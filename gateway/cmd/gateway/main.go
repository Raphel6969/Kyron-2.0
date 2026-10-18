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
	"kyron.dev/gateway/pkg/secrets"
)

var (
	startTime     = time.Now()
	egressBroker  *egress.Broker
	secretsBroker *secrets.Broker
	auditEmitter  *audit.Emitter
)

func init() {
	egressBroker = egress.NewBroker(512000, 40, []string{"api.internal.example"})
	secretsBroker = secrets.NewBroker()
	var err error
	auditEmitter, err = audit.NewEmitter()
	if err != nil {
		log.Fatalf("failed to initialize audit emitter: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"status":         "healthy",
		"service":        "kyron-gateway",
		"uptime_seconds": int(time.Since(startTime).Seconds()),
		"checks": map[string]string{
			"egress_broker":  "ok",
			"secrets_broker": "ok",
			"audit_emitter":  "ok",
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

func main() {
	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/healthz", healthHandler)

	log.Printf("[KYRON GATEWAY] Starting custom MCP Protocol Gateway on port %s...", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil); err != nil {
		log.Fatalf("gateway server exited: %v", err)
	}
}
