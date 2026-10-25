---
tier: validated
compiled_at: 2026-10-25T16:39:07Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - finale-20260622T190430-jay-flowers
  - finale-20260622T190435-jay-flowers
  - finale-reliability-20260929T194716-jay-flowers
  - finale-reliability-20260929T194719-jay-flowers
topic: finale
---

# Finale

## Current State (October 2026)

### Branch & Push Safety

- /uf.finale never commits to `main`: it operates on the feature
  branch, verifies no secrets are present in the tree, and returns
  to `main` after completion.
- Staging is explicit via `uf_finale_stage`, honoring the repo's
  never-`git add -A` / `git add .` practice.
- Untracked `openspec/changes/` artifacts MUST be committed with the
  implementation edit, not left behind.
- Commit authorship uses `normalizeModelName`; git trailers are
  validated against `[a-zA-Z0-9._-]+`.

### PR Creation & Context

- PRs are created via `uf_finale_create_pr`, which writes the body
  to a temp file to avoid shell injection.
- Step 5 sub-steps are lettered a-h: a=fork detection, b=generate
  title, c=PR template detection, d=generate body, e=review-council
  findings, f=show for approval, g=create, h=report URL; inserting
  a sub-step requires re-sequencing all subsequent letters.
- Confirmation gates (Steps 3 and 5f) carry a VISIBILITY DIRECTIVE:
  the agent MUST print the full proposed text as plain assistant
  output BEFORE invoking a tool that renders only summary content.
- Originating-issue threading: `.openspec.yaml` `originating_issue`
  emits `Closes #N` in the PR body; a branch-scoped route decision's
  `issue_number` takes precedence on `/uf.unleash`-routed branches.
- The github-pr-assign skill auto-assigns new PRs and closed issues
  to jflowers.

### CI Polling

- CI status is polled via `uf_finale_ci_poll`.
- A POST-CI MOMENTUM CHECKPOINT follows the CI-watch step: mark the
  step complete, proceed immediately WITHOUT user-facing output, and
  defer all reporting to the final summary. This counters the
  post-compression failure mode where agents treat "report results"
  as a stopping point.

### Unleash-Summary Artifact

- `uf_finale_pr_context` reads
  `.uf/artifacts/unleash-summary/<sanitized-branch>.json`, written
  by `write_unleash_summary` since Oct 16 (commit 2531531, issue
  #707) — the formerly-null PR context defect is closed.

### Base Sync

- Base remote resolution prefers `upstream`, else `origin`; the
  remote HEAD symbolic ref is used with `main` as fallback, and
  ahead/behind counts are reported.
- Template section 4 branches on `BASE_SYNC_FETCH` or
  `BASE_SYNC_COUNT`; the gate is soft — a freshness check never
  blocks the finale.

## History

- Template extraction cut `uf.finale.md` from 1,104 to 333 lines
  (~70% reduction) by moving mechanical choreography — staging, PR
  creation, CI polling, context reads — into executable tooling,
  per the determinism gate.
- The base-sync step then regrew the template from 333 to 391 lines
  (commits e072f2a-7e11c6b), adding the section 4 soft gate and
  BASE_SYNC_COUNT consumption wiring.
- Issue #707's null PR context was closed when the unleash-summary
  artifact producer landed Oct 16 (commit 2531531).
- Reliability hardening (Sept 29) introduced the VISIBILITY
  DIRECTIVE (Steps 3 and 5f, plus /uf.review-council Step 7f) and
  the POST-CI MOMENTUM CHECKPOINT to survive context compression.
- Scaffold drift practice (June 22): `.opencode/commands/finale.md`
  has an embedded copy at
  `internal/scaffold/assets/opencode/commands/finale.md`; verify
  byte-identity with `go test -race -count=1 -run
  TestEmbeddedAssets_MatchSource ./internal/scaffold/` — the
  targeted run avoids integration-test timeouts on Dewey/Ollama.
