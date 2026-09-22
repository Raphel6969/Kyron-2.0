# Workflow: /ps — Problem Statement to Execution Spine

Takes a raw hackathon Problem Statement and autonomous constraints, decodes the market gap, formulates the technical differentiator, pauses ONCE for human approval, generates a complete `.env.example`, and produces the full project architecture, phased plan, and team split.

## Step 1: Decode Problem Statement
- Invoke skill: `ps-decode`
- Parse verbatim PS text into target personas (max 2), market disparity, competitor gaps, and rubric weights.
- Generates: `docs/01-problem.md`

## Step 2: Formulate Technical Differentiator
- Invoke skill: `solution-design`
- Construct the core technical moat, evaluate 3 alternative architectures, and formulate the 90-second demo hook.
- Generates: `docs/02-solution.md`

## Step 3: Mandatory Human Checkpoint (PAUSE ONCE)
- **PAUSE EXECUTION.** Present `docs/02-solution.md` to the user:
  > *"Here is our proposed technical moat and 90-second demo hook in `docs/02-solution.md`. Please review and approve before we lock architecture and phase planning."*
- Await affirmative user confirmation. **Do NOT proceed until user approves.**

## Step 4: Generate Environment Variable Manifest (.env.example)
- Read `docs/02-solution.md` (approved moat + all third-party integrations mentioned).
- Read `.agents/templates/ARCHITECTURE.md` (service boundaries, data stores).
- Read `.agents/templates/API.md` (external API surface, authentication schemes).
- Infer every env var required by the approved architecture. At minimum include:
  ```
  ENVIRONMENT=development
  PORT=8000

  # Primary Relational Store (PostgreSQL required; SQLite banned in production)
  DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/app_db

  # Security & Session
  JWT_SECRET=replace-with-a-random-32-character-secret-key-here
  JWT_ALGORITHM=HS256

  # LLM Inference
  GROQ_API_KEY=gsk_your_groq_api_key_here
  GROQ_MODEL=llama-3.1-8b-instant

  # Circuit Breaker Feature Flags (Demo Resilience)
  ENABLE_LLM_INFERENCE=true
  ENABLE_EXTERNAL_API=true
  ```
- Extend with any domain-specific keys implied by the PS and solution (examples — include only those relevant):
  ```
  # Add only keys the approved architecture actually requires:
  OPENAI_API_KEY=sk-your-openai-key-here
  REDIS_URL=redis://localhost:6379/0
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-supabase-anon-key
  STRIPE_SECRET_KEY=sk_test_your-stripe-key
  RESEND_API_KEY=re_your-resend-key
  SENTRY_DSN=https://your-sentry-dsn@o123456.ingest.sentry.io/000000
  POSTHOG_API_KEY=phc_your-posthog-key
  GOOGLE_CLIENT_ID=your-google-oauth-client-id
  GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
  ```
- Write the final file to `.env.example` in the project root. No actual secrets — placeholder values only.
- Verify `.env` is listed in `.gitignore`. If not, append it.
- For every key that requires a human to provision (paid API keys, OAuth credentials, cloud DSNs), append a non-blocking entry to `NEEDS_YOU.md` with: what the key is, where to get it, and what the agent will do once it has it.
- Run `make verify` — confirm `hardening-gate.sh` passes (`.env.example` must not contain `sqlite:///`).
- Generates: `.env.example` (project root)

## Step 5: Map User Journeys
- Invoke skill: `user-journey`
- Map Journey 1 (Value Path), Journey 2 (Judge Demo Path <= 2 clicks), and Journey 3 (Error Recovery).
- Generates: `docs/UX.md`

## Step 6: Construct Quantified Impact Model
- Invoke skill: `impact-model`
- Source the baseline metric, construct the explicit value arithmetic, and author the "Honest Limits" section.
- Generates: `docs/IMPACT.md`

## Step 7: System Architecture & Trust Boundaries
- Invoke skill: `architecture`
- Decompose stack, define polyglot service boundaries, construct the trust matrix, log ADR-000.
- Generates: `ARCHITECTURE.md`, `API.md`, `SCHEMA.md`, and `DECISIONS.md`.

## Step 8: Phased Execution Planning
- Invoke skill: `phase-planner`
- Calculate time budgets (Phase 0: 15%, Phase 1: 25%, Phase 2: 35%, Phase 3: 15%, Buffer: 10%).
- Define exit criteria, demo fallbacks, and cut list.
- Generates: `PLAN.md` and initializes `STATE.md`.

## Step 9: Team & File Lane Allocations
- Invoke skill: `team-split`
- Allocate Lead, Backend, Frontend, and Glue file ownership lanes.
- Generates: `HUMANS.md`.

## Step 10: Verify & Commit
- // turbo `make verify`
- // turbo `git commit -m "phase0: project architecture and execution spine initialized"`
