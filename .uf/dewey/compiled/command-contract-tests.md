---
tier: validated
compiled_at: 2026-10-25T16:39:33Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - command-contract-tests-20261014T173706-jay-flowers
  - command-contract-tests-20261017T033626-jay-flowers
  - command-contract-tests-20261017T123531-jay-flowers
  - command-contract-tests-20261017T145241-jay-flowers
  - command-contract-tests-20261017T181141-jay-flowers
  - command-contract-tests-20261020T114852-jay-flowers
  - command-contract-tests-20261020T165715-jay-flowers
topic: command-contract-tests
---

# Command Contract Tests

Go command-contract tests are the only guard for command-to-tool routing: TS-side tool tests
cover the tool contract but cannot see command prose.

## Current State (October 2026)

### What is pinned today

- `internal/scaffold/command_contract_test.go` pins command content for four command files via
  `assertCommandCopies`: `uf.review-council.md`, `uf.triage-issue.md`, `uf.address-feedback.md`,
  `speckit.testreview.md`. It loads embedded assets, so one assertion covers both canonical and
  mirror copies.
- `internal/scaffold/scaffold_test.go` (`TestUnleashCommand_*` subtests) pins `uf.unleash.md`
  tool routing. All 8 `write_unleash_summary` params are pinned (step-10 subtest): `change_name`,
  `tier`, `feature_dir`, `review_verdicts`, `learnings_stored`, `whatWasBuilt`, `howToVerify`,
  `testResults`.
- `resolve_base_ref` and `dispatch_review_runs` have Go pins (scaffold_test.go:613-657);
  `clear_progress` still does not.

### Derivation rules

- Pin derivation is mechanical and complete or it is wrong.
- Parameter lists come from the tool's zod input schema, never the routing-critical subset.
  Every unpinned required parameter on a warn-and-continue path is a silent-regression window:
  a prose regression surfaces only at runtime INVALID_INPUT, where the fallback silently
  degrades the consumer (`/uf.finale` drops to no-artifact mode).
- Call sites come from the spec's enumerated union of MUST call sites at authoring time, not
  the span a review fix touched; feedback-driven pin extension systematically under-covers
  requirements that drew no feedback in the same diff.
- Prefer per-span negative assertions ("via the Task tool" absent between two anchors — the
  `between()` + `strings.Contains` pattern over `assetContent`) over command-wide greps, which
  dilute the check and false-positive on legitimately unchanged prose.

### Mechanical enumeration verification

- Never trust bucket naming or a spec's "remaining X" claim: grep every `Call \`` occurrence
  out of the command markdown, collect pinned tool names from the Go suites, and diff the sets.
  This settles whether a universal clause ("every invocation the command depends on MUST be
  pinned") matches the tasks that operationalize it before the spec lands with an unmet
  normative claim.

### Value pinning

- Phrase-presence pins cannot detect numeric bounds or classification rules embedded in prose.
  When a command rewrite introduces governance-relevant limits — retry bounds ("at most twice"),
  default-deny failure classification — pin the exact bound and classification language
  explicitly, mirroring the one-call mandate and detached-HEAD fail-closed pins. Gate-protected
  values (review retry limits per AGENTS.md) otherwise drift silently.

### Baseline readings

- When multiple command files document an identical tool-output contract sentence, a single
  golden test executing one site's documented inputs pins the shared field set but leaves the
  other sites' documented input variants unexercised. State which reading the drift baseline
  uses: "N sites pinned" can mean N per-site executions or one execution per distinct contract
  sentence.
- Prefer one golden case per documented input shape, or phrase requirement and baseline as
  contract-sentence-scoped. Current baseline: 44-of-48 with 4-per-variant coverage.

## History

- **2026-10-14**: Phrase-presence pins miss numeric bounds and classification rules in prose;
  pin exact governance-relevant values.
- **2026-10-17 (PR 745 r2)**: Step-10 `write_unleash_summary` pin checked 5 of 8 params; the
  demo-body params (`whatWasBuilt`/`howToVerify`/`testResults`), required by
  `WriteUnleashSummaryInputSchema` and read back by `/uf.finale` from the persisted artifact,
  were unpinned across the entire Go prose-contract suite. Later fixed: all 8 pinned.
- **2026-10-17 (PR 745 r4)**: Per-call-site pins added in response to feedback inherit the
  feedback's blind spots — the spec enumerated four migration surfaces (Steps 2/3 plan/tasks,
  per-task implement, Step 6 code-fix) but only the feedback-named fix-loop site was pinned;
  the Step 8 call site was missed across three rounds.
- **2026-10-17 (opsx/unleash-deterministic-tools)**: 4 delegation sites + 2 formatter
  invocations were pinned from earlier feedback while 7 of 8 `format_unleash_exit` variants and
  6 other enumerated tools (`uf_unleash_branch_gate`, `uf_unleash_detect_resume`,
  `scan_clarifications`, `resolve_clarification`, `parse_tasks`, `mark_task_complete`,
  `scan_conflict_markers`) remained unpinned until review caught the gap.
- **2026-10-17 (re-review protocol)**: A learning in observational tense with no fix in the
  diff and no tracking-issue reference marks an accepted-as-documented residual — a finding for
  the next round, not a re-raise of a dispositioned item.
- **2026-10-20 (issue #765)**: Bucket-based enumeration silently omitted `dispatch_review_runs`
  (Steps 5/9), the Step 6 forge worktree family, `resolve_base_ref`, and `clear_progress` from
  `uf.unleash.md`; `resolve_base_ref` and `dispatch_review_runs` have since gained pins
  (scaffold_test.go:613-657), `clear_progress` remains unpinned. Same issue: the 47/47/0
  baseline counted four `dispatch_review_runs` sites (identical seven-field sentence across
  `uf.triage-issue.md`, `uf.review-council.md`, `uf.review-pr.md`, `uf.address-feedback.md`) as
  pinned by the single #735 triage-input golden test while the spec requirement read per-site;
  re-scoped to 44-of-48 + 4-per-variant.
