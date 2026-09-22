# ARCHITECTURE — System Topology & Trust Boundaries

> **Strict 200-line cap.** This document is the primary architectural map read by cold agents
> to understand runtime relationships without scanning the full codebase. Keep it concise.

---

## 1. System Overview
```
                      ┌─────────────────────────────────────────┐
                      │              Client Layer               │
                      │         <React/Vite or Next.js>         │
                      └────────────────────┬────────────────────┘
                                           │ HTTP / WS
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │             API / Gateway               │
                      │            <FastAPI or Go>              │
                      └──────────────┬───────────────────┬──────┘
                                     │                   │
                        Internal IPC │                   │ Queries
                                     ▼                   ▼
                      ┌─────────────────────────┐  ┌────────────┐
                      │ Core Processing Service │  │ PostgreSQL │
                      │      <Python / Rust>    │  │  Database  │
                      └─────────────────────────┘  └────────────┘
```

## 2. Component Inventory
| Component | Runtime | Port | Primary Responsibility | Owns Database Tables |
|---|---|---|---|---|
| `<client>` | <e.g. Next.js / Vite> | 3000 | <User interface, presentation, client routing> | None |
| `<api>` | <e.g. FastAPI / Chi> | 8000 | <Public endpoints, authn/authz, input validation> | <shared relational tables> |
| `<core_engine>` | <e.g. Rust / Python> | 8080 | <High-performance computation, ML inference> | <domain specific tables> |
| `<db>` | PostgreSQL 16+ | 5432 | <ACID persistent storage, relational integrity> | All tables |

## 3. Service Trust Boundaries
*(Motivated by Nexus & Orcheon: define exactly who can read what to prevent security leaks).*

| Boundary / Secret | Accessible By | Strictly Forbidden To | Enforcement Mechanism |
|---|---|---|---|
| `<primary_database_url>` | `<api_service>` | `<client_browser>` | Server-side env injection |
| `<private_encryption_keys>` | `<core_engine>` | `<api_gateway>`, `<client>` | Isolated container filesystem |
| `<tenant_data_partition>` | `<authenticated_tenant>` | `<cross_tenant_users>` | SQL WHERE tenant_id filter & tests |

## 4. Key Data Flows
1. **Primary Request Flow:**
   `<step 1: Client submits request>` → `<step 2: API gateway validates input & authn>` → `<step 3: Business logic executed>` → `<step 4: Relational persistence>` → `<step 5: Client state updated>`.

2. **Quantified Impact Flow:**
   `<step 1: Background event logged>` → `<step 2: Database event log aggregated>` → `<step 3: /impact computes live arithmetic>` → `<step 4: Metric rendered on client>`.

## 5. Non-Goals (Explicitly Out of Scope)
- <non_goal_1_e.g._multi_region_active_active_failover>
- <non_goal_2_e.g._custom_foundation_model_pretraining>
- <non_goal_3_e.g._legacy_browser_support_below_es2022>
