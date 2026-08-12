## Why

After heavy context compression during a `/uf.unleash` run,
the Step 10 Demo produced improvised "Next Steps" output
instead of the prescribed terminal format. The agent
reconstructed exit text from `AGENTS.md` memory rather than
re-reading the template, resulting in three deviations:

1. Omitted `/uf.finale` (the prescribed commit/push/PR
   command)
2. Omitted `/speckit.clarify` (the prescribed refine/iterate
   command)
3. Wrongly injected `/uf.review-council` and hand-rolled git
   steps (the review council already ran as Step 8)

The existing compression-resilience work (merged `fba87cf`,
issue #380) added a Session-Resume Guard, execution
checklist, and per-step checkpoints. Its own design (R3)
explicitly acknowledged: "No structural guarantee ...
sufficiently aggressive compression could still discard the
guard and checklist." That is precisely the failure that
occurred.

This change is complementary: it enforces content fidelity
at emit time (re-read before output) rather than relying
solely on state tracking (which compression can discard).

Additionally, `AGENTS.md` states "MUST run
`/uf.review-council` before PR submission" without
clarifying that `/uf.unleash` Step 8 already satisfies
this requirement. This ambiguity contributed to the agent
wrongly re-suggesting the command in Step 10.

## What Changes

1. **`uf.unleash.md` Step 10 Demo**: Add a just-in-time
   re-read instruction before composing demo output.
   Reconcile the two divergent "Next Steps" blocks (prose
   L681-685 vs format L707-710) into one canonical wording.
   Add explicit note that Step 8 satisfies the pre-PR
   review-council requirement. Add guardrail forbidding
   improvised demo exit text.

2. **Scaffold sync**: Mirror canonical `uf.unleash.md` to
   `internal/scaffold/assets/opencode/commands/uf.unleash.md`
   (drift test `TestEmbeddedAssets` enforces parity).

3. **`always-on-guidance/SKILL.md`**: Add "Command Template
   Fidelity" rule: re-read prescribed output sections from
   the template before emitting, especially after
   compression.

4. **Scaffold the always-on-guidance skill**: Add
   `always-on-guidance/SKILL.md` to the scaffold embed
   assets so it propagates org-wide via `uf init`. Remove
   from `knownNonEmbeddedFiles` in `scaffold_test.go`.

5. **`AGENTS.md` review-council rule**: Clarify that
   `/uf.unleash` (Step 8 code review) satisfies the
   pre-PR `/uf.review-council` requirement. Framed as
   equivalence clarification, not a weakening of the gate.

## Capabilities

### New Capabilities

- `Command Template Fidelity rule`: Cross-cutting guidance
  requiring agents to re-read prescribed output sections
  from command templates before emitting terminal output,
  especially after context compression. Prevents
  improvised exit text that deviates from the template.

- `always-on-guidance scaffold propagation`: The
  always-on-guidance skill is now embedded in the scaffold
  and propagates to hero repos via `uf init`, ensuring
  all repos inherit the template-fidelity rule.

### Modified Capabilities

- `uf.unleash Step 10 Demo`: Adds JIT re-read instruction,
  reconciles divergent Next Steps blocks, adds explicit
  note that Step 8 satisfies review-council, adds guardrail
  against improvised exit text.

- `AGENTS.md review-council rule`: Adds parenthetical
  clarifying that `/uf.unleash` Step 8 satisfies this
  requirement.

### Removed Capabilities

- None.

## Impact

- **Files modified**:
  - `.opencode/commands/uf.unleash.md` (canonical)
  - `internal/scaffold/assets/opencode/commands/uf.unleash.md`
    (scaffold copy, must match canonical)
  - `.opencode/skills/always-on-guidance/SKILL.md` (canonical)
  - `internal/scaffold/assets/opencode/skills/always-on-guidance/SKILL.md`
    (new scaffold copy)
  - `internal/scaffold/scaffold_test.go`
    (add to expectedAssetPaths, remove from
    knownNonEmbeddedFiles)
  - `AGENTS.md` (review-council rule clarification)
  - `CHANGELOG.md` (change entry)

- **Blast radius**: Documentation and agent configuration
  only. No Go source code behavior changes. No CI gate
  modifications. The scaffold test changes are mechanical
  (adding an embed path, removing an exclusion).

- **Risk**: LOW. The changes are text edits to command
  templates, agent guidance, and governance docs. The
  scaffold test changes follow the established pattern
  (see `expectedAssetPaths` and `knownNonEmbeddedFiles`
  in `scaffold_test.go`).

## Constitution Alignment

Assessed against the Unbound Force org constitution v1.2.0.

### I. Autonomous Collaboration

**Assessment**: PASS

The change preserves artifact-based communication. The
command template produces the same structured demo output;
it just ensures the output matches the template rather
than being improvised. No runtime coupling introduced.

### II. Composability First

**Assessment**: PASS

Scaffolding `always-on-guidance` via `uf init` follows the
existing propagation pattern (see `pre-flight`,
`review-context`, `speckit-workflow` skills already
scaffolded). Each hero can still function independently.

### III. Observable Quality

**Assessment**: N/A

This change modifies agent instructions, not
machine-parseable output formats or provenance metadata.

### IV. Testability

**Assessment**: PASS

The scaffold changes are verified by existing drift tests:
`TestEmbeddedAssets` enforces canonical == embedded parity;
`TestEmbeddedAssets_SingleMarker` enforces the scaffold
marker. The `knownNonEmbeddedFiles` removal is verified by
the reverse-drift test at `scaffold_test.go:1114-1115`.
No new Go source code requiring unit tests is introduced.

### V. Security by Default

**Assessment**: N/A

No security-sensitive inputs, outputs, or external
dependencies are introduced. The change is purely
instructional text.
<!-- scaffolded by uf vdev -->
