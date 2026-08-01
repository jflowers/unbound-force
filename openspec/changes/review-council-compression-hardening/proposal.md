## Why

When OpenCode's context compression is enabled, the
`/uf.review-council` command template (799 lines) is injected
as conversation content and becomes subject to compression
heuristics. Early phases (Phase 1a pre-flight, Phase 1b Gaze,
Phase 1c review-context) are marked "cleanly closed" and
compressed into a summary that preserves data but discards
procedural instructions for subsequent steps.

Three concrete failure modes result (issue #378):

1. **Full-branch-diff review scope rule lost** -- The CRITICAL
   review scope rule (Step 2) requiring
   `git diff main...HEAD` is compressed away. Divisor agents
   default to reviewing only recent or visible changes,
   producing incomplete reviews.

2. **Fix loop iteration count lost** -- Step 4 runs a fix
   loop of up to 3 iterations. If compression fires
   mid-loop, the agent loses the iteration counter and may
   restart from 1 (exceeding the limit) or skip to Step 6.

3. **Step 7f APPROVE gate bypassed** -- The CRITICAL RULE
   requiring explicit human confirmation via AskUserQuestion
   before posting any GitHub review can be lost to
   compression, allowing the agent to post an APPROVE
   review without user consent.

The root cause is identical to #373 (`/uf.review-pr`): the
command template is conversation content subject to
compression. The same three-part remediation pattern applies.

## What Changes

Apply compression-resistance hardening to
`.opencode/commands/uf.review-council.md` (and its scaffold
copy) using the same three-part pattern proven in PR #371
for `/uf.review-pr`:

1. **Session-resume guard** -- A blockquote at the top of
   the file instructing the agent to re-read the template
   on resume and not infer step completion from compressed
   summaries.

2. **Execution checklist with Edit tool instruction** -- A
   live checklist the agent updates in-place using the Edit
   tool as each phase/step completes. The checklist is
   compression-resistant because it is actively maintained
   content, not passive instructions.

3. **Step-level checkpoint reminders** -- One-line checkpoint
   at the end of each phase/step reminding the agent to mark
   the checklist before proceeding.

4. **Step 7f MANDATORY GATE markers** -- Wrap the Step 7f
   confirmation gate with high-salience ASCII delimiters
   (`>>> MANDATORY GATE <<<`) that survive compression as
   distinctive tokens.

## Capabilities

### New Capabilities
- `compression-resistant-checklist`: Live execution
  checklist that the agent maintains via Edit tool,
  preventing compressed-context state loss
- `session-resume-guard`: Top-of-file instruction for
  context recovery after compression events
- `step-checkpoint-reminders`: Per-step reminders to update
  the checklist before proceeding

### Modified Capabilities
- `uf.review-council`: Hardened against context compression
  with session-resume guard, execution checklist, step
  checkpoints, and MANDATORY GATE markers

### Removed Capabilities
- None

## Impact

- **Files**: `.opencode/commands/uf.review-council.md` and
  `internal/scaffold/assets/opencode/commands/uf.review-council.md`
  (scaffold copy must stay in sync)
- **Behavior**: Agents executing `/uf.review-council` will
  maintain an in-place checklist during execution. No
  behavioral change to the review workflow itself -- all
  existing steps, gates, and verdicts remain identical.
- **Line count**: Estimated +40-60 lines (guard, checklist,
  checkpoints, gate markers). The file grows from ~799 to
  ~850-860 lines.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies a command template's internal
structure. It does not affect artifact-based communication
between heroes or inter-hero coupling.

### II. Composability First

**Assessment**: PASS

The change is self-contained within the review-council
command. No new dependencies are introduced. The command
remains independently usable.

### III. Observable Quality

**Assessment**: PASS

The execution checklist produces a machine-readable
progress record within the command file itself. Each
phase completion is explicitly tracked, improving
observability of the review workflow's execution state.

### IV. Testability

**Assessment**: PASS

The hardening additions are structural markers and
instructions within a Markdown file. They can be verified
by grep-based drift detection tests (marker count, guard
presence, checklist completeness).

### V. Security by Default

**Assessment**: PASS

This change directly hardens the Step 7f APPROVE gate --
a security-critical confirmation boundary. The MANDATORY
GATE markers and session-resume guard prevent the agent
from posting GitHub reviews without explicit human
consent, even after context compression events.
