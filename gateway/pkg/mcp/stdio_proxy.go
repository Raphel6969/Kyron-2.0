package mcp

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os/exec"
	"sync"
	"sync/atomic"
)

// SubprocessBackend implements BackendHandler over standard I/O pipes of a child process
type SubprocessBackend struct {
	cmd       *exec.Cmd
	writer    *FrameWriter
	reader    *FrameReader
	pendingMu sync.Mutex
	pending   map[interface{}]chan *JSONRPCMessage
	reqSeq    uint64
	done      chan struct{}
}

// NewSubprocessBackend spawns an MCP subprocess and wires JSON-RPC frame channels
func NewSubprocessBackend(command string, args ...string) (*SubprocessBackend, error) {
	cmd := exec.Command(command, args...)
	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to open stdin pipe: %w", err)
	}
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to open stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start subprocess '%s': %w", command, err)
	}

	sb := &SubprocessBackend{
		cmd:     cmd,
		writer:  NewFrameWriter(stdinPipe),
		reader:  NewFrameReader(stdoutPipe),
		pending: make(map[interface{}]chan *JSONRPCMessage),
		done:    make(chan struct{}),
	}

	go sb.readLoop()

	return sb, nil
}

func (sb *SubprocessBackend) readLoop() {
	defer close(sb.done)
	for {
		data, err := sb.reader.ReadMsg()
		if err != nil {
			if err != io.EOF {
				log.Printf("[KYRON GATEWAY] Subprocess read error: %v", err)
			}
			return
		}

		msg, err := ParseMessage(data)
		if err != nil {
			continue
		}

		if msg.ID != nil {
			sb.pendingMu.Lock()
			ch, ok := sb.pending[msg.ID]
			if ok {
				delete(sb.pending, msg.ID)
			}
			sb.pendingMu.Unlock()

			if ok {
				ch <- msg
			}
		}
	}
}

// SendRequest sends a JSON-RPC request to the child process and awaits its response
func (sb *SubprocessBackend) SendRequest(method string, params interface{}) (*JSONRPCMessage, error) {
	reqID := atomic.AddUint64(&sb.reqSeq, 1)

	var rawParams json.RawMessage
	if params != nil {
		pBytes, err := json.Marshal(params)
		if err != nil {
			return nil, err
		}
		rawParams = pBytes
	}

	req := &JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      reqID,
		Method:  method,
		Params:  rawParams,
	}

	data, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	respCh := make(chan *JSONRPCMessage, 1)
	sb.pendingMu.Lock()
	sb.pending[float64(reqID)] = respCh
	sb.pending[reqID] = respCh
	sb.pendingMu.Unlock()

	if err := sb.writer.WriteMsg(data); err != nil {
		sb.pendingMu.Lock()
		delete(sb.pending, reqID)
		sb.pendingMu.Unlock()
		return nil, fmt.Errorf("failed to write message to subprocess: %w", err)
	}

	select {
	case resp := <-respCh:
		return resp, nil
	case <-sb.done:
		return nil, fmt.Errorf("subprocess terminated prematurely")
	}
}

// ListTools queries the upstream subprocess for declared tools
func (sb *SubprocessBackend) ListTools() ([]Tool, error) {
	resp, err := sb.SendRequest("tools/list", map[string]interface{}{})
	if err != nil {
		return nil, err
	}

	if resp.Error != nil {
		return nil, fmt.Errorf("upstream tools/list returned error: %s", resp.Error.Message)
	}

	var res ListToolsResult
	if err := json.Unmarshal(resp.Result, &res); err != nil {
		return nil, fmt.Errorf("failed to parse upstream tools/list result: %w", err)
	}

	return res.Tools, nil
}

// CallTool executes a tool on the upstream subprocess
func (sb *SubprocessBackend) CallTool(name string, arguments json.RawMessage) (*CallToolResult, error) {
	params := CallToolParams{
		Name:      name,
		Arguments: arguments,
	}

	resp, err := sb.SendRequest("tools/call", params)
	if err != nil {
		return nil, err
	}

	if resp.Error != nil {
		return nil, fmt.Errorf("upstream tools/call returned error: %s", resp.Error.Message)
	}

	var res CallToolResult
	if err := json.Unmarshal(resp.Result, &res); err != nil {
		return nil, fmt.Errorf("failed to parse upstream tools/call result: %w", err)
	}

	return &res, nil
}

// Close terminates the subprocess gracefully
func (sb *SubprocessBackend) Close() error {
	if sb.cmd != nil && sb.cmd.Process != nil {
		return sb.cmd.Process.Kill()
	}
	return nil
}

// StdioProxy acts as a drop-in transparent proxy reading from client stdin and writing to client stdout
type StdioProxy struct {
	Proxy  *Proxy
	reader *FrameReader
	writer *FrameWriter
}

// NewStdioProxy initializes stdio framing
func NewStdioProxy(proxy *Proxy, in io.Reader, out io.Writer) *StdioProxy {
	return &StdioProxy{
		Proxy:  proxy,
		reader: NewFrameReader(in),
		writer: NewFrameWriter(out),
	}
}

// Run executes the stdio proxy event loop until EOF or client termination
func (sp *StdioProxy) Run(sess *Session) error {
	for {
		data, err := sp.reader.ReadMsg()
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return fmt.Errorf("stdio read error: %w", err)
		}

		msg, err := ParseMessage(data)
		if err != nil {
			errResp := NewErrorResponse(nil, ErrCodeParseError, "parse error", nil)
			outBytes, _ := json.Marshal(errResp)
			_ = sp.writer.WriteMsg(outBytes)
			continue
		}

		resp, err := sp.Proxy.HandleMessage(sess, msg)
		if err != nil {
			errResp := NewErrorResponse(msg.ID, ErrCodeInternal, err.Error(), nil)
			outBytes, _ := json.Marshal(errResp)
			_ = sp.writer.WriteMsg(outBytes)
			continue
		}

		// Notifications do not expect a response
		if resp != nil {
			outBytes, err := json.Marshal(resp)
			if err != nil {
				return fmt.Errorf("failed to marshal response: %w", err)
			}
			if err := sp.writer.WriteMsg(outBytes); err != nil {
				return fmt.Errorf("failed to write response: %w", err)
			}
		}
	}
}
