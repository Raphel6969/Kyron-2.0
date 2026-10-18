//! Effect Ledger & Idempotency Engine (C7)
//!
//! Tracks side-effect tokens committed across agent trajectories, evaluates
//! must-have / must-not-have preconditions, and reconciles indeterminate states.

use chrono::Utc;
use kyron_types::{Effect, EffectOutcome};
use std::collections::HashMap;

/// In-memory Effect Ledger tracking side-effect commitments and idempotency
#[derive(Debug, Clone, Default)]
pub struct EffectLedger {
    effects: HashMap<String, Effect>,
    idempotency_index: HashMap<String, String>, // idempotency_key -> token
}

impl EffectLedger {
    pub fn new() -> Self {
        Self {
            effects: HashMap::new(),
            idempotency_index: HashMap::new(),
        }
    }

    /// Records an effect token into the ledger, indexing by token and idempotency key
    pub fn record(&mut self, effect: Effect) {
        if let Some(ref ikey) = effect.idempotency_key {
            self.idempotency_index.insert(ikey.clone(), effect.token.clone());
        }
        self.effects.insert(effect.token.clone(), effect);
    }

    /// Retrieves an effect by its primary token identifier
    pub fn get(&self, token: &str) -> Option<&Effect> {
        self.effects.get(token)
    }

    /// Retrieves an effect by its caller-supplied idempotency key
    pub fn get_by_idempotency_key(&self, idempotency_key: &str) -> Option<&Effect> {
        let token = self.idempotency_index.get(idempotency_key)?;
        self.effects.get(token)
    }

    /// Evaluates tool preconditions: must_have_happened and must_not_have_happened
    pub fn verify_preconditions(
        &self,
        must_have: &[String],
        must_not_have: &[String],
        trajectory_effects: &[String],
    ) -> Result<(), String> {
        for required in must_have {
            if !trajectory_effects.contains(required) {
                return Err(format!(
                    "Precondition failure: required effect token '{}' has not occurred in this trajectory.",
                    required
                ));
            }
        }

        for disallowed in must_not_have {
            if trajectory_effects.contains(disallowed) {
                return Err(format!(
                    "Precondition failure: prohibited effect token '{}' has already occurred in this trajectory.",
                    disallowed
                ));
            }
        }

        Ok(())
    }

    /// Executes reconciliation on all indeterminate effects using a resolver function
    pub fn reconcile_indeterminate<F>(&mut self, resolver: F) -> Vec<Effect>
    where
        F: Fn(&Effect) -> Option<EffectOutcome>,
    {
        let mut reconciled = Vec::new();

        for effect in self.effects.values_mut() {
            if effect.outcome == EffectOutcome::Indeterminate {
                if let Some(new_outcome) = resolver(effect) {
                    effect.outcome = new_outcome;
                    effect.committed_at = Utc::now();
                    reconciled.push(effect.clone());
                }
            }
        }

        reconciled
    }

    pub fn total_effects(&self) -> usize {
        self.effects.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_and_idempotency_lookup() {
        let mut ledger = EffectLedger::new();

        let eff = Effect {
            token: "eff-100".into(),
            call_hash: "hash-call-100".into(),
            outcome: EffectOutcome::Committed,
            idempotency_key: Some("idem-key-abc".into()),
            committed_at: Utc::now(),
        };

        ledger.record(eff.clone());

        assert_eq!(ledger.get("eff-100"), Some(&eff));
        assert_eq!(ledger.get_by_idempotency_key("idem-key-abc"), Some(&eff));
        assert_eq!(ledger.get_by_idempotency_key("unknown-key"), None);
    }

    #[test]
    fn test_verify_preconditions_must_have_and_must_not_have() {
        let ledger = EffectLedger::new();
        let history = vec!["auth_verified".to_string(), "invoice_generated".to_string()];

        // 1. Passing check
        let must_have = vec!["auth_verified".to_string()];
        let must_not_have = vec!["invoice_paid".to_string()];
        assert!(ledger.verify_preconditions(&must_have, &must_not_have, &history).is_ok());

        // 2. Failing must_have
        let failing_must_have = vec!["kyc_approved".to_string()];
        assert!(ledger.verify_preconditions(&failing_must_have, &must_not_have, &history).is_err());

        // 3. Failing must_not_have
        let failing_must_not_have = vec!["invoice_generated".to_string()];
        assert!(ledger.verify_preconditions(&must_have, &failing_must_not_have, &history).is_err());
    }

    #[test]
    fn test_reconciliation_indeterminate_to_committed() {
        let mut ledger = EffectLedger::new();

        let eff_indet = Effect {
            token: "eff-timeout-1".into(),
            call_hash: "hash-timeout".into(),
            outcome: EffectOutcome::Indeterminate,
            idempotency_key: Some("req-tx-1".into()),
            committed_at: Utc::now(),
        };
        ledger.record(eff_indet);

        assert_eq!(
            ledger.get("eff-timeout-1").unwrap().outcome,
            EffectOutcome::Indeterminate
        );

        // Run reconciliation: confirm transaction succeeded downstream
        let reconciled = ledger.reconcile_indeterminate(|eff| {
            if eff.token == "eff-timeout-1" {
                Some(EffectOutcome::Committed)
            } else {
                None
            }
        });

        assert_eq!(reconciled.len(), 1);
        assert_eq!(
            ledger.get("eff-timeout-1").unwrap().outcome,
            EffectOutcome::Committed
        );
    }
}
