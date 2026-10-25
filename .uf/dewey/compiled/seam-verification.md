---
tier: validated
compiled_at: 2026-10-25T16:36:45Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - golden-tests-20261020T165718-jay-flowers
  - golden-tests-20261020T192357-jay-flowers
  - structural-pinning-20261022T225033-jay-flowers
  - seam-verification-20261023T162201-jay-flowers
  - seam-verification-20261023T182909-jay-flowers
  - seam-verification-20261023T202056-jay-flowers
  - seam-verification-20261023T202104-jay-flowers
  - seam-verification-20261023T204416-jay-flowers
  - seam-verification-20261023T211820-jay-flowers
  - seam-verification-20261024T150855-jay-flowers
topic: seam-verification
---

# Seam Verification

## Current State (October 2026)

### The three DE-007 layers

DE-007 verification has three named layers: registration surface, documented output shape, and
round-trips. Seam-verification tasks MUST be scoped from the layer list, never from an assertion
surface -- a checked checkbox cannot mask an unverified layer (PR #812 task 3.2 marked [x] on
9-tool registration lists while the golden census stayed at 8 finale sites). Per affected plugin,
name the concrete suite per layer: registration-surface tests; golden-output-shape for the
documented shape; round-trip audits, or explicit N/A for read-only tools.

### Census discipline

Adding a documented tool-call site is a census event: refresh census counts/anchors in ALL THREE
label locations -- golden suite, sibling suites (dispatch-review-runs.test.ts), and the metrics.md
site registry (fixture inventory, exclusion record, per-command counts, task-2.2 attribution) --
in the same commit. Hard-coded `uf.*.md:<line>` labels live in all three; grep the repo for
`<command-file>.md:` after any line-shifting edit. A census header and the anchors beneath it are
one unit; anchors are labels, not assertions, so off-by-7 refresh errors pass the full suite.

Golden sites must pin variant-specific depth: for multi-variant rendered-output tools
(format_unleash_exit, eight exit variants), parametrize the EXPECTED output, not just the inputs,
and assert at least one variant-specific marker per case; skeleton-only assertions leave the
variant-selection seam unpinned while registration, envelope, and lib-level tests stay green. To
check a coverage claim, diff it against the covering suite's self-reported coverage first -- two
independently authored records; divergence already corroborates the finding.

Current census: the golden suite covers 44 of 48 documented sites; the 4 dispatch_review_runs
sites are instead pinned per-input-variant in dispatch-review-runs.test.ts; the uf-finale
registry counts 9 documented sites.

### Registry-driven coverage

Registry-driven suites (registration-surface.test.ts iterates the live registry) auto-cover new
tools; enumeration-driven suites (terminal-write hygiene, terminal-output pinning, per-tool
error-code tests) silently miss them because their individual cases still pass. Enumerate gaps by
grepping a sibling tool's name across the test directory: any suite naming the sibling but not
the new tool is the gap.

### Consumption-side wiring

Failure-envelope hardening must wire the consumption side -- command branch + scaffold mirror +
spec scenario -- in the same increment; an emitted-but-unconsumed code is an incomplete fix, not
a defensive improvement. BASE_SYNC_COUNT is now consumed in uf.finale.md section 4. Grep the
consuming command file and spec for the tool's existing failure codes and extend every branch
list in the same edit.

### Value-invariant validation

A documented value invariant ("behindBy decides the gate and MUST NOT silently read as 0") must
be validated across the full production chain -- exec throw, parse, coercion, default; coercion
fallbacks convert unparseable-but-successful output into the sentinel value, silently
suppressing the gate the envelope protects.

### Open gaps

- parseInt(x, 10) || 0 coercion at uf-finale/index.ts:312/314 (and 379/385) silently suppresses
  the sync gate the BASE_SYNC_COUNT envelope protects -- STILL OPEN (LOW; real git makes the
  path near-impossible since rev-list --count always emits an integer). Fix shape: a
  Number.isFinite check routing parse failures to the same failure code.
- Live drift: golden-output-shape.test.ts internally disagrees (line 1036 "14 documented sites"
  vs line 1112 "(15 documented sites)"); metrics.md says 47/47/0 while the golden header
  counts 48.

## History

- 2026-10-20: golden-suite depth audit found 8 of 43 sites pinned at skeleton-only depth. PR 783
  divergence: metrics.md claimed 47/47/0 while the golden header said "43 of the 47 documented
  sites", the four dispatch_review_runs sites deferred to a single #735 golden test exercising
  only the triage-mode input variant.
- 2026-10-22 (issue #777, spec-review-per-finding-gate): derive structural pin lists
  scenario-by-scenario from the spec's MUST sentences and THEN clauses, not the design's feature
  inventory -- FR-001's visibility directive (finding text printed above the question tool) went
  unpinned; anything unmapped is a coverage gap by construction.
- 2026-10-23, PR #812 gap-closure iterations (rebase-upstream-before-push): uf_finale_base_state
  shipped documented at uf.finale.md:132 and unit-tested, but the golden suite stayed at 8
  finale sites -- factory unit tests skip the registry-path execution (loadRegistry + mockGit)
  that DE-007 Layer 2 verifies -- and task 3.2's registration-list completion left the census at
  8. Iteration 2 added the golden site test; council iteration 3 found the terminal-write
  regression suite still pinning 8 of 9 tools (plugin-terminal-hygiene invariant unpinned for
  the new tool's five exec calls); the follow-up closed finale coverage to 9 of 9. Fix commits
  added defects: an anchor refresh wrote three test-name anchors off by 7 lines and left a stale
  "8 documented sites" banner above a describe renamed to 9; a ~42-line label drift had
  accumulated in test labels and registry refs before address-feedback-diff-path-producer fixed
  only the test files. Commit 8359baa added the retryable BASE_SYNC_COUNT envelope with unit
  tests, but /uf.finale step 4 branched only on BASE_SYNC_FETCH and the finale-base-sync spec's
  only failure scenario was "Fetch fails offline" -- the code fell through to the generic "if
  any step fails, stop" guardrail, blocking the finale on a freshness check that step says must
  never block.
- 2026-10-24: value-invariant finding -- the parse step coerced NaN to 0 via `|| 0`, so
  zero-exit garbage output would present behindBy: 0 and skip the sync gate, the exact
  silent-zero the code comment forbids.
- 2026-10-25 audit: BASE_SYNC_COUNT now consumed in uf.finale.md section 4; census recorded at
  44 of 48 with dispatch_review_runs pinned per-input-variant; parseInt coercion still open,
  with residual count drift between the golden file's own labels and metrics.md.
