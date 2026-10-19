# Kyron daily operating model

Kyron is most useful when it is treated as the operating layer for agent access, not as another security report.

## Who uses it

- **Platform engineering:** onboard an MCP server once, run it in monitor mode, and promote it to enforce mode after the first clean report.
- **Security/AppSec:** review only quarantined or drifted tools, inspect the canonical diff, and approve a narrow pin or block it.
- **SOC/on-call:** watch source-attributed egress and active leases during an incident; revoke the smallest capability rather than disabling the whole agent fleet.
- **Compliance/risk:** export a signed session trail showing what the agent saw, what was allowed or blocked, and which policy version made the decision.
- **Agent developers:** use structured refusals and recovery routes to fix a blocked workflow without guessing or adding repeated model calls.

## The daily loop

1. **Connect:** route a new agent through the Kyron gateway with no agent-code rewrite.
2. **Observe:** start in monitor mode and review would-block decisions, tool drift, and egress by source.
3. **Decide:** approve, quarantine, or issue a time-limited capability lease with a declared audience and call count.
4. **Prove:** use the signed audit export for incident review, customer evidence, and governance reporting.
5. **Improve:** replay recorded traces after policy edits and compare false blocks, utility, latency, and model tokens.

## The product must earn its place

Kyron should reduce work, not add a second queue. The operator home screen therefore prioritizes:

1. the smallest set of actions requiring attention now;
2. the reason a decision was made;
3. the safest next action;
4. proof that the control worked.

The overview is intentionally explanatory for first-time users, while Registry, Authority, Egress, Audit, and Policy remain focused work surfaces for repeat operators.

## Honest product boundary

Kyron can enforce what crosses its gateway and can attest local tools when sandboxed. It cannot make remote third-party internals truthful, replace identity management, or decide whether a business action is wise. Those limits belong in the product UI and sales story, not hidden in footnotes.
