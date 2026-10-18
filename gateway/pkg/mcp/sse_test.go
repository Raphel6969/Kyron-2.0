package mcp

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestSSEServerStreamingAndMessageDispatch(t *testing.T) {
	registry := NewToolRegistry()
	proxy := NewProxy(registry, nil, nil, nil)
	sm := NewSessionManager()
	sseServer := NewSSEServer(proxy, sm)

	server := httptest.NewServer(sseServer)
	defer server.Close()

	// 1. Establish SSE client connection
	req, err := http.NewRequest(http.MethodGet, server.URL+"/sse?client_name=test-agent", nil)
	if err != nil {
		t.Fatalf("failed to build SSE request: %v", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed to connect to SSE: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	reader := bufio.NewReader(resp.Body)

	// Read first event (endpoint event)
	line1, _ := reader.ReadString('\n')
	line2, _ := reader.ReadString('\n')
	_, _ = reader.ReadString('\n') // blank line

	if !strings.Contains(line1, "event: endpoint") {
		t.Fatalf("expected endpoint event, got %s", line1)
	}

	// Extract session ID from data line
	dataLine := strings.TrimSpace(line2)
	prefix := "data: /message?sessionId="
	if !strings.HasPrefix(dataLine, prefix) {
		t.Fatalf("unexpected endpoint data format: %s", dataLine)
	}
	sessionID := strings.TrimPrefix(dataLine, prefix)
	if sessionID == "" {
		t.Fatalf("empty session ID extracted")
	}

	// 2. Send ping message via POST /message?sessionId=...
	pingMsg := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      100,
		Method:  "ping",
	}
	body, _ := json.Marshal(pingMsg)
	postReq, _ := http.NewRequest(http.MethodPost, server.URL+"/message?sessionId="+sessionID, bytes.NewReader(body))
	postResp, err := http.DefaultClient.Do(postReq)
	if err != nil {
		t.Fatalf("failed to post message: %v", err)
	}
	if postResp.StatusCode != http.StatusAccepted {
		t.Fatalf("expected status 202 Accepted, got %d", postResp.StatusCode)
	}
	postResp.Body.Close()

	// 3. Read message response from SSE stream
	doneCh := make(chan struct{})
	var sseMsgEvent, sseMsgData string

	go func() {
		sseMsgEvent, _ = reader.ReadString('\n')
		sseMsgData, _ = reader.ReadString('\n')
		_, _ = reader.ReadString('\n')
		close(doneCh)
	}()

	select {
	case <-doneCh:
		if !strings.Contains(sseMsgEvent, "event: message") {
			t.Errorf("expected message event, got: %s", sseMsgEvent)
		}
		if !strings.Contains(sseMsgData, `"id":100`) {
			t.Errorf("expected ping response with id 100, got: %s", sseMsgData)
		}
	case <-time.After(2 * time.Second):
		t.Fatalf("timed out waiting for response over SSE")
	}
}
