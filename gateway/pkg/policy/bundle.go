package policy

import (
	"fmt"
	"strings"

	"github.com/pelletier/go-toml/v2"
)

// PolicyMeta contains declarative metadata for a policy bundle (C3, F35)
type PolicyMeta struct {
	Version     uint32 `toml:"version"`
	Name        string `toml:"name"`
	Mode        string `toml:"mode"` // "enforce" or "monitor"
	Description string `toml:"description"`
	SignedBy    string `toml:"signed_by"`
}

// BudgetsConfig specifies resource quotas enforced per trajectory
type BudgetsConfig struct {
	EgressBytesPerTrajectory uint64 `toml:"egress_bytes_per_trajectory"`
	MaxCallsPerTrajectory    uint32 `toml:"max_calls_per_trajectory"`
	MaxDistinctDestinations  uint32 `toml:"max_distinct_destinations"`
}

// EgressConfig specifies network destination egress whitelist and blacklist rules
type EgressConfig struct {
	DefaultAction       string   `toml:"default_action"` // "allow" or "deny"
	AllowedDestinations []string `toml:"allowed_destinations"`
	BlockedDestinations []string `toml:"blocked_destinations"`
}

// ToolRule defines granular action constraints for a matching tool pattern
type ToolRule struct {
	Pattern    string  `toml:"pattern"`
	Action     string  `toml:"action"` // "allow", "block", "require_lease"
	MaxCalls   *uint32 `toml:"max_calls,omitempty"`
	TTLSeconds *uint32 `toml:"ttl_seconds,omitempty"`
	Reason     string  `toml:"reason"`
}

// PolicyBundle represents a compiled declarative policy bundle loaded from TOML
type PolicyBundle struct {
	Meta    PolicyMeta    `toml:"meta"`
	Budgets BudgetsConfig `toml:"budgets"`
	Egress  EgressConfig  `toml:"egress"`
	Tools   []ToolRule    `toml:"tools"`
}

// ParseTOML parses and semantically validates a declarative TOML policy bundle
func ParseTOML(data []byte) (*PolicyBundle, error) {
	var bundle PolicyBundle
	if err := toml.Unmarshal(data, &bundle); err != nil {
		return nil, fmt.Errorf("failed to parse TOML policy: %w", err)
	}

	if err := bundle.Validate(); err != nil {
		return nil, err
	}

	return &bundle, nil
}

// Validate verifies structural constraints on policy bundles
func (b *PolicyBundle) Validate() error {
	if b.Meta.Version == 0 {
		return fmt.Errorf("policy meta.version must be >= 1")
	}
	if strings.TrimSpace(b.Meta.Name) == "" {
		return fmt.Errorf("policy meta.name must not be empty")
	}
	if b.Meta.Mode != "enforce" && b.Meta.Mode != "monitor" {
		return fmt.Errorf("invalid policy meta.mode '%s'; must be 'enforce' or 'monitor'", b.Meta.Mode)
	}

	for i, rule := range b.Tools {
		if strings.TrimSpace(rule.Pattern) == "" {
			return fmt.Errorf("tool rule #%d pattern must not be empty", i)
		}
		if rule.Action != "allow" && rule.Action != "block" && rule.Action != "require_lease" {
			return fmt.Errorf("invalid action '%s' in tool rule for '%s'; must be 'allow', 'block', or 'require_lease'", rule.Action, rule.Pattern)
		}
	}

	return nil
}

// ResolveToolRule returns the first matching tool rule for a given tool name
func (b *PolicyBundle) ResolveToolRule(toolName string) *ToolRule {
	for i := range b.Tools {
		if MatchPattern(b.Tools[i].Pattern, toolName) {
			return &b.Tools[i]
		}
	}
	return nil
}

// IsDestinationAllowed evaluates whether an outbound destination host is permitted under egress rules
func (b *PolicyBundle) IsDestinationAllowed(host string) bool {
	// Explicit block rules take priority
	for _, blocked := range b.Egress.BlockedDestinations {
		if MatchPattern(blocked, host) {
			return false
		}
	}

	// Whitelist rules
	for _, allowed := range b.Egress.AllowedDestinations {
		if MatchPattern(allowed, host) {
			return true
		}
	}

	return b.Egress.DefaultAction == "allow"
}

// MatchPattern matches wildcard glob patterns (*, prefix*, *suffix, exact)
func MatchPattern(pattern, target string) bool {
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
