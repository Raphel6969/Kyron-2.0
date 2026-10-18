package mcp

import (
	"strings"
	"testing"
)

func TestRemediationEngineQuarantineAndAlternatives(t *testing.T) {
	reg := NewToolRegistry()
	reg.RegisterTool(&RegisteredTool{
		ServerID: "srv1",
		Name:     "get_time",
		State:    "approved",
	})
	reg.RegisterTool(&RegisteredTool{
		ServerID: "srv1",
		Name:     "fetch_url",
		State:    "approved",
	})
	reg.RegisterTool(&RegisteredTool{
		ServerID:    "srv1",
		Name:        "poisoned_time_tool",
		State:       "quarantined",
		RiskScore:   0.92,
		RiskReasons: []string{"Hidden instructions in description"},
	})

	engine := NewRemediationEngine(reg, "http://localhost:8001")
	rem := engine.BuildQuarantineRemediation(
		"sess-test",
		"poisoned_time_tool",
		"quarantined",
		0.92,
		[]string{"Hidden instructions in description"},
	)

	if rem.ErrorCode != CodeQuarantinedTool {
		t.Fatalf("expected error code %s, got %s", CodeQuarantinedTool, rem.ErrorCode)
	}
	if rem.RuleViolated != RuleRegistryTrust {
		t.Fatalf("expected rule %s, got %s", RuleRegistryTrust, rem.RuleViolated)
	}
	if len(rem.AlternativeTools) == 0 || rem.AlternativeTools[0] != "get_time" {
		t.Fatalf("expected alternative 'get_time', got %v", rem.AlternativeTools)
	}
	if !strings.Contains(rem.RecoveryPlan, "Substitute tool 'poisoned_time_tool' with approved alternative 'get_time'") {
		t.Fatalf("unexpected recovery plan: %s", rem.RecoveryPlan)
	}
	if rem.EscalationURL != "http://localhost:8001/v1/approvals/sess-test" {
		t.Fatalf("unexpected escalation URL: %s", rem.EscalationURL)
	}
}

func TestRemediationEngineLeaseFailures(t *testing.T) {
	engine := NewRemediationEngine(nil, "http://localhost:8001")

	// 1. Required lease
	remReq := engine.BuildLeaseRequiredRemediation("sess-1", "traj-1", "admin_bash", "Privileged tool")
	if remReq.ErrorCode != CodeLeaseRequired {
		t.Fatalf("expected %s, got %s", CodeLeaseRequired, remReq.ErrorCode)
	}
	if remReq.RuleViolated != RuleCapabilityLease {
		t.Fatalf("expected %s, got %s", RuleCapabilityLease, remReq.RuleViolated)
	}

	// 2. Exhausted lease
	remExh := engine.BuildLeaseFailureRemediation("sess-1", "traj-1", "admin_bash", "Capability lease exhausted (1/1 calls)")
	if remExh.ErrorCode != CodeLeaseExhausted {
		t.Fatalf("expected %s, got %s", CodeLeaseExhausted, remExh.ErrorCode)
	}

	// 3. Expired lease
	remExp := engine.BuildLeaseFailureRemediation("sess-1", "traj-1", "admin_bash", "Capability lease expired")
	if remExp.ErrorCode != CodeLeaseExpired {
		t.Fatalf("expected %s, got %s", CodeLeaseExpired, remExp.ErrorCode)
	}
}

func TestRemediationEngineEgressQuota(t *testing.T) {
	engine := NewRemediationEngine(nil, "https://kyron.soc")
	rem := engine.BuildEgressQuotaRemediation("sess-2", "traj-2", "send_payload", 700000, 512000)

	if rem.ErrorCode != CodeEgressQuotaExceeded {
		t.Fatalf("expected %s, got %s", CodeEgressQuotaExceeded, rem.ErrorCode)
	}
	if rem.RuleViolated != RuleEgressBudget {
		t.Fatalf("expected %s, got %s", RuleEgressBudget, rem.RuleViolated)
	}
	if rem.EscalationURL != "https://kyron.soc/v1/approvals/sess-2" {
		t.Fatalf("unexpected escalation url: %s", rem.EscalationURL)
	}
}
