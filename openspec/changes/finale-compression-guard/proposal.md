## Why

When OpenCode's context compression fires during a `/uf.finale`
session, the 869-line command template is summarized and
procedural instructions for remaining steps are lost. This
causes four observed failure modes:

1. **PR body approval gate lost** (Step 5f) -- the agent
   may create a PR with content never shown to the user
2. **Conflict recovery option lost** (Step 6b) -- the agent
   loses which option the user selected mid-recovery
3. **Secrets check gate lost** (Step 2) -- the agent may
   stage files without the security warning
4. **CI watch context lost** (Step 6) -- the agent loses
   the PR number and may falsely report CI status

This is the same root cause as #373 (`/review-pr` compression
vulnerability), and the fix applies the same proven pattern.

Fixes: https://github.com/unbound-force/unbound-force/issues/379

## What Changes

Add compression-resistant guards to `/uf.finale` using
the three-part remediation pattern proven in PR #371
for `/review-pr`:

1. **Session-resume guard** -- blockquote at the top of the
   file instructing the agent to re-read the template on
   resume and not infer step completion from compressed
   summaries

2. **Execution checklist** -- a live checklist the agent
   updates in-place using the Edit tool as each step
   completes, preserving key state (branch name, commit
   hash, PR number, PR URL) across compression boundaries

3. **Step-level checkpoint reminders** -- one-line
   checkpoint at the end of each critical step reminding
   the agent to mark the checklist before proceeding

## Capabilities

### New Capabilities
- `compression-resistant-state`: Live checklist that
  preserves workflow state (branch, commit, PR number)
  across context compression events
- `session-resume-detection`: Guard that detects resumed
  sessions and re-reads the template instead of relying
  on compressed summaries

### Modified Capabilities
- `uf.finale`: Enhanced with compression guards at all
  critical gates (Steps 2, 5f, 6, 6b)

### Removed Capabilities
- None

## Impact

- **Files modified**: `.opencode/commands/uf.finale.md`
  and its scaffold copy at
  `internal/scaffold/assets/opencode/commands/uf.finale.md`
- **Drift test**: Existing drift detection tests will
  verify the scaffold copy matches the command file
- **Line count**: Expect ~40-60 additional lines (guards,
  checklist, checkpoint reminders)
- **No code changes**: This is a command template change
  only -- no Go source modifications

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies a slash command template, not
inter-hero artifact communication. No impact on
artifact-based collaboration.

### II. Composability First

**Assessment**: N/A

This change is internal to the `/uf.finale` command
template. No new dependencies introduced. The command
remains independently functional.

### III. Observable Quality

**Assessment**: PASS

The execution checklist produces observable state
(branch name, commit hash, PR number) that persists
across compression. This improves auditability of the
workflow execution.

### IV. Testability

**Assessment**: PASS

The checklist state is human-readable and
machine-parseable. Drift detection tests already verify
scaffold copy matches the command file.

### V. Security by Default

**Assessment**: PASS

This change directly hardens security gates. The
secrets check gate (Step 2), PR body approval gate
(Step 5f), and conflict recovery gate (Step 6b) are
all protected against compression-induced bypass.
Without this fix, compression can silently skip
security confirmations.
