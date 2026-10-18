package mcp

import (
	"encoding/json"
	"strings"
	"testing"

	"kyron.dev/gateway/pkg/audit"
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
