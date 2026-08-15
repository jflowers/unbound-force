## Why

OpenCode's DCP (Dynamic Context Preservation) plugin
compresses conversation history during long sessions to
stay within token limits. Slash commands are injected as
user messages, which DCP treats as compressible content.
Unlike skills (which use `tool_use`/`tool_result` pairs
protected by DCP's `protectedTools` config), slash command
content has no compression immunity.

This causes critical sections -- guardrails, execution
checklists, mandatory gates, session-resume guards -- to
be summarized or dropped during compression. When an agent
resumes after compression and the guardrails have been
lost, it may skip mandatory human confirmation gates,
post duplicate PR reviews, force-push, or violate phase
boundaries.

DCP supports `<protect>` tags that mark content as
non-compressible. Wrapping critical slash command sections
in `<protect>` tags ensures they survive compression
cycles intact.

Fixes #497.

## What Changes

Add `<protect>` tags around critical sections in the 6
slash command source templates under
`internal/scaffold/assets/opencode/commands/`:

1. `uf.unleash.md` (769 lines, CRITICAL priority)
2. `uf.review-pr.md` (1098 lines, CRITICAL priority)
3. `uf.review-council.md` (875 lines, CRITICAL priority)
4. `uf.finale.md` (971 lines, CRITICAL priority)
5. `uf.address-feedback.md` (569 lines, HIGH priority)
6. `uf.triage-issue.md` (497 lines, HIGH priority)

Note: Issue #497 listed 10 files but 4 do not exist
(`uf.checklist.md`, `uf.sync-issues.md`, `uf.daily.md`,
`uf.spec-review.md`). Only 6 command templates exist in
the scaffold assets directory.

## Capabilities

### New Capabilities
- `DCP compression immunity`: Critical slash command
  sections survive DCP compression cycles, preserving
  guardrails, execution state, and mandatory gates
  across long sessions.

### Modified Capabilities
- `uf.unleash`: SESSION-RESUME GUARD, EXECUTION
  CHECKLIST, and Guardrails sections protected.
- `uf.review-pr`: Execution mode check, session-resume
  guard, and MANDATORY GATE sections protected.
- `uf.review-council`: SESSION-RESUME GUARD, EXECUTION
  CHECKLIST, CRITICAL branch diff rule, and verdict
  confirmation gate protected.
- `uf.finale`: SESSION-RESUME GUARD, EXECUTION CHECKLIST,
  secret file detection gate, and Guardrails protected.
- `uf.address-feedback`: SESSION-RESUME GUARD, EXECUTION
  CHECKLIST, triage decision enforcement, and Guardrails
  protected.
- `uf.triage-issue`: Argument validation, re-run
  detection, verdict resolution rules, and Guardrails
  protected.

### Removed Capabilities
- None.

## Impact

- **Source templates**: 6 files in
  `internal/scaffold/assets/opencode/commands/` modified.
- **Scaffolded output**: Projects running `uf init` after
  this change receive commands with `<protect>` tags.
  Existing projects need `uf init --force` to update.
- **Behavioral**: No behavioral change when DCP is not
  compressing. When DCP compresses, protected sections
  are preserved verbatim instead of being summarized.
- **Token cost**: `<protect>` tags add ~20 characters per
  protected section (tag open + close). Negligible impact
  on token usage.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

This change improves artifact-based communication by
ensuring that slash command guardrails and execution
state survive across session boundaries. Agents can
autonomously resume work using the preserved execution
checklists and session-resume guards.

### II. Composability First

**Assessment**: N/A

No new dependencies introduced. `<protect>` tags are
a DCP feature already available in the runtime.

### III. Observable Quality

**Assessment**: PASS

Execution checklists and state variables remain
observable after compression. Provenance metadata
(branch names, commit SHAs, PR numbers) in checklists
is preserved.

### IV. Testability

**Assessment**: PASS

Existing scaffold drift tests verify embedded assets
match canonical sources. The `<protect>` tags are
plain text markers that do not affect test isolation
or verification.
