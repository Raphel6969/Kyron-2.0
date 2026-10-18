package mcp

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"

	"kyron.dev/gateway/pkg/audit"
	"kyron.dev/gateway/pkg/secrets"
)

// BackendHandler defines an interface to dispatch calls to the upstream MCP server
type BackendHandler interface {
	ListTools() ([]Tool, error)
	CallTool(name string, arguments json.RawMessage) (*CallToolResult, error)
}

// Proxy coordinates interceptors across tool listings and tool invocations
type Proxy struct {
	Registry      *ToolRegistry
	SecretsBroker *secrets.Broker
	AuditEmitter  *audit.Emitter
	Backend       BackendHandler
	mu            sync.RWMutex
}

// NewProxy creates a new MCP protocol interceptor proxy
func NewProxy(reg *ToolRegistry, sb *secrets.Broker, ae *audit.Emitter, backend BackendHandler) *Proxy {
	return &Proxy{
		Registry:      reg,
		SecretsBroker: sb,
		AuditEmitter:  ae,
		Backend:       backend,
	}
}

// HandleMessage processes a single client JSON-RPC message through the Kyron security interceptor pipeline
func (p *Proxy) HandleMessage(sess *Session, msg *JSONRPCMessage) (*JSONRPCMessage, error) {
	switch msg.Method {
	case "initialize":
		return p.handleInitialize(msg)
	case "notifications/initialized":
		// No-op notification per spec
		return nil, nil
	case "ping":
		return NewSuccessResponse(msg.ID, map[string]interface{}{})
	case "tools/list":
		return p.handleToolsList(sess, msg)
	case "tools/call":
		return p.handleToolsCall(sess, msg)
	default:
		// Unsupported or custom method
		return NewErrorResponse(
			msg.ID,
			ErrCodeMethodNotFound,
			fmt.Sprintf("method '%s' not supported by Kyron Gateway", msg.Method),
			nil,
		), nil
	}
}

func (p *Proxy) handleInitialize(msg *JSONRPCMessage) (*JSONRPCMessage, error) {
	result := InitializeResult{
		ProtocolVersion: ProtocolVersion,
		Capabilities: ServerCapabilities{
			Tools: &ToolsCapability{ListChanged: true},
		},
		ServerInfo: Implementation{
			Name:    "kyron-gateway",
			Version: "2.0.0",
		},
		Instructions: "Kyron 2.0 Security Gateway: Deterministic policy enforcement, Dynamic Tool Projection, and JIT secrets isolation.",
	}
	return NewSuccessResponse(msg.ID, result)
}

func (p *Proxy) handleToolsList(sess *Session, msg *JSONRPCMessage) (*JSONRPCMessage, error) {
	if p.Backend == nil {
		return NewErrorResponse(msg.ID, ErrCodeInternal, "no backend MCP server configured", nil), nil
	}

	rawTools, err := p.Backend.ListTools()
	if err != nil {
		return NewErrorResponse(msg.ID, ErrCodeInternal, fmt.Sprintf("upstream tools/list failed: %v", err), nil), nil
	}

	// Apply Dynamic Tool Projection (F19, F03, F04)
	projectedTools := p.Registry.ProjectTools(rawTools)

	result := ListToolsResult{
		Tools: projectedTools,
	}
	return NewSuccessResponse(msg.ID, result)
}

func (p *Proxy) handleToolsCall(sess *Session, msg *JSONRPCMessage) (*JSONRPCMessage, error) {
	var params CallToolParams
	if err := json.Unmarshal(msg.Params, &params); err != nil {
		return NewErrorResponse(msg.ID, ErrCodeInvalidParams, "invalid tools/call params", nil), nil
	}

	toolName := params.Name
	reg, exists := p.Registry.GetTool(toolName)

	// Compute deterministic SHA-256 hash of rendered call
	callHashRaw := fmt.Sprintf("%s:%s", toolName, string(params.Arguments))
	hasher := sha256.New()
	hasher.Write([]byte(callHashRaw))
	callHash := hex.EncodeToString(hasher.Sum(nil))

	// 1. Stage 4 Check: Policy verification & Registry Firewall
	if exists && (reg.State == "quarantined" || reg.State == "blocked" || reg.State == "revoked") {
		// Call is blocked deterministically
		remediation := &StructuredRemediation{
			Tool:          toolName,
			State:         reg.State,
			RiskScore:     reg.RiskScore,
			RiskReasons:   reg.RiskReasons,
			Remediation:   "Request human approval in Kyron SOC console or substitute with an approved tool.",
			EscalationURL: fmt.Sprintf("http://localhost:8001/v1/approvals/%s", sess.ID),
		}

		// Emit signed audit event for the block
		if p.AuditEmitter != nil {
			_, _ = p.AuditEmitter.Emit(
				sess.ID,
				sess.TrajectoryID,
				callHash,
				toolName,
				"block",
				reg.RiskReasons,
				1,
			)
		}

		return NewErrorResponse(
			msg.ID,
			ErrCodePolicyBlocked,
			fmt.Sprintf("Policy violation: Tool '%s' is %s and not permitted for execution.", toolName, reg.State),
			remediation,
		), nil
	}

	if p.Backend == nil {
		return NewErrorResponse(msg.ID, ErrCodeInternal, "no backend MCP server configured", nil), nil
	}

	// 2. Stage 5: Secrets injection (JIT)
	args := params.Arguments
	if p.SecretsBroker != nil {
		injectedArgs, err := p.SecretsBroker.InjectSecrets(args)
		if err != nil {
			return NewErrorResponse(msg.ID, ErrCodeInternal, fmt.Sprintf("failed to inject secrets: %v", err), nil), nil
		}
		args = injectedArgs
	}

	// 3. Dispatch call to upstream MCP server
	rawResult, err := p.Backend.CallTool(toolName, args)
	if err != nil {
		return NewErrorResponse(msg.ID, ErrCodeInternal, fmt.Sprintf("tool execution failed: %v", err), nil), nil
	}

	// 4. Stage 6: Admit & Redact credentials from return payload
	if p.SecretsBroker != nil && rawResult != nil {
		for i := range rawResult.Content {
			if rawResult.Content[i].Type == "text" {
				rawResult.Content[i].Text = p.SecretsBroker.RedactTraffic(rawResult.Content[i].Text)
			}
		}
	}

	// 5. Emit signed audit event for successful execution
	if p.AuditEmitter != nil {
		_, _ = p.AuditEmitter.Emit(
			sess.ID,
			sess.TrajectoryID,
			callHash,
			toolName,
			"allow",
			[]string{"Passed registry firewall and data plane policies"},
			1,
		)
	}

	return NewSuccessResponse(msg.ID, rawResult)
}
