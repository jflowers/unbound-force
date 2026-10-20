<!-- scaffolded-by-uf-vdev -->
## Context

PR #674's prose→tool migration made commands smaller and more
deterministic (epic #659), and `determinism-codification`
(PR #723) codified the practice as DE-001..DE-004. But every
closed seam defect since then was found in live use, not CI:

- #732: factories declared `parameters:` (plain objects); the
  `@opencode-ai/plugin` `tool()` helper expects
  `args: z.ZodRawShape` and silently ignores anything else, so
  the model saw empty parameter schemas. Smoke tests assert tool
  names only (`.opencode/test/uf-workflow.test.ts:133`,
  `.opencode/test/uf-finale.test.ts:80`) — green throughout.
  The FR-004 suite added later (`uf-finale.test.ts:113-143`)
  asserts args keys for three uf-finale tools; the other three
  plugins and the SDK-exposed registration surface remain
  unasserted.
- #735: `uf.triage-issue.md` documented `findings`/`proposals`/
  `warnings` arrays the tool did not return at filing time. The
  tool now returns them (`dispatchReviewRuns` success return in
  `.opencode/plugins/review-dispatch/index.ts`, carried as
  structured `metadata` beside the `output` summary string) and
  the prose at `uf.triage-issue.md:263-265` matches — but nothing
  pins that agreement.
- #707/#737: the `write_unleash_summary` invocation in
  uf.unleash Step 10 went unpinned at filing time. PR #745 has
  since landed the pins: `TestUnleashCommand_ToolRoutingContracts`
  (internal/scaffold/scaffold_test.go:159) now pins the Step 10
  `stepTenPersistence` span ("Then persist the summary" →
  "## Guardrails") — invocation presence, all eight named
  parameters, `persist_unleash_summary` absence within the span —
  plus the whole-command ceremony-marker count, and the
  writer-reader round-trips exist (`uf-finale.test.ts:828`,
  `finalize-review-dispatch.test.ts:442`; learning
  `command-contract-tests-20261017T033626`).
  `persist_unleash_summary` survives only as a
  full-implementation compatibility alias in the uf-workflow
  plugin, so its historical 3-arg shape is pre-#745 context,
  not a current reversion target. The invocations that remain
  unpinned — verified by mechanically counting every tool the
  command text invokes against `scaffold_test.go` and
  `command_contract_test.go` (which covers only
  uf.review-council.md, uf.triage-issue.md,
  uf.address-feedback.md, and speckit.testreview.md):
  `uf_unleash_branch_gate`, `uf_unleash_detect_resume`,
  `scan_clarifications`, `resolve_clarification`, `parse_tasks`,
  `mark_task_complete`, `scan_conflict_markers`, the
  `format_unleash_exit` variants other than spec-review,
  `dispatch_review_runs`, `resolve_base_ref`,
  `consolidate_dispatch`, `plan_review_dispatch`, `get_progress`,
  `dewey_store_learning`, `clear_progress`, and the five forge
  worktree tools (`forge_worktree_list`, `forge_worktree_create`,
  `forge_spawn_subtask`, `forge_worktree_merge`,
  `forge_worktree_cleanup`) — are what this change pins; task
  3.3 re-runs the census so the list stays mechanically
  verified. Host/UI tools (`question`, `todowrite`) are not
  plugin migration seams and stay out of Layer 3 scope.

Unit tests verify tool interiors via DI'd execute paths; the
review council reasons statically; outside the PR #745 pins and
round-trips, nothing executes the seams. This design adds the
three execution layers — completing the coverage PR #745 began
— and codifies the obligation as DE-007.

Constitution alignment (proposal): Principles III/IV (observable,
testable seam quality) and VI (deterministic execution) drive the
design; Principle II (composability) constrains it to existing
seams with no new abstractions; Principle V motivates Layer 1
(the model-facing schema surface is a security-adjacent
exposure).

## Goals / Non-Goals

### Goals

- Every seam class that produced #732, #735, or #707/#737 has a
  deterministic red-test path.
- Each layer carries a falsification property proven against the
  historic defect form (not just asserted in prose).
- DE-007 lands in the pack and skill with severity mapping and
  version bump, pinned by the spec delta.
- All new tests run under existing standard commands
  (`make plugin-test`, `make test`); no new harness.
- DE-004 evidence: defect-to-layer matrix with before/after test
  counts in `openspec/changes/seam-verification/metrics.md`.

### Non-Goals

- #685 (no-console lint), #687 (base-ref staleness guard), #712
  (prose shell extraction — DE-001 completion). Adjacent defect
  classes, out of scope.
- A prose-lint requiring a golden test per DE-002 example —
  optional future enhancement, explicitly not a gate here.
- Retroactive migration of existing prose beyond the examples
  pinned in this change; the pack's opportunistic-migration rule
  governs the rest.
- The learning-recipe review phase.
- Any scaffold-template change (`.specify/templates/`).

## Decisions

1. **DE-007 numbering (coordination with #758).** Issue #765
   drafted the rule as "DE-007" assuming #758 (DE-005/DE-006)
   landed first. At authoring time the pack was at 1.0.0 with
   DE-001..DE-004 and #758 was OPEN; #758 has since landed
   (upstream/main @ 7557cfa, `router-pattern-codification`):
   the pack is at 1.1.0 with DE-005 [MUST] Intent-Level
   Orchestration and DE-006 [SHOULD] judgment-at-boundary. Per
   the issue's own coordination clause, this change takes
   **DE-007** — the issue's original draft number — with a
   1.1.0 → 1.2.0 version bump; no renumbering of either change
   is required.

2. **Layer 1 as a new `registration-surface.test.ts` asserting
   the SDK-exposed surface, with structural fallback.** The
   suite generalizes the existing FR-004 args-exposure suite
   (`uf-finale.test.ts:113-143`, three uf-finale tools) to all
   four plugins — absorbing its assertion intent rather than
   duplicating it — and loads each plugin module to assert, per
   registered tool, on what the SDK actually exposes. Where the
   SDK registry does not surface the parameter schema, the test
   asserts structurally that the tool declaration's `args` value
   is a zod raw shape (z.ZodType values) — the mis-keyed
   `parameters:` form fails both paths. The test enumerates
   registered tools dynamically from each module so added tools
   are auto-covered; the existing name-list smoke tests remain
   the removal guard. Proof bar is a falsification check:
   locally revert one factory to the pre-#732 form, observe the
   failure, restore. This follows the #732 post-mortem's
   mechanism note (assert what the SDK exposes, never the
   factory's self-description).

3. **Layer 2 discovery: in-test fixture list keyed to the
   semantic example property.** An example is any tool-call
   reference — a "Call `<tool>` with" input block, or a
   call-plus-arrow form (a tool invocation followed by `→`
   documenting its return shape — five sites in uf.finale.md,
   e.g. lines 51, 71, 131, 154, 291) — adjacent to documented
   output: a "Rendered shape:" block, an arrow-documented return
   shape, or documented-field prose (such as
   `uf.triage-issue.md:263-265`). Bare `→` arrows in
   decision-tree prose (gaze-fix, opsx-apply, speckit.*), not
   adjacent to a tool call, are NOT tool output contracts and
   are excluded — the property is "tool call plus documented
   output", not a literal phrase or arrow character. A
   prose-lint enforcing coverage is deferred (issue: optional,
   not a gate).

4. **#735 pinned as the reconciled contract.** At filing the
   prose documented arrays the tool lacked; today the tool
   returns them in the envelope's structured `metadata` and the
   prose matches. The golden test asserts the union of
   documented fields (`status`, three counters, `findings`,
   `proposals`, `warnings`) in the returned envelope, so future
   divergence on either side fails. No behavioral change is
   required; the resolution is recorded in #735. Golden tests
   assert on `metadata` where the tool carries structured
   output beside the `output` summary string.

5. **Golden tests execute through the plugin tool registry**
   (`api.tool.<name>.execute`), not lib functions directly.
   Lib-level formatter coverage already exists
   (unleash-formatters.test.ts) but does not pin the
   prose↔registration↔execute seam; the seam is the target.

6. **Layer 3 round-trips: verified baseline plus targeted
   extension.** Both pairs already exist:
   `write_unleash_summary` → `uf_finale_pr_context`
   (`uf-finale.test.ts:828`, the #707 writer-reader contract,
   exercising field survival through the shared `sanitizeSlug`
   derivation and JSON round-trip) and
   `finalize_review_dispatch` artifact → resume parser
   (`finalize-review-dispatch.test.ts:442`). This change audits
   each pair for unpinned fields (all eight writer parameters;
   verdict and head-SHA fields) and adds only missing
   assertions, following the existing per-tool vitest layout and
   DI patterns (executeTool helper precedent in
   uf-finale.test.ts) — no duplicate suites.

7. **Command-layer pins extend
   `TestUnleashCommand_ToolRoutingContracts` to the uncovered
   invocations.** The Step 10 persistence-span pins (invocation
   presence, named parameters, superseded-name absence) and the
   whole-command ceremony-marker count
   (`strings.Count(command, "CHECKPOINT: Call") == 2`) already
   landed via PR #745 and are the verified baseline. This change
   adds the missing pins: per-span invocation presence and named
   parameters for `uf_unleash_branch_gate` (Step 1),
   `uf_unleash_detect_resume` (Step 2), `scan_clarifications`
   and `resolve_clarification` (Step 4), `parse_tasks`,
   `mark_task_complete`, and `scan_conflict_markers` (Step 7),
   and the `format_unleash_exit` variants other than spec-review
   (clarify, implement-worker-failed, implement-merge-conflict,
   implement-phase-checkpoint, and the code-review exits).
   Per-span assertions are preferred over command-wide greps
   (learning `command-contract-tests-20261017T033626`, which
   also records the Step 10 pin baseline). The byte-identical
   scaffold mirror makes one command-text assertion cover
   canonical and embedded copies.

8. **Authoring hook in pack/skill text, not the scaffold
   template.** DE-007's clause and the skill's guidance require
   a migration increment's tasks.md to include a
   seam-verification task naming the three layers. Editing
   `.specify/templates/tasks-template.md` is rejected: it is a
   scaffold starter asset, and this change's constraint is
   no-scaffold-mirror changes. The pack and skill are repo-local
   governance artifacts (exclusions at
   internal/scaffold/scaffold_test.go:2212-2214 and
   internal/schemas/packvalidator_test.go:188-196), so the hook
   lives there.

## Risks / Trade-offs

- **SDK surface variance**: if the registry exposes no schema
  property, the structural fallback couples the test to factory
  declaration shape. Mitigated by the falsification check: the
  pre-#732 form must fail. Transition condition (named in the
  fallback assertion's comment): when the SDK registry exposes
  parameter schemas, the assertion moves there without contract
  change — the structural check is the interim mechanism of
  record.
- **Fixture-list drift**: new DE-002 examples in future prose
  are not auto-detected. Accepted — the issue scopes prose-lint
  as an optional enhancement; DE-007's authoring hook requires
  new examples to ship with golden tests, so the gap only
  applies to prose written outside a migration increment. The
  drift baseline is quantified at implementation time: task 2.1
  records the discovered-example count vs. fixture-list size
  (N discovered, N pinned, 0 uncovered) in metrics.md.
- **Tool-count churn**: dynamic enumeration covers additions;
  removals rely on the existing name-list smoke tests. Combined,
  both directions are guarded.
- **#758 landed concurrently (materialized, resolved)**: both
  changes target `.opencode/uf/packs/determinism.md` and the
  skill. #758 landed first (7557cfa); the coordination clause
  applied mechanically — this change's rule is DE-007 with the
  pack already at 1.1.0 from #758 — and this branch
  fast-forwarded onto the landed base, so conflict resolution
  was a base update, not a text merge.
- **Test-only change carries no runtime behavior**: the payoff
  is regression protection, delivered as failing suites on the
  historic defect forms — quantified as DE-004 evidence
  (before/after counts) rather than runtime improvement.
