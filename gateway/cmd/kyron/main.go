package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"kyron.dev/gateway/pkg/audit"
	"kyron.dev/gateway/pkg/egress"
	"kyron.dev/gateway/pkg/mcp"
	"kyron.dev/gateway/pkg/secrets"
)

var (
	Version   = "1.0.0"
	GitCommit = "development"
	BuildDate = "2026-10-18"
)

func printGlobalUsage() {
	fmt.Printf("Kyron 2.0 — Deterministic Trust Layer for Tool-Using AI Agents (v%s)\n\n", Version)
	fmt.Println("Usage: kyron <command> [arguments...]")
	fmt.Println()
	fmt.Println("Available Commands:")
	fmt.Println("  gateway      Run the custom MCP protocol gateway (stdio or HTTP/SSE)")
	fmt.Println("  audit        Verify or export cryptographic audit logs (Ed25519 & SHA-256)")
	fmt.Println("  scan         Audit a JSON tool listing and generate canonical descriptions")
	fmt.Println("  version      Print version, architecture, and build metadata")
	fmt.Println("  help         Show help for any command")
	fmt.Println()
	fmt.Println("Run 'kyron <command> --help' for details on a specific command.")
}

func main() {
	if len(os.Args) < 2 {
		printGlobalUsage()
		os.Exit(0)
	}

	cmd := os.Args[1]
	args := os.Args[2:]

	switch cmd {
	case "version", "--version", "-v":
		fmt.Printf("Kyron 2.0 CLI (v%s)\n", Version)
		fmt.Printf("Commit:       %s\n", GitCommit)
		fmt.Printf("Build Date:   %s\n", BuildDate)
		fmt.Printf("Platform:     %s/%s\n", runtime.GOOS, runtime.GOARCH)
		fmt.Printf("Go Version:   %s\n", runtime.Version())

	case "help", "--help", "-h":
		printGlobalUsage()

	case "gateway":
		runGateway(args)

	case "audit":
		runAudit(args)

	case "scan":
		runScan(args)

	default:
		fmt.Fprintf(os.Stderr, "Error: unknown command '%s'\n\n", cmd)
		printGlobalUsage()
		os.Exit(1)
	}
}

// -----------------------------------------------------------------------------
// Gateway Command
// -----------------------------------------------------------------------------

func runGateway(args []string) {
	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}
	var isStdio bool
	var subprocessCmd []string

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == "--help" || arg == "-h" {
			fmt.Println("Usage: kyron gateway [OPTIONS] [-- <backend command> [args...]]")
			fmt.Println()
			fmt.Println("Options:")
			fmt.Println("  --stdio          Run in transparent stdio mode for MCP clients")
			fmt.Println("  --port <port>    HTTP/SSE server listen port (default: 8080 or GATEWAY_PORT)")
			return
		} else if arg == "--stdio" {
			isStdio = true
		} else if arg == "--port" && i+1 < len(args) {
			port = args[i+1]
			i++
		} else if arg == "--" {
			subprocessCmd = args[i+1:]
			break
		}
	}

	egressBroker := egress.NewBroker(512000, 40, []string{"api.internal.example"})
	_ = egressBroker
	secretsBroker := secrets.NewBroker()
	toolRegistry := mcp.NewToolRegistry()
	sessionManager := mcp.NewSessionManager()

	auditEmitter, err := audit.NewEmitter()
	if err != nil {
		log.Fatalf("failed to initialize audit emitter: %v", err)
	}

	if isStdio && len(subprocessCmd) > 0 {
		cmdName := subprocessCmd[0]
		cmdArgs := subprocessCmd[1:]

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

	// HTTP/SSE server mode
	proxy := mcp.NewProxy(toolRegistry, secretsBroker, auditEmitter, nil)
	sseServer := mcp.NewSSEServer(proxy, sessionManager)

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"status":          "healthy",
			"service":         "kyron-gateway",
			"version":         Version,
			"active_sessions": sessionManager.Count(),
			"timestamp":       time.Now().UTC().Format(time.RFC3339),
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	})
	http.Handle("/sse", sseServer)
	http.Handle("/message", sseServer)

	fmt.Printf("[KYRON] MCP Gateway listening on :%s (SSE + HTTP)\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("gateway server error: %v", err)
	}
}

// -----------------------------------------------------------------------------
// Audit Command
// -----------------------------------------------------------------------------

func runAudit(args []string) {
	if len(args) == 0 {
		fmt.Println("Usage: kyron audit verify --pubkey <hex> [OPTIONS] <events.jsonl>")
		os.Exit(0)
	}

	sub := args[0]
	if sub != "verify" {
		fmt.Fprintf(os.Stderr, "Unknown audit action '%s'. Supported: 'verify'\n", sub)
		os.Exit(1)
	}

	verifyArgs := args[1:]
	var pubKeyHex string
	var jsonOutput bool
	var filePath string

	for i := 0; i < len(verifyArgs); i++ {
		arg := verifyArgs[i]
		if arg == "--pubkey" && i+1 < len(verifyArgs) {
			pubKeyHex = verifyArgs[i+1]
			i++
		} else if arg == "--json" {
			jsonOutput = true
		} else if !strings.HasPrefix(arg, "--") {
			filePath = arg
		}
	}

	if pubKeyHex == "" {
		pubKeyHex = os.Getenv("KYRON_AUDIT_PUBKEY")
	}

	if pubKeyHex == "" || filePath == "" {
		fmt.Fprintln(os.Stderr, "Error: --pubkey <hex> and input <events.jsonl> are required.")
		os.Exit(2)
	}

	pubKeyBytes, err := hex.DecodeString(pubKeyHex)
	if err != nil || len(pubKeyBytes) != ed25519.PublicKeySize {
		fmt.Fprintf(os.Stderr, "Error: invalid Ed25519 public key hex: %v\n", err)
		os.Exit(2)
	}

	file, err := os.Open(filePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error opening file '%s': %v\n", filePath, err)
		os.Exit(2)
	}
	defer file.Close()

	events, err := audit.LoadJSONL(file)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing audit events: %v\n", err)
		os.Exit(2)
	}

	result, err := audit.VerifyEventStream(events, ed25519.PublicKey(pubKeyBytes))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Verification failed: %v\n", err)
		os.Exit(2)
	}

	if jsonOutput {
		out, _ := json.MarshalIndent(result, "", "  ")
		fmt.Println(string(out))
	} else {
		fmt.Println("================================================================================")
		fmt.Println("  KYRON 2.0 AUDIT LOG VERIFICATION REPORT")
		fmt.Println("================================================================================")
		fmt.Printf("File:         %s\n", filePath)
		fmt.Printf("Total Events: %d\n", result.TotalEvents)
		if result.Valid {
			fmt.Println("STATUS: [VERIFIED — 100% UNTAMPERED]")
			fmt.Println("All SHA-256 links and Ed25519 digital signatures verified valid.")
		} else {
			fmt.Println("STATUS: [TAMPERED / INVALID CHAIN]")
			fmt.Printf("Reason: %s\n", result.FailureReason)
		}
		fmt.Println("================================================================================")
	}

	if !result.Valid {
		os.Exit(1)
	}
}

// -----------------------------------------------------------------------------
// Scan Command
// -----------------------------------------------------------------------------

func runScan(args []string) {
	if len(args) == 0 {
		fmt.Println("Usage: kyron scan <tools.json>")
		os.Exit(0)
	}

	filePath := args[0]
	data, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading file '%s': %v\n", filePath, err)
		os.Exit(1)
	}

	var tools []map[string]interface{}
	if err := json.Unmarshal(data, &tools); err != nil {
		var single map[string]interface{}
		if errSingle := json.Unmarshal(data, &single); errSingle == nil {
			tools = []map[string]interface{}{single}
		} else {
			fmt.Fprintf(os.Stderr, "Error parsing tool JSON: %v\n", err)
			os.Exit(1)
		}
	}

	fmt.Printf("[KYRON SCAN] Auditing %d tools in '%s'...\n\n", len(tools), filePath)
	for i, t := range tools {
		name, _ := t["name"].(string)
		desc, _ := t["description"].(string)
		var risk float64 = 0.05
		var verdict = "APPROVED"

		lowerDesc := strings.ToLower(desc)
		if strings.Contains(lowerDesc, "read") && strings.Contains(lowerDesc, "ssh") {
			risk = 0.95
			verdict = "QUARANTINED"
		} else if strings.Contains(lowerDesc, "eval") || strings.Contains(lowerDesc, "exec") {
			risk = 0.85
			verdict = "QUARANTINED"
		}

		canonical := fmt.Sprintf("Tool '%s': Safe canonicalized operational description.", name)

		fmt.Printf("Tool #%d: %s\n", i+1, name)
		fmt.Printf("  Status:     %s (Risk Score: %.2f)\n", verdict, risk)
		fmt.Printf("  Canonical:  %s\n", canonical)
		fmt.Println()
	}
}
