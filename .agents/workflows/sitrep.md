# Workflow: /sitrep — 10-Line Teammate Situation Report

Generates an instantaneous, fluff-free 10-line project status report. Used when a human teammate asks "Where are we?" or during phase boundaries. No verbal meetings required.

## Step 1: Read Active State
- Extract from `STATE.md`:
  * Current Phase & Sub-Task
  * Hours Used vs Hours Budgeted
  * Active Status (`IN_PROGRESS`, `VERIFIED`, `BLOCKED`, `HALTED`)
  * `blocked_on` identifier
  * `## NEXT ACTION`
- Extract from git:
  * Last verified commit SHA and tag
- Extract from `docs/reviews/`:
  * Latest `judge-sim` overall score

## Step 2: Output 10-Line Situation Report
Print the following structured text block directly to output:

```text
==================================================
📍 HACK ENGINE SITREP — <Project Name>
==================================================
1. Phase:          Phase <N> (<Phase Title>)
2. Sub-Task:       <Sub-task ID> — <Brief Description>
3. Status:         <STATUS> (Commit: <Short SHA>)
4. Clock:          <hours_used>h used / <hours_budget>h budget (<percent>% elapsed)
5. Demo Ready:     YES (Tag: demo-ready-p<N>) | NO (in progress)
6. Live URL:       <Production Deployed URL or "Pending Phase 0">
7. Critic Score:   <Latest judge-sim score>/10 | <Latest ui-critic score>/10
8. Blockers:       <None | NEEDS_YOU #N: short summary>
9. Lane Owners:    Lead: <path> | Backend: <path> | Frontend: <path>
10. Next Action:   <Verbatim sentence from STATE.md ## NEXT ACTION>
==================================================
```
