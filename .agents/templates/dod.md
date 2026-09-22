# Definition of Done (DoD)

> **Quality Floor Standard:** This file converts "is this finished?" from subjective judgment into lookup.
> Quoted verbatim inside `ui-build`, `feature-build`, and `test-verify`.

---

## A page is done when it has
- [ ] all four states: designed empty / skeleton loading / error / success — no spinners
- [ ] real seeded content, no lorem, no placeholder avatars
- [ ] a motion primitive from TOKENS.css, zero hover-only interaction
- [ ] keyboard reachable, visible focus ring, contrast >= 4.5:1, correct at 375/768/1440
- [ ] page title, meta description, OG image
- [ ] one Playwright assertion on a user-visible outcome

## An endpoint is done when it has
- [ ] entry in API.md matching reality; authn+authz enforced server-side
- [ ] input validated at the boundary; 4xx not 500 on bad input
- [ ] rate limit or a written reason there isn't one
- [ ] structured log line with request id, no secrets logged
- [ ] one happy-path unit test, one failure-path unit test

## A data model is done when it has
- [ ] a migration, not a hand-edited table; indexes on every WHERE/JOIN column
- [ ] a seed contribution of 30+ realistic rows; entry in SCHEMA.md

## A phase is done when
- [ ] make verify-full exits 0; main deployed; DEMO.md judge path works on production
- [ ] docs/phases/PHASE-N.md written, ADRs appended
- [ ] judge-sim score recorded in docs/reviews/, no criterion below 6/10
