-- Kyron 2.0 PostgreSQL 16+ Initial Schema Migration
-- Source of truth: SCHEMA.md

CREATE TABLE IF NOT EXISTS tools (
    id              TEXT PRIMARY KEY,            -- server_id + ":" + tool_name
    server_id       TEXT NOT NULL,
    name            TEXT NOT NULL,
    hash            TEXT NOT NULL,              -- SHA-256 hex string
    risk_score      REAL NOT NULL,
    risk_reasons    JSONB NOT NULL DEFAULT '[]',
    state           TEXT NOT NULL DEFAULT 'unregistered',
    approver_id     TEXT,
    signature       TEXT,
    model_facing    TEXT,                        -- canonical description
    original_text   TEXT,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_state ON tools(state);
CREATE INDEX IF NOT EXISTS idx_tools_server_id ON tools(server_id);

CREATE TABLE IF NOT EXISTS policies (
    version         INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    mode            TEXT NOT NULL DEFAULT 'monitor',  -- monitor | enforce
    content         TEXT NOT NULL,                   -- signed TOML bundle
    signature       TEXT NOT NULL,
    signed_by       TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(is_active);

CREATE TABLE IF NOT EXISTS audit_events (
    id              TEXT PRIMARY KEY,
    prev_hash       TEXT NOT NULL,
    session_id      TEXT NOT NULL,
    trajectory_id   TEXT NOT NULL,
    call_hash       TEXT NOT NULL,
    tool_id         TEXT NOT NULL,
    verdict         TEXT NOT NULL,              -- allow | block | escalate
    reasons         JSONB NOT NULL DEFAULT '[]',
    policy_version  INTEGER NOT NULL,
    model_tokens    INTEGER NOT NULL DEFAULT 0,
    signature       TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_events(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_trajectory ON audit_events(trajectory_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_verdict ON audit_events(verdict);

CREATE TABLE IF NOT EXISTS leases (
    id              TEXT PRIMARY KEY,
    trajectory_id   TEXT NOT NULL,
    action_spec     TEXT NOT NULL,
    constraints     JSONB NOT NULL DEFAULT '{}',
    policy_version  INTEGER NOT NULL,
    signature       TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    calls_used      INTEGER NOT NULL DEFAULT 0,
    max_calls       INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_trajectory ON leases(trajectory_id);
CREATE INDEX IF NOT EXISTS idx_leases_expires ON leases(expires_at);

CREATE TABLE IF NOT EXISTS approval_requests (
    id              TEXT PRIMARY KEY,
    trajectory_id   TEXT NOT NULL,
    kind            TEXT NOT NULL,              -- tool_approval | lease_request | authority_ruling
    tool_id         TEXT,
    details         JSONB NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | denied
    decided_by      TEXT,
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_trajectory ON approval_requests(trajectory_id);

CREATE TABLE IF NOT EXISTS effects (
    id              TEXT PRIMARY KEY,
    token           TEXT NOT NULL,
    call_hash       TEXT NOT NULL,
    outcome         TEXT NOT NULL,              -- committed | indeterminate
    idempotency_key TEXT,
    trajectory_id   TEXT NOT NULL,
    committed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_effects_idempotency ON effects(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_effects_trajectory ON effects(trajectory_id);
CREATE INDEX IF NOT EXISTS idx_effects_token ON effects(token);

CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    agent_id        TEXT,
    policy_version  INTEGER NOT NULL,
    mode            TEXT NOT NULL DEFAULT 'monitor',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
