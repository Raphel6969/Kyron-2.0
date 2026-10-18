# SECURITY — Hardening Baseline & Data Protection

> **Security Floor Standard:** Enforced mechanically by `hardening-gate.sh` and continuous CI.
> Code with authorization holes, plaintext credentials, or unvalidated boundaries is rejected immediately.

---

## 1. Authentication & Tenant Authorization
- **Gateway Authentication:** mTLS or Bearer API keys passed via `Authorization: Bearer <token>` or MCP connection metadata.
- **Control Plane Authentication:** JWT session tokens with HMAC-SHA256 signatures, validated on every FastAPI request via dependency injection.
- **Tenant Isolation Rule:**
  - All database queries for policies, tools, approval requests, and audit events must enforce tenant isolation (`WHERE tenant_id = :current_tenant_id`).
  - **Required Automated Test:** `test_tenant_isolation` proving User A cannot read, modify, or approve User B's tools or policies (returns HTTP 403 Forbidden).

---

## 2. Secrets Management & Environment Hygiene
- **The Zero-Credential Invariance Rule:**
  - **No credential string may ever appear in model prompts, context transcripts, or client configurations.**
  - Tools declare secret requirements in their contracts; the Secrets Broker (C9) injects dynamic, short-lived tokens at dispatch.
  - The Secrets Broker scans all model-visible return traffic and automatically redacts known secret patterns (`sk-`, `ghp_`, `AKIA`, private keys).
- **Environment Hygiene:**
  - No plaintext secrets in source code, commit history, or docker images.
  - `.env` and `.env.local` are strictly excluded in `.gitignore`.
  - `.env.example` is committed and maintained with all required configuration keys and dummy values.

---

## 3. Boundary Input Validation & Memory Safety
- **Memory-Safe Core:** The decision core and policy engine are implemented in pure Rust 1.80+; the custom protocol gateway is implemented in Go 1.23+ with bounds-checked buffer pooling.
- **Boundary Validation:**
  - Control plane REST payloads strictly validated via Pydantic v2 with runtime schema enforcement.
  - Incoming MCP JSON-RPC messages validated for standard framing, Unicode normalization (stripping zero-width and bidirectional control characters), and schema conformance.
  - Malformed payloads return HTTP 400 Bad Request or JSON-RPC `-32600 Invalid Request`, never unhandled 500 panics.

---

## 4. Cryptographic Proof & Audit Trail Security
- **Ed25519 Signatures:** Every tool approval pin and audit event is cryptographically signed using Ed25519 keys stored securely in environment/KMS.
- **Immutable Hash-Chaining:** Each audit event includes `prev_hash = SHA256(previous_event)`, creating a tamper-evident audit ledger compliant with EU AI Act Article 50.
- **Verification Tool:** The CLI utility `kyron audit verify --trajectory <id>` recomputes the hash chain and verifies digital signatures to prove zero log tampering.

---

## 5. Rate Limiting, Budgets & Abuse Prevention
- **Per-Source Egress Budgets:** Cumulative outbound bytes and distinct destinations tracked per data source classification (e.g. max 512KB per session for `crm_pii`).
- **Control Plane API Rate Limit:** 120 requests/minute per IP; 10 requests/minute for sensitive policy update operations.
- **Standard Security Headers:**
  - `Content-Security-Policy: default-src 'self'`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
