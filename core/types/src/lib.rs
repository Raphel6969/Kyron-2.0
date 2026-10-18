//! Kyron 2.0 Core Data Types
//! Source of truth for data plane models, contracts, and verdicts.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Principal identifier
pub type Principal = String;

/// Information-flow security label
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Label {
    /// Readers who may observe this value
    pub readers: Vec<Principal>,
    /// Trust floor (0 = untrusted, 255 = fully trusted system)
    pub trust: u8,
}

impl Label {
    pub fn new(readers: Vec<Principal>, trust: u8) -> Self {
        Self { readers, trust }
    }

    /// Algebraic Meet operator: narrows readers, takes lower trust
    pub fn meet(&self, other: &Label) -> Label {
        let readers: Vec<Principal> = self
            .readers
            .iter()
            .filter(|p| other.readers.contains(p))
            .cloned()
            .collect();
        let trust = self.trust.min(other.trust);
        Label { readers, trust }
    }
}

/// Lifecycle states for a registered MCP tool
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolState {
    Unregistered,
    Scanning,
    Scanned,
    Quarantined,
    Approved,
    Active,
    Blocked,
    Revoked,
}

/// A pinned, immutable tool manifest in the Kyron registry
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PinnedTool {
    pub id: String,
    pub server_id: String,
    pub name: String,
    pub hash: String, // SHA-256 hex
    pub risk_score: f32, // 0.0 to 1.0
    pub risk_reasons: Vec<String>,
    pub approver: Option<String>,
    pub signature: Option<String>, // Ed25519 signature hex
    pub model_facing_description: String,
    pub original_description: String,
    pub state: ToolState,
    pub approved_at: Option<DateTime<Utc>>,
}

/// Tool execution contract
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Contract {
    pub tool_id: String,
    pub trust_floor: u8,
    pub allowed_files: Vec<String>,
    pub allowed_network_destinations: Vec<String>,
    pub required_effects: Vec<String>,
    pub emitted_effects: Vec<String>,
}

/// Single-use or scoped capability lease
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Lease {
    pub id: String,
    pub trajectory_id: String,
    pub action: String,
    pub recipient_group: Vec<Principal>,
    pub max_calls: u32,
    pub calls_used: u32,
    pub ttl_seconds: u32,
    pub policy_version: u32,
    pub signature: String,
    pub expires_at: DateTime<Utc>,
}

impl Lease {
    /// Formats the canonical message payload for signing and verification
    pub fn canonical_payload(
        id: &str,
        trajectory_id: &str,
        action: &str,
        max_calls: u32,
        policy_version: u32,
        expires_at_unix: i64,
    ) -> String {
        format!(
            "{}:{}:{}:{}:{}:{}",
            id, trajectory_id, action, max_calls, policy_version, expires_at_unix
        )
    }

    /// Creates and signs a new Capability Lease using an Ed25519 signing key
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: String,
        trajectory_id: String,
        action: String,
        recipient_group: Vec<Principal>,
        max_calls: u32,
        ttl_seconds: u32,
        policy_version: u32,
        signing_key: &ed25519_dalek::SigningKey,
    ) -> Self {
        use chrono::Duration;
        use ed25519_dalek::Signer;

        let expires_at = Utc::now() + Duration::seconds(ttl_seconds as i64);
        let canonical = Self::canonical_payload(
            &id,
            &trajectory_id,
            &action,
            max_calls,
            policy_version,
            expires_at.timestamp(),
        );
        let sig = signing_key.sign(canonical.as_bytes());
        let signature = hex::encode(sig.to_bytes());

        Self {
            id,
            trajectory_id,
            action,
            recipient_group,
            max_calls,
            calls_used: 0,
            ttl_seconds,
            policy_version,
            signature,
            expires_at,
        }
    }

    /// Verifies the cryptographic signature of the lease
    pub fn verify_signature(&self, verifying_key: &ed25519_dalek::VerifyingKey) -> Result<(), String> {
        use ed25519_dalek::Verifier;

        let sig_bytes = hex::decode(&self.signature)
            .map_err(|e| format!("Invalid signature hex: {}", e))?;
        let sig = ed25519_dalek::Signature::from_slice(&sig_bytes)
            .map_err(|e| format!("Invalid signature format: {}", e))?;
        let canonical = Self::canonical_payload(
            &self.id,
            &self.trajectory_id,
            &self.action,
            self.max_calls,
            self.policy_version,
            self.expires_at.timestamp(),
        );

        verifying_key
            .verify(canonical.as_bytes(), &sig)
            .map_err(|e| format!("Lease signature verification failed: {}", e))
    }

    /// Checks if the lease has expired based on current time
    pub fn is_expired(&self, now: DateTime<Utc>) -> bool {
        now >= self.expires_at
    }

    /// Checks if all allowed invocations have been used
    pub fn is_exhausted(&self) -> bool {
        self.calls_used >= self.max_calls
    }

    /// Consumes one invocation from the lease if valid and unexpired
    pub fn consume(&mut self, now: DateTime<Utc>) -> Result<u32, String> {
        if self.is_expired(now) {
            return Err(format!(
                "Capability lease '{}' expired at {}",
                self.id, self.expires_at
            ));
        }
        if self.is_exhausted() {
            return Err(format!(
                "Capability lease '{}' exhausted ({} of {} calls used)",
                self.id, self.calls_used, self.max_calls
            ));
        }
        self.calls_used += 1;
        Ok(self.calls_used)
    }
}


/// Recorded side effect outcome
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EffectOutcome {
    Committed,
    Indeterminate,
}

/// Committed tool side effect
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Effect {
    pub token: String,
    pub call_hash: String,
    pub outcome: EffectOutcome,
    pub idempotency_key: Option<String>,
    pub committed_at: DateTime<Utc>,
}

/// Trajectory resource budget
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Budget {
    pub max_child_branches: u32,
    pub max_recovery_steps: u32,
    pub max_authority_requests: u32,
    pub max_delegation_depth: u32,
    pub egress_bytes_per_trajectory: u64,
}

/// Policy evaluation verdict
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum Verdict {
    Allow,
    Block {
        reasons: Vec<String>,
        recovery_plan: Option<String>,
    },
    Escalate {
        kind: String,
        details: Option<String>,
    },
}

/// Tamper-evident, hash-chained audit event
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: String,
    pub prev_hash: String,
    pub session_id: String,
    pub trajectory_id: String,
    pub call_hash: String,
    pub tool_id: String,
    pub verdict: String,
    pub reasons: Vec<String>,
    pub policy_version: u32,
    pub model_tokens_spent: u32,
    pub signature: String,
    pub timestamp: DateTime<Utc>,
}

/// Severity classification for tool drift
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DriftSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Detailed field modification in tool manifest drift
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FieldChange {
    pub field: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub semantic_risk: String,
}

/// Semantic difference record emitted when a pinned tool definition mutates
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ToolDriftDiff {
    pub tool_id: String,
    pub server_id: String,
    pub tool_name: String,
    pub old_hash: String,
    pub new_hash: String,
    pub severity: DriftSeverity,
    pub summary: String,
    pub changes: Vec<FieldChange>,
    pub detected_at: DateTime<Utc>,
}

/// Offline or online model judge analysis verdict for tool definitions
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ModelJudgeVerdict {
    pub is_suspicious: bool,
    pub confidence: f32,
    pub rationale: String,
    pub flagged_spans: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};
    use ed25519_dalek::SigningKey;

    #[test]
    fn test_lease_signing_and_verification() {
        let signing_key = SigningKey::from_bytes(&[55u8; 32]);
        let verifying_key = signing_key.verifying_key();

        let lease = Lease::new(
            "lease-test-1".into(),
            "traj-100".into(),
            "read_file".into(),
            vec!["agent".into()],
            1,
            60,
            1,
            &signing_key,
        );

        assert_eq!(lease.calls_used, 0);
        assert!(!lease.is_expired(Utc::now()));
        assert!(!lease.is_exhausted());
        assert!(lease.verify_signature(&verifying_key).is_ok());

        // Tamper with action
        let mut tampered = lease.clone();
        tampered.action = "delete_file".into();
        assert!(tampered.verify_signature(&verifying_key).is_err());
    }

    #[test]
    fn test_lease_consumption_and_expiry() {
        let signing_key = SigningKey::from_bytes(&[55u8; 32]);
        let mut lease = Lease::new(
            "lease-test-2".into(),
            "traj-200".into(),
            "execute_cmd".into(),
            vec!["agent".into()],
            2,
            10,
            1,
            &signing_key,
        );

        let now = Utc::now();
        assert_eq!(lease.consume(now).unwrap(), 1);
        assert_eq!(lease.calls_used, 1);
        assert!(!lease.is_exhausted());

        assert_eq!(lease.consume(now).unwrap(), 2);
        assert_eq!(lease.calls_used, 2);
        assert!(lease.is_exhausted());

        // Third call should fail (exhausted)
        assert!(lease.consume(now).is_err());

        // Test expired lease
        let future = now + Duration::seconds(15);
        assert!(lease.is_expired(future));
    }
}

