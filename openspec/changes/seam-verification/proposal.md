<!-- scaffolded-by-uf-vdev -->
## Why

Since PR #674 began migrating mechanical command prose to executable
plugin tools, the closed-issue stream has been dominated by breakage
at the seams those migrations created — found in live use, not in CI:

- #732: tool factories declared `parameters:` (plain objects) where
  the plugin SDK's `tool()` helper expects `args: z.ZodRawShape`.
  The SDK silently ignored the mis-keyed declarations, exposing
  empty parameter schemas to the model. Two consecutive finales
  broke. Plugin smoke tests stayed green because they assert tool
  NAMES only (`.opencode/test/uf-workflow.test.ts:133`,
  `uf-finale.test.ts:80`); the later FR-004 suite
  (`uf-finale.test.ts:113-143`) asserts args keys for three
  uf-finale tools only — the other three plugins and the
  SDK-exposed registration surface remain unasserted.
- #735: triage-issue prose documented `findings`/`proposals`/
  `warnings` output arrays the tool did not return at filing time.
  The prose↔tool output contract was unverified on both sides.
- #707/#737: the `write_unleash_summary` invocation in
  uf.unleash Step 10 went unpinned while finales shipped with a
  null unleashSummary. PR #745 has since landed the Step 10 pins
  (`TestUnleashCommand_ToolRoutingContracts`) and the
  writer-reader round-trips (`uf-finale.test.ts:828`,
  `finalize-review-dispatch.test.ts:442`) — but the command's
  remaining invocation seams (lifecycle, clarify, implement, and
  exit-formatter tools) are still unpinned.
- #693: advisor runs with empty profiles resolved no model
  (motivation only — resolved by the host-resolution fix;
  excluded from the defect-to-layer matrix: not a seam the
  three layers catch).

DE-001..DE-004 (PR #723, `determinism-codification`) made the
migrations themselves deterministic but verified only tool
interiors: unit tests execute DI'd paths, the review council
reasons statically, smoke tests assert registration names.
Outside the PR #745 Step 10 pins and round-trips, nothing
executes the three seams a migration creates:

1. tool↔SDK registration (what the model actually sees),
2. prose↔tool output contract (what instruction text promises),
3. writer tool↔reader command (artifact and invocation survival).

This change closes those gaps with three test layers and codifies
the obligation as determinism pack rule DE-007, modeled on the
`determinism-codification` change (code + tests + one pack rule in
a single change, with the spec delta pinning the rule ID and
severity the way that change pinned DE-001..DE-004).

## What Changes

1. **Layer 1 — registration surface tests.** New
   `.opencode/test/registration-surface.test.ts` (runs under
   `make plugin-test`): for every registered tool in all four
   plugins (`uf-workflow`, `uf-finale`, `review-dispatch`,
   `invoke-agent`), assert through the SDK's actual registration
   path that (a) the exposed parameter schema is non-empty exactly
   when the tool declares parameters (empty==empty is correct —
   `resolve_base_ref` takes none), (b) exposed schema keys are in
   parity with the zod shape the execute path validates, and
   (c) a factory regressing to the pre-#732 declaration form
   (mis-keyed `parameters:` or non-zod shape) fails the suite.
   Proof bar: verified by locally reverting one factory to the
   #732 form and observing the failure.
2. **Layer 2 — golden output-shape contract tests.** Every
   output-format example preserved in command prose (DE-002
   examples: the "Call `<tool>` with" input blocks plus
   "Rendered shape:" / documented-field blocks in
   `.opencode/commands/*.md`) is pinned by a vitest test executing
   the registered tool with the documented inputs and asserting
   the documented fields are present in the returned envelope.
   Includes a golden test for `dispatch_review_runs` asserting the
   `status`/counter/`findings`/`proposals`/`warnings` contract
   documented in `uf.triage-issue.md`, pinning the #735
   reconciliation. Discovery is an in-test fixture list; a
   prose-lint requiring a golden test per example is an optional
   future enhancement, explicitly NOT a gate.
3. **Layer 3 — writer↔reader round-trips + command-layer pins.**
   (a) Round-trips as verified baseline plus targeted extension:
   the `write_unleash_summary` → `uf_finale_pr_context`
   round-trip already exists (`uf-finale.test.ts:828`, the #707
   writer-reader contract), as does the
   `finalize_review_dispatch` → resume-parser round-trip
   (`finalize-review-dispatch.test.ts:442`); this change audits
   both for unpinned fields and adds only missing assertions —
   no duplicated suites. (b) Go command-layer pins in
   `internal/scaffold/` extending
   `TestUnleashCommand_ToolRoutingContracts`
   (scaffold_test.go:159): the Step 10 `stepTenPersistence` pins
   already landed via PR #745 (invocation presence, named
   parameters, superseded-name absence, ceremony-marker count —
   verified baseline); this change pins the invocations no prior
   change covered — `uf_unleash_branch_gate`,
   `uf_unleash_detect_resume`, `scan_clarifications`,
   `resolve_clarification`, `parse_tasks`, `mark_task_complete`,
   `scan_conflict_markers`, and the `format_unleash_exit`
   variants other than spec-review — asserting per-span
   invocation presence and named parameters. One command-text
   assertion covers canonical and embedded copies
   (byte-identical scaffold mirror is drift-enforced).
4. **DE-007 pack rule.** Add rule DE-007 [MUST] (seam
   verification, draft text in issue #765) to
   `.opencode/uf/packs/determinism.md`, add DE-007 to the
   severity-mapping sentence (MUST rules map to CRITICAL
   findings), and bump the pack version 1.1.0 → 1.2.0. #758
   landed first (upstream/main @ 7557cfa): the pack is at 1.1.0
   with DE-005/DE-006 (Intent-Level Orchestration / Router
   Pattern). Per the issue's own coordination clause, this change
   takes **DE-007** — the issue's original draft number — with
   the version bump to 1.2.0.
5. **Skill coverage.** `.opencode/skills/determinism-first/SKILL.md`
   "Related Enforcement" range extends to DE-007, plus the
   authoring-time hook: a prose→tool migration increment's
   tasks.md MUST include a seam-verification task naming the three
   layers. The hook lives in the pack/skill text, NOT in
   `.specify/templates/tasks-template.md` (scaffold asset — out of
   scope per the no-scaffold-mirror constraint).
6. **Docs and evidence.** `CHANGELOG.md` entry; documentation
   issue filed before PR merge (docs gate — internal change,
   see Impact); DE-004 evidence — the defect-to-layer matrix
   recorded in `openspec/changes/seam-verification/metrics.md`
   with before/after test counts, marking the PR #745 baseline
   versus coverage this change adds. Blog/tutorial coverage
   considered and declined at proposal time (no new agent, CLI,
   or hero capability); task 4.4 reassesses at filing.

## Capabilities

### Modified

- `determinism-policy`: add requirements pinning DE-007 — rule
  ID, [MUST] severity mapped to CRITICAL, a change-scoped pack
  version bump 1.1.0 → 1.2.0,
  the three seam-test layers, the migration tasks.md authoring
  hook, and the DE-004 change-record evidence.

### New

None.

### Removed

None.

## Impact

- **Files**: `.opencode/test/registration-surface.test.ts` (new),
  golden and round-trip test files under `.opencode/test/` (new
  and extended), `internal/scaffold/scaffold_test.go` (extended),
  `.opencode/uf/packs/determinism.md`,
  `.opencode/skills/determinism-first/SKILL.md`, `CHANGELOG.md`.
- **Hero repositories**: none — all surfaces are repo-local to
  this meta repository.
- **Scaffold**: untouched. The determinism pack and
  determinism-first skill are repo-local governance artifacts
  (pack exclusions confirmed at
  `internal/scaffold/scaffold_test.go:2212-2214` and
  `internal/schemas/packvalidator_test.go:188-196`); tests live
  in `.opencode/test/` (`make plugin-test`) and
  `internal/scaffold/` (`make test`).
- **Tests**: this change is majority tests. Existing suites keep
  their contracts; new assertions only.
- **In-flight migrations**: #757 (Step 6 lifecycle) and #664
  (`post_github_review`) MUST apply DE-007 when they land; the
  pack's own opportunistic-migration rule governs existing prose
  (no retroactive migration required).
- **Issue coordination**: #735 pinned as the reconciled contract
  (tool now returns the documented arrays; resolution recorded
  there); #758 landed first as DE-005/DE-006, so this change's
  rule is DE-007 per the coordination clause.
- **Docs gate** (per-file disposition): `CHANGELOG.md` —
  entry via task 4.3; this repository's docs issue — filed by
  task 4.4 (duplicate-checked, number recorded in metrics.md);
  `AGENTS.md` — no update (Convention Packs already lists
  `determinism.md`; a rule within a listed pack does not change
  the inventory); `README.md` — no update (no user-facing
  surface); unbound-force/website — exempt (classified
  internal/test-architecture; the pack and skill are repo-local
  governance artifacts per the determinism-codification
  exclusions; rationale recorded in metrics.md).

## Constitution Alignment

### I. Autonomous Collaboration

**Assessment**: PASS. Seam tests replace human vigilance with
machine-verified contracts. Agents can migrate prose to tools
autonomously — the DE-007 rule and its three test layers give
reviewers and CI a deterministic completeness check instead of
relying on a human noticing that instruction text and tool
behavior have diverged.

### II. Composability First

**Assessment**: PASS. Every test composes existing seams — the
SDK registration path, DI'd execute paths, the shared
`sanitizeSlug` derivation, the drift-enforced scaffold mirror —
rather than introducing new abstractions. The pack rule composes
with DE-001..DE-004 in the same governance artifact.

### III. Observable Quality

**Assessment**: PASS. The defect-to-layer matrix maps each closed
defect class (#732, #735, #707/#737) to the layer that now catches
it, with before/after test counts as DE-004 evidence. Seam health
becomes observable in `make plugin-test` / `make test` runs rather
than in production breakage reports.

### IV. Testability

**Assessment**: PASS. The change is itself almost entirely tests,
each with a falsification property: Layer 1 must fail on the
pre-#732 declaration form, Layer 2 must fail on prose↔tool
divergence, Layer 3 must fail on deletion of any pinned
invocation — the Step 10 deletion property is the verified
PR #745 baseline; this change extends it to the lifecycle,
clarify, implement, and exit-formatter invocations. Every layer
runs under the existing standard commands.

### V. Security by Default

**Assessment**: PASS. Layer 1 asserts the model-facing parameter
schema surface — the exact exposure #732 created (empty schemas
silently shown to the model). A registration regression that
changes what the model sees now fails CI instead of shipping.
No secrets, permissions, or runtime surfaces are altered.

### VI. Deterministic Execution

**Assessment**: PASS. Codifies seam verification as DE-007
[MUST] in the determinism pack, extending the Principle VI rule
system created by `determinism-codification` (amendment 1.4.0)
and #758 (DE-005/DE-006). The rule text, severity mapping
(CRITICAL), and version bump (1.2.0) are pinned in the spec
delta.
