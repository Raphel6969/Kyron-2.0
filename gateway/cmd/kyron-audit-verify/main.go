package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"kyron.dev/gateway/pkg/audit"
)

func printUsage() {
	fmt.Println("Kyron 2.0 Audit Log Verifier (`kyron-audit-verify`)")
	fmt.Println("Cryptographically verifies SHA-256 hash chaining and Ed25519 digital signatures.")
	fmt.Println()
	fmt.Println("Usage: kyron-audit-verify --pubkey <hex> [OPTIONS] <events.jsonl>")
	fmt.Println()
	fmt.Println("Options:")
	fmt.Println("  --pubkey <hex>   Ed25519 public key hex (required, or set KYRON_AUDIT_PUBKEY)")
	fmt.Println("  --json           Output machine-readable JSON verification result")
	fmt.Println("  --help, -h       Show this help message")
}

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		printUsage()
		os.Exit(0)
	}

	var pubKeyHex string
	var jsonOutput bool
	var filePath string

	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == "--help" || arg == "-h" {
			printUsage()
			os.Exit(0)
		} else if arg == "--json" {
			jsonOutput = true
		} else if arg == "--pubkey" && i+1 < len(args) {
			pubKeyHex = args[i+1]
			i++
		} else if !strings.HasPrefix(arg, "--") {
			filePath = arg
		}
	}

	if pubKeyHex == "" {
		pubKeyHex = os.Getenv("KYRON_AUDIT_PUBKEY")
	}

	if pubKeyHex == "" {
		fmt.Fprintln(os.Stderr, "Error: missing required --pubkey <hex> argument or KYRON_AUDIT_PUBKEY env var.")
		printUsage()
		os.Exit(2)
	}

	pubKeyBytes, err := hex.DecodeString(pubKeyHex)
	if err != nil || len(pubKeyBytes) != ed25519.PublicKeySize {
		fmt.Fprintf(os.Stderr, "Error: invalid Ed25519 public key (must be %d bytes hex): %v\n", ed25519.PublicKeySize, err)
		os.Exit(2)
	}
	pubKey := ed25519.PublicKey(pubKeyBytes)

	if filePath == "" {
		fmt.Fprintln(os.Stderr, "Error: no input events.jsonl file specified.")
		printUsage()
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
		fmt.Fprintf(os.Stderr, "Error parsing audit JSON-L: %v\n", err)
		os.Exit(2)
	}

	result, err := audit.VerifyEventStream(events, pubKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Audit verification engine error: %v\n", err)
		os.Exit(2)
	}

	if jsonOutput {
		outBytes, _ := json.MarshalIndent(result, "", "  ")
		fmt.Println(string(outBytes))
	} else {
		fmt.Println("================================================================================")
		fmt.Println("  KYRON 2.0 AUDIT LOG VERIFICATION REPORT")
		fmt.Println("================================================================================")
		fmt.Printf("File:        %s\n", filePath)
		fmt.Printf("Public Key:  %s\n", pubKeyHex)
		fmt.Printf("Total Events: %d\n", result.TotalEvents)
		if result.TotalEvents > 0 {
			fmt.Printf("Time Window: %s to %s\n",
				result.FirstEventTime.Format(time.RFC3339),
				result.LastEventTime.Format(time.RFC3339),
			)
		}
		fmt.Println()

		if result.Valid {
			fmt.Println("  STATUS: [VERIFIED — 100% UNTAMPERED]")
			fmt.Println("  All SHA-256 hash chain links and Ed25519 digital signatures verified valid.")
			fmt.Println("  Complies with EU AI Act Article 50 record-keeping and provenance mandates.")
		} else {
			fmt.Println("  STATUS: [TAMPERED / INVALID CHAIN]")
			if result.BrokenAtIndex != nil {
				fmt.Printf("  Failure Location: Event index %d\n", *result.BrokenAtIndex)
			}
			fmt.Printf("  Failure Reason:   %s\n", result.FailureReason)
		}
		fmt.Println("================================================================================")
	}

	if !result.Valid {
		os.Exit(1)
	}
	os.Exit(0)
}
