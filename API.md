# API Reference — Kyron 2.0

_Auto-generated from component specifications. Last updated: 2026-10-12 · Version 0.1 (pre-P0)_

---

> [!NOTE]
> All endpoints below are **proposals** derived from the architecture document. Actual paths and schemas will be updated when the control plane API (C12) is implemented in P1.

---

## Data Plane APIs (Go Gateway, gRPC/local socket)

These are internal interfaces between the gateway (C1) and the core (C2, C3, C8, C9, C11). They are not exposed over the internet in P0.

### Policy Engine (C3)

```
evaluate(call: RenderedCall, state: State) → Verdict
admit(ret: ToolReturn, state: &mut State) → Result<Admitted, Violation>
```

- `Verdict` = `Allow | Block { gaps: Vec<Gap>, plan: Option<Plan> } | Escalate { kind: EscalationKind }`
- Same call + state always produces the same verdict (pure, deterministic).

### Registry Firewall (C2)

```
scan(listing: ToolListing) → RiskRecord
pin(tool_id: ToolId, approver: UserId) → PinnedTool
get_canonical(tool_id: ToolId) → CanonicalDesc
check_drift(tool_id: ToolId, new_listing: ToolListing) → DriftResult
```

### Egress Broker (C8)

```
POST /egress/forward
  Body: { destination, method, headers, body_bytes, data_source_label, trajectory_id }
  Returns: { allowed: bool, reason?: string, bytes_used, budget_remaining }
```

### Secrets Broker (C9)

```
resolve(secret_ref: SecretRef, scope: Scope, ttl_s: u32) → ScopedToken
redact(text: &str) → RedactedText
```

---

## Control Plane REST API (FastAPI, C12)

Base URL: `http://localhost:8001` (dev) / configurable in production.

All write endpoints require a signed JWT. Policy bundles are signed with Ed25519.

### Tools & Registry

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/tools` | List all known tools with their `PinnedTool` records |
| `GET` | `/v1/tools/{tool_id}` | Get one tool's full record including risk reasons and state |
| `POST` | `/v1/tools/scan` | Submit a tool listing for immediate scan; returns `RiskRecord` |
| `POST` | `/v1/tools/{tool_id}/approve` | Approve and pin a quarantined tool |
| `POST` | `/v1/tools/{tool_id}/reject` | Block a tool permanently |
| `GET` | `/v1/tools/{tool_id}/diff` | Semantic diff between approved and current description |

### Policies

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/policies` | List all policy versions |
| `GET` | `/v1/policies/active` | Get currently active policy bundle |
| `GET` | `/v1/policies/{version}` | Get a specific policy bundle (signed TOML) |
| `POST` | `/v1/policies` | Create and sign a new policy version |
| `PUT` | `/v1/policies/active` | Promote a policy version to active (pushed to gateway) |
| `POST` | `/v1/policies/compile` | Compile and validate proposed declarative TOML policy |
| `POST` | `/v1/policies/reload` | Atomically hot-reload active policy across gateway with zero downtime |
| `POST` | `/v1/policies/simulate` | Run a recorded trace against a proposed policy; returns would-block counts |

### Approvals & Leases

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/approvals` | List pending approval requests |
| `POST` | `/v1/approvals/{request_id}/approve` | Issue a signed ruling or lease |
| `POST` | `/v1/approvals/{request_id}/deny` | Deny a request with reason |
| `GET` | `/v1/leases` | List active capability leases |
| `DELETE` | `/v1/leases/{lease_id}` | Revoke a lease |

### Audit & Evidence

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/audit/events` | Query events (filter by session, trajectory, verdict, time) |
| `GET` | `/v1/audit/events/{event_id}` | Get a single event with full detail |
| `GET` | `/v1/audit/export` | Export a session's events as signed JSON or OpenTelemetry |
| `POST` | `/v1/audit/verify` | Verify the hash chain of an exported event log |

### Reports

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/reports/summary` | Summary: scanned tools, blocked calls, risk distribution |
| `GET` | `/v1/reports/session/{session_id}` | Per-session report with timeline and verdict breakdown |
| `GET` | `/v1/reports/would-block` | Would-block counts from current monitor-mode trace |

### Health & Status

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | Deep health: gateway reachable, policy version, audit store writable |
| `GET` | `/v1/status` | Gateway stats: sessions active, calls/min, decision-class distribution |

---

## CLI Interface (kyron binary)

```bash
# Scan a tool listing and get risk scores
kyron scan tools.json

# Run an agent in monitor mode (block nothing, log everything)
kyron run --mode monitor -- <agent command>

# Run in enforce mode
kyron run --mode enforce -- <agent command>

# Replay a recorded trace against a proposed policy
kyron replay trace.jsonl --policy policy.toml

# Start the vulnerable lab (S1–S6 fixtures)
make lab

# Run the evaluation harness against MCPTox
kyron eval --benchmark mcp-tox --policy policy.toml

# Verify an exported audit log chain
kyron audit verify export.jsonl

# Export a session's audit events
kyron audit export --session s_42 --format json
```

---

## MCP Gateway Interface

The gateway speaks standard MCP over stdio and HTTP. Clients connect with no changes.

```
# stdio (local binary / sidecar)
kyron run --mode monitor -- python my_agent.py

# HTTP proxy
# Configure your MCP client to use http://localhost:4567 as the MCP endpoint
kyron gateway --listen :4567 --upstream http://mcp-server:3000
```

The gateway adds the following headers on forwarded calls (internal, not visible to the model):

```
X-Kyron-Session-Id: s_42
X-Kyron-Trajectory-Id: t_7
X-Kyron-Policy-Version: 3
X-Kyron-Verdict: allow
```

---

## Webhook Events (Control Plane → Integrations)

| Event | Trigger | Payload summary |
|---|---|---|
| `tool.quarantined` | Tool drift detected or new tool above threshold | `tool_id`, `risk_score`, `diff_url` |
| `call.blocked` | Call blocked in enforce mode | `trajectory_id`, `tool`, `reasons`, `policy_version` |
| `egress.budget_exceeded` | Egress budget breached | `trajectory_id`, `data_source`, `bytes_used`, `budget` |
| `approval.requested` | Human approval needed | `request_id`, `trajectory_id`, `kind`, `tool` |
| `policy.activated` | New policy version promoted | `version`, `activated_by`, `timestamp` |
