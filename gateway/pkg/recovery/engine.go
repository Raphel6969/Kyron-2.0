package recovery

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// Standard Strategy Types (C5, F17)
const (
	StrategyAutoSubstitute   = "auto_substitute"
	StrategyRebindAndIssue   = "rebind_and_reissue"
	StrategyChunkAndCompress = "chunk_and_compress"
	StrategyRequestLease     = "request_lease"
	StrategyIsolateMock      = "isolate_mock"
	StrategyRetryBackoff     = "retry_with_backoff"
)

// RecoveryPlan defines a precomputed, deterministic self-healing plan
type RecoveryPlan struct {
	Fingerprint      string    `json:"fingerprint"`
	ToolID           string    `json:"tool_id"`
	ErrorCode        string    `json:"error_code"`
	Strategy         string    `json:"strategy"`
	PrimaryAction    string    `json:"primary_action"`
	AlternativeTools []string  `json:"alternative_tools"`
	StepByStepGuide  []string  `json:"step_by_step_guide"`
	TokensConsumed   int       `json:"tokens_consumed"` // Always 0: zero-token self-healing
	CachedAt         time.Time `json:"cached_at"`
}

// CacheStats provides telemetry metrics on memoized self-healing
type CacheStats struct {
	TotalPlans  int    `json:"total_plans"`
	Hits        uint64 `json:"hits"`
	Misses      uint64 `json:"misses"`
	TokensSaved uint64 `json:"tokens_saved"`
}

// Engine implements the Memoized Recovery Engine (C5, F17)
type Engine struct {
	plans         map[string]*RecoveryPlan
	mu            sync.RWMutex
	hits          uint64
	misses        uint64
	tokensSaved   uint64
	tokenEstimate uint64
}

// ComputeFingerprint derives the deterministic composite state fingerprint
func ComputeFingerprint(toolID, errorCode, ruleViolated string, policyVersion uint32, role string) string {
	raw := fmt.Sprintf("%s|%s|%s|%d|%s", toolID, errorCode, ruleViolated, policyVersion, role)
	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:])
}

// NewEngine initializes the recovery cache and pre-seeds canonical failure plans
func NewEngine() *Engine {
	e := &Engine{
		plans:         make(map[string]*RecoveryPlan),
		tokenEstimate: 450, // Average tokens saved by precomputing recovery without calling an LLM
	}
	e.seedStandardPlans()
	return e
}

// seedStandardPlans pre-populates the cache with self-healing strategies for known failure classes
func (e *Engine) seedStandardPlans() {
	// 1. Quarantined tool (S1) -> Auto-substitute get_time
	e.Memoize(&RecoveryPlan{
		ToolID:        "s1_poison",
		ErrorCode:     "KYRON_QUARANTINED_TOOL",
		Strategy:      StrategyAutoSubstitute,
		PrimaryAction: "Substitute quarantined tool 's1_poison' with verified 'get_time'.",
		AlternativeTools: []string{
			"get_time",
			"system_clock",
		},
		StepByStepGuide: []string{
			"1. Intercept call to quarantined tool 's1_poison'.",
			"2. Reroute dispatch to approved alternative 'get_time'.",
			"3. Deliver clean RFC 3339 timestamp without leaking prompt context.",
		},
		TokensConsumed: 0,
		CachedAt:       time.Now().UTC(),
	}, "RULE_REGISTRY_TRUST", 1, "agent")

	// 2. TOCTOU Resource Swap (S5) -> Re-read and re-bind capability lease
	e.Memoize(&RecoveryPlan{
		ToolID:           "inspect_file",
		ErrorCode:        "KYRON_TOCTOU_MISMATCH",
		Strategy:         StrategyRebindAndIssue,
		PrimaryAction:    "Target file content mutated post-approval. Re-read target and request fresh capability lease.",
		AlternativeTools: []string{},
		StepByStepGuide: []string{
			"1. Abort tool dispatch to prevent symlink/file swap exploit.",
			"2. Stat target file and recompute SHA-256 content hash.",
			"3. Request operator capability lease re-binding to fresh content hash.",
		},
		TokensConsumed: 0,
		CachedAt:       time.Now().UTC(),
	}, "RULE_TOCTOU_BINDING", 1, "agent")

	// 3. Egress Quota Breach (S4) -> Chunking & compression guidance
	e.Memoize(&RecoveryPlan{
		ToolID:        "batch_export",
		ErrorCode:     "KYRON_EGRESS_QUOTA_EXCEEDED",
		Strategy:      StrategyChunkAndCompress,
		PrimaryAction: "Trajectory outbound budget exceeded. Split payload into compressed <= 4KB chunks.",
		AlternativeTools: []string{
			"compressed_export",
		},
		StepByStepGuide: []string{
			"1. Halt outbound socket connection before data leakage.",
			"2. Apply gzip compression to reduce outbound wire size.",
			"3. Request elevated egress quota lease via SOC escalation URL.",
		},
		TokensConsumed: 0,
		CachedAt:       time.Now().UTC(),
	}, "RULE_EGRESS_BUDGET", 1, "agent")

	// 4. Missing Capability Lease -> Auto-generate scoped lease request
	e.Memoize(&RecoveryPlan{
		ToolID:        "execute_sql",
		ErrorCode:     "KYRON_LEASE_REQUIRED",
		Strategy:      StrategyRequestLease,
		PrimaryAction: "Tool requires elevated capability lease. Submit call-scoped approval request.",
		AlternativeTools: []string{
			"read_only_sql",
		},
		StepByStepGuide: []string{
			"1. Pause autonomous trajectory.",
			"2. Post approval request to Kyron Control Plane /v1/approvals.",
			"3. Resume execution upon receipt of Ed25519-signed capability lease.",
		},
		TokensConsumed: 0,
		CachedAt:       time.Now().UTC(),
	}, "RULE_CAPABILITY_LEASE_REQUIRED", 1, "agent")
}

// Memoize adds or updates a recovery plan in the cache
func (e *Engine) Memoize(plan *RecoveryPlan, ruleViolated string, policyVersion uint32, role string) {
	if plan.Fingerprint == "" {
		plan.Fingerprint = ComputeFingerprint(plan.ToolID, plan.ErrorCode, ruleViolated, policyVersion, role)
	}
	if plan.CachedAt.IsZero() {
		plan.CachedAt = time.Now().UTC()
	}

	e.mu.Lock()
	defer e.mu.Unlock()
	e.plans[plan.Fingerprint] = plan
}

// Lookup retrieves a cached recovery plan by fingerprint
func (e *Engine) Lookup(fingerprint string) (*RecoveryPlan, bool) {
	e.mu.RLock()
	plan, exists := e.plans[fingerprint]
	e.mu.RUnlock()

	if exists {
		atomic.AddUint64(&e.hits, 1)
		atomic.AddUint64(&e.tokensSaved, e.tokenEstimate)
		return plan, true
	}

	atomic.AddUint64(&e.misses, 1)
	return nil, false
}

// ResolvePlan resolves a recovery plan by state components, memoizing it if synthesized
func (e *Engine) ResolvePlan(toolID, errorCode, ruleViolated string, policyVersion uint32, role string, fallbackAlternatives []string) *RecoveryPlan {
	fp := ComputeFingerprint(toolID, errorCode, ruleViolated, policyVersion, role)
	if plan, ok := e.Lookup(fp); ok {
		return plan
	}

	// Synthesize dynamic plan and memoize for future occurrences
	var primaryAction string
	if len(fallbackAlternatives) > 0 {
		primaryAction = fmt.Sprintf("1. Substitute tool '%s' with approved alternative '%s'. 2. Alternatively, request administrative approval via escalation_url.", toolID, fallbackAlternatives[0])
	} else if errorCode == "KYRON_LEASE_REQUIRED" {
		primaryAction = "1. Request capability lease from authority service. 2. Pass the granted lease_id in subsequent tools/call parameters."
	} else if errorCode == "KYRON_LEASE_EXHAUSTED" {
		primaryAction = "1. Capability lease invocation quota exhausted. Request a multi-call lease or renew single-use lease."
	} else if errorCode == "KYRON_LEASE_EXPIRED" {
		primaryAction = "1. Capability lease TTL expired. Request a renewed lease with adequate time-to-live."
	} else if errorCode == "KYRON_EGRESS_QUOTA_EXCEEDED" {
		primaryAction = "1. Request capability lease extension with elevated egress quota from authority service. 2. Compress payload before outbound dispatch."
	} else {
		primaryAction = fmt.Sprintf("1. Tool '%s' is untrusted. Pause execution and request human operator sign-off via escalation_url. 2. Await capability lease before re-attempting.", toolID)
	}

	dynamicPlan := &RecoveryPlan{
		Fingerprint:      fp,
		ToolID:           toolID,
		ErrorCode:        errorCode,
		Strategy:         StrategyAutoSubstitute,
		PrimaryAction:    primaryAction,
		AlternativeTools: fallbackAlternatives,
		StepByStepGuide: []string{
			fmt.Sprintf("1. Acknowledge policy violation on '%s' (%s).", toolID, errorCode),
			"2. Substitute with approved alternative if available.",
			"3. Request human approval via escalation URL.",
		},
		TokensConsumed: 0,
		CachedAt:       time.Now().UTC(),
	}

	e.mu.Lock()
	e.plans[fp] = dynamicPlan
	e.mu.Unlock()

	return dynamicPlan
}

// Stats returns hit/miss and tokens-saved telemetry
func (e *Engine) Stats() CacheStats {
	e.mu.RLock()
	total := len(e.plans)
	e.mu.RUnlock()

	return CacheStats{
		TotalPlans:  total,
		Hits:        atomic.LoadUint64(&e.hits),
		Misses:      atomic.LoadUint64(&e.misses),
		TokensSaved: atomic.LoadUint64(&e.tokensSaved),
	}
}
