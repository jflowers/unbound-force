# Finale Push Gate

## Why

Step 4 of `/finale` ("Push to Remote") executes `git push`
immediately after a divergence check with no AskUserQuestion
gate before the push command. Pushing to a remote is an
irreversible external action -- once pushed, code becomes
public on the remote and is only reversible by additional
commits.

Per the policy established by issue #346: every irreversible
external action requires a mandatory AskUserQuestion gate
immediately before execution. The `/address-feedback` command
already follows this pattern (section 4.4), having been
updated by the `askuser-tool-confirmations` change. The
`/finale` command was not covered by that change.

This is weakness type T1: irreversible external action without
mandatory AskUserQuestion immediately before it.

Fixes: #348

## What Changes

Add a mandatory AskUserQuestion confirmation gate in Step 4 of
the `/finale` command, immediately before the `git push`
execution. The gate uses structured options with
action-context labels adapted from the `/address-feedback`
section 4.4 pattern. Unlike `/address-feedback` which gates
only on divergence, `/finale` gates unconditionally because
it is the terminal publishing step in the workflow.

Additionally, Step 4 gains a divergence warning (`git fetch`
+ `git status`) before the gate so the user sees the branch
state before confirming. The current Step 4 only checks
whether an upstream is set; it does not fetch remote state.

Both the `.opencode/commands/finale.md` command file and its
scaffold asset copy at
`internal/scaffold/assets/opencode/commands/finale.md` must
be updated to remain byte-identical.

## Capabilities

### New Capabilities
- `finale-push-confirmation`: AskUserQuestion gate before
  `git push` in `/finale` Step 4, with structured options
  `["Push to remote", "Abort -- keep commits local"]`.

### Modified Capabilities
- `/finale` Step 4: Push is no longer automatic; requires
  explicit human confirmation via AskUserQuestion tool
  before execution.

### Removed Capabilities
- None

## Impact

- `.opencode/commands/finale.md` -- Step 4 push section
  (lines ~157-166)
- `internal/scaffold/assets/opencode/commands/finale.md` --
  scaffold copy must mirror the command file exactly

No Go source code, tests, or CI workflows are affected.
This is a command-file-only change.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies a slash command's interaction flow.
It does not affect artifact-based communication or
inter-hero collaboration patterns.

### II. Composability First

**Assessment**: N/A

This change does not introduce dependencies between
heroes or affect standalone functionality.

### III. Observable Quality

**Assessment**: N/A

This change does not affect machine-parseable output
or provenance metadata.

### IV. Testability

**Assessment**: N/A

This is a markdown command file change. The scaffold
drift detection test (`internal/scaffold/`) will verify
that both copies remain in sync.

### V. Security by Default

**Assessment**: PASS

This change directly strengthens security by adding
a mandatory human confirmation gate before an
irreversible external action (git push). It enforces
the principle that security controls are structural,
not review-time afterthoughts. The AskUserQuestion
gate prevents accidental or unauthorized pushes when
the agent operates under a human's identity.
