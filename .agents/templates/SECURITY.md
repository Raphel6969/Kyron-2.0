# SECURITY — Hardening Baseline & Data Protection

> **Security Floor Standard:** Enforced mechanically by `hardening-gate.sh`.
> Code with authorization holes or plaintext secrets is rejected immediately.

---

## 1. Authentication & Tenant Authorization
- **Authentication Mechanism:** `<e.g._JWT_with_HMAC-SHA256_or_API_Key_bearer>`
- **Tenant Isolation Rule:**
  Every database query must enforce tenant boundary filters (`WHERE tenant_id = :current_tenant_id`).
- **Required Automated Test:**
  `test_tenant_isolation` proving User A cannot read or modify User B's resources (returns HTTP 403 / 404).

---

## 2. Secrets Management & Environment Hygiene
- **Storage Rule:** All secrets must be loaded strictly from environment variables.
- **Forbidden Patterns:**
  - Hardcoded API keys, bearer tokens, or database passwords in source code.
  - Tracking `.env` or `.env.local` files in git repository.
- **Committed Artifact:** `.env.example` must be kept updated with all required variable keys and dummy values.

---

## 3. Boundary Input Validation
- **Engine Standard:** All incoming payloads must be strictly validated at the HTTP boundary before reaching business logic.
- **Schema Enforcers:** Pydantic v2 (Python) / Zod (TypeScript) / Struct validation (Go).
- **Rule:** Input errors must return HTTP 400 Bad Request with structured field details, never unhandled HTTP 500.

---

## 4. Rate Limiting & Abuse Prevention
- **Global API Rate Limit:** `<e.g._60_requests_per_minute_per_ip>`
- **Expensive Endpoint Rate Limit:** `<e.g._5_requests_per_minute_for_llm/simulation>`
- **Header Standard:** Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.

---

## 5. HTTP Security Headers
All responses must include standard security headers:
- `Content-Security-Policy: default-src 'self'`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 6. PII & Privacy Protections
- **PII Scrubbing:** No personally identifiable information (emails, phone numbers, raw tax IDs) in application logs.
- **Log Sanitation:** Request parameters and headers scrubbed of `Authorization`, `token`, `password`, `key`.
