package mcp

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
)

// SSEServer serves Model Context Protocol (MCP) clients over Server-Sent Events (SSE)
type SSEServer struct {
	Proxy          *Proxy
	SessionManager *SessionManager
	clients        map[string]chan []byte
	mu             sync.RWMutex
}

// NewSSEServer instantiates a new HTTP/SSE transport server
func NewSSEServer(proxy *Proxy, sm *SessionManager) *SSEServer {
	return &SSEServer{
		Proxy:          proxy,
		SessionManager: sm,
		clients:        make(map[string]chan []byte),
	}
}

// ServeHTTP routes SSE connections and incoming messages
func (s *SSEServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/sse":
		s.handleSSE(w, r)
	case "/message":
		s.handleMessage(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (s *SSEServer) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	clientName := r.URL.Query().Get("client_name")
	if clientName == "" {
		clientName = "unknown-agent"
	}
	sess := s.SessionManager.CreateSession(clientName, "1.0")

	msgChan := make(chan []byte, 32)
	s.mu.Lock()
	s.clients[sess.ID] = msgChan
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, sess.ID)
		s.mu.Unlock()
		s.SessionManager.RemoveSession(sess.ID)
		log.Printf("[KYRON GATEWAY] SSE client disconnected: %s", sess.ID)
	}()

	// Send endpoint event with session URI per MCP spec
	endpointData := fmt.Sprintf("/message?sessionId=%s", sess.ID)
	fmt.Fprintf(w, "event: endpoint\ndata: %s\n\n", endpointData)
	flusher.Flush()

	log.Printf("[KYRON GATEWAY] SSE client connected: %s (trajectory: %s)", sess.ID, sess.TrajectoryID)

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-msgChan:
			if !ok {
				return
			}
			fmt.Fprintf(w, "event: message\ndata: %s\n\n", string(msg))
			flusher.Flush()
		}
	}
}

func (s *SSEServer) handleMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := r.URL.Query().Get("sessionId")
	if sessionID == "" {
		http.Error(w, "missing sessionId query parameter", http.StatusBadRequest)
		return
	}

	sess, ok := s.SessionManager.GetSession(sessionID)
	if !ok {
		http.Error(w, "session not found or expired", http.StatusNotFound)
		return
	}

	s.mu.RLock()
	clientChan, clientOk := s.clients[sessionID]
	s.mu.RUnlock()
	if !clientOk {
		http.Error(w, "client message channel closed", http.StatusGone)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	msg, err := ParseMessage(body)
	if err != nil {
		errResp := NewErrorResponse(nil, ErrCodeParseError, "parse error", nil)
		out, _ := json.Marshal(errResp)
		select {
		case clientChan <- out:
		default:
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	resp, err := s.Proxy.HandleMessage(sess, msg)
	if err != nil {
		errResp := NewErrorResponse(msg.ID, ErrCodeInternal, err.Error(), nil)
		out, _ := json.Marshal(errResp)
		select {
		case clientChan <- out:
		default:
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if resp != nil {
		out, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, "serialization error", http.StatusInternalServerError)
			return
		}
		select {
		case clientChan <- out:
		default:
			log.Printf("[KYRON GATEWAY] Dropping message to client %s: channel buffer full", sessionID)
		}
	}

	w.WriteHeader(http.StatusAccepted)
}
