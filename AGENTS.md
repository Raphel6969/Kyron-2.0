# LOOP CONTRACT

1. ORIENT. At session start read STATE.md, PLAN.md, ARCHITECTURE.md, and the current
   docs/phases/PHASE-N.md. Read nothing else until a task demands it. Never paste a whole
   file into the response.

2. RESUME SAFELY. If STATE.md status is IN_PROGRESS, read IN FLIGHT first and finish or
   explicitly abandon that work before starting anything new.

3. ONE UNIT. Work on exactly one sub-task from PLAN.md. Write IN FLIGHT before the first
   edit. Do not begin the next sub-task until the current one is verified and committed.

4. VERIFY OR IT DIDN'T HAPPEN. A sub-task is complete only when `make verify` exits 0.
   Never declare success from reading code. The exit code is the only accepted evidence.

5. COMMIT. On verify-pass: `git commit -m "phase<N>.<M>: <what changed>"`. On phase close:
   squash-merge to main, tag `demo-ready-p<N>`. Never force-push. Never rewrite main.

6. WRITE STATE. After every sub-task, update STATE.md and clear IN FLIGHT. After every
   phase, write docs/phases/PHASE-N.md (<=250 words), refresh ARCHITECTURE.md, API.md,
   SCHEMA.md, DEMO.md.

7. NEVER BLOCK ON ME. If you need a human — key, account, paid tier, product decision —
   append to NEEDS_YOU.md: what you need, exactly how to get it, what you'll do once you
   have it, what you're doing meanwhile. Mark the sub-task BLOCKED, move to the next
   unblocked sub-task. Do not stop. Do not invent credentials.

8. ANTI-THRASH. Same error twice: stop editing, write docs/debug/<slug>.md with the error,
   a written hypothesis, and three alternative approaches. Same error four times:
   NEEDS_YOU.md, mark BLOCKED, move on.

9. CLOCK OVER SCOPE. Update hours_used at every phase close. Phase over budget by 50%:
   stop building it, ship its PLAN.md demo fallback instead, run budget-pivot.

10. MAIN IS ALWAYS DEMOABLE. Never merge a state that can't be shown to a judge.

11. NO PLACEHOLDERS. No lorem ipsum, no TODO stubs in merged code, no mock data standing in
    for a real database call, no fake auth. If it isn't real, it isn't done.

12. STAY OUT OF HUMAN LANES. Check HUMANS.md before editing. Paths claimed by a teammate are
    read-only; if you need a change there, append to NEEDS_YOU.md.

13. QUALITY IS NOT OPTIONAL. Every page/endpoint/model meets .agents/checklists/dod.md before
    being marked done. Fast-tier gates (ui-audit, ux-gate, hardening) run every commit via
    `make verify`. Slow-tier gates (ui-review, impact, a11y, perf) run at phase close via
    `make verify-full`, invoked by /close-phase and /harden.

14. HALT. Stop only when: all phases DONE and verified, or time budget exhausted, or
    NEEDS_YOU.md blocks every remaining task. On halt, write a status summary to STATE.md.
