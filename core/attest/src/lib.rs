//! Kyron 2.0 Attestation, TOCTOU Binding & Audit Verification (F24, F26, F33)
//! Traces runtime tool execution, binds approvals to resource hashes,
//! and verifies Ed25519-signed, SHA-256 hash-chained audit trails.

use ed25519_dalek::{Signature, VerifyingKey};
use kyron_types::AuditEvent;
use sha2::{Digest, Sha256};

pub mod sandbox;
pub use sandbox::{
    ContractConformanceReport, ContractViolation, SandboxAttestation, SyscallOp, SyscallTraceEvent,
};

pub const GENESIS_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ObservedSyscalls {
    pub files_opened: Vec<String>,
    pub network_hosts_connected: Vec<String>,
}

pub struct AttestationEngine;

impl AttestationEngine {
    /// Computes resource content identity hash to prevent TOCTOU race conditions (S5)
    pub fn compute_resource_hash(content: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content);
        hex::encode(hasher.finalize())
    }

    /// Verifies that runtime observed network calls adhere to declared tool contract (S3)
    pub fn verify_contract_compliance(
        allowed_destinations: &[String],
        observed: &ObservedSyscalls,
    ) -> Result<(), String> {
        for dest in &observed.network_hosts_connected {
            if !allowed_destinations.contains(dest) {
                return Err(format!(
                    "Lying tool violation: undeclared network connection attempt to '{}'.",
                    dest
                ));
            }
        }
        Ok(())
    }

    /// Derives canonical signing payload matching Go data plane
    pub fn canonical_signing_payload(ev: &AuditEvent) -> Vec<u8> {
        format!(
            "{}:{}:{}:{}:{}:{}:{}:{}",
            ev.prev_hash,
            ev.session_id,
            ev.trajectory_id,
            ev.call_hash,
            ev.tool_id,
            ev.verdict,
            ev.policy_version,
            ev.timestamp.to_rfc3339()
        )
        .into_bytes()
    }

    /// Computes SHA-256 hash of an AuditEvent representation
    pub fn compute_event_hash(ev: &AuditEvent) -> Result<String, String> {
        let json_bytes = serde_json::to_vec(ev).map_err(|e| e.to_string())?;
        let mut hasher = Sha256::new();
        hasher.update(&json_bytes);
        Ok(hex::encode(hasher.finalize()))
    }

    /// Cryptographically verifies a single AuditEvent with an Ed25519 public key
    pub fn verify_event_signature(ev: &AuditEvent, pubkey_bytes: &[u8; 32]) -> Result<(), String> {
        let verifying_key = VerifyingKey::from_bytes(pubkey_bytes)
            .map_err(|e| format!("Invalid Ed25519 public key: {}", e))?;

        let sig_bytes = hex::decode(&ev.signature)
            .map_err(|e| format!("Invalid signature hex: {}", e))?;

        if sig_bytes.len() != 64 {
            return Err("Invalid signature length (expected 64 bytes)".into());
        }

        let mut sig_arr = [0u8; 64];
        sig_arr.copy_from_slice(&sig_bytes);
        let signature = Signature::from_bytes(&sig_arr);

        let payload = Self::canonical_signing_payload(ev);
        verifying_key
            .verify_strict(&payload, &signature)
            .map_err(|e| format!("Cryptographic signature verification failed: {}", e))
    }

    /// Verifies that an ordered sequence of events maintains hash-chain integrity
    pub fn verify_audit_chain(events: &[AuditEvent], pubkey_bytes: &[u8; 32]) -> Result<usize, String> {
        if events.is_empty() {
            return Ok(0);
        }

        let mut expected_prev = GENESIS_HASH.to_string();

        for (i, ev) in events.iter().enumerate() {
            if ev.prev_hash != expected_prev {
                return Err(format!(
                    "Hash chain broken at index {}: expected prev_hash '{}', got '{}'",
                    i, expected_prev, ev.prev_hash
                ));
            }

            Self::verify_event_signature(ev, pubkey_bytes)
                .map_err(|e| format!("Signature failure at index {}: {}", i, e))?;

            expected_prev = Self::compute_event_hash(ev)?;
        }

        Ok(events.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use ed25519_dalek::{Signer, SigningKey};

    #[test]
    fn test_lying_tool_detection_scenario_s3() {
        let allowed = vec!["api.internal.example".to_string()];
        let observed = ObservedSyscalls {
            files_opened: vec!["/tmp/data.csv".into()],
            network_hosts_connected: vec!["evil-crm-leak.com".into()],
        };

        let result = AttestationEngine::verify_contract_compliance(&allowed, &observed);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("evil-crm-leak.com"));
    }

    #[test]
    fn test_toctou_hash_binding_scenario_s5() {
        let original_file = b"allowed content";
        let approved_hash = AttestationEngine::compute_resource_hash(original_file);

        let swapped_file = b"sensitive private key content";
        let execution_hash = AttestationEngine::compute_resource_hash(swapped_file);

        assert_ne!(approved_hash, execution_hash);
    }

    #[test]
    fn test_signed_audit_chain_verification_rust() {
        let signing_key = SigningKey::from_bytes(&[42u8; 32]);
        let verifying_key = signing_key.verifying_key();
        let pubkey_bytes = verifying_key.to_bytes();

        let now = Utc::now();
        let mut ev1 = AuditEvent {
            id: "ev_1".into(),
            prev_hash: GENESIS_HASH.into(),
            session_id: "sess_1".into(),
            trajectory_id: "traj_1".into(),
            call_hash: "hash_1".into(),
            tool_id: "get_time".into(),
            verdict: "allow".into(),
            reasons: vec![],
            policy_version: 1,
            model_tokens_spent: 0,
            signature: String::new(),
            timestamp: now,
        };

        let payload1 = AttestationEngine::canonical_signing_payload(&ev1);
        let sig1 = signing_key.sign(&payload1);
        ev1.signature = hex::encode(sig1.to_bytes());

        let ev1_hash = AttestationEngine::compute_event_hash(&ev1).unwrap();

        let mut ev2 = AuditEvent {
            id: "ev_2".into(),
            prev_hash: ev1_hash,
            session_id: "sess_1".into(),
            trajectory_id: "traj_1".into(),
            call_hash: "hash_2".into(),
            tool_id: "read_secrets".into(),
            verdict: "block".into(),
            reasons: vec!["quarantined".into()],
            policy_version: 1,
            model_tokens_spent: 0,
            signature: String::new(),
            timestamp: now,
        };

        let payload2 = AttestationEngine::canonical_signing_payload(&ev2);
        let sig2 = signing_key.sign(&payload2);
        ev2.signature = hex::encode(sig2.to_bytes());

        let events = vec![ev1, ev2];
        let verified_count = AttestationEngine::verify_audit_chain(&events, &pubkey_bytes).unwrap();
        assert_eq!(verified_count, 2);
    }
}
