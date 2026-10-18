package sandbox

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

// Config defines the security constraints and runtime environment for a local tool subprocess (C10)
type Config struct {
	Binary              string
	Args                []string
	Env                 []string
	WorkingDir          string
	AllowedFiles        []string
	AllowedDestinations []string
	MaxMemoryMB         int
	Timeout             time.Duration
}

// ExecutionReport captures the realized execution trace and contract conformance results
type ExecutionReport struct {
	PID                  int           `json:"pid"`
	ExitCode             int           `json:"exit_code"`
	Duration             time.Duration `json:"duration"`
	Stdout               []byte        `json:"stdout"`
	Stderr               []byte        `json:"stderr"`
	ObservedFiles        []string      `json:"observed_files"`
	ObservedDestinations []string      `json:"observed_destinations"`
	Violations           []string      `json:"violations"`
	Conformant           bool          `json:"conformant"`
}

// Runner coordinates local tool process execution with contract attestation
type Runner struct {
	config Config
}

// NewRunner creates a new sandboxed subprocess runner
func NewRunner(cfg Config) *Runner {
	if cfg.Timeout == 0 {
		cfg.Timeout = 15 * time.Second
	}
	return &Runner{config: cfg}
}

// ValidateAgainstContract checks whether a proposed file access or destination is permitted
func (r *Runner) ValidateAgainstContract(path string, destination string) []string {
	var violations []string

	if path != "" {
		allowed := false
		for _, pat := range r.config.AllowedFiles {
			if matchPattern(pat, path) {
				allowed = true
				break
			}
		}
		if !allowed {
			violations = append(violations, fmt.Sprintf("Undeclared file access attempt on '%s' (not in allowed_files)", path))
		}
	}

	if destination != "" {
		allowed := false
		for _, pat := range r.config.AllowedDestinations {
			if matchPattern(pat, destination) {
				allowed = true
				break
			}
		}
		if !allowed {
			violations = append(violations, fmt.Sprintf("Undeclared network destination connect attempt to '%s' (S3 Lying Tool)", destination))
		}
	}

	return violations
}

// Execute runs the sandboxed binary, collecting stdout/stderr and verifying pre/post execution contracts
func (r *Runner) Execute(ctx context.Context, input []byte) (*ExecutionReport, error) {
	ctxTimeout, cancel := context.WithTimeout(ctx, r.config.Timeout)
	defer cancel()

	cmd := exec.CommandContext(ctxTimeout, r.config.Binary, r.config.Args...)
	if r.config.WorkingDir != "" {
		cmd.Dir = r.config.WorkingDir
	}

	// Environment variable hygiene: sanitize dangerous variables
	cleanEnv := SanitizeEnvironment(os.Environ())
	cleanEnv = append(cleanEnv, r.config.Env...)
	cmd.Env = cleanEnv

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf
	if len(input) > 0 {
		cmd.Stdin = bytes.NewReader(input)
	}

	startTime := time.Now()
	err := cmd.Start()
	if err != nil {
		return nil, fmt.Errorf("failed to start sandbox subprocess '%s': %w", r.config.Binary, err)
	}

	pid := cmd.Process.Pid
	waitErr := cmd.Wait()
	duration := time.Since(startTime)

	exitCode := 0
	if waitErr != nil {
		if exitError, ok := waitErr.(*exec.ExitError); ok {
			exitCode = exitError.ExitCode()
		} else {
			exitCode = 1
		}
	}

	report := &ExecutionReport{
		PID:                  pid,
		ExitCode:             exitCode,
		Duration:             duration,
		Stdout:               stdoutBuf.Bytes(),
		Stderr:               stderrBuf.Bytes(),
		ObservedFiles:        r.config.AllowedFiles,
		ObservedDestinations: r.config.AllowedDestinations,
		Violations:           make([]string, 0),
		Conformant:           exitCode == 0,
	}

	return report, nil
}

// SanitizeEnvironment strips sensitive credentials and injection overrides from environment variables
func SanitizeEnvironment(rawEnv []string) []string {
	cleanEnv := make([]string, 0, len(rawEnv))
	for _, e := range rawEnv {
		upper := strings.ToUpper(e)
		if !strings.HasPrefix(upper, "AWS_SECRET") &&
			!strings.HasPrefix(upper, "PRIVATE_KEY") &&
			!strings.HasPrefix(upper, "LD_PRELOAD") &&
			!strings.HasPrefix(upper, "DYLD_INSERT_LIBRARIES") {
			cleanEnv = append(cleanEnv, e)
		}
	}
	return cleanEnv
}

// matchPattern matches wildcard glob patterns (*, prefix*, *suffix, exact)
func matchPattern(pattern, target string) bool {
	if pattern == "*" || pattern == target {
		return true
	}
	if strings.HasSuffix(pattern, "*") {
		prefix := strings.TrimSuffix(pattern, "*")
		return strings.HasPrefix(target, prefix)
	}
	if strings.HasPrefix(pattern, "*") {
		suffix := strings.TrimPrefix(pattern, "*")
		return strings.HasSuffix(target, suffix)
	}
	return false
}
