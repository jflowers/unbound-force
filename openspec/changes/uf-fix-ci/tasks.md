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

## 1. Command implementation

All tasks in this group edit the same file,
`.opencode/commands/uf.fix-ci.md`, and run sequentially in
order. Follow `uf.review-pr.md` conventions throughout
(frontmatter, `<protect>`, session-resume guard, MANDATORY GATE
blocks with the question-tool presentation contract,
CHECKPOINT markers, Guardrails section) per FR-009/FR-013 and
design D1.

- [x] 1.1 Create the command skeleton: YAML frontmatter with
  an `$ARGUMENTS` description, `<protect>` block, intro
  paragraph, session-resume guard (re-read template, call
  `get_progress` with `command: "uf.fix-ci"`, resume from the
  first incomplete phase), Arguments section (optional PR
  number, argument parsing before any tool calls), and a
  Progress Tracking section listing checkpoint steps
  (`pr-resolved`, `diagnosis`, `rebase`, `fix-loop`,
  `final-verification`) with TodoWrite tracking maintained
  alongside checkpoints.
- [x] 1.2 Implement Phase 1 — prerequisites and PR resolution:
  `which gh` and `gh auth status` checks with STOP errors
  (FR-001); PR number resolution with auto-detection via
  `gh pr view --json number --jq '.number'` when omitted and
  STOP when unresolvable; PR state fetch via `gh pr view <N>
  --json number,state,headRefName,baseRefName,mergeable,
  mergeStateStatus,headRepository,isCrossRepository,url`
  (base repository derived from the PR `url` — `gh pr view
  --json` exposes no `baseRepository` field) plus the pinned
  check-suite fetch `gh pr checks <N> --json name,state,link`; eligibility STOPs for CLOSED/MERGED and
  all-checks-pass (FR-002); local head-branch verification
  (current branch MUST equal `headRefName`, clean working tree
  required, STOP with guidance otherwise) and fork-aware
  BASE_REMOTE/HEAD_REMOTE resolution from `headRepository`/
  `baseRepository` per design D3/D4.
- [x] 1.3 Implement Phase 2 — diagnosis: for each failed
  check, fetch failure logs via `gh run view <run-id>
  --log-failed`, saving large output to a temp file and
  reading targeted slices (design D9); classify each failure
  as exactly one of code failure, stale branch, conflict, or
  flaky/infra, grounded in the log evidence (FR-003, design
  D5); record the classification table for the fix-plan gate.
- [ ] 1.4 Implement Phase 3 — rebase path (selected when
  conflicted or behind): the MANDATORY GATE question tool
  presents the diagnosis and proposed plan and MUST be
  answered before `git_fetch`/`git_rebase` run — the rebase
  is a mutation and never executes ungated (FR-004, FR-013,
  design D6); then `git_fetch <BASE_REMOTE>` and
  `git_rebase <BASE_REMOTE>/<BASE_BRANCH>` (FR-004); on
  conflict, resolve flagged files preserving author intent,
  re-scan with `scan_conflict_markers`, and on ambiguity STOP
  offering `git_rebase_abort`; state that pushes after a
  rebase MUST use `git_push_force_with_lease`; the command
  MUST NEVER merge base into head — no option offers it
  (design D2).
- [ ] 1.5 Implement Phase 4 — gated fix loop: a MANDATORY GATE
  presenting the full diagnosis and proposed fix plan via the
  question tool before any fix executes (FR-005, design D6);
  fix authoring scoped to the failing checks; conventional
  commit format (`fix: ...`); the review-council gate — run
  `/uf.review-council` once per iteration after all fixes are
  committed, REQUEST CHANGES enters the fix loop, exhaustion
  MUST NOT push (FR-006, design D7); push mode selection
  (`git_push` plain, `git_push_force_with_lease` after a
  rebase); a single durable iteration counter in checkpoint
  data capped at 3 with STOP on exhaustion or unfixable
  classification (design D8).
- [ ] 1.6 Implement Phase 5 — flaky/infra path: when
  classification is flaky/infra, offer `gh run rerun
  --failed` instead of a code change, rendered through the
  question tool with per-option reasoning per FR-013/design
  D6, with the classification evidence shown, and re-poll CI
  after any rerun (FR-007).
- [ ] 1.7 Implement Phase 6 — final verification and
  Guardrails: `uf_finale_ci_poll` until green or timeout with
  a final status report (FR-008); the terminal Guardrails
  section restating: MUST NOT merge, approve, or close the PR;
  rebase only, never merge base into head; never touch
  protected base branches; no fix without the human gate; no
  push without the council gate; commit scope limited to the
  failing checks; untrusted text never interpolated into
  shell arguments.

## 2. Scaffold mirror and structural pins

All tasks in this group form one atomic green-test transition
in `internal/scaffold` — the drift, manifest, and pin tests
only pass once all of 2.1-2.3 land together — so the group
runs sequentially in order.

- [ ] 2.1 Copy the canonical command byte-identical to
  `internal/scaffold/assets/opencode/commands/uf.fix-ci.md`
  (FR-011; verify with `cmp`).
- [ ] 2.2 Update `internal/scaffold/scaffold_test.go`:
  add `"opencode/commands/uf.fix-ci.md"` to
  `expectedAssetPaths` and update the "OpenCode commands (11)"
  count comment to 12.
- [ ] 2.3 Add a structural pin test in
  `internal/scaffold/command_contract_test.go` (e.g.,
  `TestCommandContracts_FixCiCommandStructure`) using
  `loadCommandCopies(t, "uf.fix-ci.md", true)`, asserting on
  both copies: the never-merge wording ("MUST NEVER merge"),
  absence of the `git_merge` tool, MANDATORY GATE markers with
  question-tool presentation-contract fragments, the
  session-resume guard, `command: "uf.fix-ci"` checkpoints,
  `uf_finale_ci_poll`, the git plugin tools, the
  `/uf.review-council` gate, the 3-iteration cap, and
  `gh run rerun --failed`.
- [ ] 2.4 Run `go test ./internal/scaffold/...` and verify
  the drift (`TestEmbeddedAssets_MatchSource`), manifest
  (`TestAssetPaths_MatchExpected`), reverse-drift, and the
  new pin test all pass.

## 3. Documentation

- [ ] 3.1 [P] Add `/uf.fix-ci [N]` to the PR Review Commands
  table in `AGENTS.md` (When = Post-PR (GitHub), Scope =
  diagnose + fix failing checks) and bump the
  project-structure tree's `commands/` "Slash commands" count
  comment from 32 to 33 files (FR-012).
- [ ] 3.2 [P] Add a `/uf.fix-ci` section to `docs/usage.md`
  (usage line, what the gated fix loop does, the rebase-only
  rule, the never-merge rule) and a Quick Reference table
  row; add the `/uf.fix-ci [N]` row to the Review Commands
  table in `docs/architecture.md` (Post-PR, diagnose + fix
  failing checks) plus the `uf.fix-ci.md` entry in its
  Scaffolded Files slash-commands list (bumping the ~46
  command-files total to ~47); and bump QUICKSTART.md's "What
  Gets Scaffolded" commands count from 11 to 12 (FR-012).
- [ ] 3.3 [P] Add the `uf-fix-ci` entry to `CHANGELOG.md`
  under Unreleased/Added following the existing entry format
  with a `(Spec: openspec/changes/uf-fix-ci/)` footer and the
  dual-number documentation footer `(Docs: #<repo-issue>,
  unbound-force/website#<website-issue>)` carrying both issue
  numbers from 3.4 (FR-012; depends on 3.4 — the footer
  cannot be finalized until 3.4 files the issues and records
  their numbers).
- [ ] 3.4 File both documentation issues required by the
  stacked documentation gates (user-facing command addition,
  before PR merge): the repo-local issue per the AGENTS.md
  documentation gate and the tracking issue in the
  `unbound-force/website` repository per the org
  constitution's Cross-Repo Documentation rule, each
  referencing the new command and its `docs/usage.md` entry;
  record both issue numbers in the CHANGELOG entry footer
  (3.3) (FR-012; 3.3 consumes this task's issue numbers).

## 4. Verification and governance

- [ ] 4.1 Run `openspec validate uf-fix-ci --type change
  --strict` and confirm the warnings-only profile: zero ERROR
  items, with only the known benign `originating_issue`
  unrecognized-key WARNING (the accepted repo-wide profile).
- [ ] 4.2 CI parity per the AGENTS.md rule — run `make check`
  (lint, test with `-race -count=1`, build, scope-based
  coverage gate, TypeScript plugin suite) and confirm green.
- [ ] 4.3 Verify constitution alignment against the proposal's
  six PASS assessments: I — the command exchanges only
  well-defined artifacts (gh JSON, logs, reports) with no
  runtime hero coupling; II — independently invocable with no
  prerequisite command; III — every classification and final
  verdict is evidence-backed with provenance; IV — the
  structural pin test (2.3) covers the contract surface;
  V — all mutations gated, untrusted-text hygiene in place;
  VI — mechanical steps execute through plugin tools wherever
  one exists, with the PR-state/checks/log fetches honestly
  documented as command-prose deviations bound to companion
  issue #861 (design D1), not claimed as tool-routed.
- [ ] 4.4 Documentation-impact assessment re-check: AGENTS.md
  table updated (3.1), `docs/usage.md` updated (3.2),
  `docs/architecture.md` Review Commands table updated (3.2),
  CHANGELOG entry present with the dual-number Docs footer
  (3.3), both documentation issues filed — repo-local (3.4)
  and unbound-force/website tracking (3.4) — README.md
  unchanged (no command-table surface; line 69 blurb
  unaffected), learnings captured per the retrospective gate.
