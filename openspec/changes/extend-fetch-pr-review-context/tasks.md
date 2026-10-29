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

## 1. Plugin tool implementation

All tasks in this group edit the same file,
`.opencode/plugins/review-dispatch/index.ts`, and run sequentially
in order (design D1–D5).

- [x] 1.1 Extend `fetch_pr_review_context` (modified FR-002/FR-003,
  design D2/D3): make `pr_number` optional in
  `FetchPrReviewContextInputSchema` (`.strict()` retained); extend
  the `gh pr view --json` field list with
  `state,mergeable,mergeStateStatus,headRepository,url` (gh rejects
  `baseRepository`); add `state`, `mergeable`, `merge_state_status`,
  `head_repository`, `base_repository` to
  `FetchPrReviewContextOutput` as pass-through values; derive
  `base_repository` from the PR `url` (unparseable url → empty
  string plus a `warnings` entry); implement current-branch
  resolution when `pr_number` is omitted (`gh pr view` with no
  number, resolved value reported in `pr_number`, `pr_not_found`
  when no open PR exists); keep `input_context` unchanged; update
  the tool description.
- [x] 1.2 Implement `fetch_pr_checks` (FR-013, design D4): input
  schema `pr_number` (required, positive integer 1–999999,
  `.strict()`); fetch `gh pr checks <N> --json
  name,state,bucket,link` through an exit-code-tolerant execution
  path (stdout parsing as a JSON array is check-status data on any
  exit code; unparseable stdout on any exit code, including 0,
  classifies through `classifyError` as a fetch failure); map
  checks to
  `{ name, state, bucket, link }`; derive `eligibility` as
  `failing` (any `fail`), `pending` (no fail but any `pending`,
  `cancel`, or unknown bucket — unknown values also append a
  warning), `passing` (otherwise, including no checks); structured
  errors `gh_not_found`, `gh_auth_failed`, `pr_not_found`,
  `api_error`, `timeout`, `rate_limited`; tool factory and
  registration in `ReviewDispatchPlugin.server()`.
- [x] 1.3 Implement `fetch_failed_run_logs` (FR-014, design D5):
  input schema `run_id` (string, `^[0-9]+$`, required) and `repo`
  (optional, `owner/repo` pattern), `.strict()`; fetch
  `gh run view <run_id> [--repo <repo>] --log-failed`; persist
  output to `$TMPDIR/opencode/run-<run_id>-failed-logs.txt` with
  the FR-005 diff pattern (unlink-then-`open` with `'wx'`,
  `0o600`, explicit `chmod`, `0o700` parent); return `run_id`,
  `repo`, `log_path`, `log_bytes`, `log_lines`, `warnings` — never
  the log text inline; zero-line fetch succeeds with
  `log_lines: 0` plus a warning; missing/expired run returns
  `run_not_found` (other errors via `classifyError`); tool factory
  and registration in `ReviewDispatchPlugin.server()`.

## 2. Dual-copy sync

- [x] 2.1 Copy the canonical plugin file byte-identical to
  `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
  (FR-016; verify with `cmp`). No `expectedAssetPaths` or count
  changes — the asset already ships.

## 3. Tests

- [x] 3.1 Extract the Bun.spawn mock harness (text streams, mock
  response routing, `setupTool`) from
  `.opencode/test/fetch-pr-review-context.test.ts` into
  `.opencode/test/helpers/gh-spawn-mock.ts` for the new suites
  (design D7; the `bun-runtime.ts` shared-extraction precedent,
  default.md CS-004). The existing suite's local copy migrates
  opportunistically — do not force-rewrite it. Files:
  `.opencode/test/helpers/gh-spawn-mock.ts`
- [x] 3.2 [P] Extend `.opencode/test/fetch-pr-review-context.test.ts`
  (modified FR-002/FR-003): the five new fields present and
  passed through (including fork orientation — `head_repository`
  differs from `base_repository` on a fork PR fixture);
  `base_repository` derivation from the url; unparseable url →
  empty string plus warning; omitted `pr_number` resolves the
  current-branch PR; omitted `pr_number` with no open PR →
  `pr_not_found`; explicit `pr_number` path unchanged; schema
  still rejects extra fields.
- [x] 3.3 [P] Create `.opencode/test/fetch-pr-checks.test.ts`
  (FR-013) using the shared harness: happy path with the four
  fields; exit-code-tolerant matrix (exit 0 green, exit 8 pending,
  non-zero failing, each returning data); eligibility derivation
  matrix (`failing` / `pending` / `passing` / unknown-bucket
  fail-closed with warning); unparseable stdout on any exit code
  including 0 → structured error; error codes (`gh_not_found`,
  `gh_auth_failed`, `pr_not_found`, `api_error`, `timeout`,
  `rate_limited`); input validation (non-integer, zero, negative,
  above 999999, string, extra fields).
- [x] 3.4 [P] Create `.opencode/test/fetch-failed-run-logs.test.ts`
  (FR-014) using the shared harness: happy path with `log_path`,
  `log_bytes`, `log_lines`; temp file created `0o600` with `O_EXCL`
  semantics under a `0o700` parent; `--repo` passed as a discrete
  spawn argument when provided and absent when not;
  `run_not_found`; zero-line fetch succeeds with warning; input
  validation (`run_id` pattern including injection payloads, `repo`
  pattern, extra fields).
- [x] 3.5 [P] Add `fetch_pr_checks` and `fetch_failed_run_logs` to
  the review-dispatch tool lists in
  `.opencode/test/scratch-smoke.test.ts` and
  `.opencode/test/plugin-integration.test.ts` (one enumerated site
  each). Registration-surface tests enumerate dynamically and need
  no edits.
- [x] 3.6 Run `make plugin-test` and confirm all suites pass with
  the coverage floors (94 percent statements, 85 percent branches)
  holding unchanged — no threshold edits (gatekeeping rule).
- [x] 3.7 DE-007 seam verification naming the three layers:
  registration surface (the 3.5 tool-list pins and the
  registration-surface tests enumerate `fetch_pr_review_context`,
  `fetch_pr_checks`, and `fetch_failed_run_logs` in
  `ReviewDispatchPlugin.server()`); documented output shape (the
  modified FR-002/FR-003, FR-013, and FR-014 output contracts
  match the implemented zod output schemas field-for-field);
  write→read round-trips (the persisted `0o600` log files are
  re-read by the tests, asserting content, byte size, and line
  counts against what `fetch_failed_run_logs` reported).

## 4. Command re-route and deviation retirement

Tasks 4.1 and 4.2 edit the same file and run sequentially; 4.3 and
4.4 follow in order (4.3 depends on 4.1–4.2 landing first).

- [x] 4.1 Re-route Phase 1 of `.opencode/commands/uf.fix-ci.md`
  (FR-015, design D6): collapse the 1.0 availability prose (the
  tools validate `gh`/auth; map `gh_not_found`/`gh_auth_failed`
  structured errors to the existing STOP messages); 1.1 auto-detect
  calls `fetch_pr_review_context` without `pr_number`
  (argument-supplied invocations call it with the number); 1.2
  replaces both raw fetches with `fetch_pr_review_context` +
  `fetch_pr_checks`, records `STATE`/`HEAD_REF`/`BASE_BRANCH`/
  `MERGEABLE`/`MERGE_STATE`/`HEAD_REPOSITORY`/`BASE_REPOSITORY`
  from the tool fields (`IS_FORK` derived from the repository
  comparison per design D2), keys the eligibility gate on the
  derived `eligibility` with identical STOP outcomes, and removes
  the raw bash blocks, the non-zero-exit caveat, and the
  bucket-categorization table prose now consumed via
  `eligibility` and the checks array.
- [x] 4.2 Re-route Phase 2.1 (FR-015, design D6): replace `mktemp`
  plus `gh run view <RUN_ID> --repo <BASE_REPOSITORY>
  --log-failed` with `fetch_failed_run_logs` called with the
  validated run-id and `BASE_REPOSITORY`; map `run_not_found` and
  the zero-line result (`log_lines: 0`) to the existing STOP
  wording; retarget the untrusted-text hygiene and the
  remove-on-completion-and-STOP cleanup rules to `log_path`; keep
  Phase 2.0's run-id derivation prose (design D6 non-goal).
- [x] 4.3 Sync the command mirror byte-identical to
  `internal/scaffold/assets/opencode/commands/uf.fix-ci.md`
  (FR-016; verify with `cmp`), update
  `TestCommandContracts_FixCiCommandStructure` in
  `internal/scaffold/command_contract_test.go` from raw-gh fetch
  assertions to tool-routed ones — assert `fetch_pr_review_context`,
  `fetch_pr_checks`, and `fetch_failed_run_logs` appear on both
  copies and the raw `gh pr view` / `gh pr checks` /
  `gh run view --log-failed` fetch invocations are absent — while
  keeping the `gh run rerun --failed` pin (rerun stays prose); run
  `go test ./internal/scaffold/...` and confirm drift, manifest,
  and pin tests pass.
- [x] 4.4 Retire the deviation records in
  `openspec/changes/uf-fix-ci/` (FR-015, design D6): amend design
  D1's three-raw-gh-fetch-classes inventory entry with a
  closed-with-reference note pointing at this change; reword
  `specs/fix-ci/spec.md` FR-001 (the gh-availability verification
  whose "before any other step" sequencing the tools' own
  validation now owns → the tools' `gh_not_found`/`gh_auth_failed`
  mapping), FR-002 (pinned `gh pr view` / `gh pr checks`
  invocations → the two tool calls), FR-003 (`gh run view
  --log-failed` pin → the tool call), and FR-010 (raw-bash
  reservation list loses the three fetch classes) with
  scenario intent preserved; touch no other fragment of the
  completed change (its proposal's Dependencies already threads
  #861 as the retirement carrier); re-run
  `openspec validate uf-fix-ci --type change` and confirm the
  warnings-only profile holds.

## 5. Documentation

- [ ] 5.1 File the repo-local documentation issue required by the
  AGENTS.md documentation gate (new plugin tools are user-facing
  capability surface), recording: the tool additions, the
  behavior-preserving `/uf.fix-ci` re-route, the website-target
  resolution (search-first over open `unbound-force/website`
  issues for `fix-ci`, `fetch_pr_checks`, `fetch_failed_run_logs`,
  and `plugin tools`; the on-point trackers
  `unbound-force/website#342` — the `/uf.fix-ci` command-reference
  docs for the command file this change rewrites — and
  `unbound-force/website#310` — plugin tool parameter behavior —
  are referenced and consolidated rather than duplicated, per the
  repo precedent: fetch-pr-review-context → repo docs #696 with no
  website issue; uf-fix-ci → repo docs #862 +
  `unbound-force/website#342`), and the content-pipeline
  dispositions (blog declined — internal extraction below the
  significance threshold; tutorial declined — no new user
  workflow).
- [ ] 5.2 Add the `extend-fetch-pr-review-context` entry to
  `CHANGELOG.md` under Unreleased/Added following the existing
  format: the extended tool, the two new tools, the re-route, and
  the measured instruction-text delta from 4.1–4.2 (lines of
  mechanical fetch prose collapsed to tool-call instructions, per
  design D8), with the `(Spec: openspec/changes/
  extend-fetch-pr-review-context/)` footer and the
  `(Docs: #<repo-issue>, unbound-force/website#342,
  unbound-force/website#310)` footer carrying 5.1's issue number
  and the consolidated website trackers (the uf-fix-ci
  dual-footer format; depends on 5.1 — the footer cannot be
  finalized until the issue number exists).
- [ ] 5.3 Documentation-impact assessment: verify no `AGENTS.md`,
  `docs/usage.md`, `docs/architecture.md`, `README.md`, or
  `QUICKSTART.md` changes are required — no new command ships, no
  scaffold manifest changes (both assets already listed), and the
  `/uf.fix-ci` documentation describes behavior, not fetch
  mechanics; record the no-change disposition in 5.1's issue.

## 6. Verification and governance

- [ ] 6.1 Run `openspec validate extend-fetch-pr-review-context
  --type change --strict` and confirm the benign profile: zero
  ERROR items, with only the `originating_issue` unrecognized-key
  WARNING, long-requirement text WARNINGs, and the archive-refusal
  INFO on the MODIFIED FR-002/FR-003 deltas (the registry carries
  no fetch-pr-review-context spec, so archive would refuse
  MODIFIED operations; changes here are not archived in practice
  — the advisor-host-model-fallback precedent carries a harder
  ERROR).
- [ ] 6.2 CI parity per the AGENTS.md rule — run `make check`
  (lint, test with `-race -count=1`, build, scope-based coverage
  gate, TypeScript plugin suite) and confirm green, including the
  scaffold drift, manifest, and command-contract tests.
- [ ] 6.3 Verify constitution alignment against the proposal's six
  PASS assessments: I — the tools exchange self-describing JSON
  artifacts with no runtime hero coupling; II — each tool
  independently invocable, no new mandatory dependency; III —
  structured output with provenance and derived fields grounded in
  fetched data; IV — isolated Bun.spawn-mocked suites clearing the
  unchanged coverage floors; V — spawn argument arrays, validated
  inputs, `0o600`/`O_EXCL` persistence, no inline untrusted text;
  VI — the three mechanical fetch classes now execute in tested
  tools and the deviation records are retired (4.4).
- [ ] 6.4 Documentation-gate re-check: CHANGELOG entry present
  with the spec and Docs footers (5.2), the documentation issue
  filed with dispositions and the exemption rationale (5.1), the
  no-change disposition for the remaining docs surfaces recorded
  (5.3), and learnings captured per the retrospective gate.
