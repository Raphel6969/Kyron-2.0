package ledger

import (
	"errors"
	"testing"
)

func TestLedgerRecordAndIdempotency(t *testing.T) {
	ledger := NewLedger()

	cachedResult := []byte(`{"status":"payment_confirmed","amount":500}`)
	eff, err := ledger.Record(
		"eff-001",
		"callhash-123",
		"traj-alpha",
		"process_payment",
		OutcomeCommitted,
		"idem-tx-999",
		[]string{"payment_charged"},
		cachedResult,
	)
	if err != nil {
		t.Fatalf("failed to record effect: %v", err)
	}

	if eff.Token != "eff-001" {
		t.Errorf("expected token eff-001, got %s", eff.Token)
	}

	// Lookup by token
	retrieved, ok := ledger.Get("eff-001")
	if !ok || retrieved == nil {
		t.Fatalf("expected effect eff-001 to exist")
	}

	// Idempotency key lookup (zero-token deduplication)
	idempEff, ok := ledger.GetByIdempotencyKey("idem-tx-999")
	if !ok || idempEff == nil {
		t.Fatalf("expected idempotency key idem-tx-999 to resolve")
	}
	if string(idempEff.CachedResult) != string(cachedResult) {
		t.Errorf("expected cached result to match")
	}
}

func TestLedgerPreconditions(t *testing.T) {
	ledger := NewLedger()
	history := []string{"auth_verified", "cart_locked"}

	// 1. Success case
	mustHave := []string{"auth_verified"}
	mustNotHave := []string{"order_cancelled"}
	if err := ledger.VerifyPreconditions(mustHave, mustNotHave, history); err != nil {
		t.Fatalf("expected preconditions to pass, got: %v", err)
	}

	// 2. Missing must-have
	failMustHave := []string{"kyc_cleared"}
	err := ledger.VerifyPreconditions(failMustHave, mustNotHave, history)
	if !errors.Is(err, ErrPreconditionMustHave) {
		t.Fatalf("expected ErrPreconditionMustHave, got: %v", err)
	}

	// 3. Prohibited must-not-have present
	failMustNot := []string{"cart_locked"}
	err = ledger.VerifyPreconditions(mustHave, failMustNot, history)
	if !errors.Is(err, ErrPreconditionMustNotHave) {
		t.Fatalf("expected ErrPreconditionMustNotHave, got: %v", err)
	}
}

func TestLedgerReconcileIndeterminate(t *testing.T) {
	ledger := NewLedger()

	_, _ = ledger.Record(
		"eff-timeout-1",
		"hash-to",
		"traj-to",
		"cloud_deploy",
		OutcomeIndeterminate,
		"idem-deploy-1",
		nil,
		nil,
	)

	eff, ok := ledger.Get("eff-timeout-1")
	if !ok || eff.Outcome != OutcomeIndeterminate {
		t.Fatalf("expected indeterminate effect")
	}

	// Run reconciliation job
	reconciled := ledger.ReconcileIndeterminate(func(e *Effect) string {
		if e.Token == "eff-timeout-1" {
			return OutcomeCommitted
		}
		return ""
	})

	if len(reconciled) != 1 {
		t.Fatalf("expected 1 reconciled effect, got %d", len(reconciled))
	}
	if ledger.effects["eff-timeout-1"].Outcome != OutcomeCommitted {
		t.Errorf("expected outcome to be transitioned to committed")
	}
}
