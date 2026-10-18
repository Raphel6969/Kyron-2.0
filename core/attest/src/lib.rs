//! Kyron 2.0 Attestation & TOCTOU Binding (F24, F26)
//! Traces runtime tool execution and binds approvals to resource content hashes.

use sha2::{Digest, Sha256};

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
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
