---
name: review-judge-sim
description: Load this skill whenever running an adversarial judge simulation, scoring projects against RUBRIC.md, preparing for pitch Q&A, identifying the weakest product claim, or prioritizing upcoming work by score-gained-per-hour. Run at every phase close and at the 70% time mark.
---

# WHEN TO LOAD
Load at every phase boundary, when executing `/close-phase` or `/harden`, and prior to pitching to stress-test claims against an adversarial evaluation rubric.

# INPUTS
- `DEMO.md` (Judge click-path and production demo access)
- `RUBRIC.md` (Judging criteria, weightings, and score targets)
- `docs/IMPACT.md` (Arithmetic value model and Honest Limits)
- `ARCHITECTURE.md` (Technical differentiator and system topology)

# OUTPUTS
- `docs/reviews/judge-sim-<phase>.md` with rubric grades, doubtful claim analysis, 3 Q&A questions, and ROI-ranked backlog.

# PROTOCOL
1. **Simulate 90-Second Walkthrough:**
   Walk `DEMO.md` strictly as a judge. Confirm public URL works and opens directly on the technical moat.
2. **Grade All Criteria in `RUBRIC.md`:**
   Score each from 0 to 10 with a single-sentence rationale. If any criterion is < 6/10, fail the evaluation.
3. **Isolate the Most Fragile Claim:**
   Challenge the arithmetic or assumptions in `docs/IMPACT.md`. Identify where judges will push during Q&A.
4. **Draft 3 Tough Q&A Inquiries:**
   Formulate three domain-literate questions challenging architecture, scale limits, or user friction.
5. **Prioritize Next Actions by Score/Hour:**
   Identify tasks that deliver the greatest score lift per hour invested. Log deferred items to `PLAN.md`'s Cut List.
6. **Log Report:**
   Write output to `docs/reviews/judge-sim-<phase>.md`.

# EXIT CRITERIA
- [ ] `docs/reviews/judge-sim-<phase>.md` exists and is fully populated
- [ ] No `RUBRIC.md` criterion scores below 6/10
- [ ] `bash scripts/checks/impact-gate.sh` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
