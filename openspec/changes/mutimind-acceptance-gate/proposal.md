## Why

The `muti-mind-po.md` agent file contains a `go run cmd/mutimind/main.go decide ...` command block (lines 70-72) that executes acceptance decisions (`accept`/`reject`/`conditional`) without requiring explicit user confirmation. Acceptance decisions are irreversible governance artifacts that affect downstream workflow -- a rejected item cannot be un-rejected without re-running the entire acceptance flow.

The existing "Interactive Approval" rule at line 60 covers story generation (`go run ... add`) but has no parallel for the `decide` command. This is a T1 (irreversible external action without confirmation) and T2 (missing approval gate) weakness identified in the parent audit (issue #346).

All sibling T1/T2/T3 weaknesses in other commands and skills have been fixed by merged PRs #391-#408. This is one of the last remaining open items.

Fixes #351.

## What Changes

Add a mandatory `AskUserQuestion` confirmation gate in the `muti-mind-po.md` agent file immediately before the acceptance decision CLI command block. The gate presents the decision details to the user and requires explicit confirmation before the Go backend is invoked.

## Capabilities

### New Capabilities
- `acceptance-decision-confirmation`: AskUserQuestion gate before `go run cmd/mutimind/main.go decide` that presents the target backlog item (BI-NNN), proposed decision (accept/reject/conditional), and rationale summary for user confirmation.

### Modified Capabilities
- `Acceptance Authority` section: Restructured to include the confirmation gate before the CLI invocation, matching the pattern established by the "Interactive Approval" rule for story generation.

### Removed Capabilities
- None.

## Impact

- **File**: `.opencode/agents/muti-mind-po.md` (lines 62-72, Acceptance Authority section)
- **Behavior**: The agent will present acceptance decision details and wait for user confirmation before executing the CLI command. If the user selects "Abort", the decision is not recorded.
- **Downstream**: No impact on the Go backend (`cmd/mutimind/main.go`), schemas, or other agent files. The change is purely in the agent's instruction text.
- **Testing**: Manual verification that the agent prompts before executing the decide command. No Go code changes, so no unit tests required.
- **Scaffold**: No scaffold asset exists for `muti-mind-po.md` under `internal/scaffold/assets/`, so no scaffold sync is required.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instructions, not artifact formats or inter-hero communication. The acceptance-decision artifacts produced by the Go backend remain unchanged.

### II. Composability First

**Assessment**: N/A

The Muti-Mind agent remains independently usable. No new dependencies are introduced. The confirmation gate uses the existing AskUserQuestion tool already available to the agent.

### III. Observable Quality

**Assessment**: PASS

The acceptance decision continues to be produced by the Go CLI backend with full schema compliance and provenance metadata. The confirmation gate adds transparency by making the decision visible to the user before execution.

### IV. Testability

**Assessment**: N/A

No new code is introduced. The change is to agent instruction text (Markdown). The Go backend and its tests are unaffected.

### V. Security by Default

**Assessment**: PASS

This change directly improves security posture by preventing an irreversible governance action from firing without explicit user confirmation. It follows the principle of requiring validation before security-sensitive operations (acceptance decisions affect workflow governance).
