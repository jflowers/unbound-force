<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Extend uf-workflow plugin with shared tools

- [x] 1.1 Add `normalize_model_name` tool to
  `.opencode/plugins/uf-workflow/index.ts` — implement
  the 6-step algorithm (D9), accept `rawModelId` string,
  return `{normalized}` via `success()` envelope. Include
  `unknown-model` fallback with warning field.
- [x] 1.2 Add 9 git operation tools to
  `.opencode/plugins/uf-workflow/index.ts` — `git_fetch`,
  `git_push`, `git_push_force_with_lease`, `git_merge`,
  `git_merge_abort`, `git_rebase`, `git_rebase_abort`,
  `git_conflict_files`, `git_commit_no_edit`. All use
  injectable `GitExec`, return minimal JSON to LLM, print
  full output to TUI (D2, D4).
- [x] 1.3 Register all new tools in the `uf-workflow`
  plugin `server()` function's returned `tool` object.

## 2. Create uf-finale plugin

- [x] 2.1 Create `.opencode/plugins/uf-finale/index.ts`
  with 8 composite tools: `uf_finale_startup`,
  `uf_finale_stage`, `uf_finale_commit_context`,
  `uf_finale_push_state`, `uf_finale_pr_context`,
  `uf_finale_create_pr`, `uf_finale_ci_poll`,
  `uf_finale_return_to_main`. Use `success()`/`failure()`
  envelopes from `../../lib/uf-workflow-types.js`. Import
  `normalize_model_name` algorithm (inline or shared
  helper). Implement internal CI polling loop (D3).
  Read unleash-summary artifact in `uf_finale_pr_context`
  (D5).
- [x] 2.2 Register `uf-finale` plugin in `opencode.json`
  — add to the `plugin` array alongside existing 3
  plugins.

## 3. Rewrite uf.finale.md

- [x] 3.1 Rewrite `.opencode/commands/uf.finale.md` from
  ~1,089 to ~300 lines. Replace all deterministic
  procedures with tool calls. Preserve: session-resume
  guard, all question-tool gates (secrets, commit, push,
  PR, CI, conflict), commit message generation, PR body
  authoring (with unleash-summary path), CI failure
  explanation, conflict resolution choices, summary
  report. Target sections: session-resume ~12 lines,
  progress ~8, Steps 1-2 ~12, Step 3 ~20, Step 4 ~12,
  Step 5 ~50, Step 6 ~70, Steps 7-8 ~15, guardrails ~15.

## 4. Scaffold machinery

- [x] 4.1 Add `ufFinalePluginAsset` constant to
  `internal/scaffold/scaffold.go`. Update
  `isActivationGatedAsset()` to include it. Update
  `hasPlugins` boolean check. Update
  `configureOpencodeJSON()` plugin list to include
  `uf-finale`.
- [x] 4.2 Update `internal/scaffold/plugin_activation.go`:
  add uf-finale to `stageReviewPluginSources()` staging
  list and `atomicallyActivateReviewPlugins()` activation
  list. Extend `reviewPluginProbeSource()` to import and
  validate ALL 4 plugins uniformly (D6).
- [x] 4.3 [P] Mirror `.opencode/plugins/uf-workflow/index.ts`
  to `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`.
- [x] 4.4 [P] Mirror `.opencode/plugins/uf-finale/index.ts`
  to `internal/scaffold/assets/opencode/plugins/uf-finale/index.ts`.
- [x] 4.5 [P] Mirror `.opencode/commands/uf.finale.md`
  to `internal/scaffold/assets/opencode/commands/uf.finale.md`.
- [x] 4.6 Update `internal/scaffold/scaffold_test.go`:
  add uf-finale asset to `expectedAssetPaths`, update
  `task42CanonicalAssets`, update all test slices with
  file count expectations (67→68 total, deployed stays
  63, activation-gated 3→4).
- [x] 4.7 Update
  `internal/scaffold/plugin_activation_test.go`: add
  uf-finale staged/installed plugin fixtures, update
  `wantPlugins` from 3 to 4.

## 5. Tests

- [x] 5.1 [P] Extend `.opencode/test/uf-workflow.test.ts`
  with tests for `normalize_model_name` (standard IDs,
  edge cases, empty input, no-provider, date suffixes,
  version segments) and 9 git operation tools (success
  paths, error paths, parameter variations).
- [x] 5.2 [P] Create `.opencode/test/uf-finale.test.ts`
  with plugin smoke test and unit tests for all 8
  composite tools using mock `GitExec` and mock
  `execSync`.

## 6. Documentation

- [x] 6.1 Update `AGENTS.md` project structure: add
  `uf-finale` to the `.opencode/plugins/` listing
  (currently lists 3, becomes 4). Update the plugin
  count in the TypeScript plugins description.
- [x] 6.2 Add `CHANGELOG.md` entry for the
  finale-token-reduction change under the next
  unreleased version.

## 7. Verification

- [x] 7.1 Run `make check` — all Go tests, lint, coverage
  gate, and plugin tests must pass.
- [x] 7.2 Verify constitution alignment: Autonomous
  Collaboration (artifact envelopes preserved),
  Composability First (git tools reusable across
  commands), Observable Quality (structured JSON output),
  Testability (GitExec injection in all tools).
- [x] 7.3 Verify scaffold-to-live parity: diff
  `.opencode/plugins/uf-workflow/index.ts` against
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`,
  same for uf-finale and uf.finale.md.

<!-- spec-review: passed -->
<!-- code-review: passed -->
