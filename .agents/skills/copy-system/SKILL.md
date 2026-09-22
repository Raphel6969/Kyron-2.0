---
name: copy-system
description: Load this skill to establish anti-AI product voice, populate docs/COPY.md, eradicate generic buzzwords, and register all user-facing UI strings before implementing frontend views.
---

# WHEN TO LOAD
Load during Phase 1 or whenever authoring user-facing text, audit button copy, write marketing copy, or replace generic placeholders with domain-specific language.

# INPUTS
- `docs/01-problem.md` (Domain terminology)
- `docs/UX.md` (Screens and interaction flows)
- `.agents/templates/COPY.md`

# OUTPUTS
- Instantiated `docs/COPY.md` containing voice guidelines, banned word replacement table, and complete UI string registry.

# EXECUTION PROTOCOL

1. **Establish Domain Vocabulary:**
   Extract authentic industry terminology from `docs/01-problem.md`. Use precise operational phrasing (e.g. "Cold Storage Hub", "Blind Index", "Tracepoint") instead of generic labels ("Item", "Box", "Record").

2. **Purge Banned AI Clichés & Buzzwords:**
   Audit and enforce the mandatory replacement table:
   - Ban "Powered by AI" -> State exact algorithm/model (e.g. "Multi-Stage Quantized Cascade").
   - Ban "Seamless", "Revolutionary", "Supercharge" -> State concrete metrics (e.g. "Sub-10ms evaluation").
   - Ban "Click here", "Submit", "Go" -> Use imperative domain verbs (e.g. "Deploy Policy", "Run Stress Test").

3. **Register All UI Copy:**
   Populate `docs/COPY.md` with:
   - Primary and secondary CTAs.
   - Designed empty state headlines and helper text.
   - Error headlines, descriptions, and recovery button text.
   - Success toast notifications.

4. **Verify Consistency:**
   Ensure components import or quote strings directly from `docs/COPY.md` rather than ad-hoc inline strings.

# EXIT CRITERIA
- [ ] `docs/COPY.md` instantiated and populated
- [ ] Banned words table verified
- [ ] All CTAs and state messages defined
- [ ] `make verify` exits 0

# NEXT
Run `make verify`, update `STATE.md`, commit.
