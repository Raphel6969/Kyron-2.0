//! Kyron 2.0 OpenAPPA IFC Adapter (C4, F07, F08, F12, F13, F36)
//! Provides a stable in-process abstraction boundary over `archestra-ai/OpenAPPA` (MIT, v0.12.0).
//! Implements the Two-Gate Reference Monitor (prospective dispatch check + return admission check),
//! algebraic label lattice meet operations, structured flow gaps, and legal recovery routes.

use kyron_types::{Contract, Label, Principal};
use serde::{Deserialize, Serialize};

pub mod provenance;
pub use provenance::{FieldProvenance, FieldProvenanceMap};

/// Upstream OpenAPPA RFC-compliant tool contract representation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OpenAppaContract {
    pub tool_id: String,
    pub input_label_floor: u8,
    pub output_label_trust: u8,
    pub permitted_readers: Vec<Principal>,
    pub required_effects: Vec<String>,
    pub emitted_effects: Vec<String>,
    pub allowed_files: Vec<String>,
    pub allowed_network_destinations: Vec<String>,
}

/// Structured information-flow gap explaining why an action was refused (F12)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "gap_type", rename_all = "snake_case")]
pub enum FlowGap {
    TrustDeficit { required_floor: u8, current_trust: u8 },
    ReaderExclusion { excluded_principal: Principal },
    MissingEffect { required_effect: String },
    UnauthorizedDestination { destination: String },
    UnauthorizedPath { path: String },
}

/// Legal, deterministic recovery route offered on refusal (F13)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "route_type", rename_all = "snake_case")]
pub enum RecoveryRoute {
    /// Narrow recipient readers group to permit execution
    AcceptNarrowing { suggested_readers: Vec<Principal> },
    /// Request human approval or call-scoped authority ruling
    AuthorityRuling { request_kind: String, escalation_url: String },
    /// Execute declared prerequisite tool before retrying
    PrerequisiteTool { tool_id: String, required_effect: String },
    /// Invoke sanitizer tool to scrub untrusted taint from trajectory
    SanitizeInput { sanitizer_tool_id: String },
}

/// Verdict returned by Gate 1 (Prospective Dispatch Check)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DispatchVerdict {
    pub allowed: bool,
    pub prospective_label: Label,
    pub gaps: Vec<FlowGap>,
    pub recovery_routes: Vec<RecoveryRoute>,
}

/// Verdict returned by Gate 2 (Return Result Admission Check)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AdmissionVerdict {
    pub admitted: bool,
    pub realized_label: Label,
    pub emitted_effects: Vec<String>,
    pub violation_reason: Option<String>,
}

/// OpenAppaAdapter manages the two-gate reference monitor and contract translation
pub struct OpenAppaAdapter;

impl OpenAppaAdapter {
    /// Translates a Kyron core contract to an OpenAPPA algebraic contract
    pub fn to_openappa_contract(c: &Contract) -> OpenAppaContract {
        OpenAppaContract {
            tool_id: c.tool_id.clone(),
            input_label_floor: c.trust_floor,
            output_label_trust: c.trust_floor,
            permitted_readers: vec!["*".into()],
            required_effects: c.required_effects.clone(),
            emitted_effects: c.emitted_effects.clone(),
            allowed_files: c.allowed_files.clone(),
            allowed_network_destinations: c.allowed_network_destinations.clone(),
        }
    }

    /// Gate 1: Prospective Check at Dispatch (F07)
    /// Validates data trust, reader permissions, required prerequisite effects, and boundary arguments
    pub fn check_dispatch(
        current_data_label: &Label,
        contract: &Contract,
        caller: &Principal,
        trajectory_effects: &[String],
        target_destination: Option<&str>,
        target_file_path: Option<&str>,
    ) -> DispatchVerdict {
        let mut gaps = Vec::new();
        let mut recovery_routes = Vec::new();

        // 1. Trust Floor Check: does the current data meet the tool's required trust floor?
        if current_data_label.trust < contract.trust_floor {
            gaps.push(FlowGap::TrustDeficit {
                required_floor: contract.trust_floor,
                current_trust: current_data_label.trust,
            });
            recovery_routes.push(RecoveryRoute::SanitizeInput {
                sanitizer_tool_id: format!("{}_sanitizer", contract.tool_id),
            });
            recovery_routes.push(RecoveryRoute::AuthorityRuling {
                request_kind: "trust_override".into(),
                escalation_url: format!("http://localhost:8001/v1/approvals/{}", contract.tool_id),
            });
        }

        // 2. Reader Audience Check: is caller permitted to read data under current label?
        if !current_data_label.readers.contains(&"*".to_string())
            && !current_data_label.readers.contains(caller)
        {
            gaps.push(FlowGap::ReaderExclusion {
                excluded_principal: caller.clone(),
            });
            recovery_routes.push(RecoveryRoute::AcceptNarrowing {
                suggested_readers: vec![caller.clone()],
            });
        }

        // 3. Workflow & Prerequisite Effect Check (F10):
        // E.g. 'read_terms' must have committed before 'sign_document'
        for req_effect in &contract.required_effects {
            if !trajectory_effects.contains(req_effect) {
                gaps.push(FlowGap::MissingEffect {
                    required_effect: req_effect.clone(),
                });
                recovery_routes.push(RecoveryRoute::PrerequisiteTool {
                    tool_id: format!("req_{}", req_effect),
                    required_effect: req_effect.clone(),
                });
            }
        }

        // 4. Declared Network Whitelist Check
        if let Some(dest) = target_destination {
            if !contract.allowed_network_destinations.is_empty()
                && !contract.allowed_network_destinations.iter().any(|d| d == dest || dest.ends_with(d))
            {
                gaps.push(FlowGap::UnauthorizedDestination {
                    destination: dest.to_string(),
                });
            }
        }

        // 5. Declared Filesystem Path Check
        if let Some(path) = target_file_path {
            if !contract.allowed_files.is_empty()
                && !contract.allowed_files.iter().any(|f| f == path || path.starts_with(f))
            {
                gaps.push(FlowGap::UnauthorizedPath {
                    path: path.to_string(),
                });
            }
        }

        if !gaps.is_empty() {
            DispatchVerdict {
                allowed: false,
                prospective_label: current_data_label.clone(),
                gaps,
                recovery_routes,
            }
        } else {
            // Algebraic meet lattice combination with tool's declared trust ceiling
            let tool_label = Label::new(vec!["*".into()], contract.trust_floor);
            let prospective = current_data_label.meet(&tool_label);

            DispatchVerdict {
                allowed: true,
                prospective_label: prospective,
                gaps: vec![],
                recovery_routes: vec![],
            }
        }
    }

    /// Gate 2: Admission Check on Realized Return Results (F07)
    /// Validates output integrity, propagates taints via algebraic meet, and registers emitted effect tokens
    pub fn admit_return(
        dispatch_label: &Label,
        contract: &Contract,
        output_data: &serde_json::Value,
    ) -> AdmissionVerdict {
        if output_data.is_null() {
            return AdmissionVerdict {
                admitted: false,
                realized_label: dispatch_label.clone(),
                emitted_effects: vec![],
                violation_reason: Some("Tool returned null or empty payload".to_string()),
            };
        }

        // Calculate realized output label via algebraic meet with tool's declared trust
        let tool_output_label = Label::new(vec!["*".into()], contract.trust_floor);
        let realized_label = dispatch_label.meet(&tool_output_label);

        AdmissionVerdict {
            admitted: true,
            realized_label,
            emitted_effects: contract.emitted_effects.clone(),
            violation_reason: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gate1_dispatch_pass_and_meet_lattice() {
        let caller = "agent_analyst".to_string();
        let current_label = Label::new(vec!["agent_analyst".into(), "auditor".into()], 180);
        let contract = Contract {
            tool_id: "query_database".into(),
            trust_floor: 120,
            allowed_files: vec!["/var/data".into()],
            allowed_network_destinations: vec!["db.internal.net".into()],
            required_effects: vec!["authenticated_session".into()],
            emitted_effects: vec!["query_executed".into()],
        };

        let trajectory_effects = vec!["authenticated_session".to_string()];
        let verdict = OpenAppaAdapter::check_dispatch(
            &current_label,
            &contract,
            &caller,
            &trajectory_effects,
            Some("db.internal.net"),
            Some("/var/data/records.csv"),
        );

        assert!(verdict.allowed);
        assert!(verdict.gaps.is_empty());
        assert_eq!(verdict.prospective_label.trust, 120);
    }

    #[test]
    fn test_gate1_dispatch_block_on_trust_deficit_and_missing_effect() {
        let caller = "agent_untrusted".to_string();
        let untrusted_label = Label::new(vec!["*".into()], 50); // Trust level 50 < required 150
        let contract = Contract {
            tool_id: "transfer_funds".into(),
            trust_floor: 150,
            allowed_files: vec![],
            allowed_network_destinations: vec!["bank.api.internal".into()],
            required_effects: vec!["2fa_verified".into()],
            emitted_effects: vec!["funds_transferred".into()],
        };

        let trajectory_effects = vec![]; // 2fa_verified missing!
        let verdict = OpenAppaAdapter::check_dispatch(
            &untrusted_label,
            &contract,
            &caller,
            &trajectory_effects,
            Some("bank.api.internal"),
            None,
        );

        assert!(!verdict.allowed);
        assert_eq!(verdict.gaps.len(), 2);
        assert!(verdict.gaps.iter().any(|g| matches!(g, FlowGap::TrustDeficit { .. })));
        assert!(verdict.gaps.iter().any(|g| matches!(g, FlowGap::MissingEffect { .. })));
        assert!(!verdict.recovery_routes.is_empty());
    }

    #[test]
    fn test_gate2_admission_check_and_effect_emission() {
        let dispatch_label = Label::new(vec!["admin".into()], 200);
        let contract = Contract {
            tool_id: "sign_contract".into(),
            trust_floor: 190,
            allowed_files: vec![],
            allowed_network_destinations: vec![],
            required_effects: vec![],
            emitted_effects: vec!["contract_signed_token".into()],
        };

        let output = serde_json::json!({
            "status": "success",
            "signature": "3f4a9b"
        });

        let admission = OpenAppaAdapter::admit_return(&dispatch_label, &contract, &output);
        assert!(admission.admitted);
        assert_eq!(admission.realized_label.trust, 190);
        assert_eq!(admission.emitted_effects, vec!["contract_signed_token".to_string()]);
    }
}
