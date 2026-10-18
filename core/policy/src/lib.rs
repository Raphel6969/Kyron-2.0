//! Kyron 2.0 Deterministic Policy Engine (C3, F07-F14)
//! Pure, deterministic evaluation of tool calls against capability leases, budgets, and data-flow rules.

use kyron_types::{Budget, Contract, Label, Lease, PinnedTool, ToolState, Verdict};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallContext {
    pub session_id: String,
    pub trajectory_id: String,
    pub tool_id: String,
    pub arguments_json: String,
    pub caller_label: Label,
    pub cumulative_bytes_out: u64,
}

#[derive(Debug, Clone)]
pub struct PolicyEngine {
    pub mode: PolicyMode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PolicyMode {
    Monitor,
    Enforce,
}

impl PolicyEngine {
    pub fn new(mode: PolicyMode) -> Self {
        Self { mode }
    }

    /// Evaluates a proposed tool call deterministically (Zero Model Tokens)
    pub fn evaluate(
        &self,
        ctx: &CallContext,
        pinned_tool: &PinnedTool,
        contract: Option<&Contract>,
        active_lease: Option<&Lease>,
        budget: &Budget,
    ) -> Verdict {
        // Rule 1: Tool must be approved and active
        if pinned_tool.state != ToolState::Approved && pinned_tool.state != ToolState::Active {
            return Verdict::Block {
                reasons: vec![format!(
                    "Tool '{}' is in '{:?}' state; execution disallowed.",
                    pinned_tool.id, pinned_tool.state
                )],
                recovery_plan: Some("Submit tool for administrative review and approval.".into()),
            };
        }

        // Rule 2: Egress byte budget check per trajectory
        if ctx.cumulative_bytes_out > budget.egress_bytes_per_trajectory {
            return Verdict::Block {
                reasons: vec![format!(
                    "Egress budget exceeded for trajectory '{}': {} bytes used, max allowed {} bytes.",
                    ctx.trajectory_id, ctx.cumulative_bytes_out, budget.egress_bytes_per_trajectory
                )],
                recovery_plan: Some("Request capability lease extension with elevated egress quota.".into()),
            };
        }

        // Rule 3: Capability lease validation (if required)
        if let Some(lease) = active_lease {
            if lease.calls_used >= lease.max_calls {
                return Verdict::Block {
                    reasons: vec![format!(
                        "Capability lease '{}' exhausted ({} of {} calls used).",
                        lease.id, lease.calls_used, lease.max_calls
                    )],
                    recovery_plan: Some("Request new capability lease from authority service.".into()),
                };
            }
        }

        // Rule 4: Contract trust floor check
        if let Some(c) = contract {
            if ctx.caller_label.trust < c.trust_floor {
                return Verdict::Block {
                    reasons: vec![format!(
                        "Caller trust level {} is below tool trust floor {}.",
                        ctx.caller_label.trust, c.trust_floor
                    )],
                    recovery_plan: Some("Acquire authority ruling to elevate trust or sanitize input.".into()),
                };
            }
        }

        Verdict::Allow
    }

    /// Gate 2: Admission check on realized tool output
    pub fn admit(
        &self,
        tool_id: &str,
        output_bytes: usize,
        current_label: &Label,
        contract: Option<&Contract>,
    ) -> Result<Label, String> {
        if let Some(c) = contract {
            // Fold tool contribution into caller label
            let tool_label = Label::new(vec!["*".into()], c.trust_floor);
            Ok(current_label.meet(&tool_label))
        } else {
            // Default: untrusted external tool taints label
            let untrusted = Label::new(vec!["*".into()], 10);
            let resulting = current_label.meet(&untrusted);
            if output_bytes > 5_000_000 {
                return Err(format!("Output size ({} bytes) from '{}' exceeds maximum return ceiling.", output_bytes, tool_id));
            }
            Ok(resulting)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_quarantined_tool_blocked_deterministically() {
        let engine = PolicyEngine::new(PolicyMode::Enforce);
        let ctx = CallContext {
            session_id: "s1".into(),
            trajectory_id: "t1".into(),
            tool_id: "time:get_time".into(),
            arguments_json: "{}".into(),
            caller_label: Label::new(vec!["admin".into()], 200),
            cumulative_bytes_out: 1024,
        };

        let mut tool = PinnedTool {
            id: "time:get_time".into(),
            server_id: "time".into(),
            name: "get_time".into(),
            hash: "abc".into(),
            risk_score: 0.85,
            risk_reasons: vec!["Poisoned description".into()],
            approver: None,
            signature: None,
            model_facing_description: "Returns UTC time.".into(),
            original_description: "Malicious".into(),
            state: ToolState::Quarantined,
            approved_at: None,
        };

        let budget = Budget {
            max_child_branches: 3,
            max_recovery_steps: 5,
            max_authority_requests: 4,
            max_delegation_depth: 2,
            egress_bytes_per_trajectory: 512000,
        };

        let verdict = engine.evaluate(&ctx, &tool, None, None, &budget);
        match verdict {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("Quarantined"));
            }
            _ => panic!("Expected block for quarantined tool"),
        }

        // Test approve
        tool.state = ToolState::Approved;
        let verdict_after = engine.evaluate(&ctx, &tool, None, None, &budget);
        assert_eq!(verdict_after, Verdict::Allow);
    }

    #[test]
    fn test_egress_budget_exhaustion_scenario_s4() {
        let engine = PolicyEngine::new(PolicyMode::Enforce);
        let ctx = CallContext {
            session_id: "s1".into(),
            trajectory_id: "t1".into(),
            tool_id: "api:post_data".into(),
            arguments_json: "{}".into(),
            caller_label: Label::new(vec!["user".into()], 100),
            cumulative_bytes_out: 600000, // Exceeds 512KB
        };

        let tool = PinnedTool {
            id: "api:post_data".into(),
            server_id: "api".into(),
            name: "post_data".into(),
            hash: "def".into(),
            risk_score: 0.1,
            risk_reasons: vec![],
            approver: Some("admin".into()),
            signature: None,
            model_facing_description: "Posts data.".into(),
            original_description: "Posts data.".into(),
            state: ToolState::Approved,
            approved_at: Some(Utc::now()),
        };

        let budget = Budget {
            max_child_branches: 3,
            max_recovery_steps: 5,
            max_authority_requests: 4,
            max_delegation_depth: 2,
            egress_bytes_per_trajectory: 512000,
        };

        let verdict = engine.evaluate(&ctx, &tool, None, None, &budget);
        match verdict {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("Egress budget exceeded"));
            }
            _ => panic!("Expected block on egress budget exceeded"),
        }
    }
}
