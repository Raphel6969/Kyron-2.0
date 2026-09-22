# SCHEMA — Relational Data Models & Migrations

> **Relational Integrity Standard:** Hand-edited database tables are strictly banned.
> Every table modification must originate from a versioned, reversible migration file.
> Indexes are required on every foreign key, JOIN, and query filter column.

---

## Migration History
| Version | Migration File / ID | Description | Applied Date |
|---|---|---|---|
| `001` | `<timestamp>_initial_schema` | Core entities, foreign keys, and indexes | <YYYY-MM-DD> |
| `002` | `<timestamp>_<feature_migration>` | <Description of table additions> | <YYYY-MM-DD> |

---

## Table Definitions

### 1. `<table>`
<Description of entity purpose>.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique entity identifier |
| `tenant_id` | `UUID` | `NOT NULL, REFERENCES tenants(id)` | Multi-tenant isolation boundary |
| `<name>` | `VARCHAR(255)` | `NOT NULL` | <Description> |
| `metadata` | `JSONB` | `DEFAULT '{}'` | Structured extensibility attributes |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW(), NOT NULL` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW(), NOT NULL` | Last update timestamp |

**Indexes:**
- `idx_<table>_tenant_id` ON `<table>(tenant_id)`
- `idx_<table>_<filter_col>` ON `<table>(<filter_col>)`

---

## Seed Data Inventory
*(Motivated by dod.md: Every model requires 30+ realistic domain rows, not lorem ipsum).*
- **Seed Script Path:** `<path_to_seed_script_e.g._backend/seed.py>`
- **Total Seed Records:** `<count_>=30>`
- **Idempotency Guarantee:** Seed script uses `ON CONFLICT DO NOTHING` or explicit upsert keys.
