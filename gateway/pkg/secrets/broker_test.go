package secrets

import (
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestCredentialTheftRedactionScenarioS6(t *testing.T) {
	broker := NewBroker()
	rawSecret := "ghp_super_secret_production_token_12345"
	broker.SetSecret("GITHUB_TOKEN", rawSecret)

	// Case 1: Plaintext secret leak
	leakedPlain := "Your token is: ghp_super_secret_production_token_12345 in variable GITHUB_TOKEN"
	redactedPlain := broker.RedactTraffic(leakedPlain)
	if strings.Contains(redactedPlain, rawSecret) {
		t.Fatal("plaintext secret was not redacted!")
	}
	if !strings.Contains(redactedPlain, RedactedPlaceholder) {
		t.Fatal("expected placeholder in redacted output")
	}

	// Case 2: Base64-encoded secret leak
	b64Secret := base64.StdEncoding.EncodeToString([]byte(rawSecret))
	leakedB64 := "Encoded credential: " + b64Secret
	redactedB64 := broker.RedactTraffic(leakedB64)
	if strings.Contains(redactedB64, b64Secret) {
		t.Fatal("base64-encoded secret was not redacted!")
	}
	if !strings.Contains(redactedB64, RedactedPlaceholder) {
		t.Fatal("expected placeholder in base64-redacted output")
	}

	// Case 3: Pattern-based AWS key detection (not in vault)
	leakedAWS := "Found key: AKIAIOSFODNN7EXAMPLE in config"
	redactedAWS := broker.RedactTraffic(leakedAWS)
	if strings.Contains(redactedAWS, "AKIAIOSFODNN7EXAMPLE") {
		t.Fatal("AWS access key pattern was not redacted!")
	}
	if !strings.Contains(redactedAWS, RedactedPlaceholder) {
		t.Fatal("expected placeholder in AWS key redacted output")
	}
}

func TestJITParameterInjection(t *testing.T) {
	broker := NewBroker()
	broker.SetSecret("PROD_DB_PASS", "ultra_secure_db_pass_9988!")

	templateArgs := json.RawMessage(`{"host": "db.internal", "password": "{{secret:PROD_DB_PASS}}"}`)
	injected, err := broker.InjectSecrets(templateArgs)
	if err != nil {
		t.Fatalf("unexpected error injecting secrets: %v", err)
	}

	injectedStr := string(injected)
	if strings.Contains(injectedStr, "{{secret:PROD_DB_PASS}}") {
		t.Fatal("secret placeholder was not replaced!")
	}
	if !strings.Contains(injectedStr, "ultra_secure_db_pass_9988!") {
		t.Fatal("real credential was not injected into arguments")
	}

	// Attempting missing secret key returns error
	missingArgs := json.RawMessage(`{"key": "{{secret:NON_EXISTENT_KEY}}"}`)
	_, errMissing := broker.InjectSecrets(missingArgs)
	if errMissing == nil {
		t.Fatal("expected error on unresolved secret placeholder, got nil")
	}
}

func TestScopedTokenResolutionAndExpiry(t *testing.T) {
	broker := NewBroker()
	broker.SetScopedSecret("STRIPE_KEY", "sk_live_1234567890", "payments:charge", nil)

	// Valid scope resolution
	tok, err := broker.Resolve("STRIPE_KEY", "payments:charge", 5*time.Second)
	if err != nil {
		t.Fatalf("failed to resolve token: %v", err)
	}
	if tok.Value != "sk_live_1234567890" {
		t.Errorf("token value mismatch: got %s", tok.Value)
	}

	// Incompatible scope fails
	_, errScope := broker.Resolve("STRIPE_KEY", "admin:all", 5*time.Second)
	if errScope == nil {
		t.Fatal("expected scope mismatch error, got nil")
	}

	// Expired secret fails
	expiredTime := time.Now().Add(-1 * time.Minute)
	broker.SetScopedSecret("EXPIRED_KEY", "old_val", "*", &expiredTime)
	_, errExpired := broker.Resolve("EXPIRED_KEY", "*", 5*time.Second)
	if errExpired == nil {
		t.Fatal("expected expired secret error, got nil")
	}
}

func TestJSONStructureRedaction(t *testing.T) {
	broker := NewBroker()
	broker.SetSecret("TOKEN", "my_secret_token_val")

	rawJSON := json.RawMessage(`{
		"user": "alice",
		"nested": {
			"auth": "Bearer my_secret_token_val",
			"items": ["safe_item", "token: my_secret_token_val"]
		}
	}`)

	redactedJSON := broker.RedactJSON(rawJSON)
	redactedStr := string(redactedJSON)

	if strings.Contains(redactedStr, "my_secret_token_val") {
		t.Fatal("secret still present in JSON structure!")
	}
	if !strings.Contains(redactedStr, RedactedPlaceholder) {
		t.Fatal("expected redaction placeholder in JSON structure")
	}
}
