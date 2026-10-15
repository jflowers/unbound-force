## Context

`finale-token-reduction` extracted the 6-step model name
normalization algorithm into the `normalize_model_name` tool
(`uf-workflow` plugin, `.opencode/plugins/uf-workflow/index.ts`)
and rewrote `/uf.finale` to consume it. `uf.address-feedback.md`
Phase 4.2 still carries the verbatim inline copy (lines 732-748,
17 lines). Issue #709 tracks the cleanup.

Current Phase 4.2 text (live copy, lines 732-748):

```text
Where `<model>` is the model family name you are
currently running as. To resolve the model name:
(1) read your model identifier from the system prompt
or runtime environment; (2) remove everything before
and including the last `/`; (3) remove everything
after and including the first `@`; (4) remove any
trailing date suffix matching `-YYYYMMDD` (a hyphen
followed by exactly 8 digits); (5) repeatedly remove
any trailing version segment matching `-N` (a hyphen
followed by a single digit at the end) until no more
remain; (6) validate the result
contains only `[a-zA-Z0-9._-]` characters. If the
result is empty, contains invalid characters, or
cannot be determined, use the literal string
`unknown-model` and warn the user (e.g., "Could not
determine AI model name — using 'unknown-model' in
attribution").
```

Live and scaffold copies are byte-identical today;
`internal/scaffold/scaffold_test.go` (`task42CanonicalAssets`)
and `command_contract_test.go` enforce parity.

## Goals / Non-Goals

### Goals
- Replace the inline algorithm with a
  `normalize_model_name` tool call instruction in
  Phase 4.2 of the live command.
- Keep the scaffold copy byte-identical to the live copy.
- Preserve the decision point: warn the user and use
  `unknown-model` when normalization fails.
- Zero behavioral change in produced commit trailers.

### Non-Goals
- Modifying the `normalize_model_name` tool or its tests
  (shipped and stable in `finale-token-reduction`).
- Migrating other parts of `uf.address-feedback.md` to
  plugin tools (separate scope; git tools migration can be
  proposed independently).
- Changing the commit message format or attribution
  trailer syntax.

## Decisions

### D1: Direct tool call, not a composite

`/uf.finale` resolves the model name inside the composite
`uf_finale_commit_context` tool. `/uf.address-feedback`
MUST call `normalize_model_name` directly instead, per the
issue's desired state. Rationale: address-feedback generates
commits per fix group with its own grouping logic; wrapping
normalization in a new composite would add a tool for no
token gain. The direct call mirrors the issue text and keeps
the change minimal.

### D2: Replacement text follows the finale precedent

The replacement keeps the `<model>` placeholder in the
commit template (line 729, unchanged) and swaps the 17-line
algorithm for:

```text
Where `<model>` is the normalized model family name.
Call `normalize_model_name` with your raw model
identifier from the system prompt. Use the returned
`normalized` value. If the tool returns an error or
`unknown-model`, warn the user (e.g., "Could not
determine AI model name — using 'unknown-model' in
attribution").
```

The warning example is preserved verbatim from the current
prose — Principle VI ("preserved decision-point examples"):
the judgment (warning the user) stays in instruction prose;
only the mechanical procedure moves to the tool.

### D3: Scaffold sync by byte-identical copy

Edit the live file first, then copy it over the scaffold
asset (`cp`), matching the workflow used by
`finale-token-reduction` task 4.5. Drift tests
(`task42CanonicalAssets`) compare the pair, so identical
bytes are the acceptance proof.

### D4: No test modifications

`internal/scaffold/command_contract_test.go` clauses for
`uf.address-feedback.md` (dedup rules, consolidate
dispatch, tool policy, provenance) do not reference the
normalization prose. No clause additions are needed: the
delta spec's scenarios are enforced by existing drift
tests plus the existing
`.opencode/test/uf-workflow.test.ts` tool tests.

## Risks / Trade-offs

- **Risk**: The model skips the tool call and guesses a
  name. **Mitigation**: the instruction is imperative and
  single-step (same pattern that works for `/uf.finale`);
  the fallback warning clause covers the failure mode.
- **Risk**: Hidden test coupling to the removed prose.
  **Mitigation**: verified by grep — no test references
  `YYYYMMDD`/normalization steps for this command;
  `make check` is the final gate.
- **Trade-off**: none identified. Pure instruction
  removal with a tested tool as the replacement.

Constitution alignment (proposal §Constitution Alignment):
this design implements Principle VI (Deterministic
Execution) and preserves Principles I-IV properties —
JSON envelope consumption (I), shared-tool reuse without
new coupling (II), observable `warning` field (III), and
algorithm-under-test (IV).
