package audit

import (
	"testing"
)

func TestAuditHashChainAndSigningVerification(t *testing.T) {
	emitter, err := NewEmitter()
	if err != nil {
		t.Fatalf("failed to create emitter: %v", err)
	}

	// Emit three events
	_, err = emitter.Emit("s1", "t1", "hash1", "tool_a", "allow", nil, 1)
	if err != nil {
		t.Fatalf("emit 1 failed: %v", err)
	}

	_, err = emitter.Emit("s1", "t1", "hash2", "tool_b", "block", []string{"risk_exceeded"}, 1)
	if err != nil {
		t.Fatalf("emit 2 failed: %v", err)
	}

	_, err = emitter.Emit("s1", "t1", "hash3", "tool_c", "allow", nil, 1)
	if err != nil {
		t.Fatalf("emit 3 failed: %v", err)
	}

	if !emitter.VerifyChain() {
		t.Fatal("expected chain verification to pass, but it failed!")
	}
}
