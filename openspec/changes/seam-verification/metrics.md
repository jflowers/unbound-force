<!-- scaffolded-by-uf-vdev -->

# seam-verification — metrics and evidence

DE-004 evidence artifact for the `seam-verification` change. Sections
are appended per task; this file is the change's running record.
This section set (fixture list, drift baseline, discovery procedure,
exclusion record) is task 2.1. Task 4.4 records the filed docs-issue
number and website-exemption rationale; task 5.4 records the
defect-to-layer matrix with before/after test counts.

## Layer 2 fixture list (task 2.1)

Input to task 2.2 (`golden-output-shape.test.ts`) and task 2.3
(the #735 `dispatch_review_runs` golden contract). Every entry is a
DE-002 example: a tool-call reference in `.opencode/commands/*.md`
adjacent to documented output.

### Inclusion rule (the semantic property, design decision 3)

A site qualifies when BOTH hold:

1. **Tool-call reference**: a "Call `<tool>` with" input block, a
   fenced tool-name input block, a call-plus-arrow form
   (`Call `<tool>` → `{...}`), or a prose call instruction naming a
   registered plugin tool.
2. **Adjacent documented output** naming the tool's returned fields
   or shape concretely, in one of three forms:
   - a "Rendered shape:" block;
   - an arrow-documented return shape (or a prose return-shape
     literal, "The tool returns `{...}`");
   - documented-field prose — an enumeration of return fields tied
     to the return act ("The tool returns `status`, ...", "the
     returned state: `completed_steps` ...", "returns the ref name,
     its resolved SHA, and a source label").

Excluded: bare `→` decision-tree arrows, template-heading maps,
file-existence maps, git-choreography sequences (arrow = "then"),
tool calls documented with inputs only, behavioral prose
("auto-checkpoints on success"), and value-branching decision logic
("If the verdict is APPROVE ...") that does not enumerate a return.

### Fixture inventory — uf.unleash.md (18 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 1 | get_progress | 55 | field prose | returned state: `completed_steps`, `current_step` (TodoWrite re-init) |
| 2 | uf_unleash_branch_gate | 81 | field prose | `status: "ok"`; payload `workflow_tier`, `feature_dir`; failure codes ON_MAIN / NO_TASKS / NO_SPEC / UNRECOGNIZED_BRANCH |
| 3 | uf_unleash_detect_resume | 104 | return shape | `{step_statuses, resume_from, all_complete, unchecked_count, checkpoint_claims}` |
| 4 | scan_clarifications | 169 | return shape | `{questions: [{question, context, line}], count}` |
| 5 | format_unleash_exit `clarify` | 235 | rendered shape | "paused at: clarify" — Reason, Q1 + Context, What to do next, Then resume |
| 6 | format_unleash_exit `spec-review` | 423 | rendered shape | "paused at: spec review" — Reason, Findings, tier-specific recovery, Then resume |
| 7 | plan_review_dispatch (Step 4) | 353 | field prose | plan `status` `ready`, `workflow_result` null, `errors` empty |
| 8 | parse_tasks | 458 | return shape | `{phases: [{phase, tasks: [{id, description, parallel, done}]}], total_tasks, done_count, all_done}` |
| 9 | mark_task_complete | 515 | field prose | `already_complete: true` no-op-success semantics on resume |
| 10 | format_unleash_exit `implement-worker-failed` | 558 | rendered shape | "paused at: implement (Phase N)" — Failed task, Error |
| 11 | scan_conflict_markers | 598 | return shape | `{conflicts: [{path, markers: [{line, marker}]}], clean, warnings}` |
| 12 | format_unleash_exit `implement-merge-conflict` | 610 | rendered shape | "paused at: implement (Phase N)" — Conflicting files |
| 13 | format_unleash_exit `implement-phase-checkpoint` | 666 | rendered shape | — Failed command, Output |
| 14 | format_unleash_exit `code-review-preflight` | 733 | rendered shape | — branch-caused failures as CRITICAL findings |
| 15 | plan_review_dispatch (Step 6) | 799 | field prose | plan `status`, `workflow_result`, `errors` |
| 16 | format_unleash_exit `code-review-no-success` | 862 | rendered shape | — No-success reasons |
| 17 | format_unleash_exit `code-review-iterations-exhausted` | 892 | rendered shape | — Persistent findings; optional Circular dependencies |
| 18 | format_unleash_demo | 1010 | rendered shape | What Was Built / How to Verify / Test Results / Next Steps (two prescribed options) |

### Fixture inventory — uf.finale.md (9 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 19 | get_progress | 42 | field prose | `completed_steps`, `data` |
| 20 | uf_finale_startup | 51 | call-plus-arrow | `{branch, branchType, isMain, hasChanges, secretCandidates, unpushedCommits}` |
| 21 | uf_finale_stage | 71 | call-plus-arrow | `{fileCount, files}` |
| 22 | uf_finale_commit_context | 82 | call-plus-arrow | `{diffStat, recentLog, normalizedModel}` |
| 23 | uf_finale_push_state | 131 | call-plus-arrow | `{upstreamExists, diverged, aheadBy, behindBy}` |
| 24 | uf_finale_pr_context | 154 | call-plus-arrow | `{existingPr, isFork, forkParent, templateSections, commitLog, diffStat, originatingIssue, unleashSummary}` |
| 25 | uf_finale_create_pr | 204 | call-plus-arrow | `{number, url}` (inputs `{title, body, targetRepo?}`) |
| 26 | uf_finale_ci_poll | 212 | call-plus-arrow | `{status, failedChecks, mergeable, workflowsConfigured}` (input `{prNumber}`) |
| 27 | uf_finale_return_to_main | 291 | call-plus-arrow | `{success}` |

Note: design decision 3 cited "five sites ... e.g. lines 51, 71,
131, 154, 291". The census finds **eight** call-plus-arrow forms in
uf.finale.md — the five named plus commit_context (82),
create_pr (204), and ci_poll (212), whose arrows sit on the same
"Call `<tool>` with ... → `{...}`" sites. All eight qualify; the
design's five were a floor ("e.g."), not an exhaustive list.

### Fixture inventory — uf.review-council.md (5 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 28 | get_progress | 51 | field prose | returned state: `completed_steps`, `current_step` |
| 29 | resolve_base_ref | 126 | field prose | returns the ref name, its resolved SHA, and a source label |
| 30 | plan_review_dispatch | 231 | field prose | plan version, status, change profile, limits, entries, omissions, errors, limit state; proceed on `status` ready / `workflow_result` null / `errors` empty |
| 31 | dispatch_review_runs | 256 | field prose | `status`, `runs_completed`, `runs_failed`, `runs_skipped`, `findings`, `proposals`, `warnings` |
| 32 | consolidate_dispatch | 361 | field prose | `status: "success"`, `artifact_path`, `review_verdict` (canonical v2 projection), `calculated_assessment.authoritative`, `verdict_reason`, run counts, findings, advisories |

### Fixture inventory — uf.review-pr.md (3 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 33 | plan_review_dispatch | 353 | field prose | plan version, status, change profile, limits, entries, omissions, errors, limit state; proceed fields |
| 34 | dispatch_review_runs | 372 | field prose | `status`, `runs_completed`, `runs_failed`, `runs_skipped`, `findings`, `proposals`, `warnings` |
| 35 | finalize_review_dispatch | 442 | field prose | persists the `review-dispatch` artifact; returns canonical `review-verdict` v2 data |

### Fixture inventory — uf.triage-issue.md (3 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 36 | plan_review_dispatch | 190 | field prose + fixed vectors | plan version, status, issue change profile, limits, entries, omissions, errors, limit state; planner-owned vectors (`text_bytes: 19`, SHA256 `60a7be43...`, `lightweight`; the 4096/4097/32768/32769 tier table); proceed fields |
| 37 | dispatch_review_runs | 238 | field prose | `status`, `runs_completed`, `runs_failed`, `runs_skipped`, `findings`, `proposals`, `warnings` — the #735 contract (task 2.3 pins this site; the defect background) |
| 38 | consolidate_dispatch | 780 | field prose | `status: "success"`, `artifact_path`, `review_verdict`, `calculated_assessment.authoritative`, `verdict_reason`, run counts, findings, advisories |

### Fixture inventory — uf.address-feedback.md (5 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 39 | get_progress | 71 | field prose | returned progress state: completed steps, first incomplete step |
| 40 | plan_review_dispatch | 314 | field prose | plan version, status, change profile, limits, entries, omissions, errors, limit state; proceed fields |
| 41 | dispatch_review_runs | 338 | field prose | `status`, `runs_completed`, `runs_failed`, `runs_skipped`, `findings`, `proposals`, `warnings` |
| 42 | consolidate_dispatch | 473 | field prose | same response-field set as the review-council site (#32) |
| 43 | normalize_model_name | 733 | field prose | the returned `normalized` value; error / `unknown-model` fallback |

### Fixture inventory — speckit.testreview.md (4 sites)

| # | Tool | Line | Output form | Documented output |
|---|------|-----:|-------------|-------------------|
| 44 | acquire_sibling_evidence | 134 | field prose | complete structured result: sibling, immutable commit, path, SHA256, source mode, rejection, error, unavailability provenance; the returned delimited `prompt` |
| 45 | plan_review_dispatch | 154 | field prose | plan version, status, matrix mode, change profile, limits, entries, omissions, errors, limit state; `matrix_mode` `code`; proceed fields |
| 46 | prepare_lesson_learning | 268 | field prose | `ready` result; the returned `information`, generated `tag`, `reference` category |
| 47 | finalize_review_dispatch | 278 | field prose | persists the additive `review-dispatch` artifact; returns mapped canonical `review-verdict` v2 data |

### Registered-tool attribution (for task 2.2 execution paths)

- `uf-workflow` (21 sites): format_unleash_exit ×8,
  format_unleash_demo, get_progress ×4, uf_unleash_branch_gate,
  uf_unleash_detect_resume, scan_clarifications, parse_tasks,
  mark_task_complete, scan_conflict_markers, resolve_base_ref,
  normalize_model_name
- `uf-finale` (8 sites): all eight uf_finale_* tools
- `review-dispatch` (18 sites): plan_review_dispatch ×7,
  dispatch_review_runs ×4, consolidate_dispatch ×3,
  finalize_review_dispatch ×2, acquire_sibling_evidence,
  prepare_lesson_learning

## Drift baseline (task 2.1)

**47 discovered, 47 pinned, 0 uncovered.** The four
`dispatch_review_runs` sites are pinned in
`dispatch-review-runs.test.ts` — one golden per documented
input variant (triage, code, feedback); the
`golden-output-shape.test.ts` suite covers the other 43
through the plugin registry, with all 8
`format_unleash_exit` variants additionally held to
tool==lib equivalence with the renderer goldens.

Per command file: uf.unleash.md 18, uf.finale.md 9,
uf.review-council.md 5, uf.address-feedback.md 5,
speckit.testreview.md 4, uf.review-pr.md 3, uf.triage-issue.md 3.
All other 25 command files in `.opencode/commands/` contain zero
qualifying examples.

Census-diff property: the discovery procedure below was re-run as a
second pass after the fixture list was assembled; the second pass
found **zero** qualifying examples absent from the list above.

## Discovery procedure (for task 5.4 census re-verification)

Run from the repository root. The registered-tool name list in step
5 comes from the four plugins' registration maps
(`.opencode/plugins/{uf-workflow,uf-finale,review-dispatch,invoke-agent}/index.ts`,
the `tool: { ... }` object keys).

```bash
# Step 1 — rendered-shape blocks (single-line and wrapped forms;
# "Rendered shape" at uf.unleash.md:902 wraps a parenthetical
# before its colon, so match on 'Rendered' alone):
rg -n 'Rendered' .opencode/commands/*.md

# Step 2 — every arrow line; classify each as call-adjacent
# (documenting a tool return) vs decision-tree / heading-map /
# file-map / choreography-sequence (arrow = "then"):
rg -n '→' .opencode/commands/*.md
# Qualifying arrows: only the eight uf.finale.md call-plus-arrow
# sites (lines 51, 71, 82-83, 131, 154, 204-205, 212, 291). All
# other 105 arrow lines are excluded per the classification above.

# Step 3 — tool-call references in all verb forms and casings:
rg -n 'Call `[a-z_.-]+` with' .opencode/commands/*.md
rg -ni 'call(ing)? `[a-z_]+`' .opencode/commands/*.md
rg -n 'Call the `[a-z_]+` tool' .opencode/commands/*.md

# Step 4 — documented return shapes and return-field prose:
rg -n 'The tool returns' .opencode/commands/*.md
rg -n 'returns? `\{' .opencode/commands/*.md
rg -n 'Display the returned JSON plan' .opencode/commands/*.md
rg -n 'Proceed only when (plan )?`?status`? is `ready`' \
  .opencode/commands/*.md
rg -n 'returned' .opencode/commands/*.md

# Step 5 — registered-tool mention census (every mention of every
# registered tool name; classify each against the fixture list and
# the exclusion record):
for t in format_unleash_exit format_unleash_demo \
         persist_unleash_summary write_unleash_summary \
         uf_unleash_branch_gate uf_unleash_detect_resume \
         scan_clarifications resolve_clarification parse_tasks \
         mark_task_complete scan_conflict_markers \
         uf_delegate_command resolve_base_ref checkpoint \
         get_progress clear_progress normalize_model_name \
         uf_finale_startup uf_finale_stage uf_finale_commit_context \
         uf_finale_push_state uf_finale_pr_context \
         uf_finale_create_pr uf_finale_ci_poll \
         uf_finale_return_to_main build_review_prompts \
         plan_review_dispatch finalize_review_dispatch \
         acquire_sibling_evidence prepare_lesson_learning \
         dispatch_agent_run submit_review_findings \
         submit_lesson_proposal consolidate_dispatch \
         dispatch_review_runs dispatch_status \
         fetch_pr_review_context invoke_agent; do
  rg -n "\`$t\`" .opencode/commands/*.md
done

# Step 6 — fenced tool-name input blocks (headers of the
# "Call `<tool>` with:" code fences):
rg -n '^\s*(format_unleash_exit|format_unleash_demo|'\
'write_unleash_summary|scan_clarifications|resolve_clarification|'\
'parse_tasks|mark_task_complete|scan_conflict_markers|'\
'uf_delegate_command|uf_unleash_branch_gate|'\
'uf_unleash_detect_resume|uf_finale_[a-z_]+|plan_review_dispatch|'\
'dispatch_review_runs|consolidate_dispatch|'\
'finalize_review_dispatch|acquire_sibling_evidence|'\
'prepare_lesson_learning|invoke_agent|normalize_model_name|'\
'resolve_base_ref)\s*$' .opencode/commands/*.md
```

Every hit is then classified against the inclusion rule: a site
qualifies only when the tool-call reference and the documented
output are adjacent (same step, block, or call-site paragraph).
A census-diff is empty when every qualifying hit maps to a fixture
entry above and every non-qualifying hit maps to an exclusion class
below.

## Exclusion record (census-diff comparability)

Tool-call references examined and excluded, with reasons — recorded
so the task 5.4 re-verification resolves them identically:

- **Inputs-only call sites** (no documented output at the site):
  `resolve_clarification` (uf.unleash.md:207);
  `uf_delegate_command` ×4 fenced blocks (uf.unleash.md:272, 298,
  504, 837 — "verifies the artifact / auto-checkpoints / carries
  the STOP message" is behavior prose, not return fields);
  `write_unleash_summary` (uf.unleash.md:1051 — documented inputs
  only; the writer-reader contract is Layer 3 scope, task 3.1);
  `dewey_store_learning` (uf.unleash.md:951);
  `submit_review_findings` / `submit_lesson_proposal`
  (speckit.testreview.md:225-228, uf.triage-issue.md:293,
  uf.review-council.md:323, uf.review-pr.md:432,
  uf.address-feedback.md:391-393 — child-call inputs);
  `invoke_agent` (speckit.testreview.md:190 — "the returned
  per-run timeout" is plan-derived, not a return-field enumeration);
  `checkpoint` and `clear_progress` (all sites);
  `dispatch_agent_run` (uf.address-feedback.md:982 — policy
  mention, not a call site).
- **get_progress mentions without field enumeration**: the
  session-resume guards at uf.review-council.md:12, 21, 38;
  uf.address-feedback.md:18, 39, 816; uf.finale.md:35 (the
  field-documented get_progress sites at uf.finale.md:42,
  uf.unleash.md:55, uf.review-council.md:51, and
  uf.address-feedback.md:71 are the pinned ones).
- **Cite-only dispatch sites in uf.unleash.md**: `dispatch_review_runs`
  (360, 806) and `consolidate_dispatch` (368, 815) document inputs
  only; the verdict-processing prose is value-branching decision
  logic, and the command cites uf.review-council.md's protocol
  sections instead of embedding the return contract. The contract
  is pinned once per file at its normative sites (#31, #32, #34,
  #37, #38, #41, #42).
- **resolve_base_ref in uf.unleash.md** (329, 776): "announce the
  resolved base ref and its SHA" is an action instruction, not a
  returns-clause enumeration; the return contract is pinned at its
  normative site (uf.review-council.md:126, #29).
- **Repeat call mentions without adjacent docs**: `uf_finale_stage`
  (uf.finale.md:76), `uf_finale_ci_poll` (uf.finale.md:254, 260,
  280), `mark_task_complete` (uf.unleash.md:640, 650),
  `format_unleash_exit` / `format_unleash_demo`
  (uf.unleash.md:1110-1111 guardrail references),
  `uf_unleash_detect_resume` (uf.unleash.md:38 result-authority
  mention; the call site at 104 is pinned).
- **Downstream consumption prose** for already-pinned fields: the
  `proposals`-array sections (uf.triage-issue.md:306-308,
  uf.review-council.md:321-323, uf.review-pr.md:429-432,
  uf.address-feedback.md:441-443) restate the
  `dispatch_review_runs` `proposals` field pinned at the call
  sites (#31, #34, #37, #41).
- **Bare decision-tree / mapping arrows** (not adjacent to any
  tool call): gaze-fix.md:85-90 (remediation mapping);
  opsx-apply.md:92-98; opsx-propose.md:25; speckit.specify.md:42-45;
  speckit.clarify.md:161-168; speckit.plan.md:66-68, 90-97;
  speckit.tasks.md:140-158; speckit.analyze.md:79;
  speckit.implement.md:74-80; speckit.constitution.md:54-65;
  uf.agent-brief.md (all 31 arrows: mode flags, project-file maps,
  pipeline names); uf.init.md:62, 78 (directory-rename reports);
  uf.address-feedback.md:11, 247-254, 557; uf.review-pr.md:212-215,
  267-268, 568; uf.triage-issue.md:11, 692; uf.finale.md:184-186
  (template-heading map) and 253-282 (`git_fetch` → `git_merge`
  choreography sequences — arrow = "then", not "returns").
- **Forge / comms / MCP tool calls without documented output**:
  the forge worktree tools and `comms_reserve` in uf.unleash.md
  (67-69, 544-549, 556, 589, 606, 608, 653-657),
  `forge_worktree_list` at forge.md:29. None document return
  fields; several are availability-guarded conditionals.

## Documentation gate (task 4.4)

Documentation issue filed: **#781**
(https://github.com/unbound-force/unbound-force/issues/781) —
"docs: cover seam-verification test layers and DE-007 pack/skill
additions". Duplicate-checked against open docs issues before
filing; the nearest neighbors are #762 (DE-005/DE-006 coverage)
and #720 (the original determinism pack) — both different scope,
no duplicate found.

Per-file dispositions recorded in #781:

- `CHANGELOG.md` — updated in-change (task 4.3): the
  seam-verification entry.
- `AGENTS.md` — no update: the Convention Packs section already
  lists `.opencode/uf/packs/determinism.md`; no structural,
  convention, or build-command changes.
- `README.md` — no update: no user-facing surface change.
- unbound-force/website — **exempt**: classified
  internal/test-architecture; the pack and skill are repo-local
  governance artifacts per the determinism-codification
  exclusions (same classification as #762's DE-005/DE-006
  additions).
- Blog/tutorial — reassessed at filing: declined; no new agent,
  CLI, or hero capability. The epic-level story remains tracked
  by #742 (deterministic-tools epic blog post, gated on #716).

## DE-004 evidence: defect-to-layer matrix (task 5.4)

Each motivating defect maps to the layer that would have caught
it. Before/after counts are measured against the pre-change
tree (7557cfa); PR #745 is noted where it already shipped pins.

- **#732 → Layer 1 (registration surface).** Tool factories
  declared `parameters:` where the SDK's `tool()` expects
  `args: z.ZodRawShape`; the SDK silently ignored the mis-keyed
  declarations, exposing empty parameter schemas to the model.
  Two consecutive finales broke while smoke tests — which
  assert tool names only — stayed green. Before: the FR-004
  suite asserted args keys for 3 uf-finale tools. After:
  `registration-surface.test.ts` covers all 47 tools across
  the 4 plugins — presence with description and execute,
  the pre-#732 `parameters:` mis-key guard (the
  load-bearing content of the biconditional, since the
  SDK `tool()` pass-through exposes exactly the `args`
  keys), and execution of the `z.object(args)` conversion
  the host validates input through (it throws on non-zod
  shapes and rejects non-object payloads); the zod
  instanceof fallback stays structural with its documented
  SDK transition condition. Falsification (task 1.2):
  reverting `normalize_model_name` to the `parameters:` form
  produced 3 targeted failures (exit 1); restoring it
  returned the suite to 905/905.
- **#735 → Layer 2 (documented output shape).** Triage-issue
  prose documented findings/proposals/warnings output arrays
  the tool did not return at filing time.   Before: the
  prose↔tool contract was unverified on both sides
  (`dispatch-review-runs.test.ts`, 17 tests, no golden).
  After: `golden-output-shape.test.ts` executes the 43
  sites in its registry scope and asserts the documented
  fields in the returned envelope (41 tests / 43 sites,
  grep-derived fixtures; all 8 `format_unleash_exit`
  variants additionally pinned by tool==lib equivalence
  with the renderer goldens); the four
  `dispatch_review_runs` sites are pinned in
  `dispatch-review-runs.test.ts` as golden tests across
  every documented input variant — triage (the reconciled
  #735 contract asserting the seven documented fields),
  code-mode, and feedback-mode (+3, 20 total) — so the
  drift baseline 47/47/0 holds per documented input.
- **#707/#737 → Layer 3 (round-trips + command-contract
  pins).** The `write_unleash_summary` invocation went
  unpinned while finales shipped with null unleashSummary.
  PR #745 baseline: Step 10 pins plus writer-reader
  round-trips. This change extends coverage to the remaining
  invocation seams: `TestUnleashCommand_ToolRoutingContracts`
  grew 10 → 32 subtests (census-diff empty — every tool the
  uf.unleash command text invokes is pinned or excluded as a
  non-migration seam: question/todowrite/skill host-UI,
  comms_reserve optional machinery, checkpoint via ceremony
  count); the uf-finale round-trip went from 5/8 parameters
  pinned (one weakly) to 8/8 strict (feature_dir,
  review_verdicts.spec_review, review_verdicts.code_review
  full structure, learnings_stored); the dispatch-artifact
  resume round-trip was audited and found already complete —
  the parser's full consumed set (mode, branch, verdict,
  head_sha, timestamp, source, artifact_type) was pinned.

Exclusion: **#693** (advisor runs with empty profiles
resolved no model) — resolved by the host-resolution fix, not
a seam the three layers catch; motivation only.

Aggregate: before 888 tests / 32 files (7557cfa) → 947
tests / 34 files at the phase gates (+59 tests, +2 suites);
the merged tree measures 985 tests / 35 files after follow-on
branch commits and the feedback-round input-variant goldens
(`npx vitest run`, re-verified). Per layer: Layer 1 +20 (new
suite); Layer 2 +41 (new suite) +3 (goldens: triage #735,
code-mode, feedback-mode); Layer 3 +22 Go
subtests and +4 in-place round-trip assertions, against −3
retired FR-004 assertions (`uf-finale.test.ts` 72 → 69 tests;
the retired block covered 3 uf-finale tools and is superseded
by 47-tool coverage).

Final verification state (re-verified after the PR-783
feedback round): `make lint` — 0 issues; `go test -race
-count=1 ./...` — 13 packages ok; `make plugin-test` —
35 files / 985 tests, coverage 95.05% statements / 87.45%
branches / 98.58% functions / 95.24% lines; `openspec
validate seam-verification --type change --strict` —
clean except the known benign `originating_issue` warning
(identical on 16 prior changes).

## Constitution alignment (task 5.5)

Each proposal.md assessment re-verified against the
implemented state:

- **I Autonomous Collaboration ✓** — the three layers replace
  human vigilance with machine-verified contracts; DE-007
  makes the obligation a review rule.
- **II Composability ✓** — the layers compose existing seams
  (the SDK registration path, DI'd path injection, the shared
  sanitizeSlug derivation, the drift-enforced command mirror)
  rather than introducing new infrastructure.
- **III Observable Quality ✓** — this matrix is the DE-004
  evidence; seam health is observable in `make plugin-test`
  and `make test`.
- **IV Testability ✓** — falsification verified (task 1.2:
  revert → red, restore → green); the deletion property is
  extended (22 census subtests fail if a pin is removed).
- **V Security by Default ✓** — Layer 1 asserts the
  model-facing parameter-schema surface (the #732 exposure)
  across all 47 tools.
- **VI Deterministic Execution ✓** — DE-007 [MUST] present
  with CRITICAL mapping; pack version 1.2.0; the skill hook
  is aligned.

All six assessments hold for the implemented state.
