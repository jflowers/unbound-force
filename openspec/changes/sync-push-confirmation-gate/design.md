## Context

The `/muti-mind.sync-push` command invokes
`go run cmd/mutimind/main.go sync-push [item_id]` directly
without any preview or confirmation step. This creates or
updates GitHub Issues -- irreversible external state changes.

Every other command that performs irreversible external actions
(posting PR reviews, creating issues, posting comments) uses
the `AskUserQuestion` tool as a mandatory confirmation gate.
The sync-push command is the only one that bypasses this
pattern.

The Go backend (`cmd/mutimind/main.go:264-279`) calls
`syncer.Push(id)` which uses the `gh` CLI to create/update
GitHub Issues. The companion `sync-status` command
(`cmd/mutimind/main.go:293-303`) calls `syncer.Status()` to
report the current sync state without side effects.

## Goals / Non-Goals

### Goals
- Add a mandatory confirmation gate before GitHub Issue
  creation/modification in the sync-push command
- Preview what will be synced so the user can make an
  informed decision
- Follow the established AskUserQuestion pattern used by
  other commands

### Non-Goals
- Modifying the Go backend (`cmd/mutimind/`, `internal/sync/`)
- Adding dry-run mode to the Go backend (future work)
- Changing `sync-pull`, `sync-status`, or `sync` commands
  (note: `/muti-mind.sync` has the same T1 vulnerability
  since `syncer.Sync()` calls `syncer.Push()` internally;
  this will be addressed in a follow-up issue)
- Adding granular per-item confirmation (all-or-nothing)

## Decisions

### D1: Command-level change only

The fix is entirely within the slash command markdown file
(`.opencode/commands/muti-mind.sync-push.md`). The Go backend
is unchanged. This keeps the change minimal and avoids
modifying tested backend code for what is an agent interaction
concern.

This aligns with Composability First: the Go backend remains
independently usable via CLI without a confirmation gate (CLI
users manage their own intent).

### D2: Use sync-status for preview

Before confirmation, run `go run cmd/mutimind/main.go sync-status`
to show the user what items exist and their current sync
state. This reuses existing backend functionality rather
than inventing new preview logic.

Note: `sync-status` always reports on all items -- it does
not accept an `[item_id]` filter argument. The preview
always shows the full sync state regardless of whether a
specific `item_id` was provided to the sync-push command.

### D3: AskUserQuestion with explicit options

Use the `AskUserQuestion` tool with two options:
- "Yes -- sync to GitHub"
- "No -- abort"

This follows the binary confirmation pattern established by
`/review-pr` and `/triage-issue`. The abort path exits
cleanly with a message, no partial work.

### D4: Preview summary format

The preview shows:
- Number of items that will be **created** (no GitHub Issue)
- Number of items that will be **updated** (existing Issue)
- List of item IDs with their sync direction

This gives the user enough context without overwhelming detail.

## Risks / Trade-offs

### Added friction (accepted)
Users must now confirm before every sync-push. This is
intentional: the prior behavior allowed accidental creation
of GitHub Issues with no undo path. One extra interaction
step is an acceptable trade-off for preventing irreversible
mistakes.

### sync-status output parsing (low risk)
The preview relies on the agent interpreting sync-status
output. If the backend output format changes, the preview
may show raw output rather than a structured summary. This
is low risk because the agent only needs to relay the output,
not parse it programmatically.

### No per-item granularity (accepted)
When syncing all items, users cannot selectively exclude
individual items. This is a non-goal for this change. Users
who need granularity can use the `item_id` argument to sync
one item at a time.
