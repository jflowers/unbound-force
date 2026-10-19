# unleash Clarification Marker Superset Grammar

Parent: the clarification-marker grammar is single-sourced as a
superset shared by the extractor tools and the resumability probe, so
every marker that blocks clarify has a visible resolution path
(issue #743, round-2 finding 5).

## ADDED Requirements

### Requirement: Single-sourced clarification marker grammar

The clarification marker grammar MUST be defined once as a shared
constant in the uf-workflow plugin and MUST be consumed by every
operation that detects, extracts, counts, or resolves markers:
`scan_clarifications`, `resolve_clarification`, and the
`uf_unleash_detect_resume` clarify probe. No operation MAY define an
independent marker grammar (a separate prefix or pattern constant).

The grammar MUST accept the superset of marker forms:

- colon form `[NEEDS CLARIFICATION: <question>]`, capturing the
  question;
- bare-with-text form `[NEEDS CLARIFICATION <text>]`, treated as an
  unscoped question;
- bare form `[NEEDS CLARIFICATION]`.

For every extracted marker the question MUST be non-empty: when the
captured question or trailing text is empty or whitespace-only, the
question MUST fall back to the marker's raw text (trimmed), so
`resolve_clarification` round-trips the exact scanned question and
the `## Clarifications` log and clarify exit stay self-describing.
The question text MUST NOT contain `]` (inherited grammar
constraint). The non-empty guarantee is bounded by
`resolve_clarification`'s inherited `question` schema maximum
(4096 characters): an extracted question beyond the bound
surfaces in scan output — with its line number and surrounding
context, so the marker can be located — but has no
tool-mediated resolution path and requires manual removal from
spec.md (documented known failure mode, inherited from the
colon form).

#### Scenario: One grammar constant, shared consumers

- **GIVEN** the uf-workflow plugin source after this change
- **WHEN** a reader searches for marker-matching constants
- **THEN** exactly one grammar definition exists, consumed by the clarification tools and the resumability probe; `CLARIFICATION_MARKER_PREFIX` is gone

#### Scenario: Single-sourcing pinned by source scan

- **GIVEN** the vitest suite includes a source-scan case reading the uf-workflow plugin source
- **WHEN** `make plugin-test` runs
- **THEN** the scan asserts `CLARIFICATION_MARKER_PREFIX` is absent and exactly one marker-grammar pattern exists, failing on any reintroduced second grammar

#### Scenario: Colon form captured

- **GIVEN** spec.md contains `[NEEDS CLARIFICATION: What timeout?]`
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** it returns the question `What timeout?` with its surrounding context lines and line number

#### Scenario: Bare forms extracted as unscoped questions

- **GIVEN** spec.md contains `[NEEDS CLARIFICATION]` and `[NEEDS CLARIFICATION retry count]`
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** both markers are extracted: the bare form's question is its raw marker text and the bare-with-text form's question is `retry count`

#### Scenario: Empty question falls back to raw marker text

- **GIVEN** spec.md contains `[NEEDS CLARIFICATION:   ]`
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** the returned question is non-empty (the raw marker text), so `resolve_clarification` accepts it for resolution

#### Scenario: Resolution matches by extracted question

- **GIVEN** spec.md contains a bare marker whose scanned question is the raw marker text
- **WHEN** `resolve_clarification` runs with that question and an answer
- **THEN** the marker is located by comparing extracted questions (same helper as the scan), removed, the answer inserted inline, and the `Q: -> A:` entry appended to `## Clarifications`

#### Scenario: Superset pinned by tests

- **GIVEN** the vitest suite for the clarification tools and the resume probe
- **WHEN** `make plugin-test` and `make test` run
- **THEN** the three grammar forms, the empty-question fallback, the probe's complete-marker matching, and the byte-identical scaffold mirrors all pass

#### Scenario: Mention occurrence extracts as a question

- **GIVEN** spec.md contains well-formed marker text as a mention — quoted syntax, a fenced example, or scenario prose such as `[NEEDS CLARIFICATION retry count]` inside a code fence
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** the mention extracts as a question like any grammar-matched marker (design D4: the grammar has no code-fence or backtick exclusion), surfacing a visible resolution path instead of silently blocking clarify

#### Scenario: Fallback-form log mention does not self-terminate

- **GIVEN** a fallback-form marker (completely bare or colon-empty) is resolved
- **WHEN** the appended Clarifications log entry quotes the raw marker text
- **THEN** the log entry itself grammar-matches and re-surfaces in scan (remaining stays 1); tool-mediated resolution of the self-generated mention appends a fresh mention each cycle and cannot terminate — the terminating path is manual removal of the literal marker syntax from the log entry (design D4)

#### Scenario: Over-long question surfaces with no tool resolution

- **GIVEN** spec.md contains a grammar-matched marker whose extracted question exceeds `resolve_clarification`'s inherited 4096-character schema bound
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** the question surfaces in scan output with its line number and surrounding context so the marker can be located, and resolution requires manual removal from spec.md (inherited known failure mode; the schema bound rejects the input before MARKER_NOT_FOUND is reached)

## MODIFIED Requirements

### Requirement: Clarification mechanics tools

`/uf.unleash` Step 1 (Speckit) MUST use `scan_clarifications` to
extract `[NEEDS CLARIFICATION]` markers in the superset forms
defined by the Single-sourced clarification marker grammar
requirement, with surrounding context from spec.md, and
`resolve_clarification` to apply a resolution: remove the marker,
insert the answer inline, and append the
`- Q: ... -> A: ... (Dewey-resolved from ...)` entry to
`## Clarifications`, creating the section when absent.
`resolve_clarification` MUST locate the target marker by comparing
its extracted question — computed by the same helper the scan uses —
against the question exactly as scanned, for every grammar form. The
command prose MUST retain query formulation, result evaluation, and
answer-sufficiency judgment; for bare-marker and empty-colon
questions (whose question text is the raw marker or its
empty-colon fallback) query formulation MUST use the
surrounding context rather than the raw marker text. Silent
auto-resolution without human confirmation MUST be preserved, and
unanswerable questions MUST flow into the rendered exit template.

Previously: the requirement required extraction of
`[NEEDS CLARIFICATION]` markers without scoping the grammar; the
shipped extractor accepted only the colon form while the
resumability probe matched any prefix text, so bare markers blocked
resume detection with no resolution path (issue #743 finding 5).

#### Scenario: Marker scan

- **GIVEN** spec.md contains two `[NEEDS CLARIFICATION: ...]` markers
- **WHEN** `scan_clarifications` runs against the feature directory
- **THEN** it returns each question with its surrounding context lines

#### Scenario: Bare marker resolution round-trip

- **GIVEN** `scan_clarifications` returns a bare-marker question whose text is the raw marker
- **WHEN** `resolve_clarification` runs with that question and an answer
- **THEN** the bare marker is removed from spec.md, the answer is inserted inline, and the `Q: -> A:` entry is appended to `## Clarifications` under that question text

#### Scenario: Resolution applied

- **GIVEN** a resolved question with its answer and Dewey source
- **WHEN** `resolve_clarification` runs
- **THEN** the marker is removed from spec.md, the answer is inserted inline, and the `Q: -> A:` entry is appended to `## Clarifications`

#### Scenario: Dewey unavailable

- **GIVEN** Dewey tools are not available in the session
- **WHEN** Step 1 processes markers
- **THEN** all questions are collected as unanswerable and the pipeline exits through the rendered clarify pause template

### Requirement: Resumability detection tool

`/uf.unleash` Step 2 MUST determine completed steps by calling
`uf_unleash_detect_resume`, which probes filesystem artifacts
(spec.md clarification markers matched by the shared superset
grammar, `## Clarifications` section or plan.md presence, plan.md
existence, tasks.md existence, unchecked `- [ ]` task checkboxes),
derives spec-review and code-review completion from the dispatch
artifacts `consolidate_dispatch` persists under
`.uf/artifacts/dispatch/` — a flat repo-global store shared across
branches — and reconciles that with checkpoint state read from the
same state store `get_progress` uses. A review step is done only
when the most recent artifact for its mode that belongs to the
current branch records an approving verdict (APPROVE or APPROVE WITH
ADVISORIES), under per-mode freshness rules: the code-review step
requires the artifact's recorded head SHA to equal the current HEAD;
the spec-review step accepts an artifact whose recorded head SHA is
an ancestor of or equal to the current HEAD when the spec artifacts
have no uncommitted modifications (checkbox edits in tasks.md
excluded), because implementation commits advance HEAD without
changing spec artifacts and the spec review MUST NOT re-run on every
mid-implementation resume. Artifacts from other branches, and
artifacts whose recorded head SHA has diverged from the current
HEAD, MUST NOT mark the step done. Checkpoint state claiming review
completion without a matching approving dispatch artifact MUST NOT
report the review step done. The clarify probe MUST derive marker
presence from the same shared grammar as the clarification tools —
per-line complete-marker matching — and MUST NOT use a bare
substring prefix match: clarify is incomplete while any
grammar-matched marker remains in spec.md, while marker-like text
outside the grammar (pluralized or unterminated forms) MUST NOT hold
the clarify step open because no resolution path exists for it. The
tool MUST return `{step_statuses, resume_from, all_complete}`.
Artifact state MUST be authoritative even when no checkpoint state
exists, so a first `/uf.unleash` run over artifacts created by
`/opsx-propose` or the Speckit commands skips the completed steps,
and compressed-context summaries are never treated as resumability
evidence. OpenSpec mode MUST report clarify, plan, and tasks as
done.

Previously: the requirement probed "spec.md clarification markers"
unqualified; the implementation used a bare substring prefix match
that also tripped on pluralized and unterminated marker-like text
with no resolution path.

#### Scenario: First run over propose artifacts

- **GIVEN** branch `opsx/some-change` has proposal, design, specs, and tasks artifacts but no `uf.unleash` checkpoint state
- **WHEN** `uf_unleash_detect_resume` runs with tier `openspec`
- **THEN** it reports clarify, plan, and tasks as done and `resume_from` names the spec review step

#### Scenario: All steps complete

- **GIVEN** every task checkbox in tasks.md is `[x]` and the most recent branch-matched dispatch artifacts for both review modes record approving verdicts meeting their per-mode freshness rules
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** it returns `all_complete: true` so the pipeline resumes at the retrospective step

#### Scenario: Cleared checkpoint state

- **GIVEN** progress state was cleared after a pipeline whose task checkboxes are all `[x]`, but the most recent branch-matched dispatch artifacts for the review steps record non-approving verdicts, or the code-review artifact records a head SHA other than the current HEAD
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** implementation is reported done from artifact state and the incomplete review steps are re-derived from dispatch artifacts and rerun rather than falsely reported complete

#### Scenario: Foreign-branch or stale artifacts ignored

- **GIVEN** the most recent `specs`-mode artifact records an approving verdict but for a different branch, and the most recent `code`-mode artifact for the current branch records a head SHA other than the current HEAD
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** both review steps are reported incomplete and the reviews rerun, even though approving artifacts exist in the store

#### Scenario: Bare marker holds clarify open

- **GIVEN** spec.md (Speckit tier) contains `[NEEDS CLARIFICATION]`, a `## Clarifications` section exists, and plan.md exists
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** clarify is reported incomplete because the shared grammar matches the marker, and a subsequent scan offers it for resolution

#### Scenario: Non-marker text no longer blocks clarify

- **GIVEN** spec.md (Speckit tier) contains the pluralized text `[NEEDS CLARIFICATIONS]` and an unterminated `[NEEDS CLARIFICATION` string, no grammar-matched marker, and a `## Clarifications` section exists
- **WHEN** `uf_unleash_detect_resume` runs
- **THEN** clarify is reported complete via the Clarifications section, because the probe matches complete markers only
