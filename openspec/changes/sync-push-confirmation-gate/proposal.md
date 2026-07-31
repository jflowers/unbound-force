## Why

`/muti-mind.sync-push` immediately invokes `go run cmd/mutimind/main.go sync-push`
with no user confirmation step. This command creates new GitHub Issues or updates
existing ones -- irreversible external actions that modify state outside the local
repository.

This violates the established confirmation gate pattern used by every other command
that performs irreversible external actions (e.g., `/review-pr`, `/triage-issue`,
`/address-feedback` all use `AskUserQuestion` before posting to GitHub).

The fix was identified in the root cause analysis of issue #346, classified as
weakness type T1: irreversible external action without mandatory AskUserQuestion
immediately before it.

Fixes #349.

## What Changes

The `/muti-mind.sync-push` slash command gains a mandatory confirmation gate
that previews what will be synced before executing the Go backend.

## Capabilities

### New Capabilities
- `sync-push-preview`: Before executing, the command shows the user what backlog
  items will be created or updated on GitHub and requires explicit confirmation.

### Modified Capabilities
- `muti-mind.sync-push`: Adds a preview-then-confirm step before invoking
  `go run cmd/mutimind/main.go sync-push`. The backend invocation itself is
  unchanged.

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/commands/muti-mind.sync-push.md` -- the slash command
  instructions are updated with a confirmation gate
- **Backend**: No changes to `cmd/mutimind/main.go` or `internal/sync/` -- the
  Go backend behavior is unchanged
- **User workflow**: Users will see a summary of what will be synced and must
  confirm before the push executes. This adds one interaction step but prevents
  accidental or unintended GitHub issue creation/modification.
- **Scaffold**: No scaffold asset exists for `muti-mind.sync-push.md` under
  `internal/scaffold/assets/`, so no scaffold sync is required.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies a slash command's interaction flow, not
artifact-based inter-hero communication. No artifacts or
self-describing outputs are affected.

### II. Composability First

**Assessment**: PASS

The change is entirely within the Muti-Mind command definition.
No dependencies on other heroes are introduced. The Go backend
remains independently usable via CLI.

### III. Observable Quality

**Assessment**: N/A

No machine-parseable output formats are affected. The change
adds a user-facing preview step in the agent command, not in
the backend output.

### IV. Testability

**Assessment**: PASS

The confirmation gate is a command-level instruction change
(markdown, not Go code). The Go backend's `sync-push`
functionality remains testable in isolation. Verification
of the new behavior is structural review of the command
file (task 2.1) rather than automated tests, since no
executable code is modified.

### V. Security by Default

**Assessment**: PASS

This change directly improves security posture by adding a
human confirmation gate before irreversible external actions
(GitHub issue creation/modification). This enforces least
privilege: the agent cannot autonomously create or modify
external resources without explicit user consent.
