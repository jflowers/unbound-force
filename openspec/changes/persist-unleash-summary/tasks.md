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

## 1. Producer tool (uf-workflow plugin)

- [x] 1.1 Implement `createPersistUnleashSummaryTool(exec, cwd)`
  in `.opencode/plugins/uf-workflow/index.ts`: three required
  string parameters (`whatWasBuilt`, `howToVerify`,
  `testResults`); non-empty/non-whitespace validation (code
  `INVALID_UNLEASH_SUMMARY`, nothing written); branch detection
  via `git rev-parse --abbrev-ref HEAD` (detached HEAD fails);
  `sanitizeSlug` branch keying; path
  `.uf/artifacts/unleash-summary/<slug>.json`; symlink refusal
  via `lstatSync` for target file and parent dir; `mkdirSync`
  recursive mode `0o700`; `writeFileSync` mode `0o600` with
  `JSON.stringify(payload, null, 2) + "\n"`; unconditional
  overwrite; top-level provenance fields `artifact_type`
  (`"unleash-summary"`), `schema_version` (`1`), `branch`,
  `timestamp` (ISO 8601); `success()` envelope with resolved
  path and branch, `failure()` envelope with code
  `PERSIST_UNLEASH_SUMMARY_ERROR` for operational errors
- [x] 1.2 Register `persist_unleash_summary` in the
  `UfWorkflowPlugin` server tool map (canonical
  `.opencode/plugins/uf-workflow/index.ts` only in this task;
  scaffold mirror happens in group 3)

## 2. Command integration and tests (different files)

- [x] 2.1 [P] Extend `.opencode/commands/uf.unleash.md` Step 10:
  after the demo format block (before the CHECKPOINT
  blockquote), add an instruction to call
  `persist_unleash_summary` with `{whatWasBuilt, howToVerify,
  testResults}` — the markdown bodies of the three presented
  sections, excluding the `##` headers — and on tool failure
  warn and continue to CHECKPOINT (soft-fail; no mechanical
  prose for paths, branch detection, or serialization)
- [x] 2.2 [P] Add tests to `.opencode/test/uf-workflow.test.ts`
  for `createPersistUnleashSummaryTool` using the injectable
  `GitExec` + temp-dir pattern: happy path (slug path
  `opsx/my-change` → `opsx-my-change.json`, schema fields incl.
  provenance), overwrite semantics (second call replaces
  content and refreshes `timestamp`), empty/whitespace
  validation rejection, detached-HEAD failure without write,
  symlink refusal, failure envelope codes; include a
  consumer-contract test asserting the written JSON exposes
  top-level `whatWasBuilt` and `howToVerify` strings (pins the
  `uf_finale_pr_context` read contract)

## 3. Scaffold mirror sync (after canonical files final)

- [x] 3.1 [P] Mirror the command:
  `cp .opencode/commands/uf.unleash.md
  internal/scaffold/assets/opencode/commands/uf.unleash.md`
- [x] 3.2 [P] Mirror the plugin:
  `cp .opencode/plugins/uf-workflow/index.ts
  internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`

## 4. Documentation

- [x] 4.1 Add a `persist-unleash-summary` entry under
  `## Unreleased` → `### Added` in `CHANGELOG.md` following the
  `- <change-name>: <summary>` format with
  `(Spec: openspec/changes/persist-unleash-summary/, Refs: #707)`
- [x] 4.2 Assess the documentation gate: file a documentation
  issue for the user-facing behavior change unless an exemption
  applies (internal workflow plumbing with user-visible PR body
  improvement — record the assessment either way)

## 5. Verification

- [x] 5.1 Run `make plugin-test` — full TypeScript suite
  (unit, integration, smoke, coverage) must pass including the
  new tool tests
- [x] 5.2 Run `go test -race -count=1 ./internal/scaffold/...`
  — embedded-asset drift tests and command contract tests must
  pass after the mirror sync
- [x] 5.3 Run `make check` for CI parity (lint, test, build,
  coverage gate, plugin tests) — must pass end to end
- [x] 5.4 Verify constitution alignment per the proposal:
  artifact-based collaboration with no runtime coupling (I),
  standalone tool usability plus preserved finale fallback (II),
  machine-parseable artifact with provenance and structured
  envelopes (III), dependency-injected testability (IV)
