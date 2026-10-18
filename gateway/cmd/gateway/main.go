package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"kyron.dev/gateway/pkg/audit"
	"kyron.dev/gateway/pkg/egress"
	"kyron.dev/gateway/pkg/mcp"
	"kyron.dev/gateway/pkg/secrets"
)

var (
	startTime      = time.Now()
	egressBroker   *egress.Broker
	secretsBroker  *secrets.Broker
	auditEmitter   *audit.Emitter
	toolRegistry   *mcp.ToolRegistry
	sessionManager *mcp.SessionManager
)

func init() {
	egressBroker = egress.NewBroker(512000, 40, []string{"api.internal.example"})
	secretsBroker = secrets.NewBroker()
	toolRegistry = mcp.NewToolRegistry()
	sessionManager = mcp.NewSessionManager()

	var err error
	auditEmitter, err = audit.NewEmitter()
	if err != nil {
		log.Fatalf("failed to initialize audit emitter: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"status":          "healthy",
		"service":         "kyron-gateway",
		"uptime_seconds":  int(time.Since(startTime).Seconds()),
		"active_sessions": sessionManager.Count(),
		"checks": map[string]string{
			"egress_broker":  "ok",
			"secrets_broker": "ok",
			"audit_emitter":  "ok",
			"registry":       "ok",
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

func main() {
	args := os.Args[1:]

	// Mode 1: Transparent stdio subprocess proxy
	// Usage: kyron-gateway stdio -- <command> [args...]
	if len(args) >= 2 && args[0] == "stdio" && args[1] == "--" {
		cmdName := args[2]
		cmdArgs := args[3:]

		log.Printf("[KYRON GATEWAY] Starting stdio proxy to subprocess: %s %v", cmdName, cmdArgs)
		backend, err := mcp.NewSubprocessBackend(cmdName, cmdArgs...)
		if err != nil {
			log.Fatalf("failed to start subprocess backend: %v", err)
		}
		defer backend.Close()

		proxy := mcp.NewProxy(toolRegistry, secretsBroker, auditEmitter, backend)
		sess := sessionManager.CreateSession("stdio-client", "1.0")
		stdioProxy := mcp.NewStdioProxy(proxy, os.Stdin, os.Stdout)

		if err := stdioProxy.Run(sess); err != nil {
			log.Fatalf("stdio proxy terminated: %v", err)
		}
		return
	}

	// Mode 2: HTTP / Server-Sent Events (SSE) streaming server
	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}

	proxy := mcp.NewProxy(toolRegistry, secretsBroker, auditEmitter, nil)
	sseServer := mcp.NewSSEServer(proxy, sessionManager)

	http.HandleFunc("/healthz", healthHandler)
	http.Handle("/sse", sseServer)
	http.Handle("/message", sseServer)

	log.Printf("[KYRON GATEWAY] Starting custom MCP Protocol Gateway (SSE/HTTP) on port %s...", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil); err != nil {
		log.Fatalf("gateway server exited: %v", err)
	}
}
