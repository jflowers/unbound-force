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

## 1. Port the Command

- [ ] 1.1 Read the staged source of truth at
  `.local-sources/resolve-branch-conflict.md` (git-excluded
  scratch input; never commit it) and the convention
  reference `.opencode/commands/uf.review-pr.md`. Port from
  the staged file, not from memory. Skim
  `.opencode/commands/uf.finale.md` step 4 for the
  distinction documented in design.md D8.

- [ ] 1.2 Create `.opencode/commands/uf.rebase-pr.md`: full
  port of the staged source following `uf.review-pr.md`
  conventions — YAML frontmatter with `description`,
  `<protect>` block, session-resume guard, Arguments section
  with the `^[1-9][0-9]*$` pre-validation contract, the six
  phases (prerequisites, PR fetch/gating, checkout and
  rebase, conflict resolution, push, verify), and the
  nine-rule Guardrails section. Apply design decisions D2/D3:
  use `git_fetch` / `git_rebase` / `git_rebase_abort` plugin
  tools where semantics match; for the push, verify the
  branch upstream is `<HEAD_REMOTE>/<HEAD_BRANCH>` before
  using `git_push_force_with_lease`, else fall back to
  `git push --force-with-lease <HEAD_REMOTE> <HEAD_BRANCH>`.

## 2. Scaffold Mirror

- [ ] 2.1 [P] Copy the canonical command to the scaffold
  location (tool-owned asset):
  ```bash
  cp .opencode/commands/uf.rebase-pr.md \
     internal/scaffold/assets/opencode/commands/uf.rebase-pr.md
  ```

- [ ] 2.2 [P] Update `expectedAssetPaths` in
  `internal/scaffold/scaffold_test.go`: add
  `opencode/commands/uf.rebase-pr.md` in alphabetical
  position and update the commands count comment from
  `// OpenCode commands (11)` to `// OpenCode commands (12)`.

- [ ] 2.3 Run scaffold drift detection to verify mirror
  parity and asset-list correctness:
  ```bash
  go test -race -count=1 ./internal/scaffold/...
  ```

## 3. Documentation

- [ ] 3.1 [P] Add a row to the PR Review Commands table in
  `AGENTS.md`:
  `| /uf.rebase-pr [N] | Post-PR (GitHub) | Rebase a
  conflicted PR's head branch onto its base |`
  In the same file, bump the Project Structure annotation
  for the commands directory from "Slash commands (32
  files)" to "Slash commands (33 files)" — the new command
  is the 33rd file under `.opencode/commands/`.

- [ ] 3.2 [P] Add a row to the Quick Reference table in
  `docs/usage.md`:
  `| /uf.rebase-pr | Rebase a conflicted PR onto its base |`
  (match the existing row format and placement).

- [ ] 3.3 [P] Add a row to the Review Commands table in
  `docs/architecture.md` (design.md D6 — consistency
  extension): `| /uf.rebase-pr [N] | Post-PR (GitHub) |
  Rebases a conflicted PR's head branch onto its base and
  force-pushes with lease |` (match the existing row format).

- [ ] 3.4 [P] Add a `port-uf-rebase-pr` entry to
  `CHANGELOG.md` under "## Unreleased" → "### Added",
  matching the existing entry format (see the
  `replicator-version-floor` entry): a
  `- port-uf-rebase-pr: <summary>` line summarizing the
  ported command, closing with
  `(Spec: openspec/changes/port-uf-rebase-pr/)` and —
  once task 4.4 files them —
  `(Docs: #N, unbound-force/website#N)` references.

## 4. Verification and Gates

- [ ] 4.1 Constitution alignment verification (proposal
  principles I–VI): confirm the ported command carries all
  nine source guardrails verbatim in intent — no
  merge/approve/close, never push the base branch,
  remotes resolved never assumed, `--force-with-lease` never
  `--force`, conflicts-only edits, no guessing, clean
  backout, gh verification before API calls, determinism.
  Confirm the scaffold mirror is byte-identical (principle
  IV testability surface) and that no quality gate,
  coverage threshold, or CI flag was modified (gatekeeping
  rule).

- [ ] 4.2 Run the full local CI parity gate:
  ```bash
  make check
  ```
  This covers lint (vet + golangci-lint), Go tests
  (`-race -count=1`), build, the scope-based coverage gate,
  and the TypeScript plugin suite. All must pass.

- [ ] 4.3 Confirm `.local-sources/` is absent from
  `git status` (git-excluded) and appears in no commit,
  artifact, or scaffold mirror, per design.md D9.

- [ ] 4.4 File the documentation-gate issues before the
  implementing PR merges (AGENTS.md documentation gate +
  constitution v1.4.0 Cross-Repo Documentation), following
  the `rebase-upstream-before-push` task 4.3 precedent:

  Duplicate search first — UNFILTERED beyond open state
  (no label or assignee filters), reusing an existing open
  issue if one already covers this change:
  ```bash
  gh issue list --repo unbound-force/unbound-force \
     --state open --search "rebase-pr"
  ```

  Then file the in-repo docs issue via
  `gh issue create --label "docs"` with a Dispositions
  body naming every surface and its disposition (updated
  or no-change, plus why): `CHANGELOG.md` (task 3.4),
  `AGENTS.md` (task 3.1), `docs/usage.md` (task 3.2),
  `docs/architecture.md` (task 3.3), and `README.md`.
  Include the content-coverage disposition: either file a
  tutorial issue (label "tutorial") for the multi-step
  `/uf.rebase-pr` workflow or record a below-threshold
  rationale, and record the blog candidacy judgment the
  same way.

  Then file the website sync issue in
  `unbound-force/website` per constitution v1.4.0
  Cross-Repo Documentation.

  Finally, record both issue numbers: as a "Filed:" line
  under this task (precedent style), in the CHANGELOG.md
  entry's `(Docs: ...)` line (task 3.4), and in
  proposal.md's Impact section.
