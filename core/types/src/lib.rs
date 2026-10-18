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
