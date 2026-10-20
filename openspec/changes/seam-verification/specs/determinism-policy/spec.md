<!-- scaffolded-by-uf-vdev -->
# Determinism Policy

## ADDED Requirements

### Requirement: Pack MUST rule DE-007 — seam verification

The determinism convention pack at `.opencode/uf/packs/determinism.md`
SHALL include rule **DE-007** with severity [MUST]: a prose→tool
migration increment MUST verify the seams it creates in the same
increment — registration surface, documented output shape, and
round-trips — and an increment whose seam tests are red or absent
is not complete. DE-007 MUST appear in the pack's
severity-mapping sentence listing MUST rules as CRITICAL findings,
with a change-scoped version bump to 1.2.0.

#### Scenario: Pack rule present with severity mapping

- **GIVEN** the determinism pack at `.opencode/uf/packs/determinism.md`
- **WHEN** the pack is read
- **THEN** rule DE-007 [MUST] is present and enumerates the three
  seam layers: registration surface, documented output shape, and
  round-trips
- **AND** DE-007 appears in the severity-mapping sentence that
  lists MUST rules as CRITICAL findings
- **AND** the pack frontmatter version is 1.2.0, bumped from
  1.1.0 by this change

#### Scenario: Migration increment without seam tests

- **GIVEN** a change that migrates command prose to tool
  invocations
- **WHEN** the increment's seam tests are red or absent
- **THEN** the increment is not complete per DE-007
- **AND** review MUST flag the omission as a CRITICAL finding

#### Scenario: Numbering coordination with #758

- **GIVEN** issue #758 landed first (upstream/main @ 7557cfa):
  the pack is at 1.1.0 with DE-005/DE-006 (Intent-Level
  Orchestration / Router Pattern)
- **WHEN** this change lands
- **THEN** this change's rule takes ID DE-007 — the number
  issue #765 originally drafted for it
- **AND** no renumbering of either change is required

### Requirement: Layer 1 — registration surface tests

A registration surface suite SHALL cover every registered tool in
the four plugins (`uf-workflow`, `uf-finale`, `review-dispatch`,
`invoke-agent`) through the plugin SDK's actual registration
path. For each tool the suite MUST assert the exposed parameter
schema is non-empty exactly when the tool declares parameters,
and that exposed schema keys are in parity with the zod shape the
execute path validates. The suite MUST run under `make
plugin-test`.

#### Scenario: All plugins' tools covered

- **GIVEN** the registration surface test suite
- **WHEN** the plugin modules for `uf-workflow`, `uf-finale`,
  `review-dispatch`, and `invoke-agent` are loaded
- **THEN** every registered tool in each plugin is asserted for
  schema presence and parity
- **AND** the suite generalizes the existing FR-004
  args-exposure coverage (three uf-finale tools) rather than
  duplicating it

#### Scenario: Empty-when-no-parameters semantics

- **GIVEN** a tool that declares no parameters (for example
  `resolve_base_ref`)
- **WHEN** its registration surface is asserted
- **THEN** an empty exposed schema passes the suite

#### Scenario: Pre-#732 declaration form fails

- **GIVEN** a tool factory reverted to the pre-#732 declaration
  form (`parameters:` with plain objects instead of
  `args: z.ZodRawShape`)
- **WHEN** the registration surface suite runs
- **THEN** the suite fails for that tool

### Requirement: Layer 2 — golden output-shape contract tests

Every DE-002 output-format example preserved in command prose
SHALL be pinned by a contract test that executes the registered
tool with the documented inputs and asserts the documented fields
are present in the returned envelope, including structured
`metadata` where the tool carries one. Discovery of examples MAY
use an in-test fixture list; a prose-lint requiring a golden test
per example MUST NOT be a completion gate.

#### Scenario: Documented example pinned

- **GIVEN** a DE-002 output-format example in command prose (a
  tool-call reference — a "Call `<tool>` with" input block or a
  call-plus-arrow form — adjacent to its documented output)
- **WHEN** the golden contract test executes the registered tool
  with the documented inputs
- **THEN** every documented output field is asserted present in
  the returned envelope

#### Scenario: Prose-tool divergence fails

- **GIVEN** a golden contract test for a documented example
- **WHEN** either the tool stops returning a documented field or
  the prose documents a field the tool does not return
- **THEN** the suite fails

#### Scenario: dispatch_review_runs contract pinned

- **GIVEN** the `dispatch_review_runs` golden test and the
  contract documented in `uf.triage-issue.md`
- **WHEN** the tool is executed with the documented inputs
- **THEN** the returned envelope contains `status`,
  `runs_completed`, `runs_failed`, `runs_skipped`, `findings`,
  `proposals`, and `warnings`, pinning the #735 reconciliation

### Requirement: Layer 3 — writer-reader round-trips and command-layer pins

Artifact-producing tools SHALL be tested against their consumers
end-to-end. Command-layer invocations MUST be pinned in Go tests
under `internal/scaffold/` extending
`TestUnleashCommand_ToolRoutingContracts`: beyond the verified
PR #745 Step 10 baseline, every invocation the command depends
on MUST be pinned within its consuming step's span — invocation
presence and the named parameters of the input contract. The
ceremony-marker count is a whole-command invariant.

#### Scenario: Artifact round-trip field survival

- **GIVEN** an artifact written by `write_unleash_summary`
- **WHEN** `uf_finale_pr_context` reads the artifact
- **THEN** every field the writer persisted survives the shared
  `sanitizeSlug` derivation and JSON round-trip

#### Scenario: Dispatch artifact parse round-trip

- **GIVEN** an artifact persisted by `finalize_review_dispatch`
- **WHEN** `uf_unleash_detect_resume` parses it
- **THEN** the resume decision reflects the artifact's verdict
  and head SHA fields

#### Scenario: Uncovered invocation deletion fails

- **GIVEN** the Go command-layer pins for every uf.unleash
  invocation no prior change covered — the mechanically
  verified census set: `uf_unleash_branch_gate`,
  `uf_unleash_detect_resume`, `scan_clarifications`,
  `resolve_clarification`, `parse_tasks`, `mark_task_complete`,
  `scan_conflict_markers`, the `format_unleash_exit` variants
  other than spec-review, `dispatch_review_runs`,
  `resolve_base_ref`, `consolidate_dispatch`,
  `plan_review_dispatch`, `get_progress`, `dewey_store_learning`,
  `clear_progress`, and the five forge worktree tools
- **WHEN** any pinned invocation is deleted or its named
  parameters are dropped from the command text
- **THEN** the Go test suite fails
- **AND** the whole-command ceremony-marker count
  (`strings.Count(command, "CHECKPOINT: Call") == 2`) remains
  asserted as the PR #745 baseline

### Requirement: Determinism-first skill coverage and authoring hook

`.opencode/skills/determinism-first/SKILL.md` SHALL extend its
"Related Enforcement" rule range to DE-007 and SHALL include the
authoring-time hook: a prose→tool migration increment's tasks.md
MUST include a seam-verification task naming the three layers
(registration surface, documented output shape, round-trips).
The hook MUST live in the pack and skill text; the scaffold
asset `.specify/templates/tasks-template.md` MUST NOT be
modified by this change.

#### Scenario: Skill lists DE-007

- **GIVEN** `.opencode/skills/determinism-first/SKILL.md`
- **WHEN** the Related Enforcement range is read
- **THEN** it extends through DE-007 and names the three seam
  layers for migration task authoring

### Requirement: Change record with DE-004 evidence

The change record for this change SHALL record in
`openspec/changes/seam-verification/metrics.md` the
defect-to-layer matrix mapping closed defect classes (#732,
#735, #707/#737) to the seam layer that now catches them —
noting which coverage is the verified PR #745 baseline versus
added by this change — and SHALL include before/after test
counts demonstrating the added coverage, satisfying DE-004.

#### Scenario: Matrix with counts recorded

- **GIVEN** the completed change
- **WHEN** `openspec/changes/seam-verification/metrics.md` is
  read
- **THEN** the defect-to-layer matrix is present with before and
  after test counts
