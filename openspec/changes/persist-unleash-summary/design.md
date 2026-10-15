## Context

Issue #707 asked for `/uf.unleash` to persist its Step 10 demo
summary so `/uf.finale` can use it for PR body generation. Since
that issue was filed, the landscape changed: the
`finale-token-reduction` change already implemented and specced
the **consumer** half. `uf_finale_pr_context`
(`.opencode/plugins/uf-finale/index.ts`) detects the current
branch, applies the shared `sanitizeSlug`, reads
`.uf/artifacts/unleash-summary/<slug>.json`, and returns the
parsed file wholesale as `unleashSummary` (null when absent).
`uf.finale.md` already prefers `unleashSummary.whatWasBuilt` for
`## Summary` and `unleashSummary.howToVerify` for `## How to
Test`, with a no-artifact fallback.

What is missing is the **producer**: no tool or command ever
writes the artifact, so the finale context is always null (latent
defect recorded in Dewey learning
`token-reduction-20261014T110708`). This change adds only the
producer side.

Constitution alignment carries over from the proposal: the
artifact is the collaboration boundary (I), the tool and the
fallback keep both halves independently usable (II), and the
JSON artifact with provenance metadata plus standard result
envelopes keep output machine-parseable (III).

## Goals / Non-Goals

### Goals
- Persist the three Step 10 demo sections as a JSON artifact at
  the exact path the implemented consumer reads
- Keep all mechanical steps (branch detection, slug, directory
  creation, serialization, overwrite) in an executable plugin
  tool per the determinism gate
- Preserve `/uf.finale`'s no-artifact fallback and leave the
  consumer side byte-identical
- Soft-fail semantics: a write failure must never block pipeline
  completion

### Non-Goals
- Modifying `uf.finale.md` or the `uf-finale` plugin (consumer
  is complete and specced by `finale-token-reduction`)
- Round tracking or history of summaries (issue #707: latest run
  is authoritative)
- Persisting the "Next Steps" section (`/uf.finale` does not
  consume it; it is workflow guidance, not PR content)
- Introducing an envelope-unwrapping change to the consumer

## Decisions

### D1: Plugin tool, not command prose (determinism gate)

Issue #707 originally proposed artifact-write instructions in
command markdown. The AGENTS.md determinism gate (CRITICAL
severity) forbids adding mechanical procedural prose where an
executable tool is feasible, and the token-reduction arc's
compiled learning identifies tool-executed deterministic logic
as the structural cure for post-compression drift. Branch
detection, path construction, JSON serialization, and overwrite
are mechanical; section content composition is judgment. The
split: Step 10 composes the three markdown strings (judgment),
`persist_unleash_summary` does everything else (mechanics).
Precedent: `review-dispatch` writes dispatch artifacts in plugin
code; `uf-workflow` already owns the Step 10-adjacent machinery
(`checkpoint`, `get_progress`, `clear_progress`).

### D2: Schema reconciliation with the implemented consumer

Issue #707 proposed an envelope
(`{artifact_type, schema_version, timestamp, context{...},
payload{what_was_built, ...}}`) with snake_case payload fields.
The implemented consumer does not unwrap: the whole file becomes
`unleashSummary`, and finale prose reads
`.whatWasBuilt`/`.howToVerify` at the top level. A producer
following the issue's schema verbatim would be **incompatible**
with the already-merged consumer. The producer therefore writes
flat camelCase content fields, and honors the issue's provenance
intent by carrying `artifact_type`, `schema_version` (1),
`branch`, and `timestamp` as top-level metadata. Consumers MUST
ignore unknown fields, so the metadata is forward-safe.

### D3: Tool lives in `uf-workflow`, factory pattern

`uf-workflow` owns the unleash workflow machinery; `uf-finale`
is the consumer. Placing the producer in `uf-finale` would
invert the data-flow direction. The tool follows the plugin's
established pattern: exported factory
`createPersistUnleashSummaryTool(exec: GitExec, cwd: string)`
registered as `persist_unleash_summary` in the server tool map,
returning `success()`/`failure()` envelopes.

### D4: No branch override parameter

`resolveKey` (checkpoint tools) allows an explicit key override.
This tool deliberately omits it: the consumer always reads by
auto-detected current branch, so a caller-supplied override
would create artifacts the consumer can never find. Write path
and read path stay symmetric; detached HEAD fails with an error
and writes nothing.

### D5: Soft-fail in Step 10

The demo output is already presented to the user when the tool
runs, and `/uf.finale` retains its no-artifact fallback. A write
failure therefore warrants a warning plus continuation to the
CHECKPOINT, never an abort. This keeps the artifact an
optimization rather than a new gate.

### D6: Write mechanics mirror `writeState` hardening

Directory creation recursive with mode `0o700`, file mode
`0o600`, pretty JSON plus trailing newline, unconditional
overwrite, and symlink refusal via `lstatSync` for the target
file and parent directory — matching the checkpoint `writeState`
pattern in the same plugin (the `review-dispatch` artifact
writer's `0750` directory mode is the alternative precedent;
same-plugin consistency wins). `.uf/artifacts/` is already
gitignored, so nothing is committed.

### D7: Non-empty validation protects the fallback

If all-parameters-required were the only check, an LLM could
persist empty strings, and `/uf.finale` would then prefer an
empty `## Summary` over its fallback synthesis. All three
parameters MUST be non-empty, non-whitespace-only strings
(error code `INVALID_UNLEASH_SUMMARY`, nothing written).

### D8: Section bodies without `##` headers

`/uf.finale` places artifact content under its own
`## Summary` / `## How to Test` headings; embedding the demo
section headers would double-nest headings in the PR body. The
Step 10 instruction passes each section's markdown body.

## Risks / Trade-offs

- **Branch mismatch**: renaming the branch (or running finale
  from a different branch) after Step 10 means the consumer
  finds no artifact and falls back. Accepted — graceful
  degradation is the designed behavior.
- **Unarchived-change coupling**: the consumer contract is
  specced in the unarchived `finale-token-reduction` change.
  Our delta introduces a separate `unleash-summary` capability
  and only references the consumer behavior, so archive order
  does not create conflicts.
- **Stale content**: the artifact snapshots Step 10 content;
  any post-demo implementation change would not be reflected.
  Step 10 is the terminal pipeline step, so the exposure window
  is negligible.
- **Scaffold drift**: command and plugin edits must be mirrored
  to `internal/scaffold/assets/opencode/`. Mitigated by the
  existing `TestEmbeddedAssets` drift tests (FR-007) which fail
  on any divergence.
