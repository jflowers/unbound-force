## Why

`uf.address-feedback.md` Phase 4.2 (Commit Changes) embeds a
verbatim ~17-line copy of the 6-step model name normalization
algorithm: strip provider prefix, strip `@` suffix, strip
`-YYYYMMDD` date suffix, strip trailing `-N` version segments,
validate charset, fall back to `unknown-model`. This is
deterministic mechanical procedure re-reasoned from prose on
every invocation — exactly what the `finale-token-reduction`
change extracted into the `normalize_model_name` tool
(`uf-workflow` plugin) for `/uf.finale`.

Issue #709 tracks the remaining half of that extraction. The
duplicated prose costs instruction tokens and creates drift
risk: the algorithm in `uf.address-feedback.md` can diverge
from the tested tool implementation.

## What Changes

1. **Replace the inline algorithm** in Phase 4.2 of
   `.opencode/commands/uf.address-feedback.md` with a
   `normalize_model_name` tool call instruction:
   - Call `normalize_model_name` with the raw model identifier
     from the system prompt; use the returned `normalized`
     value for the `Assisted-by:` trailer.
   - If the tool returns an error or `unknown-model`, warn the
     user (attribution falls back to `unknown-model`).
   - Preserve the surrounding commit format instruction and the
     existing warning behavior.

2. **Keep scaffold and live copies in sync**: apply the
   identical edit to
   `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
   (currently byte-identical to the live command; scaffold
   drift tests enforce parity).

No behavioral change: the tool implements the exact 6-step
algorithm the prose described, so the same model names are
produced.

## Capabilities

### New Capabilities
- None. `normalize_model_name` already exists in the
  `uf-workflow` plugin (shipped by `finale-token-reduction`)
  with unit tests in `.opencode/test/uf-workflow.test.ts`.

### Modified Capabilities
- `uf.address-feedback.md` Phase 4.2: commit attribution
  resolves the model family name via the
  `normalize_model_name` tool instead of an inline 6-step
  algorithm (~17 lines → ~6 lines of instruction).

### Removed Capabilities
- None. All existing behavior (commit format, warning on
  unresolvable model name) is preserved.

## Impact

- **Files modified**: 2 —
  `.opencode/commands/uf.address-feedback.md` and
  `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
  (identical edits, drift tests enforce parity).
- **Token reduction**: ~17 lines of procedural instruction
  replaced by a ~6-line tool call (~11 lines / ~65% of the
  algorithm block).
- **Tests**: No test clauses reference the inline algorithm
  text. `internal/scaffold` drift tests compare live and
  scaffold copies (both updated identically) and continue to
  pass. Plugin tool tests are untouched.
- **Risk**: Minimal. The tool is already deployed and tested;
  this change only redirects the command to call it.

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

The change strengthens artifact-based collaboration: the
command consumes the tool's self-describing JSON envelope
(`{normalized}` or `{normalized: "unknown-model", warning}`)
rather than re-deriving the value from prose. No runtime
coupling is introduced — `uf.address-feedback.md` and the
`uf-workflow` plugin already ship together in this repo.

### II. Composability First

**Assessment**: PASS

`normalize_model_name` is a shared tool already used by
`/uf.finale` (via `uf_finale_commit_context`) and now
`/uf.address-feedback`. Each command remains independently
functional; no mandatory dependencies are added.

### III. Observable Quality

**Assessment**: PASS

The tool returns machine-parseable JSON with a `warning` field
on failure — more observable than the prose fallback, which
relied on the model to remember to warn. Provenance is
unchanged (attribution trailer format preserved).

### IV. Testability

**Assessment**: PASS

The normalization algorithm executes in a tested tool
(`.opencode/test/uf-workflow.test.ts` covers standard IDs,
edge cases, empty input, date suffixes, version segments)
instead of untested prose. Scaffold parity remains verified by
`internal/scaffold` drift tests.

### V. Security by Default

**Assessment**: N/A

No new dependencies, inputs, permissions, or secrets. The tool
performs pure computation on a string.

### VI. Deterministic Execution

**Assessment**: PASS

This change is a direct application of the principle:
mechanical procedure (6-step string normalization) is
extracted from command prose into an executable, tested tool,
with the decision point (warn the user on `unknown-model`)
preserved in instruction prose.
