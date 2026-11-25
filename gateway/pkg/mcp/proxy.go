package mcp

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"kyron.dev/gateway/pkg/audit"
	"kyron.dev/gateway/pkg/authority"
	"kyron.dev/gateway/pkg/policy"
	"kyron.dev/gateway/pkg/secrets"
)

// EnforcementMode controls whether policy violations are blocked or monitored in shadow mode (F32)
type EnforcementMode string

const (
	ModeEnforce EnforcementMode = "enforce"
	ModeMonitor EnforcementMode = "monitor"
)

// BackendHandler defines an interface to dispatch calls to the upstream MCP server
type BackendHandler interface {
	ListTools() ([]Tool, error)
	CallTool(name string, arguments json.RawMessage) (*CallToolResult, error)
}

// Proxy coordinates interceptors across tool listings and tool invocations
type Proxy struct {
	Registry        *ToolRegistry
	SecretsBroker   *secrets.Broker
	AuditEmitter    *audit.Emitter
	Authority       *authority.Service
	Remediation     *RemediationEngine
	PolicyManager   *policy.Manager
	Backend         BackendHandler
	Mode            EnforcementMode
	ControlPlaneURL string
	httpClient      *http.Client
	mu              sync.RWMutex
}

// SetControlPlaneURL configures optional live Control Plane scanning and registry sync
func (p *Proxy) SetControlPlaneURL(baseURL string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.ControlPlaneURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if p.httpClient == nil {
		p.httpClient = &http.Client{Timeout: 3 * time.Second}
	}
	if p.ControlPlaneURL != "" {
		p.Remediation = NewRemediationEngine(p.Registry, p.ControlPlaneURL)
	}
}

// NewProxy creates a new MCP protocol interceptor proxy
func NewProxy(reg *ToolRegistry, sb *secrets.Broker, ae *audit.Emitter, backend BackendHandler) *Proxy {
	authSvc, _ := authority.NewService(nil, nil)
	remEngine := NewRemediationEngine(reg, "http://localhost:8001")
	return &Proxy{
		Registry:      reg,
		SecretsBroker: sb,
		AuditEmitter:  ae,
		Authority:     authSvc,
		Remediation:   remEngine,
		Backend:       backend,
		Mode:          ModeEnforce,
	}
}

// SetAuthority attaches an authority service to the proxy
func (p *Proxy) SetAuthority(auth *authority.Service) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Authority = auth
}

// GetAuthority returns the active authority service
func (p *Proxy) GetAuthority() *authority.Service {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.Authority
}

// SetPolicyManager attaches a policy manager to the proxy and registers hot-reload hooks
func (p *Proxy) SetPolicyManager(pm *policy.Manager) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.PolicyManager = pm
	if pm != nil {
		pm.SetAuthority(p.Authority)
		if active := pm.Active(); active != nil {
			if active.Meta.Mode == "monitor" {
				p.Mode = ModeMonitor
			} else {
				p.Mode = ModeEnforce
			}
		}
		pm.OnReload(func(oldBundle, newBundle *policy.PolicyBundle) {
			if newBundle != nil {
				if newBundle.Meta.Mode == "monitor" {
					p.SetMode(ModeMonitor)
				} else {
					p.SetMode(ModeEnforce)
				}
			}
		})
	}
}

// GetPolicyManager returns the active policy manager
func (p *Proxy) GetPolicyManager() *policy.Manager {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.PolicyManager
}

// SetMode toggles between blocking enforcement and non-breaking shadow monitor mode
func (p *Proxy) SetMode(m EnforcementMode) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Mode = m
}

// GetMode returns the current active enforcement mode
func (p *Proxy) GetMode() EnforcementMode {
	p.mu.RLock()
	defer p.mu.RUnlock()
	if p.Mode == "" {
		return ModeEnforce
	}
	return p.Mode
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

	// Scan and synchronize discovered tools with Control Plane & local Registry Firewall
	p.syncDiscoveredTools(sess, rawTools)

	// Apply Dynamic Tool Projection (F19, F03, F04)
	projectedTools := p.Registry.ProjectTools(rawTools)

	result := ListToolsResult{
		Tools: projectedTools,
	}
	return NewSuccessResponse(msg.ID, result)
}

func (p *Proxy) syncDiscoveredTools(sess *Session, rawTools []Tool) {
	p.mu.RLock()
	cpURL := p.ControlPlaneURL
	client := p.httpClient
	p.mu.RUnlock()

	serverID := "mcp-stdio"
	if sess != nil && sess.ClientName != "" {
		serverID = sess.ClientName
	}

	var wg sync.WaitGroup
	for _, rt := range rawTools {
		rt := rt
		wg.Add(1)
		go func() {
			defer wg.Done()
			// Sync with Control Plane if configured (populates live registry & audit trail)
			if cpURL != "" && client != nil {
				if p.Authority != nil && isHighImpactTool(rt.Name) {
					p.Authority.RequireLease(rt.Name)
				}
				reqBody, _ := json.Marshal(map[string]interface{}{
					"server_id":   serverID,
					"name":        rt.Name,
					"description": rt.Description,
				})
				req, err := http.NewRequest(http.MethodPost, cpURL+"/v1/tools/scan", bytes.NewReader(reqBody))
				if err == nil {
					req.Header.Set("Content-Type", "application/json")
					resp, err := client.Do(req)
					if err == nil {
						var scanned struct {
							ServerID    string   `json:"server_id"`
							Name        string   `json:"name"`
							State       string   `json:"state"`
							RiskScore   float32  `json:"risk_score"`
							RiskReasons []string `json:"risk_reasons"`
							ModelFacing string   `json:"model_facing"`
						}
						if decErr := json.NewDecoder(resp.Body).Decode(&scanned); decErr == nil && scanned.Name != "" {
							p.Registry.RegisterTool(&RegisteredTool{
								ServerID:               scanned.ServerID,
								Name:                   rt.Name,
								State:                  scanned.State,
								RiskScore:              scanned.RiskScore,
								RiskReasons:            scanned.RiskReasons,
								ModelFacingDescription: scanned.ModelFacing,
								InputSchema:            rt.InputSchema,
							})
							_ = resp.Body.Close()
							return
						}
						_ = resp.Body.Close()
					}
				}
			}

			// Offline fallback heuristic if Control Plane is not attached or timed out
			if _, exists := p.Registry.GetTool(rt.Name); !exists {
				lower := strings.ToLower(rt.Description)
				state := "scanned"
				var risk float32 = 0.05
				var reasons []string
				if strings.Contains(lower, "ignore previous") || strings.Contains(lower, "exfiltrat") ||
					strings.Contains(lower, "private_key") || strings.Contains(lower, "system override") ||
					strings.Contains(lower, "steal") {
					state = "quarantined"
					risk = 0.95
					reasons = []string{"Prompt injection or exfiltration sequence detected in description"}
				}
				p.Registry.RegisterTool(&RegisteredTool{
					ServerID:               serverID,
					Name:                   rt.Name,
					State:                  state,
					RiskScore:              risk,
					RiskReasons:            reasons,
					ModelFacingDescription: fmt.Sprintf("Tool '%s': Verified safe utility for %s operations.", rt.Name, rt.Name),
					InputSchema:            rt.InputSchema,
				})
			}
		}()
	}
	wg.Wait()
}

func isHighImpactTool(name string) bool {
	lower := strings.ToLower(name)
	return strings.Contains(lower, "refund") || strings.Contains(lower, "restart_deployment") || strings.Contains(lower, "drop_database")
}

func (p *Proxy) checkControlPlaneLease(toolName, leaseID string) bool {
	p.mu.RLock()
	cpURL := p.ControlPlaneURL
	client := p.httpClient
	p.mu.RUnlock()
	if cpURL == "" || client == nil {
		return false
	}
	resp, err := client.Get(cpURL + "/v1/leases")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false
	}
	var leases []struct {
		ID         string `json:"id"`
		ActionSpec string `json:"action_spec"`
		ExpiresAt  string `json:"expires_at"`
		CallsUsed  int    `json:"calls_used"`
		MaxCalls   int    `json:"max_calls"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&leases); err != nil {
		return false
	}
	now := time.Now().UTC()
	for _, l := range leases {
		if l.ActionSpec != toolName && l.ActionSpec != "*" {
			continue
		}
		if leaseID != "" && l.ID != leaseID {
			continue
		}
		if l.CallsUsed >= l.MaxCalls {
			continue
		}
		expStr := l.ExpiresAt
		if !strings.HasSuffix(expStr, "Z") && !strings.Contains(expStr, "+") {
			expStr += "Z"
		}
		if exp, err := time.Parse(time.RFC3339Nano, expStr); err == nil && now.Before(exp) {
			return true
		}
	}
	return false
}

func (p *Proxy) submitControlPlaneApproval(sess *Session, toolName, reason string) string {
	p.mu.RLock()
	cpURL := p.ControlPlaneURL
	client := p.httpClient
	p.mu.RUnlock()
	if cpURL == "" || client == nil {
		return ""
	}
	trajID := "traj-live-mcp"
	if sess != nil && sess.TrajectoryID != "" {
		trajID = sess.TrajectoryID
	}
	body, _ := json.Marshal(map[string]interface{}{
		"trajectory_id": trajID,
		"kind":          "lease_request",
		"tool_id":       toolName,
		"details": map[string]string{
			"reason": reason,
		},
	})
	resp, err := client.Post(cpURL+"/v1/approvals", "application/json", bytes.NewReader(body))
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	var created struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&created); err == nil {
		return created.ID
	}
	return ""
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

	leaseID := params.LeaseID
	if leaseID == "" && sess != nil {
		leaseID = sess.GetAttachedLease(toolName)
	}

	auth := p.GetAuthority()

	// Stage 4.0: Declarative TOML Policy Rule Check (C3, F35)
	pm := p.GetPolicyManager()
	if pm != nil {
		if bundle := pm.Active(); bundle != nil {
			if rule := bundle.ResolveToolRule(toolName); rule != nil {
				if rule.Action == "block" {
					reason := rule.Reason
					if reason == "" {
						reason = fmt.Sprintf("Tool '%s' is blocked by declarative policy rule '%s'", toolName, rule.Pattern)
					}
					mode := p.GetMode()
					if mode == ModeMonitor {
						if p.AuditEmitter != nil {
							_, _ = p.AuditEmitter.Emit(
								sess.ID,
								sess.TrajectoryID,
								callHash,
								toolName,
								"would-block",
								[]string{reason},
								1,
							)
						}
						log.Printf("[KYRON MONITOR MODE] Tool '%s' blocked by policy (%s). Permitting in monitor mode.", toolName, reason)
					} else {
						if p.AuditEmitter != nil {
							_, _ = p.AuditEmitter.Emit(
								sess.ID,
								sess.TrajectoryID,
								callHash,
								toolName,
								"block",
								[]string{reason},
								1,
							)
						}
						remediation := &StructuredRemediation{
							Tool:        toolName,
							State:       "blocked",
							RiskScore:   0.9,
							RiskReasons: []string{reason},
							Remediation: "Tool is blocked by active corporate TOML policy bundle. Select an authorized alternative tool.",
						}
						return NewErrorResponse(
							msg.ID,
							ErrCodePolicyBlocked,
							fmt.Sprintf("Policy restriction: %s", reason),
							remediation,
						), nil
					}
				}
			}
		}
	}

	// Stage 4a: Authority Service Ruling & Lease Verification (C6, F18)
	if auth != nil && auth.IsLeaseRequired(toolName) {
		if !p.checkControlPlaneLease(toolName, leaseID) {
			ruling, _ := auth.EvaluateCall(sess.ID, sess.TrajectoryID, toolName, callHash, leaseID)
			if ruling != nil && ruling.Decision != authority.RulingAllow {
				mode := p.GetMode()
				if mode == ModeMonitor {
					if p.AuditEmitter != nil {
						_, _ = p.AuditEmitter.Emit(
							sess.ID,
							sess.TrajectoryID,
							callHash,
							toolName,
							"would-block",
							[]string{ruling.Reason},
							1,
						)
					}
					log.Printf("[KYRON MONITOR MODE] Tool '%s' restricted (%s). Permitting in monitor mode.", toolName, ruling.Reason)
				} else {
					apprID := p.submitControlPlaneApproval(sess, toolName, fmt.Sprintf("High-impact call to '%s' requires human operator capability lease.", toolName))
					var remediation *StructuredRemediation
					if p.Remediation != nil {
						if leaseID == "" {
							remediation = p.Remediation.BuildLeaseRequiredRemediation(sess.ID, sess.TrajectoryID, toolName, ruling.Reason)
						} else {
							remediation = p.Remediation.BuildLeaseFailureRemediation(sess.ID, sess.TrajectoryID, toolName, ruling.Reason)
						}
					} else {
						remediation = &StructuredRemediation{
							Tool:          toolName,
							State:         "restricted",
							RiskScore:     0.7,
							RiskReasons:   []string{ruling.Reason},
							Remediation:   "Obtain a signed capability lease from the Kyron Authority Service.",
							EscalationURL: ruling.EscalationURL,
						}
					}
					if apprID != "" {
						remediation.RecoveryPlan = fmt.Sprintf("Approval request '%s' submitted to Kyron Authority Queue. Approve in SOC Console to execute.", apprID)
					}

					if p.AuditEmitter != nil {
						_, _ = p.AuditEmitter.Emit(
							sess.ID,
							sess.TrajectoryID,
							callHash,
							toolName,
							"block",
							[]string{ruling.Reason},
							1,
						)
					}

					return NewErrorResponse(
						msg.ID,
						ErrCodePolicyBlocked,
						fmt.Sprintf("Authority restriction: Tool '%s' requires a valid capability lease (%s)", toolName, apprID),
						remediation,
					), nil
				}
			}
		}
	}

	// Stage 4b Check: Policy verification & Registry Firewall
	if exists && (reg.State == "quarantined" || reg.State == "blocked" || reg.State == "revoked") {
		// If an active capability lease was provided and validated, permit single authorized execution
		var leasePermitted bool
		if auth != nil && leaseID != "" {
			ruling, _ := auth.EvaluateCall(sess.ID, sess.TrajectoryID, toolName, callHash, leaseID)
			if ruling != nil && ruling.Decision == authority.RulingAllow {
				leasePermitted = true
			}
		}

		if !leasePermitted {
			mode := p.GetMode()
			if mode == ModeMonitor {
				// Non-breaking monitor mode (F32):
				// Emit "would-block" telemetry event and continue execution without breaking live workflows
				if p.AuditEmitter != nil {
					_, _ = p.AuditEmitter.Emit(
						sess.ID,
						sess.TrajectoryID,
						callHash,
						toolName,
						"would-block",
						reg.RiskReasons,
						1,
					)
				}
				log.Printf("[KYRON MONITOR MODE] Tool '%s' triggered would-block policy violation (%v). Permitting execution without breaking workflow.", toolName, reg.RiskReasons)
			} else {
				// Enforce mode: block deterministically
				var remediation *StructuredRemediation
				if p.Remediation != nil {
					remediation = p.Remediation.BuildQuarantineRemediation(sess.ID, toolName, reg.State, reg.RiskScore, reg.RiskReasons)
				} else {
					remediation = &StructuredRemediation{
						Tool:          toolName,
						State:         reg.State,
						RiskScore:     reg.RiskScore,
						RiskReasons:   reg.RiskReasons,
						Remediation:   "Request human approval in Kyron SOC console or substitute with an approved tool.",
						EscalationURL: fmt.Sprintf("http://localhost:8001/v1/approvals/%s", sess.ID),
					}
				}

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
		}
	}

	// Stage 4c: TOCTOU Resource-Identity Binding Verification (F26, S5)
	if auth != nil && leaseID != "" {
		if activeLease, exists := auth.GetLease(leaseID); exists && activeLease.ResourceBinding != nil {
			var toctouErr error
			var targetPath string
			var targetContent []byte

			var argsMap map[string]interface{}
			if len(params.Arguments) > 0 {
				_ = json.Unmarshal(params.Arguments, &argsMap)
			}

			if argsMap != nil {
				if p, ok := argsMap["path"].(string); ok && p != "" {
					targetPath = p
				} else if p, ok := argsMap["file"].(string); ok && p != "" {
					targetPath = p
				} else if p, ok := argsMap["filepath"].(string); ok && p != "" {
					targetPath = p
				} else if p, ok := argsMap["target"].(string); ok && p != "" {
					targetPath = p
				}

				if c, ok := argsMap["content"].(string); ok {
					targetContent = []byte(c)
				}
			}

			if targetContent != nil {
				toctouErr = activeLease.VerifyContentBytes(targetContent)
			} else if targetPath != "" {
				toctouErr = activeLease.VerifyFile(targetPath)
			}

			if toctouErr != nil {
				mode := p.GetMode()
				if mode == ModeMonitor {
					if p.AuditEmitter != nil {
						_, _ = p.AuditEmitter.Emit(
							sess.ID,
							sess.TrajectoryID,
							callHash,
							toolName,
							"would-block",
							[]string{fmt.Sprintf("TOCTOU race detected: %v", toctouErr)},
							1,
						)
					}
					log.Printf("[KYRON MONITOR MODE] Tool '%s' TOCTOU race detected (%v). Permitting in monitor mode.", toolName, toctouErr)
				} else {
					if p.AuditEmitter != nil {
						_, _ = p.AuditEmitter.Emit(
							sess.ID,
							sess.TrajectoryID,
							callHash,
							toolName,
							"block",
							[]string{fmt.Sprintf("TOCTOU race detected: %v", toctouErr)},
							1,
						)
					}
					remediation := &StructuredRemediation{
						Tool:          toolName,
						State:         "blocked",
						RiskScore:     1.0,
						RiskReasons:   []string{fmt.Sprintf("TOCTOU Violation (S5): %v", toctouErr)},
						Remediation:   "Resource content has mutated or swapped after approval was granted. Re-inspect resource and request a fresh capability lease.",
						EscalationURL: fmt.Sprintf("http://localhost:8001/v1/approvals/%s", sess.ID),
					}
					return NewErrorResponse(
						msg.ID,
						ErrCodePolicyBlocked,
						fmt.Sprintf("TOCTOU security violation: %v", toctouErr),
						remediation,
					), nil
				}
			}
		}
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
	redacted := false
	if p.SecretsBroker != nil && rawResult != nil {
		for i := range rawResult.Content {
			if rawResult.Content[i].Type == "text" {
				origText := rawResult.Content[i].Text
				cleanText := p.SecretsBroker.RedactTraffic(origText)
				if cleanText != origText {
					redacted = true
				}
				rawResult.Content[i].Text = cleanText
			}
		}
	}

	// 5. Emit signed audit event for successful execution (if not already recorded in monitor mode)
	if p.AuditEmitter != nil && p.GetMode() != ModeMonitor {
		auditReasons := []string{"Passed registry firewall and data plane policies"}
		if redacted {
			auditReasons = []string{"Secrets Broker redacted sensitive credential pattern in-flight (0 tokens)"}
		}
		_, _ = p.AuditEmitter.Emit(
			sess.ID,
			sess.TrajectoryID,
			callHash,
			toolName,
			"allow",
			auditReasons,
			1,
		)
	}

	return NewSuccessResponse(msg.ID, rawResult)
}
