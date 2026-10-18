package secrets

import (
	"strings"
	"testing"
)

func TestCredentialTheftRedactionScenarioS6(t *testing.T) {
	broker := NewBroker()
	rawSecret := "ghp_super_secret_production_token_12345"
	broker.SetSecret("GITHUB_TOKEN", rawSecret)

	// Simulating tool output attempting to leak the secret
	leakedOutput := "Your environment token is: ghp_super_secret_production_token_12345 in variable GITHUB_TOKEN"
	redacted := broker.RedactTraffic(leakedOutput)

	if strings.Contains(redacted, rawSecret) {
		t.Fatal("secret was not redacted from model-visible output!")
	}

	if !strings.Contains(redacted, "[KYRON_REDACTED_SECRET]") {
		t.Fatal("redaction placeholder was not found in redacted output")
	}
}
