//! Kyron 2.0 Deterministic Policy Engine (C3, F07-F14)
//! Pure, deterministic evaluation of tool calls against capability leases, budgets, and data-flow rules.

use kyron_types::{Budget, Contract, Label, Lease, PinnedTool, ToolState, Verdict};
use serde::{Deserialize, Serialize};

pub mod bundle;
pub use bundle::{
    BudgetsConfig, EgressConfig, PolicyBundle, PolicyCompileError, PolicyMeta, ToolPolicyRule,
};

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

        // Rule 3: Capability lease validation (if required or provided)
        if let Some(lease) = active_lease {
            if lease.trajectory_id != ctx.trajectory_id {
                return Verdict::Block {
                    reasons: vec![format!(
                        "Capability lease '{}' is bound to trajectory '{}', but call was made in trajectory '{}'.",
                        lease.id, lease.trajectory_id, ctx.trajectory_id
                    )],
                    recovery_plan: Some("Obtain capability lease for active trajectory.".into()),
                };
            }

            if lease.action != "*" && lease.action != ctx.tool_id {
                return Verdict::Block {
                    reasons: vec![format!(
                        "Capability lease '{}' is scoped to action '{}', not requested tool '{}'.",
                        lease.id, lease.action, ctx.tool_id
                    )],
                    recovery_plan: Some("Request capability lease scoped to the target action.".into()),
                };
            }

            if lease.is_expired(chrono::Utc::now()) {
                return Verdict::Block {
                    reasons: vec![format!(
                        "Capability lease '{}' expired at {}.",
                        lease.id, lease.expires_at
                    )],
                    recovery_plan: Some("Request lease renewal from authority service.".into()),
                };
            }

            if lease.is_exhausted() {
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

    /// Evaluates a proposed tool call deterministically against a compiled declarative TOML policy bundle (C3, F35)
    pub fn evaluate_bundle(
        &self,
        ctx: &CallContext,
        pinned_tool: &PinnedTool,
        bundle: &PolicyBundle,
        active_lease: Option<&Lease>,
    ) -> Verdict {
        // 1. Tool state verification
        if pinned_tool.state != ToolState::Approved && pinned_tool.state != ToolState::Active {
            return Verdict::Block {
                reasons: vec![format!(
                    "Tool '{}' is in '{:?}' state; execution disallowed by registry firewall.",
                    pinned_tool.id, pinned_tool.state
                )],
                recovery_plan: Some("Submit tool for administrative review and approval.".into()),
            };
        }

        // 2. Trajectory egress budget check
        if ctx.cumulative_bytes_out > bundle.budgets.egress_bytes_per_trajectory {
            return Verdict::Block {
                reasons: vec![format!(
                    "Egress budget exceeded for trajectory '{}': {} bytes used, max allowed {} bytes.",
                    ctx.trajectory_id, ctx.cumulative_bytes_out, bundle.budgets.egress_bytes_per_trajectory
                )],
                recovery_plan: Some("Request capability lease extension with elevated egress quota.".into()),
            };
        }

        // 3. Resolve tool policy rule from declarative bundle
        if let Some(rule) = bundle.resolve_tool_rule(&ctx.tool_id) {
            match rule.action.as_str() {
                "block" => {
                    return Verdict::Block {
                        reasons: vec![if rule.reason.is_empty() {
                            format!("Tool '{}' is blocked by policy rule '{}'", ctx.tool_id, rule.pattern)
                        } else {
                            rule.reason.clone()
                        }],
                        recovery_plan: Some("Select an authorized alternative tool from the registry.".into()),
                    };
                }
                "require_lease" => {
                    let Some(lease) = active_lease else {
                        return Verdict::Escalate {
                            kind: "human_approval".into(),
                            details: Some(format!("Tool '{}' requires capability lease", ctx.tool_id)),
                        };
                    };

                    if lease.trajectory_id != ctx.trajectory_id {
                        return Verdict::Block {
                            reasons: vec![format!(
                                "Capability lease '{}' is bound to trajectory '{}', but call was made in trajectory '{}'.",
                                lease.id, lease.trajectory_id, ctx.trajectory_id
                            )],
                            recovery_plan: Some("Obtain capability lease for active trajectory.".into()),
                        };
                    }

                    if lease.action != "*" && lease.action != ctx.tool_id {
                        return Verdict::Block {
                            reasons: vec![format!(
                                "Capability lease '{}' is scoped to action '{}', not requested tool '{}'.",
                                lease.id, lease.action, ctx.tool_id
                            )],
                            recovery_plan: Some("Request capability lease scoped to the target action.".into()),
                        };
                    }

                    if lease.is_expired(chrono::Utc::now()) {
                        return Verdict::Block {
                            reasons: vec![format!(
                                "Capability lease '{}' expired at {}.",
                                lease.id, lease.expires_at
                            )],
                            recovery_plan: Some("Request lease renewal from authority service.".into()),
                        };
                    }

                    if lease.is_exhausted() {
                        return Verdict::Block {
                            reasons: vec![format!(
                                "Capability lease '{}' exhausted ({} of {} calls used).",
                                lease.id, lease.calls_used, lease.max_calls
                            )],
                            recovery_plan: Some("Request new capability lease from authority service.".into()),
                        };
                    }
                }
                "allow" => {
                    // Allowed
                }
                _ => {}
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

    #[test]
    fn test_capability_lease_validation() {
        let engine = PolicyEngine::new(PolicyMode::Enforce);
        let ctx = CallContext {
            session_id: "s1".into(),
            trajectory_id: "traj-alpha".into(),
            tool_id: "system:admin_exec".into(),
            arguments_json: "{}".into(),
            caller_label: Label::new(vec!["agent".into()], 50),
            cumulative_bytes_out: 100,
        };

        let tool = PinnedTool {
            id: "system:admin_exec".into(),
            server_id: "system".into(),
            name: "admin_exec".into(),
            hash: "abc123".into(),
            risk_score: 0.8,
            risk_reasons: vec![],
            approver: Some("sec-admin".into()),
            signature: None,
            model_facing_description: "Admin tool".into(),
            original_description: "Admin tool".into(),
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

        // 1. Valid Lease
        let valid_lease = Lease {
            id: "lease-1".into(),
            trajectory_id: "traj-alpha".into(),
            action: "system:admin_exec".into(),
            recipient_group: vec!["agent".into()],
            max_calls: 1,
            calls_used: 0,
            ttl_seconds: 60,
            policy_version: 1,
            signature: "sig".into(),
            expires_at: Utc::now() + chrono::Duration::seconds(60),
        };
        assert_eq!(
            engine.evaluate(&ctx, &tool, None, Some(&valid_lease), &budget),
            Verdict::Allow
        );

        // 2. Trajectory mismatch
        let mut traj_mismatch = valid_lease.clone();
        traj_mismatch.trajectory_id = "traj-beta".into();
        match engine.evaluate(&ctx, &tool, None, Some(&traj_mismatch), &budget) {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("bound to trajectory 'traj-beta'"));
            }
            _ => panic!("Expected trajectory mismatch block"),
        }

        // 3. Action mismatch
        let mut action_mismatch = valid_lease.clone();
        action_mismatch.action = "system:read_only".into();
        match engine.evaluate(&ctx, &tool, None, Some(&action_mismatch), &budget) {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("scoped to action 'system:read_only'"));
            }
            _ => panic!("Expected action mismatch block"),
        }

        // 4. Exhausted lease
        let mut exhausted_lease = valid_lease.clone();
        exhausted_lease.calls_used = 1;
        match engine.evaluate(&ctx, &tool, None, Some(&exhausted_lease), &budget) {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("exhausted"));
            }
            _ => panic!("Expected exhausted lease block"),
        }

        // 5. Expired lease
        let mut expired_lease = valid_lease.clone();
        expired_lease.expires_at = Utc::now() - chrono::Duration::seconds(10);
        match engine.evaluate(&ctx, &tool, None, Some(&expired_lease), &budget) {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("expired"));
            }
            _ => panic!("Expected expired lease block"),
        }
    }

    #[test]
    fn test_evaluate_bundle_scenarios() {
        let toml_data = r#"
        [meta]
        version = 1
        name = "prod-policy"
        mode = "enforce"

        [budgets]
        egress_bytes_per_trajectory = 1000

        [[tools]]
        pattern = "bash"
        action = "block"
        reason = "Banned shell"

        [[tools]]
        pattern = "exec_*"
        action = "require_lease"

        [[tools]]
        pattern = "*"
        action = "allow"
        "#;

        let bundle = PolicyBundle::from_toml(toml_data).unwrap();
        let engine = PolicyEngine::new(PolicyMode::Enforce);

        let ctx = CallContext {
            session_id: "s1".into(),
            trajectory_id: "t1".into(),
            tool_id: "bash".into(),
            arguments_json: "{}".into(),
            caller_label: Label::new(vec!["*".into()], 100),
            cumulative_bytes_out: 100,
        };

        let tool = PinnedTool {
            id: "bash".into(),
            server_id: "srv".into(),
            name: "bash".into(),
            hash: "h".into(),
            risk_score: 0.1,
            risk_reasons: vec![],
            state: ToolState::Approved,
            approver: Some("adm".into()),
            signature: Some("sig".into()),
            model_facing_description: "desc".into(),
            original_description: "orig".into(),
            approved_at: None,
        };

        // 1. bash is blocked by rule
        match engine.evaluate_bundle(&ctx, &tool, &bundle, None) {
            Verdict::Block { reasons, .. } => {
                assert_eq!(reasons[0], "Banned shell");
            }
            _ => panic!("Expected block for bash"),
        }

        // 2. exec_cmd requires lease -> escalates when no lease
        let mut exec_ctx = ctx.clone();
        exec_ctx.tool_id = "exec_command".into();
        let mut exec_tool = tool.clone();
        exec_tool.id = "exec_command".into();
        assert_eq!(
            engine.evaluate_bundle(&exec_ctx, &exec_tool, &bundle, None),
            Verdict::Escalate {
                kind: "human_approval".into(),
                details: Some("Tool 'exec_command' requires capability lease".into()),
            }
        );

        // 3. budget exceeded
        let mut overbudget_ctx = ctx.clone();
        overbudget_ctx.tool_id = "other_tool".into();
        overbudget_ctx.cumulative_bytes_out = 2000;
        let mut other_tool = tool.clone();
        other_tool.id = "other_tool".into();
        match engine.evaluate_bundle(&overbudget_ctx, &other_tool, &bundle, None) {
            Verdict::Block { reasons, .. } => {
                assert!(reasons[0].contains("Egress budget exceeded"));
            }
            _ => panic!("Expected budget block"),
        }
    }
}

