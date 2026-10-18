package mcp

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"
	"testing"

	"kyron.dev/gateway/pkg/audit"
	"kyron.dev/gateway/pkg/authority"
	"kyron.dev/gateway/pkg/secrets"
)

type mockBackend struct {
	tools []Tool
}

func (m *mockBackend) ListTools() ([]Tool, error) {
	return m.tools, nil
}

func (m *mockBackend) CallTool(name string, arguments json.RawMessage) (*CallToolResult, error) {
	if name == "get_credentials" {
		return &CallToolResult{
			Content: []ContentItem{
				{
					Type: "text",
					Text: "Found secret key: super_secret_api_key_12345 in config",
				},
			},
		}, nil
	}
	return &CallToolResult{
		Content: []ContentItem{
			{
				Type: "text",
				Text: "2026-10-18T08:00:00Z",
			},
		},
	}, nil
}

func TestProxyInterceptionAndPolicyEnforcement(t *testing.T) {
	registry := NewToolRegistry()
	secretsBroker := secrets.NewBroker()
	secretsBroker.SetSecret("api_key", "super_secret_api_key_12345")

	auditEmitter, err := audit.NewEmitter()
	if err != nil {
		t.Fatalf("failed to create audit emitter: %v", err)
	}

	backend := &mockBackend{
		tools: []Tool{
			{
				Name:        "get_time",
				Description: "Returns time.",
				InputSchema: json.RawMessage(`{}`),
			},
			{
				Name:        "s1_poison",
				Description: "Poisoned tool stealing private keys.",
				InputSchema: json.RawMessage(`{}`),
			},
		},
	}

	registry.RegisterTool(&RegisteredTool{
		ServerID:               "srv1",
		Name:                   "get_time",
		State:                  "approved",
		RiskScore:              0.02,
		ModelFacingDescription: "Tool 'get_time': Retrieves current UTC time.",
	})
	registry.RegisterTool(&RegisteredTool{
		ServerID:               "srv1",
		Name:                   "s1_poison",
		State:                  "quarantined",
		RiskScore:              0.99,
		RiskReasons:            []string{"Prompt injection and private key theft"},
		ModelFacingDescription: "[QUARANTINED]",
	})

	proxy := NewProxy(registry, secretsBroker, auditEmitter, backend)
	sm := NewSessionManager()
	sess := sm.CreateSession("test-agent", "1.0")

	// 1. Test initialize
	initMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "initialize",
		Params:  json.RawMessage(`{"protocolVersion":"2024-11-05"}`),
	}
	initResp, err := proxy.HandleMessage(sess, initMsg)
	if err != nil || initResp == nil || initResp.Error != nil {
		t.Fatalf("initialize failed: %v", err)
	}

	// 2. Test tools/list (must project approved tools only)
	listMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      2,
		Method:  "tools/list",
	}
	listResp, err := proxy.HandleMessage(sess, listMsg)
	if err != nil || listResp.Error != nil {
		t.Fatalf("tools/list failed: %v", err)
	}

	var listRes ListToolsResult
	if err := json.Unmarshal(listResp.Result, &listRes); err != nil {
		t.Fatalf("failed to unmarshal tools/list: %v", err)
	}
	if len(listRes.Tools) != 1 || listRes.Tools[0].Name != "get_time" {
		t.Fatalf("expected 1 projected tool 'get_time', got %v", listRes.Tools)
	}

	// 3. Test tools/call on quarantined tool (Scenario S1)
	callPoisonMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      3,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"s1_poison","arguments":{}}`),
	}
	poisonResp, err := proxy.HandleMessage(sess, callPoisonMsg)
	if err != nil {
		t.Fatalf("unexpected proxy error: %v", err)
	}
	if poisonResp.Error == nil {
		t.Fatalf("expected policy block on quarantined tool, got success")
	}
	if poisonResp.Error.Code != ErrCodePolicyBlocked {
		t.Errorf("expected error code %d, got %d", ErrCodePolicyBlocked, poisonResp.Error.Code)
	}
	if poisonResp.Error.Data == nil || poisonResp.Error.Data.State != "quarantined" {
		t.Fatalf("expected structured remediation with state 'quarantined', got %+v", poisonResp.Error.Data)
	}
	if !strings.Contains(poisonResp.Error.Message, "quarantined") {
		t.Errorf("expected error message to explain quarantine, got %s", poisonResp.Error.Message)
	}

	// 4. Test tools/call on approved tool
	callTimeMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      4,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"get_time","arguments":{}}`),
	}
	timeResp, err := proxy.HandleMessage(sess, callTimeMsg)
	if err != nil || timeResp.Error != nil {
		t.Fatalf("tools/call on approved tool failed: %v", timeResp.Error)
	}

	// 5. Test secrets redaction on return payload
	registry.RegisterTool(&RegisteredTool{
		ServerID: "srv1",
		Name:     "get_credentials",
		State:    "approved",
	})
	callCredMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      5,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"get_credentials","arguments":{}}`),
	}
	credResp, err := proxy.HandleMessage(sess, callCredMsg)
	if err != nil || credResp.Error != nil {
		t.Fatalf("tools/call on get_credentials failed: %v", credResp.Error)
	}
	var credRes CallToolResult
	_ = json.Unmarshal(credResp.Result, &credRes)
	if strings.Contains(credRes.Content[0].Text, "super_secret_api_key_12345") {
		t.Fatalf("credential was NOT redacted from return text: %s", credRes.Content[0].Text)
	}
	if !strings.Contains(credRes.Content[0].Text, "[KYRON_REDACTED_SECRET]") {
		t.Fatalf("expected [KYRON_REDACTED_SECRET] placeholder in return text, got %s", credRes.Content[0].Text)
	}
}

func TestMonitorModeShadowEvaluation(t *testing.T) {
	registry := NewToolRegistry()
	secretsBroker := secrets.NewBroker()
	auditEmitter, err := audit.NewEmitter()
	if err != nil {
		t.Fatalf("failed to create audit emitter: %v", err)
	}

	backend := &mockBackend{
		tools: []Tool{
			{Name: "quarantined_tool", Description: "Malicious tool"},
		},
	}

	registry.RegisterTool(&RegisteredTool{
		ServerID:    "srv1",
		Name:        "quarantined_tool",
		State:       "quarantined",
		RiskScore:   0.85,
		RiskReasons: []string{"Prompt injection detected"},
	})

	proxy := NewProxy(registry, secretsBroker, auditEmitter, backend)
	proxy.SetMode(ModeMonitor) // Activate non-breaking shadow monitor mode (F32)

	sm := NewSessionManager()
	sess := sm.CreateSession("monitor-agent", "1.0")

	// Call quarantined tool in monitor mode
	callMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      10,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"quarantined_tool","arguments":{}}`),
	}

	resp, err := proxy.HandleMessage(sess, callMsg)
	if err != nil {
		t.Fatalf("unexpected proxy error: %v", err)
	}

	// Must NOT return error to agent in monitor mode
	if resp.Error != nil {
		t.Fatalf("expected successful execution in monitor mode, got error: %v", resp.Error)
	}

	// But an audit event with verdict "would-block" MUST be emitted
	events := auditEmitter.Events()
	var foundWouldBlock bool
	for _, ev := range events {
		if ev.ToolID == "quarantined_tool" && ev.Verdict == "would-block" {
			foundWouldBlock = true
			break
		}
	}

	if !foundWouldBlock {
		t.Fatal("expected 'would-block' audit event to be emitted in monitor mode, but none found")
	}
}

func TestProxyCapabilityLeaseAuthorization(t *testing.T) {
	registry := NewToolRegistry()
	secretsBroker := secrets.NewBroker()
	auditEmitter, err := audit.NewEmitter()
	if err != nil {
		t.Fatalf("failed to create audit emitter: %v", err)
	}

	backend := &mockBackend{
		tools: []Tool{
			{Name: "execute_root", Description: "Privileged execution"},
		},
	}

	registry.RegisterTool(&RegisteredTool{
		ServerID:               "srv1",
		Name:                   "execute_root",
		State:                  "approved",
		RiskScore:              0.8,
		ModelFacingDescription: "Privileged execution tool",
	})

	proxy := NewProxy(registry, secretsBroker, auditEmitter, backend)
	auth := proxy.GetAuthority()
	auth.RequireLease("execute_root")

	sm := NewSessionManager()
	sess := sm.CreateSession("agent-with-lease", "1.0")

	// 1. Call without lease -> must be blocked
	callMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      20,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"execute_root","arguments":{}}`),
	}

	resp, err := proxy.HandleMessage(sess, callMsg)
	if err != nil || resp.Error == nil {
		t.Fatalf("expected call to be blocked without lease, got resp=%+v, err=%v", resp, err)
	}
	if !strings.Contains(resp.Error.Message, "requires a valid capability lease") {
		t.Fatalf("unexpected error message: %s", resp.Error.Message)
	}

	// 2. Issue a 1-time capability lease
	lease, err := auth.IssueLease(sess.TrajectoryID, "execute_root", 1, 60, []string{"agent"})
	if err != nil {
		t.Fatalf("failed to issue lease: %v", err)
	}

	// 3. Call with lease_id in parameters
	callWithLeaseMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      21,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"execute_root","arguments":{},"lease_id":"` + lease.ID + `"}`),
	}

	resp, err = proxy.HandleMessage(sess, callWithLeaseMsg)
	if err != nil || resp.Error != nil {
		t.Fatalf("expected call with valid lease to succeed, got resp=%+v, err=%v", resp, err)
	}

	// 4. Second call with same lease must fail because max_calls (1) is exhausted
	resp, err = proxy.HandleMessage(sess, callWithLeaseMsg)
	if err != nil || resp.Error == nil {
		t.Fatalf("expected second call with exhausted lease to be blocked, got resp=%+v", resp)
	}

	// 5. Test session attached lease
	lease2, _ := auth.IssueLease(sess.TrajectoryID, "execute_root", 1, 60, []string{"agent"})
	sess.AttachLease("execute_root", lease2.ID)

	callAttachedMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      22,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"execute_root","arguments":{}}`),
	}

	resp, err = proxy.HandleMessage(sess, callAttachedMsg)
	if err != nil || resp.Error != nil {
		t.Fatalf("expected call with session attached lease to succeed, got resp=%+v, err=%v", resp, err)
	}
}

func TestToolsCallTOCTOUResourceBindingVerification(t *testing.T) {
	backend := &mockBackend{
		tools: []Tool{
			{Name: "inspect_file", Description: "Inspects file contents"},
		},
	}
	registry := NewToolRegistry()
	registry.RegisterTool(&RegisteredTool{
		ServerID: "srv1",
		Name:     "inspect_file",
		State:    "approved",
	})

	auth, err := authority.NewService(nil, nil)
	if err != nil {
		t.Fatalf("failed to init authority: %v", err)
	}
	auth.RequireLease("inspect_file")

	proxy := NewProxy(registry, nil, nil, backend)
	proxy.SetAuthority(auth)
	sm := NewSessionManager()
	sess := sm.CreateSession("agent-toctou", "1.0")

	approvedContent := []byte("Strictly approved financial record data")

	hasher := sha256.New()
	hasher.Write(approvedContent)
	expectedHash := hex.EncodeToString(hasher.Sum(nil))

	binding := &authority.ResourceBinding{
		Path:         "/tmp/financial.txt",
		ExpectedHash: expectedHash,
		Algorithm:    "sha256",
	}

	lease1, err := auth.IssueLeaseWithResource(sess.TrajectoryID, "inspect_file", 1, 60, []string{"analyst"}, binding)
	if err != nil {
		t.Fatalf("failed to issue lease: %v", err)
	}

	// 1. Call with exact approved content passes
	callOkMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      31,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"inspect_file","arguments":{"path":"/tmp/financial.txt","content":"Strictly approved financial record data"},"lease_id":"` + lease1.ID + `"}`),
	}
	resp, err := proxy.HandleMessage(sess, callOkMsg)
	if err != nil || resp.Error != nil {
		t.Fatalf("expected call with valid content to succeed, got resp=%+v, err=%v", resp, err)
	}

	// 2. Call with swapped/tampered content must trigger TOCTOU rejection (S5)
	lease2, _ := auth.IssueLeaseWithResource(sess.TrajectoryID, "inspect_file", 1, 60, []string{"analyst"}, binding)
	callTamperedMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      32,
		Method:  "tools/call",
		Params:  json.RawMessage(`{"name":"inspect_file","arguments":{"path":"/tmp/financial.txt","content":"Malicious tampered record data"},"lease_id":"` + lease2.ID + `"}`),
	}
	resp, err = proxy.HandleMessage(sess, callTamperedMsg)
	if err != nil {
		t.Fatalf("unexpected proxy error: %v", err)
	}
	if resp.Error == nil {
		t.Fatal("expected TOCTOU error response for swapped content, got success")
	}
	if resp.Error.Code != ErrCodePolicyBlocked {
		t.Errorf("expected error code %d, got %d", ErrCodePolicyBlocked, resp.Error.Code)
	}
	if !strings.Contains(resp.Error.Message, "TOCTOU security violation") {
		t.Errorf("expected error message to explain TOCTOU violation, got %s", resp.Error.Message)
	}
	if resp.Error.Data == nil || resp.Error.Data.RiskScore != 1.0 {
		t.Errorf("expected risk score 1.0 for TOCTOU violation, got %+v", resp.Error.Data)
	}
}
