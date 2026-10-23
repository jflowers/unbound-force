## Why

Issue #777 reports that the spec review gates give the human
no way to make quick, educated, per-finding choices. A
REQUEST CHANGES verdict currently offers only two paths:

- LOW/MEDIUM findings: one bulk consent gate ("Apply
  auto-fixes") that applies every trivial fix at once, sight
  unseen.
- Any HIGH/CRITICAL finding: a dead-stop exit
  (`format_unleash_exit` variant `spec-review`) that halts
  the pipeline until the human edits the spec manually and
  re-runs `/uf.unleash` from scratch.

The issue asks: "please present each finding with options, a
recommendation, and with reasoning as text in the session
screen for an individual finding with the question tool
below presenting those options with a recommendation, then
repeat for each finding".

Fixes #777.

## What Changes

Replace the bulk spec auto-fix consent gate and the
HIGH/CRITICAL dead-stop with a per-finding interactive
decision flow in the spec review gates (Spec Review Mode,
used by `/uf.unleash` Step 4 and `/uf.review-council`):

1. **Per-finding presentation**: For each finding in a
   REQUEST CHANGES verdict (any severity), print the finding
   details, per-option reasoning, and a recommendation as
   plain session text, then present the question tool below
   it with the same options — recommended option first,
   labeled "(Recommended)". Repeat for each finding.
2. **Per-finding options**:
   - "Apply suggested fix" — apply the fix for this finding
     now. Available for every severity: a human-directed fix
     is a consented edit, not an autonomous auto-fix.
   - "Override & continue" — waive the finding with a
     recorded justification, carried into the final report
     as an advisory.
   - "Show more context" — print the full finding context,
     then re-present the same options.
   - "Pause & exit" — stop through the existing tool-rendered
     `spec-review` exit path, making no further spec edits.
   - Bulk shortcut: when the current finding is LOW/MEDIUM,
     an additional "Apply all remaining LOW/MEDIUM fixes"
     option applies the remaining trivial fixes in one
     consented action.
3. **After the loop**: if any fixes were applied, re-run the
   review under the existing iteration rules (all included
   reviewers, single sibling-evidence acquisition,
   3-iteration cap). When every finding is fixed or
   overridden, proceed; overrides are recorded durably in
   checkpoint data and the final report.
4. **Invariants preserved**:
   - No autonomous progression past HIGH/CRITICAL: the
     pipeline advances only after an explicit per-finding
     human choice.
   - Severity definitions and the autonomous auto-fix policy
     in `.opencode/uf/packs/severity.md` are unchanged; the
     pack gains a clarifying note distinguishing
     human-directed per-finding fixes from autonomous
     auto-fixes.
   - The session-resume guard re-presents unresolved findings
     after any context compression or session resume.
   - Spec review checkpoint data (iteration counter) is
     preserved.

Scope: spec review gates only (`/uf.unleash` Step 4 and the
Spec Review Mode section of `/uf.review-council` it cites).
The Step 6 code review fix loop and the GitHub review posting
gate are unchanged.

## Capabilities

### New Capabilities
- None — this change reshapes an existing gate.

### Modified Capabilities
- `uf.review-council`: Spec Review Mode's MANDATORY GATE
  becomes a per-finding decision protocol — finding text
  above, question tool below, recommendation-first options.
- `uf.unleash`: Step 4 routes every REQUEST CHANGES verdict
  through the per-finding protocol; the HIGH/CRITICAL
  dead-stop branch is removed (the tool-rendered
  `spec-review` exit remains as the "Pause & exit" choice).
- `severity` convention pack: clarifying note on
  human-directed per-finding fixes vs. autonomous auto-fix.
### Removed Capabilities

- None

**Supersedes**: FR-001..FR-007 replace the prior spec
auto-fix consent gate requirements still carried by active
(unarchived) changes: the "Spec auto-fix consent gate"
requirement in
`openspec/changes/unleash-direct-review-dispatch/specs/unleash/spec.md`,
FR-003 "Spec File Edit Gate in uf.review-council" in
`openspec/changes/mandatory-gate-hardening/specs/mandatory-gates.md`,
and the consent-gate carriers in
`openspec/changes/unleash-deterministic-tools`: the
"Judgment boundary" requirement
(specs/unleash/spec.md:292-302 -- uf.unleash.md MUST
retain the spec auto-fix consent gate via the question
tool), the "Consent gate unchanged" scenario (:304-307 --
three council options), the guardrails clause (:338 --
guardrails MUST name the spec auto-fix consent gate), the
consent-gate-exception scenario (:354), and proposal.md:93.
Those deltas describe the retired bulk gate; archive-time
merges and readers of the active-change ledger resolve to
this change's per-finding protocol. When those superseded
changes archive, their consent-gate clauses drop or adjust
so the per-finding protocol (FR-001..FR-007) remains
canonical.

## Impact

**Files affected** (15 total — 3 canonical commands/pack, 2
canonical template/plugin strings, 5 mirrors, 3 test files, 1
user-facing docs page, CHANGELOG):
- `.opencode/commands/uf.review-council.md`
- `.opencode/commands/uf.unleash.md`
- `.opencode/uf/packs/severity.md`
- `.opencode/lib/unleash-templates.ts` (spec-review exit
  reason string and doc comments — see design D11)
- `.opencode/plugins/uf-workflow/index.ts`
  (`format_unleash_exit` findings-param description string)
- `internal/scaffold/assets/opencode/commands/uf.review-council.md`
- `internal/scaffold/assets/opencode/commands/uf.unleash.md`
- `internal/scaffold/assets/opencode/uf/packs/severity.md`
- `internal/scaffold/assets/opencode/lib/unleash-templates.ts`
- `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- `internal/scaffold/scaffold_test.go` (structural assertions
  extended; spec-review exit anchor updated)
- `internal/scaffold/command_contract_test.go` (review-council
  gate clause rewritten for the new protocol)
- `.opencode/test/unleash-formatters.test.ts` (spec-review
  reason-string assertions)
- `docs/heroes.md` (The Divisor capability list — stale
  hybrid-policy bullet replaced during spec review)
- `CHANGELOG.md`

**Behavioral impact**: Spec review becomes more interactive:
every REQUEST CHANGES finding gets an individual decision.
LOW/MEDIUM findings retain a fast bulk path. HIGH/CRITICAL
findings no longer dead-stop the pipeline; they require an
explicit per-finding human choice (apply, override, more
context, or pause) before the pipeline proceeds.

**Gatekeeping analysis**: This change does not weaken any
quality or governance gate. Severity definitions, the
LOW/MEDIUM-only autonomous auto-fix policy, and the
3-iteration review cap are unchanged. The HIGH/CRITICAL
blocking rule is strengthened in purpose: the pipeline still
cannot proceed past a HIGH/CRITICAL finding without explicit
human consent — the terminal stop becomes an interactive
consent flow (strictly more human oversight per finding).

**Go changes are test-only**: production Go code is
untouched. This is a command/pack documentation change plus
scaffold mirror sync, two string-level template/plugin
updates (design D11), and test assertion extensions.

**Documentation Impact** (AGENTS.md doc-gate targets,
explicit outcome per target):
- `CHANGELOG.md` — updated (Unreleased entry references
  #777)
- `AGENTS.md` — assessed, no update required (does not
  document spec review gate mechanics)
- `README.md` — assessed, no update required (no gate
  description present)
- `docs/` — `docs/heroes.md` capability bullet updated
  during spec review (stale hybrid-policy phrasing); no
  other docs page describes the gate (grep-verified)
- Repo documentation issue (AGENTS.md docs gate) —
  maintainer exemption recorded 2026-10-22 during
  /uf.unleash spec review (override justification: "This
  change is not substantial enough"); no repo docs issue
  filed per maintainer decision
- Content pipeline — the per-finding consent gate is a
  distinctive human-in-the-loop pattern; blog opportunity
  acknowledged; maintainer exemption recorded 2026-10-22
  during /uf.unleash spec review — no blog issue or
  constitution Cross-Repo website issue filed; revisit at
  merge
- Interaction semantics — the five option labels,
  override-justification requirement, bulk-shortcut
  severity restriction, 3-iteration cap, and
  session-resume behavior are documented normatively in
  the two command files and summarized in the CHANGELOG
  entry

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command files (instruction
documents) and a convention pack, not artifact schemas or
inter-hero communication formats.

### II. Composability First

**Assessment**: N/A

No hero dependencies are introduced or modified.
`/uf.unleash` and `/uf.review-council` remain independently
usable; the per-finding protocol is internal to the spec
review workflow they already share.

### III. Observable Quality

**Assessment**: PASS

Each per-finding decision produces an observable
question-tool invocation in the session log, and overrides
are recorded durably (checkpoint data, final-report
advisories) with their justifications — auditable evidence
of human approval for every spec edit and every waived
finding.

### IV. Testability

**Assessment**: PASS

The command/pack changes are verified by the existing
scaffold drift tests (embedded assets match canonical
sources) and extended structural assertions in
`internal/scaffold/scaffold_test.go` covering the
per-finding protocol text.

### V. Security by Default

**Assessment**: PASS

Spec artifacts are modified only after an explicit per-finding
human confirmation — least privilege is strengthened by
replacing bulk-fix consent with per-finding consent while
retaining the bulk path as an explicit opt-in for trivial
severities.

### VI. Deterministic Execution

**Assessment**: PASS

The per-finding flow is judgment and human interaction, which
belongs in instruction prose per this principle. Mechanical
concerns remain tool-rendered: exits stay produced by
`format_unleash_exit`, checkpoints by the `checkpoint` tool,
and findings arrive from `consolidate_dispatch`.
