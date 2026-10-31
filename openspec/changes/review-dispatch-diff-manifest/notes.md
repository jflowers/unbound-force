# Change notes: review-dispatch-diff-manifest

## Documentation issues (tasks 7.2 / 7.3)

- In-repo docs issue: unbound-force/unbound-force#880
  ("docs: manifest + on-demand diff retrieval for large changesets
  in review dispatch", label `docs`, filed 2026-10-30).
- Website docs issue: unbound-force/website#349
  ("docs: review dispatch manifest delivery for large changesets",
  label `docs`, filed 2026-10-30). Constitution v1.4.0 Cross-Repo
  Documentation trigger: the change alters the /uf.review-council
  workflow and the scaffolded review-dispatch plugin `uf init`
  deploys.

## Dispositions of related open issues (task 7.2 step b)

- unbound-force/unbound-force#766 ("docs: review-dispatch recovery
  tools and consolidation changes"): remains scoped to the recovery
  workflow (issue #751 fix). Filed new rather than extending — the
  manifest-delivery surface is a distinct user-facing feature. The
  new issue #880 cross-references #766 and names the intersection
  points (`redispatch_failed_runs` retrieval allowance on the
  recovery path; the `consolidate_dispatch`
  `empty_coverage_attestation` advisory).
- unbound-force/website#313 ("docs: review-dispatch recovery tools"):
  same disposition — remains scoped to recovery; website#349
  cross-references it with the same intersection note.
- unbound-force/website#341 ("Document derived per-run review
  timeouts, operation windows, and cancelled-run recovery"): remains
  scoped to the RD-FR-028/029 derivation coverage; website#349
  cross-references it because the manifest retrieval allowance is a
  new additive term in that derivation.

## Constitution alignment verification (task 8.3)

Verified 2026-10-30 against the implemented code on
`opsx/review-dispatch-diff-manifest`. All six proposal PASS
assessments confirmed:

- **I. Autonomous Collaboration — CONFIRMED.** Manifest persisted as
  `<diff_path>.manifest.json` via the unlink-then-`O_EXCL` 0o600
  write (`index.ts` persistManifest); retrieval is artifact-addressed
  (`diff_path` + `chunk_id`/`file` selectors); the coverage
  attestation rides persisted child final text
  (`parseCoverageAttestation(run.text)`).
- **II. Composability First — CONFIRMED.** The lib module
  `review-diff-manifest.ts` is pure — zero fs/zod/crypto imports
  (grep-verified); `buildDiffManifest(patchContent, numstat?)` is a
  standalone pure function; all four tools remain independently
  usable; below-threshold assembly byte-identical (golden tests).
- **III. Observable Quality — CONFIRMED.** Machine-parseable JSON
  manifest with schema version, source diff path, byte length,
  SHA-256 digest, entries; `delivery_mode` recorded per dispatch and
  in tool output; `parseCoverageAttestation` +
  `empty_coverage_attestation` advisory; `retrieval_allowance_ms`
  in `TimeoutProvenanceRecord` (`run-timeout.ts`).
- **IV. Testability — CONFIRMED.** Pure builder unit-tested in
  `review-diff-manifest.test.ts`; `read-diff-chunk.test.ts` (12
  tests) exercises the tool through temp-dir filesystem fixtures,
  including path-validation and crafted-manifest fail-closed cases;
  no external services.
- **V. Security by Default — CONFIRMED.** Served chunks and the
  rendered manifest table wrapped via `wrapUntrusted`/
  `escapeDelimiters`; `validateDiffPath` + manifest-declared
  coordinate confinement (no arbitrary reads); fail-closed
  structured errors incl. SHA-256 integrity mismatch; 0o600
  `O_EXCL` artifact writes.
- **VI. Deterministic Execution — CONFIRMED.** Mode selection is a
  pure comparison (`diffLineCount > DIFF_THRESHOLD`); chunk ids are
  deterministic (`<path>#<index>`); below-threshold prompts
  byte-identical per golden tests; manifest-mode prompt sections
  are tool-rendered constants.

## Verification runs (tasks 8.1 / 8.2)

- `make plugin-test` and `make check`: green (phase 7 hard gate,
  2026-10-30) — all Go packages under `-race`, coverage-gate 0
  changed packages within scope thresholds, plugin suite 44 files /
  1462 tests, statements 95.46% vs the unchanged 94% floor;
  `council-review-action/test/test-pipeline.sh` re-run green after
  the phase 7 command-file edits (91 passed, 0 failed).
- `openspec validate review-dispatch-diff-manifest --type change
  --strict`: zero ERROR items. Warnings: five long-requirement
  (>500 chars) style warnings (pre-existing, present at spec
  review); three archive-order INFOs (capability specs established
  by sibling unarchived changes — the recorded advisory); the known
  benign `originating_issue` unrecognized-key warning.
