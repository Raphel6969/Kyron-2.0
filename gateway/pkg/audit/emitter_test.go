package audit

import (
	"bytes"
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

	// Test JSON-L export & re-load
	var buf bytes.Buffer
	if err := emitter.ExportJSONL(&buf); err != nil {
		t.Fatalf("failed to export JSON-L: %v", err)
	}

	loadedEvents, err := LoadJSONL(&buf)
	if err != nil {
		t.Fatalf("failed to load JSON-L: %v", err)
	}
	if len(loadedEvents) != 3 {
		t.Fatalf("expected 3 loaded events, got %d", len(loadedEvents))
	}

	verif, err := VerifyEventStream(loadedEvents, emitter.PublicKey())
	if err != nil || !verif.Valid {
		t.Fatalf("loaded events failed verification: %+v", verif)
	}

	// Tamper test 1: Modify a field in the second event
	tampered := make([]Event, len(loadedEvents))
	copy(tampered, loadedEvents)
	tampered[1].Verdict = "allow" // Attacker alters 'block' to 'allow'

	tamperRes, err := VerifyEventStream(tampered, emitter.PublicKey())
	if err != nil {
		t.Fatalf("unexpected error during tamper verification: %v", err)
	}
	if tamperRes.Valid {
		t.Fatal("expected tamper detection to fail on modified verdict, but it passed!")
	}
	if *tamperRes.BrokenAtIndex != 1 {
		t.Errorf("expected broken at index 1, got %d", *tamperRes.BrokenAtIndex)
	}

	// Tamper test 2: Delete an event from the middle
	deletedChain := []Event{loadedEvents[0], loadedEvents[2]}
	delRes, err := VerifyEventStream(deletedChain, emitter.PublicKey())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if delRes.Valid {
		t.Fatal("expected chain break detection on deleted event, but it passed!")
	}
}
