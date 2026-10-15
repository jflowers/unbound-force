## Why

`/uf.unleash` Step 10 composes the highest-fidelity summary of a
change that exists anywhere in the pipeline: **What Was Built**
(sourced from spec user stories or proposal), **How to Verify**
(sourced from acceptance scenarios), and **Test Results** (sourced
from the most recent build/test checkpoint). That structured output
is presented once in the TUI and then discarded.

`/uf.finale` regenerates its PR body from scratch (git log, spec
artifacts) and ignores the Step 10 output entirely (#707). The
`finale-token-reduction` change already built the consumer half:
`uf_finale_pr_context` reads
`.uf/artifacts/unleash-summary/<slug>.json` and returns it as
`unleashSummary`, which `uf.finale.md` prefers for `## Summary` and
`## How to Test`. But no producer ever writes that file — a latent
defect documented in the Dewey learning
`token-reduction-20261014T110708`: the finale context is always
null. This change supplies the missing producer side so the
existing consumer finally has input.

## What Changes

1. **New `persist_unleash_summary` tool** in the `uf-workflow`
   plugin (factory `createPersistUnleashSummaryTool(exec, cwd)`):
   - Accepts the three LLM-composed markdown sections as string
     parameters (`whatWasBuilt`, `howToVerify`, `testResults`).
   - Deterministically handles branch detection
     (`git rev-parse --abbrev-ref HEAD`), slug sanitization
     (`sanitizeSlug`), directory creation, JSON serialization,
     and overwrite-on-re-run.
   - Writes `.uf/artifacts/unleash-summary/<sanitized-branch>.json`
     (gitignored, runtime-only) with flat camelCase content fields
     matching the implemented `uf_finale_pr_context` read contract,
     plus provenance metadata (`artifact_type`, `schema_version`,
     `branch`, `timestamp`).
   - Validates all three parameters are non-empty strings;
     refuses symlinked target paths (matching the checkpoint
     `writeState` hardening pattern).

2. **`/uf.unleash.md` Step 10 extension** — after the demo format
   block, before the CHECKPOINT, a new instruction to call
   `persist_unleash_summary` with the exact section content just
   presented. On tool failure: warn and continue (soft-fail; the
   demo output is already delivered and `/uf.finale` retains its
   no-artifact fallback).

3. **Scaffold sync** — mirror the `uf.unleash.md` command and
   `uf-workflow` plugin changes to
   `internal/scaffold/assets/opencode/` (drift tests enforce
   byte parity; no new asset files, so counts are unchanged).

4. **Tests** — `.opencode/test/uf-workflow.test.ts` coverage for
   the new tool: happy path, branch slug path, schema shape
   (contract with the finale consumer), overwrite semantics,
   non-empty validation, detached-HEAD and filesystem failures.

**Not changing**: `uf.finale.md` and the `uf-finale` plugin — the
consumer side is already implemented and specced by
`finale-token-reduction`. Deviation from issue #707's proposed
envelope schema (`payload.what_was_built`, snake_case) is
deliberate and required for compatibility with the implemented
consumer; see design.md.

## Capabilities

### New Capabilities
- `unleash-summary`: Producer-side persistence of the Step 10
  demo summary as a machine-readable JSON artifact at a
  well-known path, keyed by sanitized branch, consumable by
  `/uf.finale` and any future downstream tool.

### Modified Capabilities
- None — the baseline specs (`openspec/specs/`) do not yet cover
  `/uf.unleash` Step 10 or the artifact; all requirements here
  are additions.

### Removed Capabilities
- None.

## Impact

- **Files modified**: `.opencode/plugins/uf-workflow/index.ts`,
  `.opencode/commands/uf.unleash.md`,
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`,
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`,
  `.opencode/test/uf-workflow.test.ts`
- **No files created** — no new committed directories; the
  artifact lands in the already-gitignored `.uf/artifacts/`
- **Runtime behavior**: after Step 10 demo output, a JSON file is
  written under `.uf/artifacts/unleash-summary/` (never committed)
- **`/uf.finale` behavior**: unchanged (it already prefers the
  artifact when present and falls back when absent)
- **Failure mode**: soft — artifact write failure warns and the
  workflow continues to CHECKPOINT

## Constitution Alignment

Assessed against the Unbound Force org constitution.

### I. Autonomous Collaboration

**Assessment**: PASS

`/uf.unleash` and `/uf.finale` continue to collaborate through
well-defined artifacts, not runtime coupling. The producer writes
a self-describing JSON file at a well-known path; the consumer
already reads it independently. Neither command invokes the
other.

### II. Composability First

**Assessment**: PASS

The tool is independently usable by any workflow that wants to
persist a summary, and `/uf.finale` remains fully functional
without the artifact (fallback path preserved and exercised in
existing tests). No mandatory dependency is introduced between
plugins or commands.

### III. Observable Quality

**Assessment**: PASS

The artifact is machine-parseable JSON with provenance metadata
(`artifact_type`, `schema_version`, `branch`, `timestamp`). The
tool returns the standard `success()`/`failure()` envelope with
structured error codes, following the `uf-workflow` pattern.

### IV. Testability

**Assessment**: PASS

The tool factory follows the established dependency-injection
pattern (`GitExec` + cwd parameters), so tests inject a fake git
executor and a temp directory — no real repository or external
services required. The schema-shape test pins the producer
contract to the consumer's read path.
