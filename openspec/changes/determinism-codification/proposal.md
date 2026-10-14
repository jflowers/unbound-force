## Why

Recent work — epic #659 (token reduction: uf-workflow-scaffold,
finale-token-reduction at ~70% command shrinkage) and the uf.unleash
audit (issue #716) — shares one intent: commands and agents should
spend context on judgment, not on re-reasoning deterministic
procedures. The Dewey knowledge base now documents the finding in
a compiled article (`.uf/dewey/compiled/token-reduction.md`, draft
tier pending human promotion):

- Behavioral guards (re-read rules, emit-time verification)
  mitigate prompt-drift symptoms but cannot cure the root cause:
  prescribed procedures and output formats living as
  conversation-content prose.
- The structural cure is executing deterministic logic in plugin
  tools. Tool-rendered output cannot drift after context
  compression; extraction saves tokens and eliminates re-reasoning
  errors.

The practice is real but uncodified. Without codification it
regresses: new command templates accumulate mechanical prose, and
reviewers have no rule to cite. This change codifies the principle
across the governance stack — constitution, AGENTS.md behavioral
rules, review convention pack, and session skill.

## What Changes

1. **Constitution amendment (rider, spec-exempt per AGENTS.md)**:
   add Principle VI "Deterministic Execution" to
   `.specify/memory/constitution.md`. MINOR version bump 1.3.1 →
   1.4.0. Adds MUST rules, so hero repositories must open alignment
   issues within one release cycle (standard amendment path).
2. **New repo-local convention pack**
   `.opencode/uf/packs/determinism.md` with rules DE-001..DE-004.
   Auto-discovered by review dispatch — every Divisor review agent
   prompt in this repo gains the rules with no plugin changes.
3. **New repo-local skill**
   `.opencode/skills/determinism-first/SKILL.md` for session-time
   guidance to coding agents.
4. **Test-file updates**: `internal/scaffold/scaffold_test.go` —
   add both files to `knownNonEmbeddedFiles` (the sanctioned
   exclusion map for local-only files);
   `internal/schemas/packvalidator_test.go` — add
   `determinism.md` to the `TestValidateConventionPack_AllPacksValid`
   skip list with a rationale comment (governance pack, not a
   coding convention pack; `severity.md`/`content.md`/`ci.md`
   precedent). No scaffold assets are created or modified.
5. **`AGENTS.md`**: new "Determinism gate" Behavioral Rule (CRITICAL
   severity) and Convention Packs listing update (add
   `determinism.md`, plus the previously unlisted `ci.md` and
   `ci-custom.md`).
6. **`CHANGELOG.md`**: entry for the governance codification.
7. **`README.md` and principle-count reconciliation**: the
   README Constitution section still enumerates four core
   principles; re-enumerate all six (adding V. Security by
   Default and VI. Deterministic Execution) and fix the
   governance bridge bullet's "four org principles" reference.
   The constitution's Hero Constitution Alignment count
   reference ("five org principles") is reconciled to six.

Deliberately repo-local: pack and skill changes do not propagate via
`uf init`. Hero repos adopt the principle through constitutional
alignment, not scaffolding.

## Capabilities

### New Capabilities
- `determinism-policy`: codified rules governing where deterministic
  logic lives (executable tools, with tests) versus where judgment
  lives (instruction prose), enforced at constitution, review-pack,
  session-skill, and AGENTS.md rule layers.

### Modified Capabilities

None. Review prompt assembly gains the pack through existing
auto-discovery; no existing capability's behavior changes.

### Removed Capabilities

None.

## Impact

- **Files**: `.specify/memory/constitution.md`, `AGENTS.md`,
  `.opencode/uf/packs/determinism.md` (new),
  `.opencode/skills/determinism-first/SKILL.md` (new),
  `internal/scaffold/scaffold_test.go` (exclusion map only),
  `internal/schemas/packvalidator_test.go` (skip list only),
  `CHANGELOG.md`, `README.md` (Constitution section count
  reconciliation only).
- **Hero repositories**: new MUST rules trigger the standard
  alignment-review obligation (alignment issue within one release
  cycle, resolved before the next major version).
- **Scaffold**: untouched. The embedded starter constitution
  (`internal/scaffold/assets/specify/memory/constitution.md`) is a
  template, not a mirror (excluded from drift tests), and hero
  adoption is governed by `## Hero Constitution Alignment`, not
  scaffolding.
- **Tests**: `make test` (canonical-embedded walk passes via the new
  exclusions), `make plugin-test` (verify no golden tests break from
  the added pack).
- **Docs gate**: not exempt. The constitution amendment and the
  new pack and skill alter repo-wide agent and review-council
  behavior, which satisfies "user-facing" per org precedent:
  (a) README.md's Constitution section is reconciled in this
  change (task 1.8); (b) the org constitution's Cross-Repo
  Documentation rule requires a `unbound-force/website` issue
  for the constitution page update before PR merge (task 1.10;
  Principle V precedent: website issues #142 and #254); (c)
  AGENTS.md's documentation gate requires a documentation issue
  in this repo (task 1.11).

## Constitution Alignment

Assessed against the Unbound Force org constitution (five active
principles; the proposed Principle VI is the subject of this change
and is not self-assessed).

### I. Autonomous Collaboration

**Assessment**: PASS

Codifies collaboration through well-defined artifacts (constitution
principle, convention pack, skill, AGENTS.md rule) rather than
runtime coupling. The determinism rules themselves direct mechanical
work into tools with self-describing, structured output.

### II. Composability First

**Assessment**: PASS

No new runtime dependencies. Pack and skill are independently
consumable and repo-local; removing either leaves the rest of the
governance stack functional.

### III. Observable Quality

**Assessment**: PASS

DE-004 requires measurable line/token deltas in change records, and
DE-003 requires tool-rendered output — machine-parseable by
construction. The compiled Dewey article carries source provenance.

### IV. Testability

**Assessment**: PASS

DE-001 requires every extracted tool to ship with tests. The
exclusion-map entries are themselves verified by the existing
canonical-embedded drift tests (`make test` fails if the map and
filesystem disagree).

### V. Security by Default

**Assessment**: PASS

The codified pattern moves shell choreography from instructed prose
into args-array tool execution (no shell), structurally reducing
injection surface. No dependencies, permissions, or CI surfaces
change.
