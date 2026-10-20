<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Layer 1 — registration surface tests

- [x] 1.1 Create `.opencode/test/registration-surface.test.ts`
  loading all four plugin modules (`uf-workflow`, `uf-finale`,
  `review-dispatch`, `invoke-agent`) via the existing
  smoke-test loading pattern. For every registered tool assert
  through the SDK's registration path: (a) the tool is present;
  (b) the exposed parameter schema is non-empty exactly when the
  tool declares parameters (`resolve_base_ref` declares none —
  empty passes); (c) exposed schema keys are in parity with the
  zod shape the execute path validates. Where the registry does
  not surface the schema, assert structurally that the
  declaration's `args` value is a zod raw shape — the pre-#732
  `parameters:` plain-object form must fail both paths. Follow
  the `executeTool` helper precedent in uf-finale.test.ts; the
  suite generalizes the existing FR-004 args-exposure suite
  (uf-finale.test.ts:113-143) to all four plugins — retire that
  block when the registration-surface suite lands (subsumed by
  its SDK-path parity assertions; task 1.2's falsification
  check proves the #732 form still fails; git history records
  the retirement). The structural-fallback assertion carries a
  comment naming its transition condition: move to the SDK
  surface when the registry exposes parameter schemas — the
  structural check is the interim mechanism of record.
- [x] 1.2 Falsification check for the #732 form: temporarily
  revert one tool factory to the mis-keyed `parameters:`
  plain-object declaration, run `make plugin-test`, confirm the
  registration-surface suite fails for that tool, restore the
  factory, and confirm green. Record the result for task 5.4.

## 2. Layer 2 — golden output-shape contract tests

- [x] 2.1 Enumerate the DE-002 examples into an in-test fixture
  list keyed to the semantic property — any tool-call reference
  (a "Call `<tool>` with" input block, or a call-plus-arrow
  form: five uf.finale.md sites, e.g. lines 51, 71, 131, 154,
  291) adjacent to documented output (a "Rendered shape:"
  block, an arrow-documented return shape, or documented-field
  prose); bare `→` decision-tree arrows not adjacent to a tool
  call are excluded. The enumeration must cover at minimum the
  uf.unleash.md format_unleash_exit / format_unleash_demo
  blocks, the five uf.finale.md call-plus-arrow sites, and the
  uf.triage-issue.md dispatch_review_runs contract
  (uf.triage-issue.md:263-265). Record the discovered-example
  count vs. fixture-list size (N discovered, N pinned, 0
  uncovered) in `openspec/changes/seam-verification/metrics.md`
  as the drift baseline.
- [x] 2.2 [P] Create `.opencode/test/golden-output-shape.test.ts`
  from the 2.1 fixture list: for each example execute the
  registered tool (`api.tool.<name>.execute`) with the
  documented inputs and DI'd dependencies, asserting every
  documented output field is present in the returned envelope
  (structured `metadata` where the tool carries one).
- [x] 2.3 [P] Extend `.opencode/test/dispatch-review-runs.test.ts`
  with the #735 golden contract: executing `dispatch_review_runs`
  per the uf.triage-issue.md documented inputs returns
  `status`, `runs_completed`, `runs_failed`, `runs_skipped`,
  `findings`, `proposals`, and `warnings` in the envelope.
  Reference #735 in a test comment; record the pinned
  reconciliation in #735 when the change lands.

## 3. Layer 3 — writer-reader round-trips and command-layer pins

- [x] 3.1 [P] Audit the existing write→read round-trip
  (`uf-finale.test.ts:828`, the #707 writer-reader contract)
  for unpinned fields: confirm all eight writer parameters
  (including `review_verdicts` and `learnings_stored`) survive
  the shared `sanitizeSlug` derivation and the JSON round-trip;
  add assertions only for fields the existing test misses. Do
  not create a duplicate suite in
  `.opencode/test/unleash-summary.test.ts`.
- [x] 3.2 [P] Audit the existing dispatch-artifact round-trip
  (`finalize-review-dispatch.test.ts:442`, resume consumer
  parser) for unpinned fields: confirm the resume decision
  reflects the artifact's verdict and head-SHA fields; add
  assertions only for fields the existing test misses. Do not
  create a duplicate suite in
  `.opencode/test/unleash-resume.test.ts`.
- [x] 3.3 [P] Extend `TestUnleashCommand_ToolRoutingContracts`
  in `internal/scaffold/scaffold_test.go` with pins for the
  invocations no prior change covered (the Step 10
  persistence-span pins are the verified PR #745 baseline):
  per-span invocation presence and named parameters for
  `uf_unleash_branch_gate` (Step 1), `uf_unleash_detect_resume`
  (Step 2), `scan_clarifications` and `resolve_clarification`
  (Step 4), `parse_tasks`, `mark_task_complete`, and
  `scan_conflict_markers` (Step 7), the `format_unleash_exit`
  variants other than spec-review (clarify,
  implement-worker-failed, implement-merge-conflict,
  implement-phase-checkpoint, code-review exits),
  `dispatch_review_runs` (Steps 5 and 9), `resolve_base_ref`
  (Steps 4 and 8), `consolidate_dispatch`,
  `plan_review_dispatch`, `get_progress`, `dewey_store_learning`
  (Step 9), `clear_progress`, and the forge worktree tools
  (`forge_worktree_list`, `forge_worktree_create`,
  `forge_spawn_subtask`, `forge_worktree_merge`,
  `forge_worktree_cleanup`). Then verify completeness by
  census-diff: enumerate every tool the uf.unleash command
  text invokes, direct-count each against scaffold_test.go,
  and confirm the diff is empty — host/UI tools (question,
  todowrite) excluded as non-migration seams.

## 4. Governance artifacts

- [x] 4.1 [P] Add rule DE-007 [MUST] (seam verification, draft
  text in issue #765 — its original draft number, since #758
  landed first as DE-005/DE-006 per design decision 1) to
  `.opencode/uf/packs/determinism.md`; add DE-007 to the
  severity-mapping sentence listing MUST rules as CRITICAL; bump
  the frontmatter version 1.1.0 → 1.2.0.
- [x] 4.2 [P] Update `.opencode/skills/determinism-first/SKILL.md`:
  extend the "Related Enforcement" range through DE-007 and add
  the authoring-time hook — a prose→tool migration increment's
  tasks.md MUST include a seam-verification task naming the
  three layers (registration surface, documented output shape,
  round-trips).
- [x] 4.3 [P] Add the `CHANGELOG.md` entry for the three test
  layers and pack rule DE-007.
- [x] 4.4 File a documentation issue against this repository
  per the docs gate before PR merge, applying the per-file
  dispositions: CHANGELOG.md (task 4.3), this repo's docs issue
  (duplicate-checked here), AGENTS.md (no update — Convention
  Packs already lists determinism.md), README.md (no update —
  no surface), unbound-force/website (exempt — classified
  internal/test-architecture; the pack and skill are repo-local
  governance artifacts per the determinism-codification
  exclusions). Record the filed issue number and the
  website-exemption rationale in
  `openspec/changes/seam-verification/metrics.md`. Reassess
  blog/tutorial coverage at filing (declined at proposal time —
  no new agent, CLI, or hero capability).

## 5. Verification

- [x] 5.1 Run `make lint` and `make test` (Go suite including
  scaffold drift tests; CI parity).
- [x] 5.2 Run `make plugin-test` (TypeScript suite including
  registration-surface, golden, and round-trip tests).
- [x] 5.3 Run
  `openspec validate seam-verification --type change --strict`
  and confirm the only reported issue is the known benign
  `originating_issue` warning (CLI-unrecognized key that
  /uf.finale reads; identical warning on 16 prior changes
  including merged persist-unleash-summary). No requirement
  or scenario issues may remain.
- [x] 5.4 Record DE-004 evidence in
  `openspec/changes/seam-verification/metrics.md`:
  defect-to-layer matrix (#732 → Layer 1, #735 → Layer 2,
  #707/#737 → Layer 3) with before/after test counts — noting
  the PR #745 baseline (Step 10 pins, round-trips) versus
  coverage added by this change — including the 1.2
  falsification result. #693 is excluded (resolved by the
  host-resolution fix; not a seam the layers catch).
- [x] 5.5 Verify constitution alignment: confirm each principle
  assessment in proposal.md still holds for the implemented
  state (notably V — Layer 1 asserts the model-facing schema
  surface — and VI — DE-007 present with CRITICAL mapping).
