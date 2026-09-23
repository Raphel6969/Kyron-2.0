---
name: solution-design
description: Load this skill immediately after ps-decode to formulate the technical differentiator, define the core product moat, compare architectural alternatives, and pause once for mandatory human approval.
---

# WHEN TO LOAD
Load right after `ps-decode` completes during the `/ps` workflow, or when redesigning the technical value proposition for a problem statement.

# INPUTS
- `docs/01-problem.md` (Deconstructed problem and market gap)
- `RUBRIC.md` (Judging criteria)

# OUTPUTS
- `docs/02-solution.md` containing the technical differentiator, architecture comparison, and 90-second demo thesis.
- Mandatory Human Approval checkpoint.

# EXECUTION PROTOCOL

1. **Formulate the Unfair Technical Advantage (The Moat):**
   Define the single technical differentiator that will win the hackathon:
   - Is it a deterministic mathematical solver (e.g. Arrhenius decay model, MILP optimization)?
   - Is it an ultra-low-latency cascade (e.g. eBPF kernel guard, sub-2ms multi-stage filter)?
   - Is it a novel protocol or verifiable proof layer (e.g. HMAC action proofs, SHAP attribution)?

2. **Evaluate 3 Architectural Approaches:**
   Compare three concrete ways to solve the problem:
   - **Approach 1 (Naive):** The obvious LLM wrapper / basic CRUD app (what 80% of teams will submit).
   - **Approach 2 (Over-engineered):** The academic ideal (too complex for the hackathon clock).
   - **Approach 3 (The Hack Engine Sweet Spot):** Production-quality focused engine with high-signal differentiator, deterministic core, and live telemetry.

3. **Synthesize the 90-Second Demo Hook:**
   Write the opening sentence and initial 30-second user interaction for the live demo. If the differentiator cannot be demonstrated in under 30 seconds, simplify the solution.

4. **Write Solution Document:**
   Output findings to `docs/02-solution.md`. The document must include:
   - `## Technical Moat` — the differentiator from Step 1
   - `## Architecture Comparison` — the 3 approaches from Step 2
   - `## 90-Second Demo Hook` — from Step 3
   - `## Infrastructure Stack` — placeholder section with inferred defaults (finalized by `stack-interview` at the human checkpoint):
     ```
     ## Infrastructure Stack
     _(To be confirmed at human checkpoint — preliminary inference below)_
     - Backend:       <inferred from PS>
     - Frontend:      <inferred from PS>
     - Auth:          <inferred from PS>
     - Database:      PostgreSQL 16+ [non-negotiable]
     - Cache/Queue:   <inferred from PS>
     - API Gateway:   <inferred from PS>
     - Storage:       <inferred from PS>
     - Notifications: <inferred from PS>
     ```

5. **THE HUMAN CHECKPOINT (Mandatory Pause):**
   Present `docs/02-solution.md` to the user. State plainly:
   *"Here is the proposed technical differentiator and demo hook in `docs/02-solution.md`. Please review and approve — and confirm or override the infrastructure defaults — before we proceed to architecture and phase planning."*
   Wait for affirmative user approval. The `stack-interview` skill runs inside this pause.

# EXIT CRITERIA
- [ ] `docs/02-solution.md` exists with technical moat, 3 architecture comparisons, and `## Infrastructure Stack` placeholder
- [ ] Human lead has provided explicit approval to proceed
- [ ] `make verify` exits 0

# NEXT
`stack-interview` runs inside Step 3 to finalize `## Infrastructure Stack`. Then `user-journey` and `impact-model`.
