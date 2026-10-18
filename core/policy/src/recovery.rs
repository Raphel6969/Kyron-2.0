//! Memoized Recovery Engine (C5, F17)
//!
//! Precomputes and caches structured recovery plans indexed by composite
//! state fingerprints to achieve zero-model-token self-healing.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Calculates deterministic composite state fingerprints (C5, F17)
pub struct CompositeFingerprint;

impl CompositeFingerprint {
    pub fn compute(
        tool_id: &str,
        error_code: &str,
        rule_violated: &str,
        policy_version: u32,
        role: &str,
    ) -> String {
        let raw = format!(
            "{}|{}|{}|{}|{}",
            tool_id, error_code, rule_violated, policy_version, role
        );
        let mut hasher = Sha256::new();
        hasher.update(raw.as_bytes());
        hex::encode(hasher.finalize())
    }
}

/// Precomputed recovery plan for zero-token self-healing (F17)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RecoveryPlan {
    pub fingerprint: String,
    pub tool_id: String,
    pub error_code: String,
    pub strategy: String,
    pub primary_action: String,
    pub alternative_tools: Vec<String>,
    pub step_by_step_guide: Vec<String>,
    pub tokens_consumed: u32,
    pub cached_at: DateTime<Utc>,
}

impl RecoveryPlan {
    pub fn new(
        tool_id: impl Into<String>,
        error_code: impl Into<String>,
        rule_violated: &str,
        policy_version: u32,
        role: &str,
        strategy: impl Into<String>,
        primary_action: impl Into<String>,
        alternative_tools: Vec<String>,
        step_by_step_guide: Vec<String>,
    ) -> Self {
        let tool_str = tool_id.into();
        let err_str = error_code.into();
        let fingerprint =
            CompositeFingerprint::compute(&tool_str, &err_str, rule_violated, policy_version, role);

        Self {
            fingerprint,
            tool_id: tool_str,
            error_code: err_str,
            strategy: strategy.into(),
            primary_action: primary_action.into(),
            alternative_tools,
            step_by_step_guide,
            tokens_consumed: 0, // Zero tokens consumed on precomputed recovery path
            cached_at: Utc::now(),
        }
    }
}

/// Telemetry metrics for memoized self-healing
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RecoveryCacheStats {
    pub hits: u64,
    pub misses: u64,
    pub tokens_saved: u64,
}

/// Memoized Recovery Cache storing precomputed self-healing strategies
#[derive(Debug, Clone)]
pub struct MemoizedRecoveryCache {
    plans: HashMap<String, RecoveryPlan>,
    stats: RecoveryCacheStats,
    tokens_per_recovery_estimate: u64,
}

impl Default for MemoizedRecoveryCache {
    fn default() -> Self {
        Self::new()
    }
}

impl MemoizedRecoveryCache {
    pub fn new() -> Self {
        let mut cache = Self {
            plans: HashMap::new(),
            stats: RecoveryCacheStats::default(),
            tokens_per_recovery_estimate: 450, // Average tokens an LLM would burn attempting re-prompting
        };
        cache.seed_standard_recovery_plans();
        cache
    }

    /// Pre-seeds canonical recovery plans across all core failure modes
    fn seed_standard_recovery_plans(&mut self) {
        // 1. Quarantined time tool (S1) -> Substitute with safe get_time
        let p1 = RecoveryPlan::new(
            "s1_poison",
            "KYRON_QUARANTINED_TOOL",
            "RULE_REGISTRY_TRUST",
            1,
            "agent",
            "auto_substitute",
            "Substitute quarantined 's1_poison' with verified 'get_time'.",
            vec!["get_time".into(), "system_clock".into()],
            vec![
                "1. Intercept call to quarantined tool 's1_poison'.".into(),
                "2. Reroute dispatch to approved alternative 'get_time'.".into(),
                "3. Deliver clean RFC 3339 timestamp without leaking prompt context.".into(),
            ],
        );
        self.memoize(p1);

        // 2. TOCTOU Resource Swap (S5) -> Re-hash and re-bind capability lease
        let p2 = RecoveryPlan::new(
            "inspect_file",
            "KYRON_TOCTOU_MISMATCH",
            "RULE_TOCTOU_BINDING",
            1,
            "agent",
            "rebind_and_reissue",
            "Target file content mutated post-approval. Re-read target and request fresh capability lease.",
            vec![],
            vec![
                "1. Abort tool dispatch to prevent symlink/file swap exploit.".into(),
                "2. Stat target file and recompute SHA-256 content hash.".into(),
                "3. Request operator capability lease re-binding to fresh content hash.".into(),
            ],
        );
        self.memoize(p2);

        // 3. Egress Quota Breach (S4) -> Payload chunking and compression
        let p3 = RecoveryPlan::new(
            "batch_export",
            "KYRON_EGRESS_QUOTA_EXCEEDED",
            "RULE_EGRESS_BUDGET",
            1,
            "agent",
            "chunk_and_compress",
            "Trajectory outbound budget exceeded. Split payload into compressed <= 4KB chunks.",
            vec!["compressed_export".into()],
            vec![
                "1. Halt outbound socket connection before data leakage.".into(),
                "2. Apply gzip compression to reduce outbound wire size.".into(),
                "3. Request elevated egress quota lease via SOC escalation URL.".into(),
            ],
        );
        self.memoize(p3);

        // 4. Missing Capability Lease -> Auto-generate scoped lease request
        let p4 = RecoveryPlan::new(
            "execute_sql",
            "KYRON_LEASE_REQUIRED",
            "RULE_CAPABILITY_LEASE_REQUIRED",
            1,
            "agent",
            "request_lease",
            "Tool requires elevated capability lease. Submit call-scoped approval request.",
            vec!["read_only_sql".into()],
            vec![
                "1. Pause autonomous trajectory.".into(),
                "2. Post approval request to Kyron Control Plane /v1/approvals.".into(),
                "3. Resume execution upon receipt of Ed25519-signed capability lease.".into(),
            ],
        );
        self.memoize(p4);
    }

    /// Stores a precomputed or dynamically generated recovery plan
    pub fn memoize(&mut self, plan: RecoveryPlan) {
        self.plans.insert(plan.fingerprint.clone(), plan);
    }

    /// Looks up a memoized recovery plan by its composite state fingerprint
    pub fn lookup(&mut self, fingerprint: &str) -> Option<RecoveryPlan> {
        if let Some(plan) = self.plans.get(fingerprint) {
            self.stats.hits += 1;
            self.stats.tokens_saved += self.tokens_per_recovery_estimate;
            Some(plan.clone())
        } else {
            self.stats.misses += 1;
            None
        }
    }

    /// Returns cache hit/miss and tokens-saved metrics
    pub fn stats(&self) -> &RecoveryCacheStats {
        &self.stats
    }

    /// Number of cached recovery plans
    pub fn len(&self) -> usize {
        self.plans.len()
    }

    pub fn is_empty(&self) -> bool {
        self.plans.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_composite_fingerprint_deterministic() {
        let fp1 = CompositeFingerprint::compute(
            "s1_poison",
            "KYRON_QUARANTINED_TOOL",
            "RULE_REGISTRY_TRUST",
            1,
            "agent",
        );
        let fp2 = CompositeFingerprint::compute(
            "s1_poison",
            "KYRON_QUARANTINED_TOOL",
            "RULE_REGISTRY_TRUST",
            1,
            "agent",
        );
        let fp_diff = CompositeFingerprint::compute(
            "s1_poison",
            "KYRON_QUARANTINED_TOOL",
            "RULE_REGISTRY_TRUST",
            2, // different policy version
            "agent",
        );

        assert_eq!(fp1, fp2);
        assert_ne!(fp1, fp_diff);
        assert_eq!(fp1.len(), 64);
    }

    #[test]
    fn test_preseeded_recovery_cache_hit_zero_tokens() {
        let mut cache = MemoizedRecoveryCache::new();
        assert!(cache.len() >= 4);

        let fp = CompositeFingerprint::compute(
            "s1_poison",
            "KYRON_QUARANTINED_TOOL",
            "RULE_REGISTRY_TRUST",
            1,
            "agent",
        );

        let plan = cache.lookup(&fp).expect("Pre-seeded plan should be found");
        assert_eq!(plan.tool_id, "s1_poison");
        assert_eq!(plan.strategy, "auto_substitute");
        assert_eq!(plan.tokens_consumed, 0); // Zero model tokens!
        assert_eq!(plan.alternative_tools, vec!["get_time", "system_clock"]);

        assert_eq!(cache.stats().hits, 1);
        assert_eq!(cache.stats().tokens_saved, 450);
    }

    #[test]
    fn test_dynamic_memoization_and_miss_tracking() {
        let mut cache = MemoizedRecoveryCache::new();

        let unk_fp = "0000000000000000000000000000000000000000000000000000000000000000";
        assert!(cache.lookup(unk_fp).is_none());
        assert_eq!(cache.stats().misses, 1);

        // Dynamically memoize a new plan
        let new_plan = RecoveryPlan::new(
            "custom_tool",
            "CUSTOM_ERR",
            "RULE_CUSTOM",
            1,
            "admin",
            "retry_with_backoff",
            "Retry after 500ms backoff",
            vec![],
            vec!["1. Sleep 500ms".into(), "2. Re-dispatch".into()],
        );
        let new_fp = new_plan.fingerprint.clone();
        cache.memoize(new_plan);

        let retrieved = cache.lookup(&new_fp).expect("Dynamically memoized plan should be found");
        assert_eq!(retrieved.strategy, "retry_with_backoff");
        assert_eq!(cache.stats().hits, 1);
    }
}
