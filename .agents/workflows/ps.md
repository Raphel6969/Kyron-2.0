# Workflow: /ps — Problem Statement to Execution Spine

Takes a raw hackathon Problem Statement and autonomous constraints, decodes the market gap, formulates the technical differentiator, pauses ONCE for human approval, and generates the complete project architecture, phased plan, and team split.

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

## Step 4: Map User Journeys
- Invoke skill: `user-journey`
- Map Journey 1 (Value Path), Journey 2 (Judge Demo Path <= 2 clicks), and Journey 3 (Error Recovery).
- Generates: `docs/UX.md`

## Step 5: Construct Quantified Impact Model
- Invoke skill: `impact-model`
- Source the baseline metric, construct the explicit value arithmetic, and author the "Honest Limits" section.
- Generates: `docs/IMPACT.md`

## Step 6: System Architecture & Trust Boundaries
- Invoke skill: `architecture`
- Decompose stack, define polyglot service boundaries, construct the trust matrix, log ADR-000.
- Generates: `ARCHITECTURE.md`, `API.md`, `SCHEMA.md`, and `DECISIONS.md`.

## Step 7: Phased Execution Planning
- Invoke skill: `phase-planner`
- Calculate time budgets (Phase 0: 15%, Phase 1: 25%, Phase 2: 35%, Phase 3: 15%, Buffer: 10%).
- Define exit criteria, demo fallbacks, and cut list.
- Generates: `PLAN.md` and initializes `STATE.md`.

## Step 8: Team & File Lane Allocations
- Invoke skill: `team-split`
- Allocate Lead, Backend, Frontend, and Glue file ownership lanes.
- Generates: `HUMANS.md`.

## Step 9: Verify & Commit
- // turbo `make verify`
- // turbo `git commit -m "phase0: project architecture and execution spine initialized"`
