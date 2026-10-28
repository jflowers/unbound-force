## Context

PR #792 upgraded the per-finding spec review decision gates in
`uf.review-council.md` (and its `uf.unleash.md` embedding) to a
presentation contract for the **question tool**: decision
content printed as plain session text above the question
(visibility directive with a same-details/same-options
guarantee), per-option reasoning, an advisory recommendation
with justification, and the recommended option first and
labeled "(Recommended)". The reference implementation is the
MANDATORY GATE at `uf.review-council.md` ~L1171-1255.

The three sibling interactive commands — `uf.triage-issue`,
`uf.address-feedback`, `uf.review-pr` — still present their 22
question-tool invocations in the older bare-options shape.
Issue #850 asks for the upgrade and poses one open design
question: extract the contract into a shared convention-pack
rule that commands reference, or duplicate the prose per gate
as #792 did across two commands. This design resolves that
question.

Constitution alignment is assessed in `proposal.md` (III and IV
PASS via the pin tests; I, II, V, VI N/A). Two principles shape
the design: Principle VI assigns human interaction — judgment —
to instruction prose, and Principle III/IV back normative
claims with automated, reproducible evidence.

## Goals / Non-Goals

### Goals

- Apply the PR #792 presentation contract at all 22
  question-tool invocations: 8 in `uf.triage-issue`, 6 in
  `uf.address-feedback`, 8 in `uf.review-pr`
- Print composed but unseen content (address-feedback 4.5
  replies, triage-issue 4.3 comment) as session text above the
  posting question
- Preserve every gate's safety semantics: option sets, blocking
  rules, session-resume guards, MANDATORY GATE markers
- Preserve open-ended follow-ups unchanged
- Enforce the contract with structural pin tests so it cannot
  drift silently (closes the #792 advisory gap)
- Keep scaffold assets byte-identical to canonical commands

### Non-Goals

- Adding, removing, or merging gates; changing any gate's
  option set (beyond ordering and the "(Recommended)" label)
- Modifying dispatch protocols, artifacts, schemas, or tool
  payloads
- Upgrading `uf.review-council` code-mode gates (Step 7c
  ~L773, Step 7f ~L969) or `uf.finale` (13 question-tool
  references) — tracked as adjacent gaps in #850
- Changing the question tool itself or OpenCode configuration

## Decisions

### D1: Duplicate the contract prose per gate, pinned by tests

Each of the 22 gates restates the contract in full at the
gate. A shared convention-pack rule that commands merely
reference is rejected.

**Rationale**:

1. **Precedent**. PR #792 shipped duplicated prose across
   `uf.review-council.md` and `uf.unleash.md`. The repo
   learning `command-prose-20261022T225021-jay-flowers`
   records why: restating the full option set and gate
   invariants verbatim is the correct pattern — citation-only
   parents risk contradicting the child's gate (see the
   security-gate-delegation learning, 2026-10-14).
2. **Load-time guarantees**. A pack reference is only as good
   as the pack being loaded. Of the three commands, only
   `uf.review-pr` conditionally loads `default.md` (Step 3.9)
   and `uf.address-feedback` loads packs in Phase 2.1 —
   `uf.triage-issue` loads no general convention pack at all.
   The gates are human-consent checkpoints for GitHub
   mutations; their normative text must not depend on an
   optional context load.
3. **The pack would not remove duplication**. Each gate still
   needs gate-specific prose (option sets, recommendation
   basis, decision content). A pack rule adds indirection
   without eliminating the per-gate restatement, and
   gatekeeping rules forbid weakening MUST classifications
   when moving text between assets.
4. **Constitution fit**. Principle VI assigns human
   interaction to instruction prose. The contract governs
   judgment presentation, so it belongs in the command assets;
   drift prevention belongs in an executable, tested pin test.

The trade-off — 22 restatements can drift — is handled by D4's
pin tests, the same mechanism the shipped precedent uses for
the two-command case.

### D2: Canonical contract block

Every upgraded gate carries the same normative block, adapted
from `uf.review-council.md` L1189-1202:

```markdown
1. Print the decision content as plain session text **above**
   the question tool (visibility directive — the printed text
   and the question tool MUST present the
   same details and options):
   - <gate-specific decision details with surrounding context>
   - Per-option reasoning: what each choice does and
     when it fits
   - A recommendation with its justification (advisory only —
     the human decides)
   - If the assessment data does not ground any option, the
     gate MUST say so, present the trade-off, and still ask
     the full option set (fail-closed, per FR-006/FR-012)
2. Present the **question tool** below the printed text with
   the same options, the recommended option FIRST and
   labeled "(Recommended)".
```

Gates that already print required content above the question
(triage-issue Phase 4.1 summary, address-feedback 3.1 item
display and Phase 4 execution summary, review-pr Step 7 failure
context, 7.5 commit preview, 8c verdict context) keep that
content as the printed decision content and add the missing
contract elements; the visibility directive's
same-details/same-options clause binds the existing display to
the question options.

The per-gate recommendation basis (advisory, grounded in the
command's own assessment data — FR-006):

| Gate | Recommendation basis |
|---|---|
| triage Phase 4 | "Proceed" on decisive panel majority with actions following from classification; otherwise "Skip" citing dissent/uncertainty |
| triage 4.2 label gates | Apply when classification is decisive; skip when the category was contested |
| triage 4.2 duplicate | Apply, citing the two-persona duplicate agreement, restating the close-semantics warning |
| triage 4.3 re-run | "No -- skip comment" when a prior triage comment exists, unless the new round materially changes the assessment |
| triage 4.3 comment | "Approve -- post as-is" when the comment meets its tone-tier requirements |
| triage 4.4 child gates | Create for well-grounded split proposals (2+ personas); skip weak ones; skip on close duplicate match |
| feedback 3.2 | ACCEPT assessment → "Accept"; AUTHOR-DECIDES → advisory suggestion from evidence and reviewer authority, clearly labeled non-binding |
| feedback 3.4 | "Confirm" when all decisions are recorded and consistent |
| feedback Phase 4 | "Proceed" when the execution plan matches the triage decisions; otherwise "Review plan again" |
| feedback 4.4 rebase | "Rebase" when a clean replay preserves both remote and local work; otherwise "Abort" |
| feedback 4.5 | "Yes -- post" after the printed replies verify against the decision table |
| feedback 4.6 | "Yes -- resolve" for accepted threads with posted replies; note REJECT/ASK threads stay open |
| review-pr Step 3 | "Wait" (conservative — CI results feed pre-flight and the verdict) unless remaining checks are informational |
| review-pr 3.5 | "Review all files" (completeness) unless the diff is dominated by generated or lock files |
| review-pr 7 | "Yes" for a trivial, well-understood pre-existing failure; "No" when the guardrail calls it non-trivial |
| review-pr 7.5 | "Commit -- apply fix" when the staged diff matches the failing check and the message follows the template |
| review-pr 8 | "Yes" when the terminal review is final and verdict-aligned |
| review-pr 8a same | "No -- skip posting" (duplicate same-verdict review adds noise) |
| review-pr 8a different | "Yes -- override" when the new verdict reflects the current PR state; keep otherwise |
| review-pr 8c | The verdict-aligned posting option when the printed review matches the terminal summary |

At gates whose basis is unconditional, the literal option array
leads with the recommended option; at conditional gates the
array enumerates the option set, and the recommended-first
directive governs presentation order and "(Recommended)"
labeling at runtime (stated by a clarifying sentence at the
gates where the static array order most diverges from the
runtime recommendation; FR-004's Present directive (recommended
option FIRST, labeled "(Recommended)") governs every gate
regardless of the sentence's presence).

When assessment data genuinely favors no option, the
recommendation says so and presents the trade-off (FR-006
fail-closed presentation; the question is never skipped).

### D3: Existing gate elements are preserved, not rewritten

MANDATORY GATE markers, session-resume guards, CRITICAL RULES,
verdict-mapping tables, and option sets are carried forward
unchanged. `uf.review-pr` Step 8c keeps its existing
**VISIBILITY DIRECTIVE** label and gains the missing
per-option reasoning, recommendation, and "(Recommended)"
ordering. Step 7.5 keeps its commit preview and per-option
bullets, which become part of the printed text. Open-ended
follow-ups (feedback 3.2 Modify/Reject/Ask, review-pr 3.5
focus files, triage 4.3 Modify) are untouched.

### D4: Pin test design

A new test function in `internal/scaffold/scaffold_test.go`
(following `TestSpecReviewPerFindingGateContracts`), reading
the three embedded command assets via `assetContent` (the
existing drift test already guarantees the embedded copies are
byte-identical to the canonical files, so pinning embedded
assets pins both):

1. **Shared fragments, all three assets**: each asset contains
   the wrap-safe contract fragments (each kept on a single
   line, all under ~50 chars):
   - `the question tool MUST present the`
   - `same details and options`
   - `Per-option reasoning: what each choice does and`
   - `when it fits`
   - `advisory only`
   - `the human decides`
   - `recommended option FIRST`
   - `labeled "(Recommended)"`
2. **Gate inventories**: every option label from the FR-007,
   FR-008, and FR-009 inventories is present in its command
   asset.
3. **Counts, tripwires, and negatives**: all 8 shared
   fragments counted per asset (8/6/8, one per gate); the
   backtick-bracket option-array opener counted (8/6/9 —
   review-pr Step 8c carries two verdict-specific option sets;
   the backtick prefix excludes embedded JSON examples); the
   legacy bare-options phrasing asserted absent both raw and
   whitespace-normalized (so a line-wrapped occurrence fails);
   and per-label occurrence totals pinned for every inventory
   label (quoted-label anchor prevents prefix collisions).
   Each gate also carries the fail-closed clause. The clause
   itself is not fragment-pinned; its deletion relies on
   review. A new or removed gate, array, label occurrence, or
   fragment fails the test until the pin is deliberately
   updated.
   `Per-option reasoning:` is used only inside gate contract
   blocks.

Mirrors are updated by copying the canonical files to
`internal/scaffold/assets/opencode/commands/`; the existing
drift detection test enforces byte parity.

### D5: Documentation impact

The change alters user-facing workflow behavior of three slash
commands (presentation at decision gates). Project governance
imposes two documentation gates on user-facing changes, both
filed before the implementing PR merges (tasks.md carries the
tasks): (a) a website issue in `unbound-force/website`
(unbound-force/website#339, filed; required by the
constitution's Cross-Repo Documentation principle), and (b) a
repo-local docs-tracking issue in this repo (unbound-force#853,
filed; required by AGENTS.md's Documentation gate).
Dual-filing precedent: #840 + unbound-force/website#335,
#844 + unbound-force/website#337, #838 +
unbound-force/website#332. The previously cited #789 (docs
tracking for #792) and #525 are current-repo
(unbound-force/unbound-force) docs-tracking issues
demonstrating the repo-local gate, not website-repo
precedents.
The change also requires a repo-root `CHANGELOG.md` entry
under `## Unreleased` (AGENTS.md documentation gate), in the
established `- <change-name>: <summary>` format with
`(Spec: ...)` and `(Docs: ...)` reference lines; tasks.md
carries the task.

## Risks / Trade-offs

### R1: Prose volume across 22 gates

Each gate grows by roughly 10-15 lines. Accepted: the contract
is the price of informed consent at mutation gates, and the
per-gate block is small relative to the commands (~1000 lines
each). The pin test guarantees the duplication stays
consistent rather than proliferating variants.

### R2: Recommendation quality is judgment

A bad recommendation could steer the human. Mitigations: the
recommendation is always labeled advisory/non-binding
(FR-003), must be grounded in the command's own assessment
data (FR-006), and FR-012 requires fail-closed presentation
when no option is genuinely favored. The human retains every
pre-existing escape option.

### R3: Count-based pins are sensitive to new gates

The fragment counts (8/6/8), the option-array tripwire
(8/6/9), and the per-label occurrence totals all fail when a
future change adds or removes a gate, array, or label
occurrence. Accepted — that failure is the mechanism working:
new gates must adopt the contract and update the pins
deliberately (same maintenance contract as the shipped
per-finding pin test).

### R4: Purely instructional change

No Go logic, schemas, or tool payloads change; regression risk
is confined to markdown prose and one new test. The scaffold
drift test plus the new pin test provide automated verification
under `make check`.
