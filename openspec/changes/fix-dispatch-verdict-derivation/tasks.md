<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the same group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Plugin Verdict Derivation

- [x] 1.1 Read `.opencode/uf/packs/determinism.md` and
       `.opencode/uf/packs/typescript.md`, then re-verify the
       fix site (`.opencode/plugins/review-dispatch/index.ts`,
       `createConsolidateDispatchTool` L3286-3289) and the
       shared derivation (`calculatedWorkflowValue` L1957,
       finalizer call site L2286) against current HEAD
- [x] 1.2 Narrow `calculatedWorkflowValue` to a structural
       input type carrying exactly what it reads
       (`{ runs, workflow_result: { kind }, advisories }`);
       the finalizer call site MUST remain unchanged because
       the full payload satisfies the type structurally
- [x] 1.3 In `createConsolidateDispatchTool`, derive the
       top-level `workflow_result.value` from
       `calculatedWorkflowValue({ runs: dispatchRuns,
       workflow_result: { kind }, advisories: [] })`, set
       `verdict = projectNativeValue(value)`, and keep
       `computeVerdict` output for `verdict_reason` and the
       advisories gate unchanged (design D3 fixed-point
       ordering: value first, advisories from projected
       verdict)
- [x] 1.4 Confirm the zero-success path: with no successful
       runs the value comes from `noSuccessResult`, the
       verdict is the pass-through (`INCONCLUSIVE` /
       `UNAVAILABLE`, both verdict-enum members), and the
       payload validates

## 2. Scaffold Mirror

- [x] 2.1 [P] Apply the identical edit to
       `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
       (dispatch-finalization FR-005; drift-detection tests
       enforce equality)

## 3. Regression Tests

All tasks extend `.opencode/test/consolidate-dispatch.test.ts`
(same file: sequential, no [P]). Split panels need multi-entry
explicit plans; provenance commit MUST equal
`input_context.head_sha` for non-issue kinds.

- [x] 3.1 Feedback split panel: two-entry plan, one
       zero-findings run (ACCEPT) + one MEDIUM-findings run
       (AUTHOR-DECIDES); internal-finalize with provenance
       MUST succeed (verdict APPROVE, workflow_result
       `{ kind: "feedback", value: "ACCEPT" }`, finding
       retained, advisories empty), and the payload-only call
       MUST return a payload that finalizes unmodified
- [x] 3.2 Triage split-majority panel: three-entry plan with
       `triageIssueMetadata()`, two zero-findings runs (VALID)
       + one HIGH-findings run (INVALID); internal-finalize
       MUST succeed with value VALID and verdict APPROVE
- [x] 3.3 Council non-regression: mixed-severity panel
       (HIGH-findings run + zero-findings run) MUST produce
       the same severity-derived output as before (verdict
       REQUEST CHANGES)
- [x] 3.4 Zero-successful-runs panel: all runs failed with no
       findings; consolidation MUST finalize with verdict
       INCONCLUSIVE instead of a value-mismatch rejection

## 4. Verification

- [x] 4.1 Run `make plugin-test` -- the full vitest suite
       including scaffold drift tests MUST pass
- [x] 4.2 Run `make check` for CI parity
- [x] 4.3 Verify constitution alignment per the proposal:
       split panels persist an artifact on first finalization
       (I), no tool interface or caller changes (II), the
       verdict matches the documented strictest-rule contract
       (III), regression tests use isolated on-disk fixtures
       with no external services (IV)
- [x] 4.4 Documentation gate: add the CHANGELOG.md bugfix
      entry and confirm no AGENTS.md/README.md impact
      (behavioral bugfix, no structural or usage change)
- [x] 4.5 File the in-repo documentation issue for this
      user-facing change before PR merge (per AGENTS.md
      documentation gate): duplicate-check open docs-labeled
      issues in this repo first, describe the verdict-outcome
      change for /uf.address-feedback and /uf.triage-issue
      split panels and the uf init scaffold-mirror deployment,
      and record the filed issue number here — filed as #778
- [x] 4.6 File the cross-repo documentation issue in
      unbound-force/website for this workflow-affecting change
      before PR merge (per org constitution Cross-Repo
      Documentation): duplicate-check open website issues
      first (website#303 tracks adjacent command-reference
      work), describe the change in the website repo's terms,
      and record the filed issue number here — filed as
      unbound-force/website#316
