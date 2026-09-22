# OPS — Operational Baseline & Reliability Runbook

> **Operational Standard:** Production-grade systems maintain structured visibility.
> Every service must expose health metrics, structured logs, and demo recovery hooks.

---

## 1. System Health Check Specification (`/healthz`)
- **Route:** `GET /healthz`
- **Port:** `<service_port>`
- **Downstream Checks Performed:**
  - Database pool query (`SELECT 1`)
  - Upstream service reachability check
- **Required Response Format:**
```json
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "storage": "ok"
  },
  "uptime_seconds": "<integer>",
  "timestamp": "<ISO-8601>"
}
```

---

## 2. Structured Logging Standards
- **Format:** Single-line JSON emitted to `stdout`.
- **Mandatory Fields per Log Entry:**
  - `timestamp`: ISO-8601 UTC string.
  - `level`: `INFO` | `WARN` | `ERROR`.
  - `request_id`: UUID correlating the transaction across services.
  - `message`: Human-readable summary.
  - `duration_ms`: Execution time for request or background task.
- **Log Hygiene:** Zero secrets, bearer tokens, or PII permitted in log fields.

---

## 3. Demo Reset & State Recovery (`make reset-demo`)
- **Command:** `make reset-demo`
- **Execution Target Time:** `< 5 seconds`
- **Actions Executed by Command:**
  1. Truncates transient and test transaction tables.
  2. Runs database migrations to verify schema parity.
  3. Executes idempotent seed script loading 30+ clean demo records.
  4. Flushes in-memory cache or Redis keys.

---

## 4. Integration Feature Flags (Circuit Breakers)
*(Enables live disabling of flaky 3rd-party dependencies mid-demo).*

| Integration Name | Environment Flag | Default State | Fallback Action when Disabled |
|---|---|---|---|
| `<LLM_API_Provider>` | `ENABLE_LLM_INFERENCE` | `true` | Deterministic canned evaluation |
| `<External_Data_Feed>` | `ENABLE_LIVE_DATA_FEED` | `true` | Seeded database snapshot |
| `<Notification_Service>` | `ENABLE_WEBHOOK_NOTIFICATIONS`| `true` | Local in-memory log entry |
