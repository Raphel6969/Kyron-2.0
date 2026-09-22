---
name: ps-decode
description: Load this skill immediately when receiving a new hackathon Problem Statement (PS), starting the /ps workflow, analyzing market gaps, or extracting technical constraints from competition briefs.
---

# WHEN TO LOAD
Load at the very beginning of a hackathon, upon entering `/ps`, or whenever given a raw problem statement text that needs deconstruction into actionable technical and market requirements.

# INPUTS
- Raw Problem Statement text and prompt constraints (hours, team size, required stack, judging criteria)
- `RUBRIC.md` template

# OUTPUTS
- `docs/01-problem.md` containing structured market analysis, competitor gaps, stakeholder disparity, and constraints.

# EXECUTION PROTOCOL

1. **Deconstruct the Verbatim Text:**
   Parse the exact problem wording into:
   - **Target Ecosystem:** Exact market or industry vertical.
   - **Core Friction:** The systemic breakdown, bottleneck, or economic loss occurring today.
   - **Stakeholder Personas:** Identify all affected participants. Apply the **2-Persona Cap** — select at most 1 primary and 1 secondary persona to build for; relegate others to background context.

2. **Competitor Audit & Market Disparity:**
   - Identify 2–3 existing market solutions or incumbent software.
   - Name the exact architectural or business model blind spot they fail to address.
   - Formulate the unserved disparity: what asymmetry of information, latency, or access exists?

3. **Map to Judging Criteria:**
   Extract explicit hackathon requirements:
   - Mandatory technologies, sponsor API tracks, or hardware requirements.
   - Weightings in `RUBRIC.md` (Innovation, Impact, Craft, Technical Depth).

4. **Write Structured Problem Dossier:**
   Output to `docs/01-problem.md`:
   ```markdown
   # Problem Dossier: <PS Title>
   ## 1. Executive Summary & Market Disparity
   ## 2. Target Personas (Primary & Secondary Only)
   ## 3. Incumbent Limitations & Competitor Gap
   ## 4. Judging Rubric Alignment
   ## 5. Explicit Technical Constraints
   ```

# EXIT CRITERIA
- [ ] `docs/01-problem.md` exists and is populated
- [ ] No more than 2 active user personas declared
- [ ] Competitor gap and market disparity explicitly stated

# NEXT
Execute `solution-design` skill.
