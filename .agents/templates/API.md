# API — Contract & Endpoint Registry

> **Living Contract.** Every endpoint in production must be registered here with its exact
> request/response schemas. Any divergence between code and this file fails verification.

---

## Base URLs
- **Local:** `http://localhost:<port>`
- **Production:** `<public_production_deployment_url>`

## Global Headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` *(where applicable)*
- `X-Request-ID: <uuid>` *(auto-generated structured trace)*

---

## 1. System & Health Endpoints

### `GET /healthz`
Returns system component liveness and database connectivity status.
- **Auth:** None (Public)
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "<ISO-8601>",
  "version": "<semver>"
}
```

---

## 2. Quantified Impact Endpoints

### `GET /impact`
Calculates live economic and efficiency metrics from seeded historical database records.
- **Auth:** None (Public)
- **Response (200 OK):**
```json
{
  "baseline_metric": "<number>",
  "optimized_metric": "<number>",
  "total_disparity_resolved": "<number>",
  "unit": "<currency_or_unit>",
  "sample_count": "<integer>",
  "last_updated": "<ISO-8601>"
}
```

---

## 3. Core Business Endpoints

### `POST /<domain_resource>`
<Brief description of what this endpoint executes>.
- **Auth:** Bearer Token / API Key
- **Request Body:**
```json
{
  "<field_name>": "<data_type_and_constraints>"
}
```
- **Response (201 Created):**
```json
{
  "id": "<uuid>",
  "<result_field>": "<value>",
  "created_at": "<ISO-8601>"
}
```
- **Error Responses:**
  - `400 Bad Request`: Input validation failure (Pydantic / Zod schema mismatch).
  - `401 Unauthorized`: Missing or invalid credential.
  - `403 Forbidden`: Cross-tenant data access attempt blocked.
  - `429 Too Many Requests`: Rate limit threshold exceeded.
