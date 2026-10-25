---
tier: validated
compiled_at: 2026-10-25T16:44:45Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - spec-review-20260622T190439-jay-flowers
  - spec-review-20261007T185858-jay-flowers
  - review-accuracy-20261014T181315-jay-flowers
  - review-advisories-20261014T184915-jay-flowers
  - review-process-20261015T020321-jay-flowers
  - spec-review-20261015T182736-jay-flowers
  - spec-review-defense-in-depth-20261016T132702-jay-flowers
  - review-process-20261017T232054-jay-flowers
  - review-process-20261017T234714-jay-flowers
  - spec-review-20261019T022457-jay-flowers
  - spec-review-20261019T111102-jay-flowers
  - spec-review-20261019T122046-jay-flowers
  - spec-security-review-20261019T125050-jay-flowers
  - spec-review-20261019T164201-jay-flowers
  - review-technique-20261019T171719-jay-flowers
  - spec-review-20261019T223124-jay-flowers
  - spec-review-20261020T124800-jay-flowers
  - spec-review-20261022T180742-jay-flowers
  - spec-review-security-20261022T205110-jay-flowers
  - spec-review-20261022T205113-jay-flowers
  - spec-review-gates-20261022T225031-jay-flowers
  - opsx-spec-review-per-finding-gate-20261022T225039-jay-flowers
topic: spec-review
---

# Spec Review

## Current State (October 2026)

### The Per-Finding Consent Gate

Spec review findings resolve through a per-finding human consent gate
(issue #777, commit eeb7d09, 2026-10-23). Every finding presents four
choices: Apply suggested fix / Override & continue / Show more context /
Pause & exit. A bulk shortcut consents to all remaining LOW/MEDIUM
fixes as ONE consented action — the usability valve without which a
15-finding review is 15 sequential questions. HIGH/CRITICAL findings
are never fixed autonomously: each needs explicit consent or a
recorded override. Session resume re-presents unresolved findings;
the iteration cap is 3 per review mode. First full-pipeline run
(2026-10-22): 15 findings — one HIGH overridden, two fixed, bulk at four.

### Iteration and Override Semantics

Overrides carry forward by same file and same root cause: a waived
subject re-reported later or in another mode (the pilot's spec-review
HIGH override re-surfaced as code-review C1/C4) resolves against the
recorded override without re-asking — define the rule before the
first override, or fresh reviewers re-report waived findings each
iteration and fix+override cycles exhaust the cap. Two iterations
per mode sufficed (spec: 15 findings -> 6 advisories; code: 8 -> 9);
record overrides in checkpoint data to survive compressions,
delegate bulk fixes in one prompt, and accept post-approval LOW
advisories as-recorded — post-approval edits invalidate approval;
remaining advisories concentrate in test-pin hardening (defer, not
block). A changed gate condition stales every surface naming the
old one: grep retired phrases repo-wide, fix live citations, pin
new fragments in drift tests.

### Delta Content Requirements

The delta is the durable record: input contracts and failure modes
MUST live in the spec delta even when design.md and tasks.md document
them — design and tasks are derivations; reviews and archive readers
diff the delta (fix-review-dispatch-recovery's fully tested
negative-input handling lived only in design/tasks). Negative-input
scenarios follow the input contract: every new tool AND every
parameter added to a pre-existing tool needs malformed / nonexistent
/ expired-state scenarios; filesystem-resolving identifiers over
ephemeral temp directories especially. PR #776's RD-FR-027 added
correlation_id to pre-existing dispatch_status and
consolidate_dispatch without the mirrored rejection scenario despite
Zod UUID validation and a test — extending args is an input-contract
change exactly like adding a tool; coverage follows the contract,
not tool novelty. Deltas must enumerate all exit paths (success,
failure, abort) and define matching rules concretely.

### Artifact-Claim Verification

Claims inside spec artifacts require re-verification:
- Payload field names against the implementation: a docs-accuracy
  change must not carry forward the text it corrects —
  fix-triage-issue-dispatch-docs nearly re-institutionalized a
  nonexistent 'reference' field its own design D2 refuted.
- "Previously:" baselines: diff a MODIFIED requirement's restated
  MUSTs against the prior change's delta (Dewey indexes them) and
  verify every file path, call-site count, and section name against
  the working tree (glob respects .gitignore, so use directory reads
  under .opencode/test/ and .specify/scripts/).
- Count claims: recount per-handler against the diff before filing
  (heterogeneity causes off-by-one); for removals, grep zero remaining.
- Reconciliation notes are not self-executing: grep every occurrence
  of a disputed value (ts-plugin-coverage-gate left two conflicting
  attributions of 94.58% in one proposal); corrected enumerations
  leave stale count adjectives elsewhere — grep or delete them.
- Terminology: verify the real pattern first (satisfies
  PluginModule, not "default function returning server()") and grep
  all artifacts in one pass; declared retrofits sweep every restating
  task, widened docs task, and constitution-verification summary.
- Learnings are the correction record, not the correction: capturing
  one neither amends an artifact nor discharges a finding — cross-
  check accepted learnings against in-flight artifacts and amend
  refuted claims before merge (PR #733); pre-PR, verify each learning
  naming a defect in this change's artifacts was fixed or explicitly
  waived. Defer-to-future holds only when out of scope (#729).

### Common Finding Classes

Spec review catches different defect classes than code review; the
most-missed delta-spec elements are error-path scenarios and
algorithm-level specificity — in one review (2026-06-22) 3 of 5
Divisor agents independently flagged missing temp-file cleanup on
user abort, 2 of 5 underspecified PR-template matching. Other
classes: preservation-contract false positives (carried values are
LOW advisories; the finding is untracked follow-up debt); defense-
in-depth layer ambiguity (which layer rejects which input class);
unanchored security MUSTs; untestable escape hatches (a bypass
parameter needs a testable invalid-use example). Mirror-pair byte
identity is provable from unified-diff blob hashes — a mismatch
proves drift despite green drift tests.

## History

- June 22: 3/5 agents flagged temp-file cleanup on abort — first
  most-missed-elements evidence (error paths, algorithm specificity).
- October 7: plugin terminology drift (satisfies PluginModule)
  caught after reaching five locations.
- October 14-17: count discipline; as-recorded advisories; the
  learning-vs-artifact gap (#729, #733); defense-in-depth; preservation contracts.
- October 19-20: field-name verification; retrofit sweeps; unanchored
  validation MUSTs; delta-carries-input-contracts (#751, PR #776).
- October 22: two-anchor review; escape-hatch testability; gate-change
  sweep; first full-pipeline run validated bulk shortcut + carry-forward.
- Policy: pre-Oct-22 auto-fix LOW/MEDIUM + HIGH/CRITICAL dead-stop
  (REMOVED) -> per-finding consent gate (issue #777, eeb7d09, Oct 23).
