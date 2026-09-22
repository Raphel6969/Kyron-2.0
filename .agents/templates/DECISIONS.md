# DECISIONS — Architecture Decision Records (ADRs)

> **Append-only log.** Every non-trivial structural, architectural, or technical trade-off
> must be recorded here before implementation. Never delete or overwrite an earlier record.
> Reversals must be logged as a new ADR that explicitly references the superseded entry.

---

## ADR-<000>: <Title of Architectural Decision>
- **Date:** <YYYY-MM-DD>
- **Phase:** <phase_number_and_name>
- **Status:** PROPOSED | ACCEPTED | SUPERSEDED by ADR-<NNN>

### Context
<What problem or constraint triggered this decision? Include technical and time trade-offs.>

### Decision
<What specific path, technology, library, or pattern was chosen?>

### Alternatives Considered & Why Rejected
1. **<Alternative A>:** <Specific reason why this was rejected (e.g. latency, complexity, fragility)>
2. **<Alternative B>:** <Specific reason why this was rejected>

### Consequences & Trade-offs
- **Positive:** <What capability or speed is gained>
- **Negative:** <What debt, extra hop, or constraint is accepted>
