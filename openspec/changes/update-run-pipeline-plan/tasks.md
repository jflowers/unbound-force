<!--
  [P] marks tasks eligible for parallel execution.
  Tasks in group 1 all edit the same file and MUST run
  sequentially. Group 2 tasks touch different files.
-->

## 1. Command protocol rewrite (canonical file)

All tasks in this group edit
`.opencode/commands/uf.run-pipeline-plan.md` and MUST run in
order. Preserve the file skeleton: YAML frontmatter, the
`<!-- scaffolded by uf vdev -->` marker, the `<protect>` block,
the User Input / Description / Usage / Instructions section
order, and the ~70-character line wrap (MegaLinter markdown
lint). Phase 0, the Plan File Contract, the session-resume
guard, and the Execution Checklist stay semantically unchanged.

- [x] 1.1 Update the frontmatter `description` and the
  `## Description` section: the command now executes each work
  item through two `uf_delegate_command` delegations
  (`/uf.unleash`, then `/uf.finale`) with paused-exit handling
  and per-item todowrite tracking. Remove all references to
  three subagents, `general` subagent spawning, gate relaying,
  and the `/opsx-propose` -> `/uf.unleash` -> `/uf.finale`
  sequencing.
- [x] 1.2 Rewrite the Per-Item Pipeline Protocol section per the
  spec delta: delegation 1 is `uf_delegate_command` with
  `command_path: ".opencode/commands/uf.unleash.md"` and a prompt
  carrying the work item's description and issue reference(s)
  (the child resolves the issue, routes the tier, runs the entry
  command, and executes the pipeline through demo); delegation 2
  is `uf_delegate_command` with
  `command_path: ".opencode/commands/uf.finale.md"`, delegated
  only after the demo block is presented. State the parameter
  contract (omit `task_classification` for command-path
  delegations; omit `checkpoint_step` and `expected_artifact` on
  both — the delegated commands own their durable progress).
  Replace the disk handoff verification table: before finale,
  verify the working tree is on the item's feature branch (not
  `main`); after finale, verify a PR exists for the branch and
  the tree is back on `main` and clean. Keep the
  clean-tree-between-items rule.
- [x] 1.3 Delete the Gate Relay Protocol section. Add a Direct
  Human Gate Surfacing rule: human gates inside delegated
  commands surface as tool-rendered paused exits relayed verbatim
  (question-tool prompts inside a parented child do not surface —
  the delegation wedges at the gate until timeout); the
  orchestrator MUST NOT relay gates via
  structured values or resume children via `task_id`; the
  orchestrator's question-tool use is limited to Phase 0 triage
  and pause-relay decisions. Add the Unleash Paused-Exit
  Handling protocol: recognize any `/uf.unleash paused at:`
  heading (variants: clarify, spec-review, implement-worker-
  failed, implement-merge-conflict, implement-phase-checkpoint,
  code-review-preflight, code-review-no-success,
  code-review-iterations-exhausted, tier-routing-dirty-tree,
  tier-routing-missing-tooling, planner-failure); relay the exit
  text
  verbatim; mark the todowrite entry blocked (`in_progress` +
  `[BLOCKED: <variant>]` annotation); present the pause-relay
  question (re-run after human action / skip the item / abort
  the run); on re-run, delegate `/uf.unleash` again with the same
  `command_path` and no routing context (omitting orchestrator-
  side tier and branch directives while the prompt still carries
  the work item's description and issue reference(s)), split by
  variant class: mid-pipeline variants resume from
  durable state; tier-routing variants restart fresh on `main`
  with the description and issue reference(s) re-supplied;
  delegate `/uf.finale` only after the demo
  completes. Route hard delegation failures (error envelopes,
  neither exit text nor demo) through the same blocked protocol.
- [x] 1.4 Refresh the `/uf.finale` delegation description: nine
  steps — branch safety gate, check for changes and stage,
  commit message, sync with base branch, push, create or find
  PR, watch CI checks, return to main, summary; expected outcome
  is a PR URL, the PR stays open for human review, `Closes #N`
  threads via `originating_issue`, and the tree returns to
  `main`. Update the Guardrails section: keep scaffold drift
  sync, stray file removal, no force-push (`--force-with-lease`
  only), PR targeting, and no auto-merge verbatim; re-anchor the
  explicit staging guardrail (the orchestrator stages and commits
  nothing — staging happens inside the delegated `/uf.finale`
  child via `uf_finale_stage`; the orchestrator-side rule is
  verification only, explicit paths if it ever stages); replace
  the Closes linkage guardrail with the
  backstop — verify the PR body contains `Closes #N` for each
  issue via `gh pr view <N> --json body` and append missing
  lines via `gh pr edit <N>`, reporting the repair. Update the
  Tracking section: `[x]` only after the PR is created AND
  `gh pr checks <N>` is green; blocked items stay `in_progress`
  with the paused variant annotated.

## 2. Mirror sync and changelog

- [x] 2.1 [P] Sync the scaffold mirror byte-identically: copy
  `.opencode/commands/uf.run-pipeline-plan.md` to
  `internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`
  and verify with `cmp` (zero output). No manifest change is
  needed — the asset path already exists in `expectedAssetPaths`.
- [x] 2.2 [P] Add a `CHANGELOG.md` entry under
  `## Unreleased` -> `### Changed` in the repo's
  `- <change-name>: <summary>` format, summarizing the
  two-delegation protocol, gate-relay removal, paused-exit
  handling, and the mirror sync, ending with
  `(Spec: openspec/changes/update-run-pipeline-plan/)` (see the
  `rebase-upstream-before-push` entry for length and style).

## 3. Verification and gates

- [x] 3.1 Run the scaffold drift test:
  `go test ./internal/scaffold/ -run TestEmbeddedAssets_MatchSource -race -count=1`
  — it MUST pass, proving canonical and embedded copies are
  byte-identical.
- [x] 3.2 Run `make check` — lint, Go tests (including scaffold
  drift detection), build, the scope-based coverage gate, and
  the TypeScript plugin suite must pass, replicating CI locally.
  No gate or threshold may be modified.
- [x] 3.3 [P] Assess documentation impact per the AGENTS.md
  documentation gate: the CHANGELOG entry (task 2.2) is the
  change record; AGENTS.md, README.md, and docs/ need no
  update (grep confirms no run-pipeline-plan references in
  any of them today; no structural or count changes). File
  BOTH documentation issues required for this user-facing
  change (the asset is scaffolded to downstream repos via
  `uf init`). First run an UNFILTERED duplicate search —
  `gh issue list --repo unbound-force/unbound-force --state
  open --search "run-pipeline-plan"` — and disposition any
  related open issue: #747 ("Docs gate: command-prose-pilot
  rewrite of /uf.run-pipeline-plan") is the prior change's
  docs-gate issue for this same command file and its
  assessment ("website exempt, no user-facing behavior
  change") is superseded by this change; the new issue MUST
  reference it and either close it with rationale or note
  the AGENTS.md follow-up work its comment tracks. Then
  file: (a) the in-repo issue via `gh issue create --repo
  unbound-force/unbound-force --label docs --title "docs:
  /uf.run-pipeline-plan two-delegation protocol"`; and (b)
  the website issue per the org constitution v1.4.0
  Cross-Repo Documentation rule, via `gh issue create
  --repo unbound-force/website --label docs --title "docs:
  /uf.run-pipeline-plan orchestrator behavior changes"`.
  Both issue bodies MUST enumerate the user-visible
  changes: paused-exit relay of delegated-command gates
  (question-tool prompts inside a parented child do not
  surface), pause-relay questions
  and blocked-item tracking, auto-delegation of
  /uf.finale superseding the demo block's interactive
  next-step choice, and the Closes-linkage verification
  backstop. Record BOTH issue numbers and the #747
  disposition in the completion note.
- [x] 3.4 [P] Verify constitution alignment per the proposal's
  assessment: delegations run through `uf_delegate_command`
  with the command file as procedure of record (I, II, VI);
  paused-exit text is relayed verbatim from
  `format_unleash_exit` and PR/CI state is verified via `gh`
  (III); the behavior is scenario-specified and drift-test
  enforced (IV); no new trust boundaries or dependencies (V).
  Confirm no quality gate, threshold, review limit, or pinned
  dependency was modified.
