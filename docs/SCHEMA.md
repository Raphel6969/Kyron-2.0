# Schema Reference — Kyron 2.0

_Core data objects that carry all policy and audit state._
_Last updated: 2026-10-12 · Version 0.1 (pre-P0)_

---

> [!NOTE]
> All schemas below are **proposals** from the architecture document. Tables will be created in migrations when the P0 scaffold is implemented. Rust structs in `core/` are the source of truth for the data plane; Postgres tables in `control/` are the source of truth for persistent state.

---

## Rust Core Types (Data Plane)

### Label

```rust
struct Label {
    readers: BitSet<Principal>,  // Who may read this value
    trust: u8,                   // Trust level (0 = untrusted, 255 = system)
}
// Combine: meet = (BitAnd readers, min trust)
```

### PinnedTool

```rust
struct PinnedTool {
    id: ToolId,                      // server_id + tool_name
    server: ServerId,
    name: String,
    hash: [u8; 32],                  // SHA-256 of normalised text + schema + server identity
    risk_score: f32,                 // 0.0–1.0
    risk_reasons: Vec<RiskReason>,
    approver: Option<UserId>,
    sig: Option<Signature>,          // Ed25519 over (hash, approver, timestamp)
    model_facing: CanonicalDesc,     // What the agent sees
    original_text: String,           // Kept for audit only
    state: ToolState,
    approved_at: Option<Timestamp>,
}

enum ToolState {
    Unregistered, Scanning, Scanned,
    Quarantined, Approved, Blocked, Revoked,
}
```

### Contract

```rust
struct Contract {
    tool_id: ToolId,
    label_contribution: LabelContrib, // What labels this tool adds/removes
    effect_tokens: Vec<EffectToken>,  // Side effects this tool commits
    preconditions: Preconditions,     // Constraints the call must satisfy
    declared_files: Vec<GlobPattern>,
    declared_network: Vec<DestinationSpec>,
}

struct Preconditions {
    trust_floor: u8,
    required_audience: Option<AudienceSet>,
    must_have_happened: Vec<EffectToken>,
    must_not_have_happened: Vec<EffectToken>,
    authority_gates: Vec<AuthorityGate>,
}
```

### Lease

```rust
struct Lease {
    id: LeaseId,
    trajectory: TrajectoryId,
    action: ActionSpec,
    constraints: LeaseConstraints,
    policy_version: u32,
    sig: Signature,     // Ed25519; issued by authority service
    expires_at: Timestamp,
}

struct LeaseConstraints {
    recipient_group: Option<PrincipalSet>,
    data_class_ceiling: TrustLevel,
    max_calls: u32,
    ttl_s: u32,
    max_bytes: u64,
}
```

### Effect

```rust
struct Effect {
    token: EffectToken,
    call_hash: [u8; 32],
    outcome: EffectOutcome,
    idempotency_key: Option<String>,
    committed_at: Timestamp,
}

enum EffectOutcome { Committed, Indeterminate }
```

### Verdict

```rust
enum Verdict {
    Allow,
    Block { gaps: Vec<Gap>, plan: Option<Plan> },
    Escalate { kind: EscalationKind },
}

enum EscalationKind {
    ResidualAmbiguity { question: NarrowQuestion },
    HighRisk,
    HumanRequired { request_id: ApprovalRequestId },
}
```

### AuditEvent

```rust
struct AuditEvent {
    id: EventId,
    prev_hash: [u8; 32],            // Hash of previous event (chain)
    session: SessionId,
    trajectory: TrajectoryId,
    call_hash: [u8; 32],
    tool: ToolId,
    verdict: VerdictTag,            // allow | block | escalate
    reasons: Vec<String>,
    policy_version: u32,
    model_tokens_spent: u32,
    sig: Signature,                 // Ed25519 over all fields above
    timestamp: Timestamp,
}
```

### Budget

```rust
struct Budget {
    max_child_branches: u32,
    max_recovery_steps: u32,
    max_authority_requests: u32,
    max_delegation_depth: u32,
    egress_bytes_per_trajectory: u64,
}
```

---

## PostgreSQL Tables (Control Plane)

### `tools`

```sql
CREATE TABLE tools (
    id              TEXT PRIMARY KEY,            -- server_id + ":" + tool_name
    server_id       TEXT NOT NULL,
    name            TEXT NOT NULL,
    hash            BYTEA NOT NULL,              -- SHA-256 (32 bytes)
    risk_score      REAL NOT NULL,
    risk_reasons    JSONB NOT NULL DEFAULT '[]',
    state           TEXT NOT NULL DEFAULT 'unregistered',
    approver_id     TEXT,
    sig             BYTEA,
    model_facing    TEXT,                        -- canonical description
    original_text   TEXT,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tools_state ON tools(state);
CREATE INDEX idx_tools_server_id ON tools(server_id);
```

### `policies`

```sql
CREATE TABLE policies (
    version         INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    mode            TEXT NOT NULL DEFAULT 'monitor',  -- monitor | enforce
    content         TEXT NOT NULL,                   -- signed TOML bundle
    sig             BYTEA NOT NULL,
    signed_by       TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_policies_active ON policies(is_active);
```

### `audit_events`

```sql
CREATE TABLE audit_events (
    id              TEXT PRIMARY KEY,
    prev_hash       BYTEA NOT NULL,
    session_id      TEXT NOT NULL,
    trajectory_id   TEXT NOT NULL,
    call_hash       BYTEA NOT NULL,
    tool_id         TEXT NOT NULL,
    verdict         TEXT NOT NULL,              -- allow | block | escalate
    reasons         JSONB NOT NULL DEFAULT '[]',
    policy_version  INTEGER NOT NULL,
    model_tokens    INTEGER NOT NULL DEFAULT 0,
    sig             BYTEA NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_session ON audit_events(session_id);
CREATE INDEX idx_audit_trajectory ON audit_events(trajectory_id);
CREATE INDEX idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX idx_audit_verdict ON audit_events(verdict);
```

### `leases`

```sql
CREATE TABLE leases (
    id              TEXT PRIMARY KEY,
    trajectory_id   TEXT NOT NULL,
    action_spec     JSONB NOT NULL,
    constraints     JSONB NOT NULL,
    policy_version  INTEGER NOT NULL,
    sig             BYTEA NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    calls_used      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_leases_trajectory ON leases(trajectory_id);
CREATE INDEX idx_leases_expires ON leases(expires_at);
```

### `approval_requests`

```sql
CREATE TABLE approval_requests (
    id              TEXT PRIMARY KEY,
    trajectory_id   TEXT NOT NULL,
    kind            TEXT NOT NULL,              -- tool_approval | lease_request | authority_ruling
    tool_id         TEXT,
    details         JSONB NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | denied
    decided_by      TEXT,
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_approvals_status ON approval_requests(status);
CREATE INDEX idx_approvals_trajectory ON approval_requests(trajectory_id);
```

### `effects`

```sql
CREATE TABLE effects (
    id              TEXT PRIMARY KEY,
    token           TEXT NOT NULL,
    call_hash       BYTEA NOT NULL,
    outcome         TEXT NOT NULL,              -- committed | indeterminate
    idempotency_key TEXT,
    trajectory_id   TEXT NOT NULL,
    committed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_effects_idempotency ON effects(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_effects_trajectory ON effects(trajectory_id);
CREATE INDEX idx_effects_token ON effects(token);
```

### `sessions`

```sql
CREATE TABLE sessions (
    id              TEXT PRIMARY KEY,
    agent_id        TEXT,
    policy_version  INTEGER NOT NULL,
    mode            TEXT NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
```

---

## JSON Event Schema (Audit Log Wire Format)

```json
{
  "id": "ev_01J...",
  "prev": "sha256:aabbcc...",
  "session": "s_42",
  "trajectory": "t_7",
  "call_hash": "sha256:ddeeff...",
  "tool": "crm.get_customer",
  "verdict": "block",
  "reasons": ["egress_budget_exceeded"],
  "policy_version": 3,
  "model_tokens_spent": 0,
  "sig": "ed25519:zzz...",
  "timestamp": "2026-10-12T01:59:00Z"
}
```

---

## Policy File Schema (Declarative TOML, C3, F35)

```toml
[meta]
version = 1
name = "enterprise-strict"
mode = "enforce"                     # enforce | monitor
description = "Default corporate zero-trust policy for tool-using AI agents"
signed_by = "sec-admin-corp"

[budgets]
egress_bytes_per_trajectory = 1048576 # 1 MB
max_calls_per_trajectory = 100
max_distinct_destinations = 5

[egress]
default_action = "deny"              # deny | allow
allowed_destinations = [
    "api.github.com",
    "*.corp.net",
]
blocked_destinations = [
    "169.254.169.254",               # Cloud metadata SSRF
    "evil.com",
    "webhook.site",
]

[[tools]]
pattern = "bash"
action = "block"                     # allow | block | require_lease
reason = "Direct raw shell execution is permanently banned"

[[tools]]
pattern = "k8s:restart_deployment"
action = "require_lease"
max_calls = 1
ttl_seconds = 600
reason = "Production deployment restart requires call-scoped capability lease"

[[tools]]
pattern = "*"
action = "allow"
reason = "Permit registered approved tools"
```
