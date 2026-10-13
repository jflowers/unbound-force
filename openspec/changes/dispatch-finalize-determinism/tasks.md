<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file --
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Plugin Fix (kind-native run verdicts)

- [x] 1.1 In `.opencode/plugins/review-dispatch/index.ts`
       `createConsolidateDispatchTool`: hoist
       `const kind = workflowKind(sessionMetadata.command)` above
       the dispatchRuns block and change run emission to
       `workflow_verdict: run.status === "success" ?
       workflowVerdictValue(kind, runVerdict(run.findings)) :
       null` (FR-001)
- [x] 1.2 Mirror the exact edit into
       `internal/scaffold/assets/opencode/plugins/review-dispatch/index.ts`
       (FR-005)

## 2. Plugin Regression Tests

- [x] 2.1 Add triage-kind internal-finalize test: persisted
       session with `command: "triage-issue"`, one successful run
       with LOW findings, `consolidate_dispatch` with provenance
       returns `status: "success"` and native run verdicts
       (`NEEDS-CLARIFICATION`), no "verdict outside triage" errors
       (FR-001)
- [x] 2.2 Add feedback-kind internal-finalize test: same shape
       with `command: "address-feedback"`, assert run verdict maps
       to `AUTHOR-DECIDES` (FR-001)
- [x] 2.3 Add payload-without-provenance triage test: returned
       payload runs carry native verdicts and the payload passes
       `finalize_review_dispatch` structural+semantic validation
       when submitted unmodified (FR-001)
- [x] 2.4 Run `make plugin-test` and confirm the full suite passes

## 3. Command Rewrites

- [x] 3.1 Rewrite uf.triage-issue.md §4.6 (both
       `.opencode/commands/` and
       `internal/scaffold/assets/opencode/commands/` copies):
       single `consolidate_dispatch` call with provenance
       {branch, commit, workflow_id: "uf.triage-issue"};
       authoritative finalizer output; no manual payload assembly;
       action completion reported in §4.7 terminal report and the
       legacy issue-triage artifact instead of `verdict_reason`;
       mapping table display-only; bounded mechanical retry (max
       2) vs fail-closed INCONCLUSIVE (FR-002, FR-003, FR-004,
       FR-008)
- [x] 3.2 [P] Rewrite uf.review-council.md §5 (both copies):
       same one-call consolidate+provenance pattern with workflow
       id `uf.review-council`, keep the REQUEST CHANGES fix-loop
       semantics unchanged (FR-002, FR-003, FR-004, FR-008)
- [x] 3.3 [P] Rewrite uf.address-feedback.md §2.3.8 (both
       copies): same one-call pattern with workflow id
       `uf.address-feedback` and the PR-branch/head-SHA provenance
       source (FR-002, FR-003, FR-004, FR-008)
- [x] 3.4 Fix uf.triage-issue.md §1.1 (both copies): replace
       the `--paginate --slurp` snippet with
       `gh api --paginate ... --jq '.[] | {id, created_at,
       body}'` (FR-006)
- [x] 3.5 Add uf.triage-issue.md §1.4 fallback (both copies):
       zero-result primary search → retry once with top 2-3 title
       keywords, deterministic candidate recording (FR-007)

## 4. Verification, Parity, and Docs

- [x] 4.1 Verify byte-identical parity between every
       `.opencode/` file edited in groups 1 and 3 and its
       `internal/scaffold/assets/opencode/` mirror (FR-005)
- [x] 4.2 Run `make check` — which includes the scaffold
       drift-detection parity tests
       (internal/scaffold/scaffold_test.go), `make build`
       (embed.FS asset sync), and `make plugin-test`; all must
       pass (FR-005, FR-001)
- [x] 4.3 Add a CHANGELOG.md entry describing the deterministic
       one-call finalization and the kind-native run verdicts
- [x] 4.4 File a documentation issue for the user-facing command
       behavior change before PR merge (per AGENTS.md
       documentation gate; duplicate-check open docs issues in
       this repo first)
- [x] 4.5 Confirm constitution alignment: human-confirmation
       gates untouched, no governance gate modified, artifacts
       remain tool-authoritative (proposal Constitution Alignment
       I-V)
- [x] 4.6 File a cross-repo documentation issue in
       unbound-force/website for the user-facing command behavior
       change before PR merge (per org constitution Development
       Workflow, Cross-Repo Documentation; duplicate-check open
       website issues first and describe the change in the
       website repo's terms)
