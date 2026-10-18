package recovery

import (
	"sync"
	"testing"
)

func TestCompositeFingerprintDeterminism(t *testing.T) {
	fp1 := ComputeFingerprint("s1_poison", "KYRON_QUARANTINED_TOOL", "RULE_REGISTRY_TRUST", 1, "agent")
	fp2 := ComputeFingerprint("s1_poison", "KYRON_QUARANTINED_TOOL", "RULE_REGISTRY_TRUST", 1, "agent")
	fp3 := ComputeFingerprint("s1_poison", "KYRON_QUARANTINED_TOOL", "RULE_REGISTRY_TRUST", 2, "agent") // different policy version

	if fp1 != fp2 {
		t.Fatalf("expected identical fingerprints for same parameters, got %s != %s", fp1, fp2)
	}
	if fp1 == fp3 {
		t.Fatalf("expected different fingerprints for different policy versions, got %s == %s", fp1, fp3)
	}
	if len(fp1) != 64 {
		t.Fatalf("expected 64 hex characters SHA-256 fingerprint, got length %d", len(fp1))
	}
}

func TestPreseededRecoveryHitZeroTokens(t *testing.T) {
	engine := NewEngine()

	fp := ComputeFingerprint("s1_poison", "KYRON_QUARANTINED_TOOL", "RULE_REGISTRY_TRUST", 1, "agent")
	plan, ok := engine.Lookup(fp)
	if !ok || plan == nil {
		t.Fatalf("expected pre-seeded recovery plan for s1_poison to be found")
	}

	if plan.ToolID != "s1_poison" {
		t.Errorf("expected tool_id s1_poison, got %s", plan.ToolID)
	}
	if plan.Strategy != StrategyAutoSubstitute {
		t.Errorf("expected auto_substitute strategy, got %s", plan.Strategy)
	}
	if plan.TokensConsumed != 0 {
		t.Errorf("expected 0 tokens consumed for memoized plan, got %d", plan.TokensConsumed)
	}
	if len(plan.AlternativeTools) == 0 || plan.AlternativeTools[0] != "get_time" {
		t.Errorf("expected alternative tool 'get_time', got %v", plan.AlternativeTools)
	}

	stats := engine.Stats()
	if stats.Hits != 1 {
		t.Errorf("expected 1 hit, got %d", stats.Hits)
	}
	if stats.TokensSaved != 450 {
		t.Errorf("expected 450 tokens saved, got %d", stats.TokensSaved)
	}
}

func TestDynamicResolutionAndMemoization(t *testing.T) {
	engine := NewEngine()

	tool := "custom_untrusted_worker"
	errCode := "KYRON_CUSTOM_POLICY_BREACH"
	rule := "RULE_CUSTOM"

	fp := ComputeFingerprint(tool, errCode, rule, 1, "agent")

	// First lookup is a miss
	_, ok := engine.Lookup(fp)
	if ok {
		t.Fatalf("expected miss for unknown fingerprint")
	}

	// Resolve plan
	plan := engine.ResolvePlan(tool, errCode, rule, 1, "agent", []string{"safe_worker"})
	if plan == nil {
		t.Fatalf("expected non-nil resolved plan")
	}
	if plan.Fingerprint != fp {
		t.Errorf("expected plan fingerprint %s, got %s", fp, plan.Fingerprint)
	}

	// Second lookup is now a hit because ResolvePlan memoizes it!
	retrieved, ok := engine.Lookup(fp)
	if !ok || retrieved == nil {
		t.Fatalf("expected memoized plan to be retrieved on second lookup")
	}
	if retrieved.ToolID != tool {
		t.Errorf("expected tool %s, got %s", tool, retrieved.ToolID)
	}
}

func TestConcurrentRecoveryCacheAccess(t *testing.T) {
	engine := NewEngine()
	fp := ComputeFingerprint("s1_poison", "KYRON_QUARANTINED_TOOL", "RULE_REGISTRY_TRUST", 1, "agent")

	var wg sync.WaitGroup
	workers := 50

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, _ = engine.Lookup(fp)
		}()
	}

	wg.Wait()

	stats := engine.Stats()
	if stats.Hits != uint64(workers) {
		t.Fatalf("expected %d hits, got %d", workers, stats.Hits)
	}
	if stats.TokensSaved != uint64(workers)*450 {
		t.Fatalf("expected %d tokens saved, got %d", uint64(workers)*450, stats.TokensSaved)
	}
}
