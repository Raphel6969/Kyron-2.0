package authority

import (
	"crypto/ed25519"
	"crypto/rand"
	"sync"
	"testing"
	"time"
)

func TestLeaseSigningAndVerification(t *testing.T) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}

	lease, err := NewLease(
		"lease-001",
		"traj-100",
		"execute_bash",
		[]string{"admin"},
		1,
		60,
		1,
		priv,
	)
	if err != nil {
		t.Fatalf("failed to create lease: %v", err)
	}

	if err := lease.Verify(pub); err != nil {
		t.Fatalf("expected valid signature, got: %v", err)
	}

	// Tamper with action
	lease.Action = "delete_database"
	if err := lease.Verify(pub); err == nil {
		t.Fatal("expected signature verification failure for tampered lease")
	}
}

func TestLeaseAtomicConsumptionAndExpiry(t *testing.T) {
	_, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}

	// 2 calls, 2 seconds TTL
	lease, err := NewLease(
		"lease-002",
		"traj-200",
		"read_table",
		[]string{"analyst"},
		2,
		2,
		1,
		priv,
	)
	if err != nil {
		t.Fatalf("failed to create lease: %v", err)
	}

	now := time.Now().UTC()

	// First call succeeds
	calls, err := lease.Consume(now)
	if err != nil || calls != 1 {
		t.Fatalf("expected calls=1, got calls=%d, err=%v", calls, err)
	}

	// Second call succeeds
	calls, err = lease.Consume(now)
	if err != nil || calls != 2 {
		t.Fatalf("expected calls=2, got calls=%d, err=%v", calls, err)
	}

	// Third call fails with exhaustion
	_, err = lease.Consume(now)
	if err != ErrLeaseExhausted {
		t.Fatalf("expected ErrLeaseExhausted, got %v", err)
	}

	// Fast forward time past TTL
	future := now.Add(5 * time.Second)
	_, err = lease.Consume(future)
	if err != ErrLeaseExpired {
		t.Fatalf("expected ErrLeaseExpired, got %v", err)
	}
}

func TestLeaseConcurrentAtomicConsumption(t *testing.T) {
	_, priv, _ := ed25519.GenerateKey(rand.Reader)
	lease, _ := NewLease(
		"lease-concurrency",
		"traj-300",
		"limited_resource",
		[]string{"worker"},
		10,
		100,
		1,
		priv,
	)

	var wg sync.WaitGroup
	workers := 50
	successCount := int32(0)
	var mu sync.Mutex

	now := time.Now().UTC()
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := lease.Consume(now); err == nil {
				mu.Lock()
				successCount++
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	if successCount != 10 {
		t.Fatalf("expected exactly 10 successful consumptions, got %d", successCount)
	}
	if lease.CallsUsed != 10 {
		t.Fatalf("expected lease.CallsUsed == 10, got %d", lease.CallsUsed)
	}
}

func TestAuthorityServiceRulingPipeline(t *testing.T) {
	svc, err := NewService(nil, nil)
	if err != nil {
		t.Fatalf("failed to create authority service: %v", err)
	}

	// 1. Unrestricted tool needs no lease
	ruling, err := svc.EvaluateCall("sess-1", "traj-1", "public_echo", "hash1", "")
	if err != nil || ruling.Decision != RulingAllow {
		t.Fatalf("expected unrestricted tool to be allowed, got ruling=%+v, err=%v", ruling, err)
	}

	// 2. Mark tool as restricted
	svc.RequireLease("execute_sql")

	// Missing lease returns RulingNeedApproval
	ruling, err = svc.EvaluateCall("sess-1", "traj-1", "execute_sql", "hash2", "")
	if err != nil || ruling.Decision != RulingNeedApproval {
		t.Fatalf("expected need_approval, got ruling=%+v, err=%v", ruling, err)
	}
	if ruling.EscalationURL == "" {
		t.Fatal("expected non-empty escalation URL")
	}

	// 3. Issue lease for execute_sql
	lease, err := svc.IssueLease("traj-1", "execute_sql", 1, 60, []string{"agent"})
	if err != nil {
		t.Fatalf("failed to issue lease: %v", err)
	}

	// 4. Evaluate with valid lease
	ruling, err = svc.EvaluateCall("sess-1", "traj-1", "execute_sql", "hash3", lease.ID)
	if err != nil || ruling.Decision != RulingAllow {
		t.Fatalf("expected allow with valid lease, got ruling=%+v, err=%v", ruling, err)
	}

	// 5. Subsequent call with same single-use lease fails (exhausted)
	ruling, err = svc.EvaluateCall("sess-1", "traj-1", "execute_sql", "hash4", lease.ID)
	if err != nil || ruling.Decision != RulingDeny {
		t.Fatalf("expected deny on exhausted lease, got ruling=%+v, err=%v", ruling, err)
	}

	// 6. Trajectory mismatch test
	lease2, _ := svc.IssueLease("traj-other", "execute_sql", 1, 60, []string{"agent"})
	ruling, _ = svc.EvaluateCall("sess-1", "traj-1", "execute_sql", "hash5", lease2.ID)
	if ruling.Decision != RulingDeny {
		t.Fatalf("expected deny on trajectory mismatch, got %v", ruling.Decision)
	}

	// 7. Wildcard action lease
	wildcardLease, _ := svc.IssueLease("traj-1", "*", 5, 60, []string{"admin"})
	ruling, err = svc.EvaluateCall("sess-1", "traj-1", "execute_sql", "hash6", wildcardLease.ID)
	if err != nil || ruling.Decision != RulingAllow {
		t.Fatalf("expected allow with wildcard lease, got ruling=%+v, err=%v", ruling, err)
	}
}
