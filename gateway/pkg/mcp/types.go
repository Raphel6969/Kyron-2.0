package mcp

import (
	"encoding/json"
	"fmt"
)

// MCP Protocol Version
const ProtocolVersion = "2024-11-05"

// JSON-RPC 2.0 Error Codes
const (
	ErrCodeParseError     = -32700
	ErrCodeInvalidRequest = -32600
	ErrCodeMethodNotFound = -32601
	ErrCodeInvalidParams  = -32602
	ErrCodeInternal       = -32603
	ErrCodePolicyBlocked  = -32000 // Kyron deterministic policy block
)

// JSONRPCMessage represents a Model Context Protocol (MCP) frame
type JSONRPCMessage struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"`
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *JSONRPCError   `json:"error,omitempty"`
}

// JSONRPCError contains standard code, message, and structured remediation data
type JSONRPCError struct {
	Code    int                    `json:"code"`
	Message string                 `json:"message"`
	Data    *StructuredRemediation `json:"data,omitempty"`
}

// StructuredRemediation provides actionable guidance when a call is blocked (F12, F17)
type StructuredRemediation struct {
	ErrorCode        string   `json:"error_code,omitempty"`
	Tool             string   `json:"tool,omitempty"`
	State            string   `json:"state,omitempty"`
	RiskScore        float32  `json:"risk_score,omitempty"`
	RiskReasons      []string `json:"risk_reasons,omitempty"`
	RuleViolated     string   `json:"rule_violated,omitempty"`
	Remediation      string   `json:"remediation,omitempty"`
	AlternativeTools []string `json:"alternative_tools,omitempty"`
	RecoveryPlan     string   `json:"recovery_plan,omitempty"`
	EscalationURL    string   `json:"escalation_url,omitempty"`
}


// ClientCapabilities declared during initialize
type ClientCapabilities struct {
	Roots        *RootsCapability        `json:"roots,omitempty"`
	Sampling     *SamplingCapability     `json:"sampling,omitempty"`
	Experimental map[string]interface{} `json:"experimental,omitempty"`
}

type RootsCapability struct {
	ListChanged bool `json:"listChanged,omitempty"`
}

type SamplingCapability struct{}

// ServerCapabilities declared by Kyron Gateway
type ServerCapabilities struct {
	Tools        *ToolsCapability        `json:"tools,omitempty"`
	Resources    *ResourcesCapability    `json:"resources,omitempty"`
	Prompts      *PromptsCapability      `json:"prompts,omitempty"`
	Logging      *LoggingCapability      `json:"logging,omitempty"`
	Experimental map[string]interface{} `json:"experimental,omitempty"`
}

type ToolsCapability struct {
	ListChanged bool `json:"listChanged,omitempty"`
}

type ResourcesCapability struct {
	Subscribe   bool `json:"subscribe,omitempty"`
	ListChanged bool `json:"listChanged,omitempty"`
}

type PromptsCapability struct {
	ListChanged bool `json:"listChanged,omitempty"`
}

type LoggingCapability struct{}

// InitializeParams received on initialize handshake
type InitializeParams struct {
	ProtocolVersion string             `json:"protocolVersion"`
	Capabilities    ClientCapabilities `json:"capabilities"`
	ClientInfo      Implementation     `json:"clientInfo"`
}

type Implementation struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// InitializeResult returned by Kyron Gateway
type InitializeResult struct {
	ProtocolVersion string             `json:"protocolVersion"`
	Capabilities    ServerCapabilities `json:"capabilities"`
	ServerInfo      Implementation     `json:"serverInfo"`
	Instructions    string             `json:"instructions,omitempty"`
}

// Tool represents an MCP Tool declaration
type Tool struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	InputSchema json.RawMessage `json:"inputSchema"`
}

// ListToolsResult represents the result payload of a tools/list call
type ListToolsResult struct {
	Tools []Tool `json:"tools"`
}

// CallToolParams represents parameters for tools/call
type CallToolParams struct {
	Name      string          `json:"name"`
	Arguments json.RawMessage `json:"arguments,omitempty"`
	LeaseID   string          `json:"lease_id,omitempty"`
}

// ContentItem in CallToolResult
type ContentItem struct {
	Type     string          `json:"type"` // "text", "image", "resource"
	Text     string          `json:"text,omitempty"`
	Data     string          `json:"data,omitempty"`
	MimeType string          `json:"mimeType,omitempty"`
	Resource json.RawMessage `json:"resource,omitempty"`
}

// CallToolResult returned from tools/call
type CallToolResult struct {
	Content []ContentItem `json:"content"`
	IsError bool          `json:"isError,omitempty"`
}

// ParseMessage parses a raw byte payload into a JSONRPCMessage
func ParseMessage(data []byte) (*JSONRPCMessage, error) {
	var msg JSONRPCMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("failed to parse JSON-RPC message: %w", err)
	}
	return &msg, nil
}

// NewErrorResponse builds a standard JSON-RPC error response
func NewErrorResponse(id interface{}, code int, message string, remediation *StructuredRemediation) *JSONRPCMessage {
	return &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      id,
		Error: &JSONRPCError{
			Code:    code,
			Message: message,
			Data:    remediation,
		},
	}
}

// NewSuccessResponse builds a standard JSON-RPC success response
func NewSuccessResponse(id interface{}, result interface{}) (*JSONRPCMessage, error) {
	raw, err := json.Marshal(result)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON-RPC result: %w", err)
	}
	return &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      id,
		Result:  raw,
	}, nil
}
