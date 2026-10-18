package mcp

import (
	"fmt"
	"strings"

	"kyron.dev/gateway/pkg/recovery"
)

// Standard Kyron Error Codes (F12, F17)
const (
	CodeQuarantinedTool     = "KYRON_QUARANTINED_TOOL"
	CodeBlockedTool         = "KYRON_BLOCKED_TOOL"
	CodeLeaseRequired       = "KYRON_LEASE_REQUIRED"
	CodeLeaseExhausted      = "KYRON_LEASE_EXHAUSTED"
	CodeLeaseExpired        = "KYRON_LEASE_EXPIRED"
	CodeLeaseInvalid        = "KYRON_LEASE_INVALID"
	CodeEgressQuotaExceeded = "KYRON_EGRESS_QUOTA_EXCEEDED"
	CodeDataFlowRefusal     = "KYRON_DATA_FLOW_REFUSAL"
	CodeSSRFBlocked         = "KYRON_SSRF_BLOCKED"
)

// Standard Kyron Policy Rule Identifiers
const (
	RuleRegistryTrust   = "RULE_REGISTRY_TRUST"
	RuleCapabilityLease = "RULE_CAPABILITY_LEASE_REQUIRED"
	RuleEgressBudget    = "RULE_EGRESS_BUDGET"
	RuleDataFlowMeet    = "RULE_DATA_FLOW_MEET"
	RuleSSRFIsolation   = "RULE_SSRF_ISOLATION"
)

// RemediationEngine synthesizes actionable structured remediation responses for blocked calls (C5, F12, F17)
type RemediationEngine struct {
	registry       *ToolRegistry
	socBaseURL     string
	recoveryEngine *recovery.Engine
}

// NewRemediationEngine creates a new Actionable Error Remediation Engine
func NewRemediationEngine(registry *ToolRegistry, socBaseURL string) *RemediationEngine {
	if socBaseURL == "" {
		socBaseURL = "http://localhost:8001"
	}
	return &RemediationEngine{
		registry:       registry,
		socBaseURL:     strings.TrimRight(socBaseURL, "/"),
		recoveryEngine: recovery.NewEngine(),
	}
}

// GetRecoveryEngine returns the underlying memoized recovery cache engine
func (e *RemediationEngine) GetRecoveryEngine() *recovery.Engine {
	return e.recoveryEngine
}

// BuildQuarantineRemediation generates remediation for tools flagged or quarantined by the registry firewall
func (e *RemediationEngine) BuildQuarantineRemediation(
	sessionID string,
	toolName string,
	state string,
	riskScore float32,
	riskReasons []string,
) *StructuredRemediation {
	alternatives := e.findAlternatives(toolName)
	escalationURL := fmt.Sprintf("%s/v1/approvals/%s", e.socBaseURL, sessionID)

	errCode := CodeQuarantinedTool
	if state == "blocked" || state == "revoked" {
		errCode = CodeBlockedTool
	}

	var recoveryPlan string
	if e.recoveryEngine != nil {
		plan := e.recoveryEngine.ResolvePlan(toolName, errCode, RuleRegistryTrust, 1, "agent", alternatives)
		recoveryPlan = plan.PrimaryAction
		for _, alt := range plan.AlternativeTools {
			var found bool
			for _, ex := range alternatives {
				if ex == alt {
					found = true
					break
				}
			}
			if !found {
				alternatives = append(alternatives, alt)
			}
		}
	} else {
		if len(alternatives) > 0 {
			recoveryPlan = fmt.Sprintf(
				"1. Substitute tool '%s' with approved alternative '%s'. 2. Alternatively, request administrative approval via escalation_url.",
				toolName, alternatives[0],
			)
		} else {
			recoveryPlan = "1. Tool is untrusted. Pause execution and request human operator sign-off via escalation_url. 2. Await capability lease before re-attempting."
		}
	}

	return &StructuredRemediation{
		ErrorCode:        errCode,
		Tool:             toolName,
		State:            state,
		RiskScore:        riskScore,
		RiskReasons:      riskReasons,
		RuleViolated:     RuleRegistryTrust,
		Remediation:      fmt.Sprintf("Tool '%s' is in '%s' state and blocked from autonomous execution.", toolName, state),
		AlternativeTools: alternatives,
		RecoveryPlan:     recoveryPlan,
		EscalationURL:    escalationURL,
	}
}

// BuildLeaseRequiredRemediation generates remediation when a tool requires an explicit capability lease
func (e *RemediationEngine) BuildLeaseRequiredRemediation(
	sessionID string,
	trajectoryID string,
	toolName string,
	reason string,
) *StructuredRemediation {
	escalationURL := fmt.Sprintf("%s/v1/approvals/%s", e.socBaseURL, sessionID)

	var recoveryPlan string
	if e.recoveryEngine != nil {
		plan := e.recoveryEngine.ResolvePlan(toolName, CodeLeaseRequired, RuleCapabilityLease, 1, "agent", nil)
		recoveryPlan = plan.PrimaryAction
	} else {
		recoveryPlan = fmt.Sprintf(
			"1. Request capability lease from authority service for trajectory '%s'. 2. Pass the granted lease_id in subsequent tools/call parameters.",
			trajectoryID,
		)
	}

	return &StructuredRemediation{
		ErrorCode:     CodeLeaseRequired,
		Tool:          toolName,
		State:         "restricted",
		RiskScore:     0.7,
		RiskReasons:   []string{reason},
		RuleViolated:  RuleCapabilityLease,
		Remediation:   fmt.Sprintf("Tool '%s' requires an authenticated capability lease: %s", toolName, reason),
		RecoveryPlan:  recoveryPlan,
		EscalationURL: escalationURL,
	}
}

// BuildLeaseFailureRemediation generates remediation when a capability lease is rejected
func (e *RemediationEngine) BuildLeaseFailureRemediation(
	sessionID string,
	trajectoryID string,
	toolName string,
	reason string,
) *StructuredRemediation {
	escalationURL := fmt.Sprintf("%s/v1/approvals/%s", e.socBaseURL, sessionID)

	errCode := CodeLeaseInvalid
	recoveryPlan := "1. Obtain a fresh capability lease from authority service. 2. Re-dispatch call."

	if strings.Contains(strings.ToLower(reason), "exhaust") {
		errCode = CodeLeaseExhausted
		recoveryPlan = "1. Capability lease invocation quota exhausted. Request a multi-call lease or renew single-use lease."
	} else if strings.Contains(strings.ToLower(reason), "expire") {
		errCode = CodeLeaseExpired
		recoveryPlan = "1. Capability lease TTL expired. Request a renewed lease with adequate time-to-live."
	}

	if e.recoveryEngine != nil {
		plan := e.recoveryEngine.ResolvePlan(toolName, errCode, RuleCapabilityLease, 1, "agent", nil)
		recoveryPlan = plan.PrimaryAction
	}

	return &StructuredRemediation{
		ErrorCode:     errCode,
		Tool:          toolName,
		State:         "lease_rejected",
		RiskScore:     0.8,
		RiskReasons:   []string{reason},
		RuleViolated:  RuleCapabilityLease,
		Remediation:   fmt.Sprintf("Capability lease validation failed for '%s': %s", toolName, reason),
		RecoveryPlan:  recoveryPlan,
		EscalationURL: escalationURL,
	}
}

// BuildEgressQuotaRemediation generates remediation when an agent trajectory exceeds egress quotas
func (e *RemediationEngine) BuildEgressQuotaRemediation(
	sessionID string,
	trajectoryID string,
	toolName string,
	bytesUsed uint64,
	maxAllowed uint64,
) *StructuredRemediation {
	escalationURL := fmt.Sprintf("%s/v1/approvals/%s", e.socBaseURL, sessionID)

	recoveryPlan := "1. Request capability lease extension with elevated egress quota from authority service. 2. Compress payload before outbound dispatch."
	if e.recoveryEngine != nil {
		plan := e.recoveryEngine.ResolvePlan(toolName, CodeEgressQuotaExceeded, RuleEgressBudget, 1, "agent", nil)
		recoveryPlan = plan.PrimaryAction
	}

	return &StructuredRemediation{
		ErrorCode:     CodeEgressQuotaExceeded,
		Tool:          toolName,
		State:         "quota_exceeded",
		RiskScore:     0.9,
		RiskReasons:   []string{fmt.Sprintf("Cumulative trajectory egress limit exceeded: %d bytes used, max %d bytes allowed.", bytesUsed, maxAllowed)},
		RuleViolated:  RuleEgressBudget,
		Remediation:   "Outbound network egress budget exceeded for current agent trajectory.",
		RecoveryPlan:  recoveryPlan,
		EscalationURL: escalationURL,
	}
}

// findAlternatives searches the registry for approved tools that may substitute the blocked tool
func (e *RemediationEngine) findAlternatives(blockedTool string) []string {
	if e.registry == nil {
		return nil
	}

	var alternatives []string
	cleanBlocked := strings.ToLower(blockedTool)

	for _, tool := range e.registry.AllTools() {
		if tool.State != "approved" && tool.State != "active" {
			continue
		}
		if tool.Name == blockedTool {
			continue
		}

		cleanCandidate := strings.ToLower(tool.Name)
		if hasSemanticOverlap(cleanBlocked, cleanCandidate) {
			alternatives = append(alternatives, tool.Name)
		}
	}

	return alternatives
}

func hasSemanticOverlap(a, b string) bool {
	keywords := []string{"time", "clock", "date", "read", "fetch", "query", "sql", "file", "list", "get"}
	for _, kw := range keywords {
		if strings.Contains(a, kw) && strings.Contains(b, kw) {
			return true
		}
	}
	return false
}
