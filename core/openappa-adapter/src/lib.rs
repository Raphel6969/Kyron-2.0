//! Kyron 2.0 OpenAPPA IFC Adapter (C4, F36)
//! Provides a stable abstraction boundary over upstream `archestra-ai/OpenAPPA` (MIT, v0.12.0).
//! Isolates Kyron from RFC wire-format and configuration churn.

use kyron_types::{Contract, Label};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAppaContract {
    pub tool_id: String,
    pub input_label_floor: u8,
    pub output_label_trust: u8,
    pub permitted_readers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowCheckResult {
    pub allowed: bool,
    pub resulting_label: Label,
    pub violation_reason: Option<String>,
}

pub struct OpenAppaAdapter;

impl OpenAppaAdapter {
    /// Translates a Kyron contract to an OpenAPPA algebraic contract
    pub fn to_openappa_contract(c: &Contract) -> OpenAppaContract {
        OpenAppaContract {
            tool_id: c.tool_id.clone(),
            input_label_floor: c.trust_floor,
            output_label_trust: c.trust_floor,
            permitted_readers: vec!["*".into()],
        }
    }

    /// Evaluates prospective information-flow permission using the OpenAPPA meet lattice
    pub fn check_prospective_flow(
        current_data_label: &Label,
        target_tool_contract: &Contract,
    ) -> FlowCheckResult {
        let appa_contract = Self::to_openappa_contract(target_tool_contract);

        if current_data_label.trust < appa_contract.input_label_floor {
            FlowCheckResult {
                allowed: false,
                resulting_label: current_data_label.clone(),
                violation_reason: Some(format!(
                    "Data trust ({}) insufficient for destination tool trust requirement ({}).",
                    current_data_label.trust, appa_contract.input_label_floor
                )),
            }
        } else {
            let tool_output_label = Label::new(appa_contract.permitted_readers, appa_contract.output_label_trust);
            let resulting = current_data_label.meet(&tool_output_label);
            FlowCheckResult {
                allowed: true,
                resulting_label: resulting,
                violation_reason: None,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_openappa_flow_meet_lattice() {
        let data_label = Label::new(vec!["team_sec".into(), "team_eng".into()], 150);
        let contract = Contract {
            tool_id: "db_read".into(),
            trust_floor: 100,
            allowed_files: vec![],
            allowed_network_destinations: vec![],
            required_effects: vec![],
            emitted_effects: vec![],
        };

        let result = OpenAppaAdapter::check_prospective_flow(&data_label, &contract);
        assert!(result.allowed);
        assert_eq!(result.resulting_label.trust, 100);
    }
}
