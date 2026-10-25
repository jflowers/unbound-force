---
tier: validated
compiled_at: 2026-10-25T16:29:11Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - testing-20261006T004550-jay-flowers
  - testing-patterns-20261008T223713-jay-flowers
  - test-coverage-strategy-20261009T171038-jay-flowers
  - test-quality-removal-changes-20261011T022009-jay-flowers
  - test-quality-removal-changes-20261011T023755-jay-flowers
  - security-review-removal-changes-20261011T193236-jay-flowers
  - gaze-artifact-hygiene-20261011T193237-jay-flowers
  - gaze-baseline-hygiene-20261011T193238-jay-flowers
  - test-coverage-bundled-fixes-20261011T193240-jay-flowers
  - test-quality-revert-patterns-20261012T140011-jay-flowers
  - test-quality-defense-in-depth-20261012T145522-jay-flowers
  - test-quality-defense-in-depth-20261012T151432-jay-flowers
  - test-coverage-20261014T151547-jay-flowers
  - test-coverage-20261014T165450-jay-flowers
  - regression-testing-20261014T171110-jay-flowers
  - regression-testing-20261014T182418-jay-flowers
  - contract-testing-20261016T222930-jay-flowers
  - test-coverage-20261019T153517-jay-flowers
  - test-coverage-20261019T171729-jay-flowers
  - test-coverage-20261019T171731-jay-flowers
  - test-quality-20261020T161834-jay-flowers
  - test-infrastructure-20261020T165710-jay-flowers
  - test-quality-20261020T172448-jay-flowers
  - test-infrastructure-20261020T182844-jay-flowers
  - test-infrastructure-20261020T193536-jay-flowers
  - test-infrastructure-20261020T194153-jay-flowers
  - test-infrastructure-20261020T194155-jay-flowers
  - test-quality-20261020T195910-jay-flowers
  - test-quality-20261022T130004-jay-flowers
  - test-coverage-20261022T225002-jay-flowers
  - test-quality-20261022T225012-jay-flowers
  - test-quality-20261022T225019-jay-flowers
topic: test-discipline
---

# Test Discipline

## Current State (October 2026)

### Go Test Conventions

Standard library `testing` only (no testify): `t.Errorf`/`t.Fatalf` directly, 
`TestXxx_Description` names, `t.TempDir()` isolation, CI-enforced `-race -count=1`. Go tests 
may walk the real repo tree (`findProjectRoot`, `internal/scaffold/scaffold_test.go`) to pin 
real-repo invariants the plugin fixture suite cannot reach.

### TypeScript Plugin Suite and Coverage Floors

`.opencode/test/*.test.ts` runs vitest 5.0.3 + `@vitest/coverage-v8` 5.0.3 (v8 provider, Node 
environment). Node engines floor `^22.22.2 || ^24.15.0 || >=26.0.0` (transitive `ini@7.0.0`); 
CI node 22 resolves v22.23.3. Floors in `.opencode/vitest.config.ts`: statements 94 percent 
(governance-controlled, changed only via a spec-workflow governance change), branches 85 
percent. Every plugin test runs against a `mkdtemp` scratch fixture, never the real repo root: 
they verify mechanisms, not real-repo artifact inclusion -- adding a repo pack cannot break a 
plugin golden. Real-tree scenarios need a real-tree Go test or compositional verification 
(fixture mechanism test plus drift-test presence walk). Unpinned doc invariants: AGENTS.md pack 
listing vs `.opencode/uf/packs` set equality; `.opencode/skills/*/SKILL.md` frontmatter (doctor 
runtime only). Verification rationales must match actual command scope: `make lint` is Go-only 
(markdownlint via MegaLinter in CI); `make plugin-test` never verifies real-repo artifacts (PR 
#723).

### Coverage Gating

Scope-based Go gate: `make coverage-gate` (`cmd/coverage-gate`, `coverage-gate.json`) applies 
per-package thresholds to changed packages; `make check` depends on it plus `plugin-test`. 
Removals delete scope entries but never change threshold values. Percentages recorded in change 
artifacts (design risk notes) enforce nothing -- convert deferrals into tracked follow-up 
issues cited in the risk note. Quality-gate and CI-only changes are documentation-gate exempt 
but must show the four-artifact provenance pattern: gate-config provenance comment, 
CHANGELOG.md entry, AGENTS.md convention bullet (value plus governance control), and an 
explicit documentation-issue exemption claim in proposal/tasks.

### Regression-Test Discipline

A regression test must reproduce the original failure; a test passing under old and new code is 
not a regression test (TC-006: bug fixes MUST include a test that fails without the fix). 
Deletion-fixes use negative assertions: spy the whole API family that can produce the forbidden 
side effect (six console methods plus stdout/stderr writes), assert zero calls, `mockRestore` 
in `finally`, `vi.resetAllMocks` in `beforeEach`. Defense-in-depth layers are tested 
independently (export or bypass the outer sanitization). Source-scan guards counting regex 
literals are representation-dependent -- pair each with a behavioral test pinning the 
historical bug mode. Audit advertised properties for vacuity (name the input mutation that 
would fail them); identity pass-through "parity" comparisons (PR #783) pass forever -- use 
execution checks instead. When every test injects a fake runner, pin the default runner's 
subprocess contract (argv, cwd, encoding, stdio, trim) or record the gap.

### Removal-Change Testing

Checklist for removals deleting packages and their test suites: (1) remaining test files 
updated (imports, test data); (2) `coverage-gate.json` scope entries removed, thresholds 
unchanged; (3) schema registry count assertions updated; (4) behavioral changes to surviving 
code covered; (5) review-verdict consumer matrices drop deleted consumers. Bundled behavioral 
fixes need their own coverage regardless of size (the October 2026 Muti-Mind/Mx F removal left 
a broadened `/tmp` path allowlist untested -- a regression could silently re-narrow it). Full 
reverts: replacement paths covered (`tier_model_unavailable`), no orphaned fixtures or helpers, 
no unreachable validation branches (`validateRunModel` three-to-two). Security review of 
removals focuses on new code beside the deletion; deleted code has zero attack surface.

### Fixture Hygiene

Hand-written producer-format fixtures silently stop representing reachable state: derive 
fixtures from the producer's executed output (write-applying fake deps) or pin the producer's 
write format in the producing suite. One connecting test per contract seam: run the real 
producer write path against mocked filesystem dependencies, read the persisted bytes, feed them 
to the consumer parser, assert decision fields (`uf-finale.test.ts`, PR #707); shared constant 
modules remove constant drift, not shape drift. Fakes preserve absent-vs-default (`"field" in 
options ? options.field : "default"`, never `??`). Suite-wide never-invoked guards are windowed 
by any earlier `afterEach(mockClear)`; prefer `toHaveBeenCalledTimes(N)` naming sanctioned 
callers. Mock-executor injection (uf-workflow `resolve_base_ref`): cover upstream/origin/main 
fallbacks, all-fail, empty-string skip, cwd pass-through; vary optional parameters 
(per_run_timeout_ms, model/tier/variant) to exercise conditional passthrough via promptCalls 
tracking. New persistent end states (log entries matching a scan grammar) need fixture matrices 
derived from those states; pin the composite (input -> tool -> probe) in the gate-enforcing 
suite. Mid-file `describe()` insertion can close the parent early and orphan later tests -- 
verify brace structure. When a new suite would copy a helper already in more than two test 
files, extract it to a shared module in the same change (withBun shim hit 8 copies in PR #783) 
-- a learning naming the in-flight change as extraction point does not self-execute. Spec 
structural pins: cover every FR with an acceptance scenario (enumerate the FR-to-pin mapping); 
derive pins from MUST clauses and scenario outcomes, not greppable strings; pin operative 
sentences, not headings; add absence checks for retired wording; when a rewording drops pinned 
fragments, diff the removed invariants and add replacement pins.

## History

Oct 6-9: suite mechanics -- describe-brace hygiene, mock-executor injection (100 percent branch 
coverage on resolve_base_ref), conditional-passthrough fixtures. Oct 11 (Muti-Mind/Mx F 
removal): removal checklist crystallized across two iterations; the bundled-fix gap (untested 
validateDiffPath `/tmp` allowlisting) established the bundled-fix coverage obligation; `.gaze/` 
hygiene (baseline.json regeneration emits crap_stderr.txt/crap_stdout.txt -- track 
baseline.json, stage it explicitly). Oct 12: revert patterns; defense-in-depth inner-layer 
testing. Oct 14: mkdtemp/real-repo scope split (PR #723); broad-spy negative assertions for 
deletion-fixes. Oct 16 (PR #707): writer-reader seam tests. Oct 19 (PR #753): composite 
end-state pinning, source-scan limits, producer-derived fixtures. Oct 20: an unenforced 94.61 
percent recorded baseline drove tracked-issue deferrals; PR #783 exposed vacuous parity 
assertions, the helper-duplication threshold, and learning-not-self-executing; PR #784 exposed 
mockClear windowing. Oct 22: absent-vs-default fakes and spec pin discipline; the 
ts-plugin-coverage-gate governance change (issue #780) raised the statements floor 90 -> 94 -- 
1.18 points under the 95.18 percent measurement for cross-platform V8 divergence (integer 
floors only), with executable proof of both gate modes and the four-artifact provenance 
exemplar. The scope-based Go coverage gate was operational by the Oct 11 removal and now 
anchors `make check` alongside `plugin-test`.
