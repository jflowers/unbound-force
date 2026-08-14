## Why

Several agent commands contain high-risk mutation points (code edits,
git commits, git push, PR review posting, spec file edits) that lack
the established `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<`
marker pattern. Without these explicit stop markers, agents under
compressed context can read past prose-only confirmation gates and
execute mutations autonomously.

The pattern is already proven in `uf.review-council.md` (Step 7f),
`uf.review-pr.md` (review posting), and `uf.finale.md` (Steps 2
and 5). An audit (issue #474, discovered via #465/#473) revealed
the same structural vulnerability in 4 commands with 10+
individual mutation sub-steps across 7 unguarded entry points,
consolidated into 5 new gates after design decisions.

Fixes #474.

## What Changes

Add `>>> MANDATORY GATE: HUMAN CONFIRMATION REQUIRED <<<` markers
at every unguarded mutation entry point across 4 commands. Each gate
includes the session-resume guard, AskUserQuestion tool requirement,
and `>>> END MANDATORY GATE <<<` closing marker.

## Capabilities

### New Capabilities
- None — this change adds guardrails, not features.

### Modified Capabilities
- `uf.address-feedback`: Phase 4 entry gate before code file edits,
  commits, and push operations
- `uf.review-pr`: Fix-branch commit gate before committing
  AI-generated code to the fix branch
- `uf.review-council`: Spec file edit gate before auto-applying
  LOW/MEDIUM spec fixes
- `uf.finale`: Gates at Steps 3 (commit) and 4 (push); Steps 2,
  5, 6, and 6b already have correct gates (FR-006)

### Removed Capabilities
- None

## Impact

**Files affected** (8 total — 4 canonical + 4 scaffolded copies):
- `.opencode/commands/uf.address-feedback.md`
- `.opencode/commands/uf.review-pr.md`
- `.opencode/commands/uf.review-council.md`
- `.opencode/commands/uf.finale.md`
- `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
- `internal/scaffold/assets/opencode/commands/uf.review-pr.md`
- `internal/scaffold/assets/opencode/commands/uf.review-council.md`
- `internal/scaffold/assets/opencode/commands/uf.finale.md`

**Behavioral impact**: Agents will pause at additional mutation
points for human confirmation. This increases safety at the cost
of slightly more interactive sessions.

**No Go code changes**: This is a documentation/command-file-only
change. No build, test, or CI impact.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.2.0).

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent command files (instruction documents),
not artifact schemas or inter-hero communication formats. Heroes
continue to collaborate through well-defined artifacts.

### II. Composability First

**Assessment**: N/A

No hero dependencies are introduced or modified. The gate markers
are internal to individual command workflows and do not affect
standalone hero functionality.

### III. Observable Quality

**Assessment**: PASS

The mandatory gate pattern produces observable confirmation events
(AskUserQuestion tool invocations) that are visible in session logs
and provide auditable evidence of human approval before mutations.

### IV. Testability

**Assessment**: N/A

This change modifies Markdown instruction files, not executable
code. The existing drift detection tests (embedded asset sync)
will verify that `.opencode/commands/` and
`internal/scaffold/assets/opencode/commands/` remain in sync.

### V. Security by Default

**Assessment**: PASS

This change directly strengthens the security posture by ensuring
that all high-risk mutations (code changes, git operations, PR
interactions) require explicit human authorization. It enforces
least privilege by preventing agents from autonomously executing
mutations that could alter repository state.
