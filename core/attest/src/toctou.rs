//! TOCTOU Resource-Identity Binding Engine (F26)
//!
//! Defeats Scenario S5 (Check-then-Use / TOCTOU resource swaps) by cryptographically
//! binding human approvals and capability leases to exact resource content hashes,
//! re-verifying byte identity and symlink integrity at execution time.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ToctouViolation {
    #[error("Target resource '{path}' not found")]
    FileNotFound { path: String },

    #[error("TOCTOU race detected for '{path}': expected content hash {expected}, actual hash {actual}")]
    ContentHashMismatch {
        path: String,
        expected: String,
        actual: String,
    },

    #[error("Disallowed symlink swap detected for '{path}' pointing to '{target}'")]
    SymlinkDisallowed { path: String, target: String },

    #[error("I/O error verifying resource identity for '{path}': {detail}")]
    IoError { path: String, detail: String },
}

/// Cryptographically verifiable resource binding (F26)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ResourceBinding {
    pub path: String,
    pub expected_hash: String,
    pub algorithm: String,
    pub bound_at: DateTime<Utc>,
}

impl ResourceBinding {
    /// Creates a new binding from path and content bytes, hashing with SHA-256
    pub fn new(path: impl Into<String>, content: &[u8]) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(content);
        let expected_hash = hex::encode(hasher.finalize());

        Self {
            path: path.into(),
            expected_hash,
            algorithm: "sha256".to_string(),
            bound_at: Utc::now(),
        }
    }

    /// Creates a binding from an already-computed hex hash
    pub fn from_hash(path: impl Into<String>, expected_hash: impl Into<String>) -> Self {
        Self {
            path: path.into(),
            expected_hash: expected_hash.into(),
            algorithm: "sha256".to_string(),
            bound_at: Utc::now(),
        }
    }

    /// Verifies in-memory bytes against the bound cryptographic hash
    pub fn verify_bytes(&self, bytes: &[u8]) -> Result<(), ToctouViolation> {
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        let actual_hash = hex::encode(hasher.finalize());

        if actual_hash != self.expected_hash {
            return Err(ToctouViolation::ContentHashMismatch {
                path: self.path.clone(),
                expected: self.expected_hash.clone(),
                actual: actual_hash,
            });
        }
        Ok(())
    }

    /// Verifies on-disk file against the bound cryptographic hash and symlink rules
    pub fn verify_file(&self, target_path: &Path) -> Result<(), ToctouViolation> {
        let path_str = target_path.to_string_lossy().to_string();

        let symlink_meta = match std::fs::symlink_metadata(target_path) {
            Ok(m) => m,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                return Err(ToctouViolation::FileNotFound { path: path_str });
            }
            Err(e) => {
                return Err(ToctouViolation::IoError {
                    path: path_str,
                    detail: e.to_string(),
                });
            }
        };

        if symlink_meta.file_type().is_symlink() {
            let target = match std::fs::read_link(target_path) {
                Ok(dest) => dest.to_string_lossy().to_string(),
                Err(e) => format!("unknown target: {}", e),
            };
            return Err(ToctouViolation::SymlinkDisallowed {
                path: path_str,
                target,
            });
        }

        let bytes = match std::fs::read(target_path) {
            Ok(b) => b,
            Err(e) => {
                return Err(ToctouViolation::IoError {
                    path: path_str,
                    detail: e.to_string(),
                });
            }
        };

        self.verify_bytes(&bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_content_hash_matches() {
        let content = b"Approved financial report data";
        let binding = ResourceBinding::new("/tmp/report.txt", content);

        assert!(binding.verify_bytes(content).is_ok());
    }

    #[test]
    fn test_toctou_content_mutation_detected() {
        let original_content = b"Approved financial summary: normal balances";
        let modified_content = b"Modified malicious summary: transfer $1,000,000";

        let binding = ResourceBinding::new("/tmp/report.txt", original_content);
        let result = binding.verify_bytes(modified_content);

        assert!(result.is_err());
        match result.unwrap_err() {
            ToctouViolation::ContentHashMismatch { expected, actual, .. } => {
                assert_eq!(expected, binding.expected_hash);
                assert_ne!(expected, actual);
            }
            other => panic!("Expected ContentHashMismatch, got {:?}", other),
        }
    }

    #[test]
    fn test_s5_scenario_swap_reproduction() {
        // Scenario S5: approved resource content swapped before execution
        let approved_resource = b"Monthly financial summary: all balances normal.";
        let swapped_malicious_resource = b"root:$6$xyz... (shadow password hashes)";

        let binding = ResourceBinding::new("/tmp/report.txt", approved_resource);
        let err = binding.verify_bytes(swapped_malicious_resource).unwrap_err();

        match err {
            ToctouViolation::ContentHashMismatch { expected, actual, path } => {
                assert_eq!(path, "/tmp/report.txt");
                assert_eq!(expected, hex::encode(Sha256::digest(approved_resource)));
                assert_eq!(actual, hex::encode(Sha256::digest(swapped_malicious_resource)));
            }
            _ => panic!("Expected ContentHashMismatch"),
        }
    }

    #[test]
    fn test_verify_file_disk_matches() {
        let temp_dir = std::env::temp_dir().join(format!("kyron_toctou_test_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp_dir);
        let file_path = temp_dir.join("safe_doc.txt");
        let content = b"Strictly verified document content.";
        std::fs::write(&file_path, content).unwrap();

        let binding = ResourceBinding::new(file_path.to_str().unwrap(), content);
        assert!(binding.verify_file(&file_path).is_ok());

        // Modify file on disk to simulate TOCTOU disk edit
        std::fs::write(&file_path, b"Tampered document content!").unwrap();
        let err = binding.verify_file(&file_path).unwrap_err();
        assert!(matches!(err, ToctouViolation::ContentHashMismatch { .. }));

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
