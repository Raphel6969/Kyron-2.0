package sandbox

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestContractValidation(t *testing.T) {
	cfg := Config{
		Binary:              "image_resizer",
		AllowedFiles:        []string{"/workspace/images/*", "/tmp/app.log"},
		AllowedDestinations: []string{"api.github.com:443", "*.internal.net"},
	}
	runner := NewRunner(cfg)

	// 1. Allowed file access
	v1 := runner.ValidateAgainstContract("/workspace/images/input.png", "")
	if len(v1) != 0 {
		t.Fatalf("expected 0 violations for allowed file, got: %v", v1)
	}

	// 2. Undeclared sensitive file access
	v2 := runner.ValidateAgainstContract("/etc/shadow", "")
	if len(v2) == 0 {
		t.Fatalf("expected violation for undeclared sensitive file, got 0")
	}

	// 3. Allowed network connect
	v3 := runner.ValidateAgainstContract("", "api.github.com:443")
	if len(v3) != 0 {
		t.Fatalf("expected 0 violations for allowed destination, got: %v", v3)
	}

	// 4. Lying tool covert network egress (Scenario S3)
	v4 := runner.ValidateAgainstContract("", "evil-exfil.com:8080")
	if len(v4) == 0 {
		t.Fatalf("expected S3 Lying Tool violation for undeclared destination, got 0")
	}
}

func TestExecuteSubprocess(t *testing.T) {
	// Execute standard go command in sandbox
	cfg := Config{
		Binary:  "go",
		Args:    []string{"version"},
		Timeout: 5 * time.Second,
	}
	runner := NewRunner(cfg)

	ctx := context.Background()
	report, err := runner.Execute(ctx, nil)
	if err != nil {
		t.Fatalf("unexpected error executing sandbox runner: %v", err)
	}

	if report.ExitCode != 0 {
		t.Errorf("expected exit code 0, got %d", report.ExitCode)
	}
	if len(report.Stdout) == 0 {
		t.Errorf("expected non-empty stdout")
	}
	if !report.Conformant {
		t.Errorf("expected report to be conformant")
	}
}

func TestEnvironmentSanitization(t *testing.T) {
	rawEnv := []string{
		"PATH=/usr/bin:/bin",
		"AWS_SECRET_ACCESS_KEY=super-secret-key-12345",
		"PRIVATE_KEY=secret_ed25519",
		"LD_PRELOAD=/tmp/evil.so",
		"HOME=/home/user",
	}

	sanitized := SanitizeEnvironment(rawEnv)
	for _, e := range sanitized {
		upper := strings.ToUpper(e)
		if strings.HasPrefix(upper, "AWS_SECRET") || strings.HasPrefix(upper, "PRIVATE_KEY") || strings.HasPrefix(upper, "LD_PRELOAD") {
			t.Errorf("found unsanitized secret in environment: %s", e)
		}
	}
	if len(sanitized) != 2 {
		t.Errorf("expected 2 safe env vars, got %d", len(sanitized))
	}
}
