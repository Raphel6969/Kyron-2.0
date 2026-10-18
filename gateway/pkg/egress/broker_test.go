package egress

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestShardedExfiltrationBlockedScenarioS4(t *testing.T) {
	broker := NewBroker(512000, 40, []string{"api.internal.example"})

	// First 40 small requests succeed
	for i := 1; i <= 40; i++ {
		err := broker.CheckAndRecordTrajectory("traj-1", "crm_pii", "api.internal.example", 100)
		if err != nil {
			t.Fatalf("call %d should succeed, got error: %v", i, err)
		}
	}

	// 41st call must be blocked deterministically
	err := broker.CheckAndRecordTrajectory("traj-1", "crm_pii", "api.internal.example", 100)
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

func TestByteQuotaExhaustion(t *testing.T) {
	broker := NewBroker(1000, 10, []string{"api.internal.example"})

	// 800 bytes succeeds
	if err := broker.CheckAndRecord("crm_pii", "api.internal.example", 800); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Another 300 bytes breaches 1000 byte quota
	if err := broker.CheckAndRecord("crm_pii", "api.internal.example", 300); err == nil {
		t.Fatal("expected byte quota breach error, got nil")
	}
}

func TestCloudMetadataBlockedSSRF(t *testing.T) {
	broker := NewBroker(512000, 40, []string{}) // empty whitelist allows public, but blocks private

	// Attempting direct cloud metadata IP
	err := broker.CheckAndRecord("aws_tool", "169.254.169.254", 50)
	if err == nil {
		t.Fatal("expected cloud metadata IP 169.254.169.254 to be blocked by SSRF protection, got nil")
	}

	// Attempting loopback IP
	errLoopback := broker.CheckAndRecord("test_tool", "127.0.0.1", 50)
	if errLoopback == nil {
		t.Fatal("expected 127.0.0.1 to be blocked by SSRF protection, got nil")
	}
}

func TestDistinctDestinationsLimit(t *testing.T) {
	broker := NewBroker(512000, 40, []string{})
	broker.SetSourceBudget("covert_tool", SourceBudget{
		MaxBytes:        512000,
		MaxCalls:        40,
		MaxDestinations: 2,
	})

	// 1st destination
	if err := broker.CheckAndRecordTrajectory("traj-covert", "covert_tool", "dest1.public.net", 50); err != nil {
		t.Fatalf("dest1 failed: %v", err)
	}
	// 2nd destination
	if err := broker.CheckAndRecordTrajectory("traj-covert", "covert_tool", "dest2.public.net", 50); err != nil {
		t.Fatalf("dest2 failed: %v", err)
	}
	// 3rd destination breaches max destinations (2)
	err := broker.CheckAndRecordTrajectory("traj-covert", "covert_tool", "dest3.public.net", 50)
	if err == nil {
		t.Fatal("expected 3rd distinct destination to be blocked, got nil")
	}
}

func TestForwardProxyExecution(t *testing.T) {
	// Setup target test server
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Custom", "verified")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}))
	defer testServer.Close()

	broker := NewBroker(512000, 40, []string{})
	// Whitelist target test server host
	broker.AllowHost("127.0.0.1")

	// Attempt forward with blocked destination
	blockedReq := &ForwardRequest{
		TrajectoryID:   "traj-fwd",
		DataSource:     "crm",
		DestinationURL: "http://unapproved.host.com/data",
		Method:         "GET",
	}
	broker.allowedHosts["127.0.0.1"] = true
	broker.allowedHosts["approved.host.com"] = true

	resp, err := broker.Forward(context.Background(), blockedReq)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Allowed {
		t.Fatal("expected unapproved host forward to be denied, but it was allowed")
	}
}
