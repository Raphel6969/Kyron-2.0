---
name: data-integrity
description: Load this skill to author versioned database migrations, index every foreign key and query filter column, create 30+ realistic domain seed rows, and verify idempotent database seeding.
---

# WHEN TO LOAD
Load during Phase 0 to set up migrations and initial seeds, whenever modifying table schemas in Phase 1/2, or when optimizing slow queries before phase close.

# INPUTS
- `SCHEMA.md` (Table models, relationships, and index definitions)
- Database migration directory (`alembic/versions/` or `migrations/`)
- Seed script (`backend/seed.py`, `scripts/seed.py`, or `server/scripts/seed.js`)

# OUTPUTS
- Versioned, reversible database migration file
- Indexes on every foreign key and WHERE/JOIN filter column
- 30+ realistic domain records loaded into PostgreSQL
- Verified idempotent execution of `make seed`

# EXECUTION PROTOCOL

1. **Author Migration (Never Hand-Edit Databases):**
   - Create a versioned migration using the project's migration tool (e.g. `alembic revision --autogenerate -m "<name>"`).
   - Ensure both `upgrade()` and `downgrade()` (or `up` and `down`) steps are complete.
   - Run migration against local PostgreSQL: `alembic upgrade head`.

2. **Enforce Query Indexing Standards:**
   Audit every table in the migration:
   - Add explicit B-tree indexes on all foreign keys (`tenant_id`, `user_id`, `parent_id`).
   - Add indexes on columns commonly used in `WHERE`, `ORDER BY`, or `JOIN` queries.
   - Document index names in `SCHEMA.md`.

3. **Author 30+ Realistic Domain Seed Rows:**
   Write an idempotent seed script:
   - Generate at least 30 rich, domain-authentic rows per primary model (no "test1", "foo", "lorem ipsum").
   - Include diverse statuses, realistic timestamps spanning past weeks, and edge-case values.

4. **Ensure Strict Idempotency:**
   Implement conflict handling:
   - Use `ON CONFLICT (id) DO NOTHING` or `INSERT ... ON CONFLICT DO UPDATE`.
   - Running `make seed` three times in succession must produce identical row counts without error.

# EXIT CRITERIA
- [ ] Migration applied cleanly with reversible downgrade
- [ ] All foreign keys and query filters indexed
- [ ] Database contains 30+ realistic records per entity
- [ ] `make seed` runs idempotently with zero errors
- [ ] `make verify` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
