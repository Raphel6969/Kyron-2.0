//! Local Tool Sandbox & Syscall Attestation Tracing (C10, F24)
//! Intercepts local tool process telemetry, traces file opens and socket connections,
//! and diffs observed behavior against declared contracts to catch lying tools (Scenario S3).

use chrono::{DateTime, Utc};
use kyron_types::Contract;
use serde::{Deserialize, Serialize};

/// Granular operating system syscall operation captured during execution
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SyscallOp {
    FileOpen { path: String, is_write: bool },
    SocketConnect { host: String, port: u16 },
    ProcessExec { binary: String, args: Vec<String> },
}

/// Timestamped trace event emitted by the sandbox probe per PID
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SyscallTraceEvent {
    pub pid: u32,
    pub timestamp: DateTime<Utc>,
    pub op: SyscallOp,
}

/// Recorded violation when a realized syscall deviates from declared contract
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ContractViolation {
    pub op: SyscallOp,
    pub reason: String,
    pub threat_scenario: String,
}

/// Detailed conformance report emitted upon tool execution completion
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ContractConformanceReport {
    pub is_conformant: bool,
    pub observed_files: Vec<String>,
    pub observed_destinations: Vec<String>,
    pub violations: Vec<ContractViolation>,
}

pub struct SandboxAttestation;

impl SandboxAttestation {
    /// Diffs observed runtime syscall trace against the tool's declared contract (C10)
    pub fn diff_against_contract(
        contract: &Contract,
        events: &[SyscallTraceEvent],
    ) -> ContractConformanceReport {
        let mut observed_files = Vec::new();
        let mut observed_destinations = Vec::new();
        let mut violations = Vec::new();

        for ev in events {
            match &ev.op {
                SyscallOp::FileOpen { path, is_write } => {
                    observed_files.push(path.clone());
                    let allowed = contract.allowed_files.iter().any(|pattern| {
                        match_path_pattern(pattern, path)
                    });

                    if !allowed {
                        violations.push(ContractViolation {
                            op: ev.op.clone(),
                            reason: format!(
                                "Undeclared file open attempt on '{}' (write={}). Not in allowed_files.",
                                path, is_write
                            ),
                            threat_scenario: "S3: Lying Tool File Access Violation".into(),
                        });
                    }
                }
                SyscallOp::SocketConnect { host, port } => {
                    let dest = format!("{}:{}", host, port);
                    observed_destinations.push(dest.clone());

                    // Check if host matches any declared network destination
                    let allowed = contract.allowed_network_destinations.iter().any(|allowed_dest| {
                        match_dest_pattern(allowed_dest, host, *port)
                    });

                    if !allowed {
                        violations.push(ContractViolation {
                            op: ev.op.clone(),
                            reason: format!(
                                "Undeclared outbound network connection attempt to '{}:{}'. Tool declared zero network egress.",
                                host, port
                            ),
                            threat_scenario: "S3: Lying Tool Covert Egress Violation".into(),
                        });
                    }
                }
                SyscallOp::ProcessExec { binary, args } => {
                    // Check if binary execution is declared in allowed files or contracts
                    let allowed = contract.allowed_files.iter().any(|pattern| {
                        match_path_pattern(pattern, binary)
                    });
                    if !allowed {
                        violations.push(ContractViolation {
                            op: ev.op.clone(),
                            reason: format!(
                                "Unauthorized subprocess spawning of '{}' with args {:?}.",
                                binary, args
                            ),
                            threat_scenario: "S3: Lying Tool Subprocess Spawning Violation".into(),
                        });
                    }
                }
            }
        }

        let is_conformant = violations.is_empty();
        ContractConformanceReport {
            is_conformant,
            observed_files,
            observed_destinations,
            violations,
        }
    }
}

/// Matches path globs (*, prefix*, exact)
pub fn match_path_pattern(pattern: &str, path: &str) -> bool {
    if pattern == "*" || pattern == path {
        return true;
    }
    if let Some(prefix) = pattern.strip_suffix('*') {
        if path.starts_with(prefix) {
            return true;
        }
    }
    if let Some(suffix) = pattern.strip_prefix('*') {
        if path.ends_with(suffix) {
            return true;
        }
    }
    false
}

/// Matches network destination pattern (supports "host", "host:port", "*.domain", "*")
pub fn match_dest_pattern(pattern: &str, host: &str, port: u16) -> bool {
    if pattern == "*" {
        return true;
    }
    let full_target = format!("{}:{}", host, port);
    if pattern == full_target || pattern == host {
        return true;
    }
    if let Some(pat_host) = pattern.strip_suffix(":*") {
        if pat_host == host {
            return true;
        }
    }
    if let Some(suffix) = pattern.strip_prefix('*') {
        if host.ends_with(suffix) {
            return true;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compliant_sandbox_trace() {
        let contract = Contract {
            tool_id: "image_resizer".into(),
            trust_floor: 100,
            allowed_files: vec!["/tmp/images/*".into(), "/usr/bin/convert".into()],
            allowed_network_destinations: vec![],
            required_effects: vec![],
            emitted_effects: vec![],
        };

        let trace = vec![
            SyscallTraceEvent {
                pid: 1001,
                timestamp: Utc::now(),
                op: SyscallOp::FileOpen {
                    path: "/tmp/images/input.png".into(),
                    is_write: false,
                },
            },
            SyscallTraceEvent {
                pid: 1001,
                timestamp: Utc::now(),
                op: SyscallOp::FileOpen {
                    path: "/tmp/images/output.png".into(),
                    is_write: true,
                },
            },
        ];

        let report = SandboxAttestation::diff_against_contract(&contract, &trace);
        assert!(report.is_conformant);
        assert_eq!(report.violations.len(), 0);
        assert_eq!(report.observed_files.len(), 2);
    }

    #[test]
    fn test_s3_lying_tool_undeclared_network_caught() {
        // Tool contract declared NO network access (air-gapped local converter)
        let contract = Contract {
            tool_id: "local_converter".into(),
            trust_floor: 50,
            allowed_files: vec!["/workspace/*".into()],
            allowed_network_destinations: vec![],
            required_effects: vec![],
            emitted_effects: vec![],
        };

        // Lying tool attempts covert socket connection to external exfiltration server (Scenario S3)
        let trace = vec![
            SyscallTraceEvent {
                pid: 2042,
                timestamp: Utc::now(),
                op: SyscallOp::FileOpen {
                    path: "/workspace/doc.pdf".into(),
                    is_write: false,
                },
            },
            SyscallTraceEvent {
                pid: 2042,
                timestamp: Utc::now(),
                op: SyscallOp::SocketConnect {
                    host: "evil-exfil.com".into(),
                    port: 443,
                },
            },
        ];

        let report = SandboxAttestation::diff_against_contract(&contract, &trace);
        assert!(!report.is_conformant);
        assert_eq!(report.violations.len(), 1);
        assert_eq!(
            report.violations[0].threat_scenario,
            "S3: Lying Tool Covert Egress Violation"
        );
        assert!(report.violations[0].reason.contains("evil-exfil.com:443"));
    }

    #[test]
    fn test_unauthorized_sensitive_file_read_caught() {
        let contract = Contract {
            tool_id: "markdown_parser".into(),
            trust_floor: 80,
            allowed_files: vec!["/app/docs/*".into()],
            allowed_network_destinations: vec![],
            required_effects: vec![],
            emitted_effects: vec![],
        };

        let trace = vec![
            SyscallTraceEvent {
                pid: 3050,
                timestamp: Utc::now(),
                op: SyscallOp::FileOpen {
                    path: "/etc/shadow".into(),
                    is_write: false,
                },
            },
        ];

        let report = SandboxAttestation::diff_against_contract(&contract, &trace);
        assert!(!report.is_conformant);
        assert_eq!(report.violations.len(), 1);
        assert!(report.violations[0].reason.contains("/etc/shadow"));
    }
}
