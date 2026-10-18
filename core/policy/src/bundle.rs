//! Declarative TOML Policy Bundle Compiler (C3, F35)
//! Compiles human-readable declarative TOML policies into fast, zero-token deterministic runtime rule sets.

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PolicyCompileError {
    #[error("TOML syntax error: {0}")]
    TomlError(#[from] toml::de::Error),
    #[error("TOML serialization error: {0}")]
    SerializeError(#[from] toml::ser::Error),
    #[error("Validation error: {0}")]
    ValidationError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PolicyMeta {
    pub version: u32,
    pub name: String,
    pub mode: String, // "enforce" or "monitor"
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub signed_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BudgetsConfig {
    #[serde(default = "default_egress_bytes")]
    pub egress_bytes_per_trajectory: u64,
    #[serde(default = "default_max_calls")]
    pub max_calls_per_trajectory: u32,
    #[serde(default = "default_max_destinations")]
    pub max_distinct_destinations: u32,
}

fn default_egress_bytes() -> u64 {
    1024 * 1024 // 1 MB
}
fn default_max_calls() -> u32 {
    100
}
fn default_max_destinations() -> u32 {
    10
}

impl Default for BudgetsConfig {
    fn default() -> Self {
        Self {
            egress_bytes_per_trajectory: default_egress_bytes(),
            max_calls_per_trajectory: default_max_calls(),
            max_distinct_destinations: default_max_destinations(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EgressConfig {
    #[serde(default = "default_egress_action")]
    pub default_action: String, // "deny" or "allow"
    #[serde(default)]
    pub allowed_destinations: Vec<String>,
    #[serde(default)]
    pub blocked_destinations: Vec<String>,
}

fn default_egress_action() -> String {
    "deny".into()
}

impl Default for EgressConfig {
    fn default() -> Self {
        Self {
            default_action: default_egress_action(),
            allowed_destinations: Vec::new(),
            blocked_destinations: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ToolPolicyRule {
    pub pattern: String,
    pub action: String, // "allow", "block", "require_lease"
    #[serde(default)]
    pub max_calls: Option<u32>,
    #[serde(default)]
    pub ttl_seconds: Option<u32>,
    #[serde(default)]
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PolicyBundle {
    pub meta: PolicyMeta,
    #[serde(default)]
    pub budgets: BudgetsConfig,
    #[serde(default)]
    pub egress: EgressConfig,
    #[serde(default)]
    pub tools: Vec<ToolPolicyRule>,
}

impl PolicyBundle {
    /// Compiles and validates a policy bundle from raw TOML text
    pub fn from_toml(raw: &str) -> Result<Self, PolicyCompileError> {
        let bundle: PolicyBundle = toml::from_str(raw)?;
        bundle.validate()?;
        Ok(bundle)
    }

    /// Serializes a policy bundle to formatted TOML
    pub fn to_toml(&self) -> Result<String, PolicyCompileError> {
        Ok(toml::to_string_pretty(self)?)
    }

    /// Validates policy semantics
    pub fn validate(&self) -> Result<(), PolicyCompileError> {
        if self.meta.version == 0 {
            return Err(PolicyCompileError::ValidationError(
                "Policy version must be >= 1".into(),
            ));
        }
        if self.meta.name.trim().is_empty() {
            return Err(PolicyCompileError::ValidationError(
                "Policy name must not be empty".into(),
            ));
        }
        if self.meta.mode != "enforce" && self.meta.mode != "monitor" {
            return Err(PolicyCompileError::ValidationError(format!(
                "Invalid policy mode '{}'; must be 'enforce' or 'monitor'",
                self.meta.mode
            )));
        }

        for rule in &self.tools {
            if rule.pattern.trim().is_empty() {
                return Err(PolicyCompileError::ValidationError(
                    "Tool rule pattern must not be empty".into(),
                ));
            }
            if rule.action != "allow" && rule.action != "block" && rule.action != "require_lease" {
                return Err(PolicyCompileError::ValidationError(format!(
                    "Invalid tool action '{}'; must be 'allow', 'block', or 'require_lease'",
                    rule.action
                )));
            }
        }

        Ok(())
    }

    /// Resolves the first matching tool rule for a given tool name
    pub fn resolve_tool_rule(&self, tool_name: &str) -> Option<&ToolPolicyRule> {
        self.tools
            .iter()
            .find(|rule| match_pattern(&rule.pattern, tool_name))
    }

    /// Evaluates if an egress host is allowed under this policy
    pub fn is_destination_allowed(&self, host: &str) -> bool {
        // Explicit block takes precedence
        for blocked in &self.egress.blocked_destinations {
            if match_pattern(blocked, host) {
                return false;
            }
        }

        // Whitelist check
        for allowed in &self.egress.allowed_destinations {
            if match_pattern(allowed, host) {
                return true;
            }
        }

        self.egress.default_action == "allow"
    }
}

/// Matches simple wildcard glob patterns (* and exact match)
pub fn match_pattern(pattern: &str, target: &str) -> bool {
    if pattern == "*" {
        return true;
    }
    if pattern == target {
        return true;
    }
    if let Some(prefix) = pattern.strip_suffix('*') {
        if target.starts_with(prefix) {
            return true;
        }
    }
    if let Some(suffix) = pattern.strip_prefix('*') {
        if target.ends_with(suffix) {
            return true;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_policy_compilation() {
        let toml_data = r#"
        [meta]
        version = 1
        name = "test-policy"
        mode = "enforce"
        description = "Test policy"
        signed_by = "sec-admin"

        [budgets]
        egress_bytes_per_trajectory = 500000
        max_calls_per_trajectory = 50
        max_distinct_destinations = 3

        [egress]
        default_action = "deny"
        allowed_destinations = ["api.github.com", "*.corp.net"]
        blocked_destinations = ["169.254.169.254"]

        [[tools]]
        pattern = "bash"
        action = "block"
        reason = "Banned"

        [[tools]]
        pattern = "exec_*"
        action = "require_lease"
        max_calls = 1
        ttl_seconds = 300

        [[tools]]
        pattern = "*"
        action = "allow"
        "#;

        let bundle = PolicyBundle::from_toml(toml_data).expect("Must compile valid TOML");
        assert_eq!(bundle.meta.name, "test-policy");
        assert_eq!(bundle.budgets.max_calls_per_trajectory, 50);

        // Tool resolution
        let bash_rule = bundle.resolve_tool_rule("bash").unwrap();
        assert_eq!(bash_rule.action, "block");

        let exec_rule = bundle.resolve_tool_rule("exec_cmd").unwrap();
        assert_eq!(exec_rule.action, "require_lease");
        assert_eq!(exec_rule.max_calls, Some(1));

        let generic_rule = bundle.resolve_tool_rule("read_file").unwrap();
        assert_eq!(generic_rule.action, "allow");

        // Egress checks
        assert!(bundle.is_destination_allowed("api.github.com"));
        assert!(bundle.is_destination_allowed("auth.corp.net"));
        assert!(!bundle.is_destination_allowed("169.254.169.254"));
        assert!(!bundle.is_destination_allowed("evil.com"));
    }

    #[test]
    fn test_invalid_policy_validation() {
        let invalid_toml = r#"
        [meta]
        version = 0
        name = ""
        mode = "invalid"
        "#;
        assert!(PolicyBundle::from_toml(invalid_toml).is_err());
    }
}
