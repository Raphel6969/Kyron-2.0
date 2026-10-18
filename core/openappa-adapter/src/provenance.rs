//! JSON-Path Field-Level Provenance Engine (C7, F21)
//!
//! Enables fine-grained security labeling at the individual JSON field level,
//! defeating the classic Information Flow Control over-tainting problem.

use chrono::{DateTime, Utc};
use kyron_types::Label;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// Provenance metadata and security label for a specific JSON path
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FieldProvenance {
    pub path: String,
    pub label: Label,
    pub source_tool_id: String,
    pub call_hash: String,
    pub tagged_at: DateTime<Utc>,
}

/// Map tracking JSON-path field-level provenance across structured payloads
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct FieldProvenanceMap {
    pub entries: HashMap<String, FieldProvenance>,
}

impl FieldProvenanceMap {
    pub fn new() -> Self {
        Self {
            entries: HashMap::new(),
        }
    }

    /// Assigns or updates a fine-grained security label to a specific JSON path
    pub fn assign(
        &mut self,
        path: impl Into<String>,
        label: Label,
        source_tool: impl Into<String>,
        call_hash: impl Into<String>,
    ) {
        let p = path.into();
        self.entries.insert(
            p.clone(),
            FieldProvenance {
                path: p,
                label,
                source_tool_id: source_tool.into(),
                call_hash: call_hash.into(),
                tagged_at: Utc::now(),
            },
        );
    }

    /// Retrieves provenance metadata for an exact JSON path
    pub fn get(&self, path: &str) -> Option<&FieldProvenance> {
        self.entries.get(path)
    }

    /// Resolves the effective security label for a path, checking exact path, parent wildcard, or default
    pub fn resolve_label(&self, path: &str, default_label: &Label) -> Label {
        if let Some(entry) = self.entries.get(path) {
            return entry.label.clone();
        }

        // Check parent prefix wildcard match, e.g. "$.items[*]" or "$.items"
        for (pattern, entry) in &self.entries {
            if pattern.ends_with("[*]") {
                let prefix = &pattern[..pattern.len() - 3];
                if path.starts_with(prefix) {
                    return entry.label.clone();
                }
            } else if pattern.ends_with(".*") {
                let prefix = &pattern[..pattern.len() - 2];
                if path.starts_with(prefix) {
                    return entry.label.clone();
                }
            }
        }

        default_label.clone()
    }

    /// Recursively filters a JSON value for a specific reader, pruning unauthorized fields
    pub fn filter_for_reader(&self, value: &Value, reader: &str, default_label: &Label) -> Value {
        self.filter_recursive(value, "$", reader, default_label)
    }

    fn filter_recursive(
        &self,
        value: &Value,
        current_path: &str,
        reader: &str,
        default_label: &Label,
    ) -> Value {
        let effective_label = self.resolve_label(current_path, default_label);
        let reader_allowed = effective_label.readers.contains(&"*".to_string())
            || effective_label.readers.iter().any(|r| r == reader);

        if !reader_allowed && current_path != "$" {
            return Value::Null;
        }

        match value {
            Value::Object(map) => {
                let mut filtered_map = serde_json::Map::new();
                for (k, v) in map {
                    let field_path = if current_path == "$" {
                        format!("$.{}", k)
                    } else {
                        format!("{}.{}", current_path, k)
                    };

                    let field_label = self.resolve_label(&field_path, &effective_label);
                    let is_allowed = field_label.readers.contains(&"*".to_string())
                        || field_label.readers.iter().any(|r| r == reader);

                    if is_allowed {
                        let filtered_val =
                            self.filter_recursive(v, &field_path, reader, &field_label);
                        if !filtered_val.is_null() {
                            filtered_map.insert(k.clone(), filtered_val);
                        }
                    }
                }
                Value::Object(filtered_map)
            }
            Value::Array(arr) => {
                let mut filtered_arr = Vec::new();
                for (idx, item) in arr.iter().enumerate() {
                    let item_path = format!("{}[{}]", current_path, idx);
                    let filtered_val =
                        self.filter_recursive(item, &item_path, reader, &effective_label);
                    if !filtered_val.is_null() {
                        filtered_arr.push(filtered_val);
                    }
                }
                Value::Array(filtered_arr)
            }
            primitive => primitive.clone(),
        }
    }

    /// Automatically scans and tags all leaf nodes of a JSON structure
    pub fn tag_leaf_nodes(
        &mut self,
        value: &Value,
        source_tool: &str,
        call_hash: &str,
        default_label: &Label,
    ) {
        self.walk_tag(value, "$", source_tool, call_hash, default_label);
    }

    fn walk_tag(
        &mut self,
        value: &Value,
        path: &str,
        source_tool: &str,
        call_hash: &str,
        current_label: &Label,
    ) {
        match value {
            Value::Object(map) => {
                for (k, v) in map {
                    let child_path = if path == "$" {
                        format!("$.{}", k)
                    } else {
                        format!("{}.{}", path, k)
                    };
                    self.walk_tag(v, &child_path, source_tool, call_hash, current_label);
                }
            }
            Value::Array(arr) => {
                for (idx, item) in arr.iter().enumerate() {
                    let child_path = format!("{}[{}]", path, idx);
                    self.walk_tag(item, &child_path, source_tool, call_hash, current_label);
                }
            }
            _leaf => {
                if !self.entries.contains_key(path) {
                    self.assign(path, current_label.clone(), source_tool, call_hash);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_provenance_assignment_and_resolution() {
        let mut map = FieldProvenanceMap::new();
        let default_label = Label::new(vec!["*".into()], 100);

        let public_label = Label::new(vec!["*".into()], 100);
        let secret_label = Label::new(vec!["compliance".into()], 20);

        map.assign("$.public_name", public_label, "tool1", "hash1");
        map.assign("$.ssn", secret_label, "tool1", "hash1");

        assert_eq!(
            map.resolve_label("$.public_name", &default_label).readers,
            vec!["*".to_string()]
        );
        assert_eq!(
            map.resolve_label("$.ssn", &default_label).readers,
            vec!["compliance".to_string()]
        );
        assert_eq!(
            map.resolve_label("$.unknown", &default_label).readers,
            vec!["*".to_string()]
        );
    }

    #[test]
    fn test_filter_for_reader_prevents_overtainting() {
        let mut map = FieldProvenanceMap::new();
        let default_label = Label::new(vec!["*".into()], 100);

        let payload = serde_json::json!({
            "user_id": "usr_9988",
            "public_name": "Alice Developer",
            "email": "alice@corp.internal",
            "social_security": "000-11-2222",
            "internal_scores": {
                "public_score": 98,
                "private_risk_vector": [1, 2, 3]
            }
        });

        // Tag public fields
        map.assign("$.public_name", Label::new(vec!["*".into()], 100), "db", "h1");
        map.assign("$.internal_scores.public_score", Label::new(vec!["*".into()], 100), "db", "h1");

        // Tag internal / sensitive fields
        map.assign("$.social_security", Label::new(vec!["admin_compliance".into()], 0), "db", "h1");
        map.assign("$.internal_scores.private_risk_vector", Label::new(vec!["risk_team".into()], 10), "db", "h1");

        // Reader "public" receives payload: social_security & private_risk_vector pruned!
        let filtered_public = map.filter_for_reader(&payload, "public", &default_label);
        let obj = filtered_public.as_object().unwrap();

        assert_eq!(obj.get("public_name").unwrap(), "Alice Developer");
        assert_eq!(obj.get("social_security"), None); // Pruned without breaking entire payload!

        let nested = obj.get("internal_scores").unwrap().as_object().unwrap();
        assert_eq!(nested.get("public_score").unwrap(), 98);
        assert_eq!(nested.get("private_risk_vector"), None); // Nested sensitive array pruned!

        // Reader "admin_compliance" receives payload: social_security is visible!
        let filtered_admin = map.filter_for_reader(&payload, "admin_compliance", &default_label);
        let admin_obj = filtered_admin.as_object().unwrap();
        assert_eq!(admin_obj.get("social_security").unwrap(), "000-11-2222");
    }

    #[test]
    fn test_leaf_tagging_traversal() {
        let mut map = FieldProvenanceMap::new();
        let label = Label::new(vec!["worker".into()], 50);

        let payload = serde_json::json!({
            "status": "ok",
            "data": {
                "count": 42
            }
        });

        map.tag_leaf_nodes(&payload, "counter_tool", "hash_abc", &label);
        assert!(map.get("$.status").is_some());
        assert!(map.get("$.data.count").is_some());
        assert_eq!(map.get("$.data.count").unwrap().label.trust, 50);
    }
}
