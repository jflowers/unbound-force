## ADDED Requirements

### Requirement: Finalize Every Iteration Via Consolidation

Each review-council iteration MUST be finalized by a single
`consolidate_dispatch` call with provenance (current branch,
immutable reviewed head SHA, workflow id `uf.review-council`).
The command MUST NOT hand-assemble the closed finalization
payload and MUST NOT alter tool-computed verdicts, reasons, run
counts, findings, or advisories. The finalizer's returned data
remains authoritative for the persisted `review-dispatch`
artifact and the canonical `review-verdict` v2 projection. A
mechanical payload-shape rejection MAY be corrected and retried
at most twice; persistence or content failures, or exhausted
retries, MUST fail closed to `INCONCLUSIVE` with any calculated
assessment retained as non-authoritative human context.

Previously: the command instructed agents to manually assemble
the complete version 1 payload and provenance for
`finalize_review_dispatch`, including every plan entry, run,
finding, advisory, and count, which invited transcription errors
and enum-space mismatches.

#### Scenario: Council iteration finalizes in one call
- **GIVEN** a completed council iteration with terminal runs and
  stored lesson proposals
- **WHEN** the finalize step runs
- **THEN** a single `consolidate_dispatch` call with provenance
  returns the authoritative finalization result without manual
  payload reconstruction

#### Scenario: REQUEST CHANGES loop unaffected
- **GIVEN** the finalized native verdict is REQUEST CHANGES
- **WHEN** the iteration completes
- **THEN** the fix loop proceeds exactly as before, with verdict
  semantics unchanged
