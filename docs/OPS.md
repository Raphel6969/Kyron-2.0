# OPS — Operational Baseline & Reliability Runbook

> **Operational Standard:** Production-grade systems maintain structured visibility.
> Every service exposes health metrics, structured logs, and demo recovery hooks.

---

## 1. System Health Check Specification (`/healthz`)
- **Route:** `GET /healthz`
- **Port:** `8000` (Control API) and `8080` (Gateway Proxy)
- **Deep Downstream Checks Performed:**
  - Database pool query: `SELECT 1` on PostgreSQL 16+
  - In-process Rust policy engine communication check
  - Upstream MCP server reachability check
- **Required Response Format:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "checks": {
    "database": "ok",
    "policy_engine": "ok",
    "gateway_proxy": "ok",
    "audit_emitter": "ok"
  },
  "uptime_seconds": 18420,
  "timestamp": "2026-10-17T10:35:00Z"
}
```

---

## 2. Structured Logging Standards
- **Format:** Single-line JSON emitted to `stdout`.
- **Mandatory Fields per Log Entry:**
  - `timestamp`: ISO-8601 UTC string.
  - `level`: `INFO` | `WARN` | `ERROR`.
  - `request_id`: UUIDv4 correlating the transaction across services.
  - `session_id`: Active agent session ID.
  - `trajectory_id`: Execution trajectory ID.
  - `message`: Human-readable summary.
  - `duration_ms`: Execution time for request or background task.
- **Log Hygiene:** Zero passwords, bearer tokens, API keys, or raw customer PII permitted in log fields.

---

## 3. Demo Reset & State Recovery (`make reset-demo`)
- **Command:** `make reset-demo`
- **Execution Target Time:** `< 5 seconds`
- **Actions Executed:**
  1. Truncates transient test tables and active session records.
  2. Runs PostgreSQL migrations (`alembic upgrade head`) to ensure schema parity.
  3. Executes idempotent database seed script loading:
     - 6 standard MCP tool fixtures (including S1–S6 fixtures in quarantined or active states)
     - 3 enterprise policies (default monitor, strict PCI, dev permissive)
     - 40 historical signed audit events with valid Ed25519 hash chains
  4. Flushes in-process Rust policy verdict caches.

---

## 4. Integration Circuit Breakers & Feature Flags

| Flag Name | Environment Variable | Default State | Fallback Action when Disabled |
|---|---|---|---|
| **Live Remote MCP Proxy** | `ENABLE_REMOTE_MCP` | `true` | Serves mock tools from `lab/` |
| **Offline Model Judge** | `ENABLE_OFFLINE_JUDGE` | `false` | Uses fast heuristic vector rules only |
| **Aya/eBPF Process Tracing** | `ENABLE_EBPF_TRACING` | `false` | Skips syscall trace diff on non-Linux platforms |
| **External SIEM Export** | `ENABLE_OTEL_EXPORT` | `true` | Buffers audit events locally in PostgreSQL |
