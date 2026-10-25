---
tier: validated
compiled_at: 2026-10-25T16:30:53Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - command-authoring-20261015T020325-jay-flowers
  - command-authoring-20261015T020327-jay-flowers
  - command-contracts-20261015T150710-jay-flowers
  - determinism-20261015T150715-jay-flowers
  - deterministic-execution-20261015T150717-jay-flowers
  - determinism-20261016T152653-jay-flowers
  - determinism-20261016T202416-jay-flowers
  - determinism-20261017T145239-jay-flowers
  - determinism-20261017T181139-jay-flowers
  - command-prose-20261017T234704-jay-flowers
  - determinism-20261019T125101-jay-flowers
  - determinism-20261019T153505-jay-flowers
  - determinism-20261019T171724-jay-flowers
  - determinism-20261020T172445-jay-flowers
  - command-authoring-20261020T195908-jay-flowers
  - determinism-20261022T200538-jay-flowers
  - command-prose-20261022T224952-jay-flowers
  - command-prose-20261022T225021-jay-flowers
  - determinism-20261023T001732-jay-flowers
  - command-templates-20261023T155952-jay-flowers
  - command-design-20261023T162159-jay-flowers
  - determinism-20261023T204408-jay-flowers
  - determinism-20261023T204412-jay-flowers
  - command-design-20261023T211834-jay-flowers
topic: determinism
---

# Determinism

## Current State (October 2026)

### The classification rule

- The Determinism gate is an AGENTS.md behavioral rule: agents MUST classify work as
deterministic or judgment-based BEFORE writing. Deterministic work (build/test/lint
commands, transformations, verification) MUST run via the exact command or script;
violations are CRITICAL.
- Classification follows the nature of the work, never routing metadata. Twice-test:
work is deterministic when a fixed repo procedure (skill or script) performs it
end-to-end; tier and route names never decide. Documentation authorship and code fixing
are judgment work (twice-test fails) — "deterministic docs" labels force misleading
skill directives or vacuous skill_absent_reason entries (DE-008).
- DE-001 boundary: parsing, existence checks, git choreography, output template
rendering, enumeration loops are mechanical; decisions, evaluation, human interaction
stay in prose. DE-005: a judgment-free fixed tool-call sequence is itself mechanical
and MUST collapse into one intent-level tool.

### Mechanical-prose extraction and DE-001 concessions

- The determinism pack (v1.3.0) carries DE-001..DE-008 — MUST rules (DE-001, DE-003,
DE-005, DE-007, DE-008) are CRITICAL findings, SHOULD rules (DE-002, DE-004, DE-006)
guidance — governing new and modified instruction; existing prose migrates
opportunistically, never retroactively.
- Concessions are counted per procedure: docs-first changes engage DE-001 for every NEW
procedural instruction; extraction or validation as command prose is an interim guard,
not the mechanism of record, counted separately in Constitution Alignment with the
removal issue bound to eliminating the prose itself (fix-triage-issue-dispatch-docs
shipped an uncounted FR-003 concession).
- New prose in MUST-rule domains compounds debt invisibly: a new workflow tier mirroring
adjacent display prose is still new instruction, so opportunistic migration never fires
— route new prescribed output through formatter tools or record the deferral.
- Producer steps belong in the tool layer: fetch_pr_review_context fetches PR diffs via
injection-safe Bun.spawn, persists with unlink-then-O_EXCL and 0o600/0o700 permissions,
and returns diff_path/diff_bytes with structured error codes; the 2 MiB limit fails as
prompt_size_exceeded. Shell choreography as command prose is a CRITICAL DE-001/DE-005
violation with weaker safety — a raw `>` redirect truncates the target before gh
failure is detected, leaving a zero-byte file a missing-only resume check passes — and
gap-fixing bash blocks are CRITICAL even inside grandfathered commands; only policy
(path immutability, report-and-STOP) stays prose per DE-006.
- Prose bans and residual prose need explicit enforcement: copy-parity and tool tests
pass even when both copies contain forbidden prose (only negative command-text clauses
catch it), and surviving prose is fragile — verdicts need branches in every consuming
step, count qualifiers ("exactly once") need per-attempt scoping in re-run loops, and
cross-step delegated MUSTs need durable checkpoint anchors or die on session resume.

### One grammar per textual marker

- CLARIFICATION_MARKER_PATTERN (uf-workflow/index.ts:2930) is the single shared grammar,
matching all three forms — colon, bare-with-text, completely bare; AGENTS.md codifies
it. Pluralized or unterminated marker-like text is ignored by design; well-formed
markers extract as questions even in documentation, so prose avoids literal marker
syntax.
- Divergent grammars create silent bypass: a detector broader than its extractor leaves
a bare marker blocking resume forever while extraction returns zero items ("No
clarification needed"). Fail-safe detection must pair with a visible resolution path —
every blocked item must trace to a surface that displays it. Divergence can originate
in the spec delta (one marker referenced at different precisions, PR #745); spec review
unifies or scopes bare forms.
- Single-sourcing is an executable gate: a source-reading test (vi.importActual around
a node:fs mock) asserts the duplicate constant absent, the escaped grammar literal
exactly once, and the shared constant exactly once (unleash-clarify.test.ts).

### Command-layer drift tests

- Prose→tool migrations move the regression contract from instruction templates to tool
invocations, but drift tests pin only what they assert (PR #745: the unpinned
write_unleash_summary invocation could be deleted with the suite green). Pin per
consuming step: invocation presence within the step's span, the named parameters
defining the input contract, absence of the superseded tool name, and removed-ceremony
counts (strings.Count(command, "CHECKPOINT: Call") == 2).
- Scaffold mirrors are byte-identical and drift-enforced, so one command-text assertion
covers canonical and embedded copies (identical git blob hashes prove byte-identity).
Deltas governing multiple embeddings must verify every new MUST/MUST NOT in all copies
— recurring failures are carry-over contradictions and mechanisms wired into one
embedding only. Parents restating a child's gate verbatim back it with structural pin
tests on shared fragments in both canonical assets (TestSpecReviewPerFindingGateContracts).
- Prose-adding remediation re-runs every measurement it invalidates, updating citing
artifacts in the same commit (PR #753: stale "+5 lines / one sentence" records after a
+9-line hunk); prose-standard pilots require requirement-by-requirement conformance
matrices — rg scans verify token rules but miss structural ones.

### Tool-contract split

- Graduating a prose rule into a tool contract splits validation: the input schema owns
structural cross-field rules (mutual exclusion, conditional presence) failing as
generic INVALID_INPUT; execute() owns greppable failure codes with remediation text
(SKILL_REFERENCE_REQUIRED, SKILL_NOT_FOUND). References resolve to canonical form
before audit trails persist (resolved value, never raw input), and child spawns gate
behind all validation — a rejected call costs one round-trip and zero child sessions
(delegation-skill-enforcement D2/D3/D5; DE-008 fail-closed).
- Same-named inputs differ across tools: plan_review_dispatch takes changed_files as
{path, additions, deletions} objects; dispatch_review_runs takes a pre-formatted string
plus required diff_path. Templates verify each input against that tool's zod schema
(issue #763: first-call validation failures from a carried-forward description);
instructed tool calls are checked against plugin source, never session-surfaced schemas.

## History

- Oct 15: the deterministic-instruction migration diverged on consumption notation —
increment 1 (uf.finale §3) rendered the output shape inline with arrow form; increment
2 (uf.address-feedback Phase 4.2) named the consumed field in prose. Review proposed
standardizing the arrow template. The ruling fixed shape, not form: DE-002 requires
only one or two output-shape examples near decision points [SHOULD], mandating no
notation; arrow notation remains a uf.finale-family convention (9 sites), while
uf.unleash and uf.review-council use fenced-block forms.
- Oct 16-19: marker grammar convergence. A round-2 council (run 16a15ccc) found the
resume probe prefix-matching "[NEEDS CLARIFICATION" while the extractor required the
colon form; PR #745 traced the divergence to the spec delta itself. PR #753
(clarification-marker-superset) landed the fix: one CLARIFICATION_MARKER_PATTERN
extracting all three forms, the extractor broadened so fail-safety stays paired with
visibility. AGENTS.md codified the shared grammar; the single-sourcing test shipped Oct 19.
- Oct 16: producer tools landed (issue #716, commit 2531531) — fetch_pr_review_context
and capture_review_diff in review-dispatch/index.ts (6045+, registered 6484-6485),
with golden tests. By Oct 23, reviews treated them as the compliant precedent: extend
the tool (e.g. a persistent per-PR destination option under validateDiffPath's
project-root allowlist) rather than prescribe shell choreography as prose, closing the
producer gap that address-feedback-diff-path-input had left.
