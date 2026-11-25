# API Reference — Kyron 2.0

_Unified Data Plane & Control Plane interface specification (`v2.0`)._

---

## 1. Data Plane Interfaces (Go Gateway + Rust Core)

Internal low-latency hot-path interfaces (`3.8 ms` p95 decision overhead, `0` model tokens consumed).

### Policy Engine (`C3`)
```text
evaluate(call: RenderedCall, state: State) -> Verdict
admit(ret: ToolReturn, state: &mut State) -> Result<Admitted, Violation>
```
- `Verdict` = `Allow | Block { gaps: Vec<Gap>, plan: Option<Plan> } | Escalate { kind: EscalationKind }`

### Registry Firewall (`C2`)
```text
scan(listing: ToolListing) -> RiskRecord
pin(tool_id: ToolId, approver: UserId) -> PinnedTool
get_canonical(tool_id: ToolId) -> CanonicalDesc
check_drift(tool_id: ToolId, new_listing: ToolListing) -> DriftResult
```

### Egress Broker (`C8`) & Secrets Broker (`C9`)
```text
POST /egress/forward { destination, method, headers, body_bytes, data_source_label, trajectory_id }
resolve(secret_ref: SecretRef, scope: Scope, ttl_s: u32) -> ScopedToken
redact(text: &str) -> RedactedText
```

---

## 2. Control Plane REST API (FastAPI, `C12`)

Base URL: `http://127.0.0.1:8001` (local) · `https://kyron-2-0.onrender.com` (production).

### Health, Status & Impact
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root service banner and version metadata |
| `GET` | `/healthz` | Deep health check: DB reachability, policy version, store status |
| `GET` | `/v1/database/status` | Database dialect and active cloud provider status |
| `GET` | `/impact` | Live economic and risk-reduction telemetry computed from stored records |
| `GET` | `/v1/status` | Active sessions, tool counts, policy version, and lease metrics |
| `GET` | `/v1/circuit-breakers` | External dependency health & circuit-breaker flags |

### Tools & Registry Firewall
| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/tools` | List all registered MCP tools with risk scores and pinning states |
| `GET` | `/v1/tools/{tool_id}` | Inspect a single tool's manifest, risk reasons, and hash |
| `POST` | `/v1/tools/scan` | Submit a tool listing for scanning, canonicalization, and drift detection |
| `POST` | `/v1/tools/{tool_id}/approve` | Approve and Ed25519-pin a quarantined/scanned tool (writes audit event) |
| `POST` | `/v1/tools/{tool_id}/reject` | Permanently block a tool (writes audit event) |
| `GET` | `/v1/tools/{tool_id}/diff` | Side-by-side semantic diff between pinned and mutated descriptions |

### Policies
| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/policies` | List policy versions |
| `GET` | `/v1/policies/active` | Get currently active policy bundle |
| `PUT` | `/v1/policies/active` | Promote a policy version to active |
| `GET` | `/v1/policies/{version}` | Fetch a specific TOML policy version |
| `POST` | `/v1/policies` | Create and sign a new policy version |
| `POST` | `/v1/policies/compile` | Compile and validate declarative TOML policy rules |
| `POST` | `/v1/policies/reload` | Atomic zero-downtime hot-reload of active policy bundle |
| `POST` | `/v1/policies/simulate` | Replay recorded traces against a candidate policy |

### Approvals, Leases, TOCTOU & Provenance
| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/approvals` | List approval queue items |
| `POST` | `/v1/approvals` | Escalate a high-impact or quarantined call into the approval queue |
| `POST` | `/v1/approvals/{request_id}/approve` | Approve request and mint a signed single-use capability lease |
| `POST` | `/v1/approvals/{request_id}/deny` | Deny an escalated request with reason |
| `GET` | `/v1/leases` | List active capability leases |
| `POST` | `/v1/leases` | Create a signed capability lease |
| `DELETE` | `/v1/leases/{lease_id}` | Revoke a lease |
| `POST` | `/v1/resources/bind` | Bind resource URI/path to SHA-256 content hash |
| `POST` | `/v1/resources/verify` | Verify resource SHA-256 hash at execution instant (TOCTOU gate) |
| `GET` | `/v1/recovery/stats` | Zero-token memoized recovery cache statistics |
| `POST` | `/v1/recovery/lookup` | Look up precomputed recovery plan by composite state fingerprint |
| `POST` | `/v1/provenance/filter` | Apply RFC 6901 JSON-path field-level provenance redaction |
| `GET` | `/v1/effects` | List recorded side-effects |
| `POST` | `/v1/effects` | Record an effect with idempotency token |
| `POST` | `/v1/effects/reconcile` | Reconcile indeterminate/timed-out side-effects |

### Audit, Reports, Evaluation & OAuth
| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/audit/events` | Query SHA-256 hash-chained audit events |
| `POST` | `/v1/audit/events` | Append a gateway or runtime decision event to the hash chain |
| `GET` | `/v1/audit/export` | Export EU AI Act Article 50 bundle (`session_id=active` / `all` / specific ID) |
| `GET` | `/v1/reports/summary` | Summary across tools, blocked calls, and risk distribution |
| `GET` | `/v1/eval/adaptive-redteam` | Execute live RQ6 6-vector adaptive red-team benchmark |
| `GET` / `POST` | `/v1/auth/*` | Google OAuth 2.0 & GitHub OAuth sign-in and session endpoints |

---

## 3. MCP Gateway Interface (`kyron-gateway`)

- **Stdio subprocess interception:** `kyron-gateway --stdio --control-url http://127.0.0.1:8001 -- <upstream MCP command>`
- **HTTP / SSE mode:** Connects MCP clients to `/sse` and `/message` on `:8080` (or Nginx reverse proxy in container deployments).
- **Internal Context Headers:** `X-Kyron-Session-Id`, `X-Kyron-Trajectory-Id`, `X-Kyron-Policy-Version`, `X-Kyron-Verdict`.
