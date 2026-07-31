## Why

The `speckit.clarify` command (lines 100-134) describes a sequential
questioning loop entirely in prose: "Present EXACTLY ONE question at a
time", "wait for user to respond". No `AskUserQuestion` tool call is
specified. Under context compression the one-at-a-time requirement is
not enforced — an agent can present multiple questions or skip
straight to processing assumed answers.

This is a T3 weakness (confirmation gate / interaction requirement is
inline text only, not enforced by a tool call). The parent audit
(issue #346) identified this pattern as the root cause of the
review-pr confirmation gate bypass.

Fixes: https://github.com/unbound-force/unbound-force/issues/364

## What Changes

Add explicit `AskUserQuestion` tool call requirements to the
sequential questioning loop in `.opencode/commands/speckit.clarify.md`
(step 4, lines 100-134). The prose-only one-at-a-time instruction is
replaced with mandatory tool call language that survives context
compression.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `speckit.clarify sequential questioning`: Each clarification
  question MUST be delivered via AskUserQuestion tool call, with
  explicit prohibition on batching or advancing without a tool
  response

### Removed Capabilities
- None

## Impact

- **File**: `.opencode/commands/speckit.clarify.md` (step 4,
  lines ~100-134)
- **Behavioral**: Agents running `/speckit.clarify` will be
  constrained to use the AskUserQuestion tool for each question,
  preventing question batching or answer assumption under context
  compression
- **No scaffold copies**: Unlike `speckit.testreview.md`, the
  `speckit.clarify.md` file does not have copies in
  `cmd/unbound-force/.opencode/command/` or
  `internal/scaffold/.opencode/command/`, so only one file
  requires modification
- **Backward compatible**: No change to the questioning taxonomy,
  prioritization logic, or spec integration behavior

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies an interactive agent command that inherently
requires synchronous user interaction (clarification questions).
It does not affect artifact-based inter-hero communication.

### II. Composability First

**Assessment**: PASS

The change is contained within a single command file. No new
dependencies are introduced. The speckit.clarify command remains
independently usable.

### III. Observable Quality

**Assessment**: N/A

This change does not affect machine-parseable output formats or
provenance metadata. The clarification results are still recorded
in the spec file with the same format.

### IV. Testability

**Assessment**: PASS

The fix makes the questioning gate structurally enforceable via
tool calls rather than relying on prose interpretation. The
presence of AskUserQuestion tool calls in the command output is
a verifiable observable side effect.

### V. Security by Default

**Assessment**: N/A

No security-sensitive operations, dependencies, or input
validation paths are affected by this change.
