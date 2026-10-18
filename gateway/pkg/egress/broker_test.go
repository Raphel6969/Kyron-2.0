package egress

import (
	"testing"
)

func TestShardedExfiltrationBlockedScenarioS4(t *testing.T) {
	broker := NewBroker(512000, 40, []string{"api.internal.example"})

	// First 40 small requests succeed
	for i := 1; i <= 40; i++ {
		err := broker.CheckAndRecord("crm_pii", "api.internal.example", 100)
		if err != nil {
			t.Fatalf("call %d should succeed, got error: %v", i, err)
		}
	}

	// 41st call must be blocked deterministically
	err := broker.CheckAndRecord("crm_pii", "api.internal.example", 100)
	if err == nil {
		t.Fatal("expected 41st call to be blocked by call limit, but it passed")
	}
}

func TestUndeclaredDestinationBlockedScenarioS3(t *testing.T) {
	broker := NewBroker(512000, 40, []string{"api.internal.example"})

	err := broker.CheckAndRecord("crm_pii", "evil-exfil.com", 100)
	if err == nil {
		t.Fatal("expected undeclared destination to be blocked, but it passed")
	}
}
