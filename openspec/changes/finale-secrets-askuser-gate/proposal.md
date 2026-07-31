## Why

The `/uf.finale` command's secrets check gate (Step 2, lines 63-83)
relies on prose instructions to ask for user confirmation before
staging potentially sensitive files. The confirmation is expressed
as plain text:

> "Ask for confirmation. If the user declines, stop and let them
> handle it manually."

This is a T3 weakness (inline text confirmation, not enforced by
a tool call). Under context compression or fast-path reasoning,
an agent can treat this prose as informational and proceed to
`git add .` without explicit user confirmation, potentially
staging files that contain secrets (`.env`, `*.key`, `*.pem`,
`credentials.json`).

The sibling push gate (Step 4) was already fixed in PR #405
with an explicit AskUserQuestion tool call at line 175. This
change applies the same pattern to the secrets check gate.

Fixes: https://github.com/unbound-force/unbound-force/issues/347

## What Changes

Replace the prose confirmation at lines 80-81 of
`.opencode/commands/uf.finale.md` (and its scaffold copy in
`internal/scaffold/assets/opencode/commands/uf.finale.md`) with
an explicit AskUserQuestion tool call that blocks execution
until the user responds.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `secrets-check-gate`: The secrets file warning in Step 2 of
  `/uf.finale` now uses an explicit AskUserQuestion tool call
  with binary options instead of prose instructions. This
  ensures agents cannot skip the confirmation under context
  compression.

### Removed Capabilities

- None

## Impact

- **Files**: `.opencode/commands/uf.finale.md` and
  `internal/scaffold/assets/opencode/commands/uf.finale.md`
  (both must stay in sync)
- **Behavior**: Agents executing `/uf.finale` will now be
  structurally required to pause for user confirmation when
  potential secret files are detected, matching the pattern
  already established by the push gate at line 175.
- **Risk**: Low. This is a narrowly-scoped change to an
  instruction file. No Go source code, tests, or CI
  configuration is affected.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: N/A

This change modifies agent instruction prose within a slash
command file. It does not affect artifact-based communication
between heroes or inter-hero collaboration patterns.

### II. Composability First

**Assessment**: N/A

This change is internal to the `/uf.finale` command. It does
not introduce dependencies between heroes or affect standalone
functionality.

### III. Observable Quality

**Assessment**: N/A

This change does not affect machine-parseable output or
provenance metadata. The AskUserQuestion tool call produces
user-visible interaction, not data artifacts.

### IV. Testability

**Assessment**: PASS

The fix is structurally verifiable: a drift detection test can
confirm the scaffold copy matches the command file, and the
presence of the AskUserQuestion pattern can be validated by
grep-based assertions. The existing scaffold drift tests
already cover this file pair.

### V. Security by Default

**Assessment**: PASS

This change directly strengthens security by converting a
prose-only confirmation gate into a tool-enforced gate,
preventing agents from accidentally staging secret files.
This addresses the T3 weakness class identified in the
parent audit (issue #346).
