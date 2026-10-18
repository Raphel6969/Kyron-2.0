package policy

import (
	"sync"
	"testing"

	"kyron.dev/gateway/pkg/authority"
)

const sampleTOML = `
[meta]
version = 1
name = "enterprise-strict"
mode = "enforce"
description = "Unit test policy bundle"
signed_by = "sec-admin"

[budgets]
egress_bytes_per_trajectory = 1048576
max_calls_per_trajectory = 100
max_distinct_destinations = 5

[egress]
default_action = "deny"
allowed_destinations = ["api.github.com", "*.corp.net"]
blocked_destinations = ["169.254.169.254", "evil.com"]

[[tools]]
pattern = "bash"
action = "block"
reason = "Direct shell execution is banned"

[[tools]]
pattern = "deploy_*"
action = "require_lease"
max_calls = 1
ttl_seconds = 300
reason = "Deployments require capability lease"

[[tools]]
pattern = "*"
action = "allow"
reason = "Permitted approved tool"
`

func TestParseTOMLValid(t *testing.T) {
	bundle, err := ParseTOML([]byte(sampleTOML))
	if err != nil {
		t.Fatalf("unexpected error parsing valid TOML: %v", err)
	}

	if bundle.Meta.Name != "enterprise-strict" {
		t.Errorf("expected name enterprise-strict, got %s", bundle.Meta.Name)
	}
	if bundle.Meta.Mode != "enforce" {
		t.Errorf("expected mode enforce, got %s", bundle.Meta.Mode)
	}
	if bundle.Budgets.EgressBytesPerTrajectory != 1048576 {
		t.Errorf("unexpected egress bytes: %d", bundle.Budgets.EgressBytesPerTrajectory)
	}

	// Tool matching tests
	bashRule := bundle.ResolveToolRule("bash")
	if bashRule == nil || bashRule.Action != "block" {
		t.Fatalf("expected bash rule to block, got: %+v", bashRule)
	}

	deployRule := bundle.ResolveToolRule("deploy_prod")
	if deployRule == nil || deployRule.Action != "require_lease" {
		t.Fatalf("expected deploy_prod to require_lease, got: %+v", deployRule)
	}
	if *deployRule.MaxCalls != 1 || *deployRule.TTLSeconds != 300 {
		t.Errorf("unexpected max_calls or ttl: %+v", deployRule)
	}

	readRule := bundle.ResolveToolRule("read_file")
	if readRule == nil || readRule.Action != "allow" {
		t.Fatalf("expected read_file to fallback to allow, got: %+v", readRule)
	}

	// Egress destination tests
	if !bundle.IsDestinationAllowed("api.github.com") {
		t.Errorf("expected api.github.com to be allowed")
	}
	if !bundle.IsDestinationAllowed("internal.corp.net") {
		t.Errorf("expected internal.corp.net to be allowed via wildcard *.corp.net")
	}
	if bundle.IsDestinationAllowed("169.254.169.254") {
		t.Errorf("expected cloud metadata SSRF IP to be blocked")
	}
	if bundle.IsDestinationAllowed("evil.com") {
		t.Errorf("expected evil.com to be blocked")
	}
	if bundle.IsDestinationAllowed("unknown-external.com") {
		t.Errorf("expected unknown destination to be denied by default_action=deny")
	}
}

func TestParseTOMLInvalid(t *testing.T) {
	cases := []struct {
		name string
		toml string
	}{
		{
			name: "zero version",
			toml: `[meta]
version = 0
name = "bad"
mode = "enforce"`,
		},
		{
			name: "empty name",
			toml: `[meta]
version = 1
name = ""
mode = "enforce"`,
		},
		{
			name: "invalid mode",
			toml: `[meta]
version = 1
name = "bad"
mode = "permissive"`,
		},
		{
			name: "invalid tool action",
			toml: `[meta]
version = 1
name = "bad"
mode = "enforce"
[[tools]]
pattern = "tool1"
action = "ignore"`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := ParseTOML([]byte(tc.toml))
			if err == nil {
				t.Errorf("expected error for invalid case '%s', got nil", tc.name)
			}
		})
	}
}

func TestManagerAtomicHotReload(t *testing.T) {
	bundleA, err := ParseTOML([]byte(sampleTOML))
	if err != nil {
		t.Fatalf("failed to parse initial bundle: %v", err)
	}

	mgr := NewManager(bundleA)

	const updatedTOML = `
[meta]
version = 2
name = "enterprise-updated"
mode = "monitor"
description = "Hot reloaded"

[budgets]
egress_bytes_per_trajectory = 2097152
max_calls_per_trajectory = 200
max_distinct_destinations = 10

[egress]
default_action = "allow"
allowed_destinations = []
blocked_destinations = []

[[tools]]
pattern = "*"
action = "allow"
`
	bundleB, err := ParseTOML([]byte(updatedTOML))
	if err != nil {
		t.Fatalf("failed to parse updated bundle: %v", err)
	}

	var hookFired bool
	mgr.OnReload(func(oldB, newB *PolicyBundle) {
		hookFired = true
		if oldB.Meta.Version != 1 || newB.Meta.Version != 2 {
			t.Errorf("unexpected hook versions: old=%d, new=%d", oldB.Meta.Version, newB.Meta.Version)
		}
	})

	// Concurrent lockless readers simulating active gateway traffic
	stopCh := make(chan struct{})
	var wg sync.WaitGroup

	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-stopCh:
					return
				default:
					active := mgr.Active()
					if active == nil {
						t.Errorf("active bundle was unexpectedly nil")
						return
					}
					// Verify bundle consistency during atomic swap
					if active.Meta.Version != 1 && active.Meta.Version != 2 {
						t.Errorf("corrupt version during hot reload: %d", active.Meta.Version)
						return
					}
				}
			}
		}()
	}

	// Trigger atomic activation while readers are active
	mgr.Activate(bundleB)

	// Verify active bundle swapped immediately
	active := mgr.Active()
	if active.Meta.Version != 2 || active.Meta.Name != "enterprise-updated" {
		t.Errorf("expected active bundle version 2, got %d", active.Meta.Version)
	}

	close(stopCh)
	wg.Wait()

	if !hookFired {
		t.Errorf("expected reload hook to fire upon activation")
	}
}

func TestManagerAuthoritySync(t *testing.T) {
	bundle, err := ParseTOML([]byte(sampleTOML))
	if err != nil {
		t.Fatalf("failed to parse bundle: %v", err)
	}

	auth, err := authority.NewService(nil, nil)
	if err != nil {
		t.Fatalf("failed to create authority: %v", err)
	}

	mgr := NewManager(nil)
	mgr.SetAuthority(auth)
	mgr.Activate(bundle)

	// deploy_* should require lease now
	if !auth.IsLeaseRequired("deploy_prod") {
		t.Errorf("expected deploy_prod to require lease after policy activation")
	}

	// Hot reload policy to release lease requirement
	relaxedTOML := `
[meta]
version = 3
name = "relaxed"
mode = "enforce"

[[tools]]
pattern = "deploy_*"
action = "allow"
`
	err = mgr.LoadTOML([]byte(relaxedTOML))
	if err != nil {
		t.Fatalf("failed to load relaxed policy: %v", err)
	}

	if auth.IsLeaseRequired("deploy_prod") {
		t.Errorf("expected deploy_prod lease requirement to be released after policy reload")
	}
}
