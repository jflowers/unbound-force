# unleash Direct Review Dispatch (Increment 1)

Parent: `/uf.unleash` review steps dispatch councils directly through
the review-dispatch plugin tools and own their fix-gate policy.

## ADDED Requirements

### Requirement: Direct review dispatch

`/uf.unleash` Steps 4 (Spec Review) and 6 (Code Review) MUST invoke
the review-dispatch plugin tools directly from the parent command:
`resolve_base_ref`, `plan_review_dispatch`, `dispatch_review_runs`
(command `review-council`), and `consolidate_dispatch`. The steps
MUST NOT delegate the review-driver role to `cobalt-crush-dev` or
any other child agent whose purpose is to read `uf.review-council.md`
and call the tools on unleash's behalf.

#### Scenario: Spec review dispatch
- **GIVEN** the pipeline reaches Step 4 on a feature branch
- **WHEN** the spec review runs
- **THEN** the parent command calls `plan_review_dispatch` with mode `specs`, `dispatch_review_runs` with command `review-council`, and `consolidate_dispatch` exactly once per finalization attempt, without spawning a `cobalt-crush-dev` driver session

#### Scenario: Code review dispatch
- **GIVEN** the pipeline reaches Step 6 with a passing build
- **WHEN** the code review runs
- **THEN** the parent command performs the same direct-call sequence with mode `code`, without spawning a `cobalt-crush-dev` driver session

### Requirement: Local immutable input resolution

Before planning a review, `/uf.unleash` MUST resolve a local input
context: base ref via `resolve_base_ref`, head as the current branch
head SHA, and the immutable diff captured with tracked changes
(`git diff <base_sha> -- .`) plus untracked files
(`git ls-files --others --exclude-standard`). When the branch has no
commits ahead of base and the working tree carries the change, the
context MUST be flagged `uncommitted: true` with null PR number.
SHA and ref validation failures MUST stop the step before any child
reviewer dispatch.

#### Scenario: Uncommitted-work review
- **GIVEN** Step 4 runs immediately after artifact creation with no commits ahead of base
- **WHEN** input context is resolved
- **THEN** the diff includes tracked and untracked spec artifacts and the context is marked `uncommitted: true` with null `pr_number`

#### Scenario: Invalid context stops dispatch
- **GIVEN** the resolved head SHA does not match `^[0-9a-f]{40}$`
- **WHEN** input validation runs
- **THEN** the step stops before `dispatch_review_runs` and reports the validation failure

### Requirement: Reviewer discovery and fail-closed planning

`/uf.unleash` MUST discover reviewers by enumerating regular
`divisor-*.md` files under `.opencode/agents/`, stripping the
extension, sorting, and passing the complete list to
`plan_review_dispatch`. If no reviewers are discovered, the step
MUST exit fail-closed without dispatching. The step MUST proceed to
dispatch only when the returned plan is ready, has a null
`workflow_result`, and no errors; otherwise it MUST finalize the
failed dispatch and exit.

#### Scenario: Zero reviewers
- **GIVEN** `.opencode/agents/` contains no `divisor-*.md` files
- **WHEN** Step 4 or Step 6 attempts discovery
- **THEN** the step exits with a fail-closed message and dispatches no reviewer

#### Scenario: Plan not ready
- **GIVEN** `plan_review_dispatch` returns status not `ready` or a non-empty errors list
- **WHEN** the step evaluates the plan
- **THEN** it finalizes the failed dispatch and exits instead of calling `dispatch_review_runs`

### Requirement: Spec auto-fix consent gate

When a spec review returns REQUEST CHANGES with only LOW or MEDIUM
findings, `/uf.unleash` MUST present the auto-fix decision to the
human via the question tool with the three council options: apply
auto-fixes, review findings first, or skip auto-fixes and report
only. `/uf.unleash` MUST NOT modify spec artifacts on LOW/MEDIUM
findings without explicit human consent. HIGH or CRITICAL findings
MUST exit the pipeline with tier-specific recovery guidance. This
gate is the single legitimate mid-pipeline human interaction named
by the guardrails. The council's session-resume guard applies to
this gate: consent captured before a context compression or session
resume is not valid, and the question MUST be re-presented on
resume.
#### Scenario: Consent granted

- **GIVEN** a spec review returns REQUEST CHANGES with two LOW findings and no HIGH/CRITICAL findings
- **WHEN** the human selects "Apply auto-fixes"
- **THEN** the parent applies the LOW/MEDIUM fixes itself and re-runs the review per the iteration requirement

#### Scenario: Review findings first

- **GIVEN** a spec review returns REQUEST CHANGES with only LOW/MEDIUM findings
- **WHEN** the human selects "Review findings first" and the findings are displayed
- **THEN** the question tool re-presents the same three options; no spec edits occur until a selection is made

#### Scenario: Consent withheld
- **GIVEN** the same REQUEST CHANGES verdict
- **WHEN** the human selects "Skip auto-fixes -- report only"
- **THEN** the pipeline exits at spec review with the findings and tier-specific recovery guidance, making no spec edits
#### Scenario: Blocking findings bypass the gate

- **GIVEN** a spec review returns findings at HIGH or CRITICAL severity
- **WHEN** the verdict is processed
- **THEN** the pipeline exits at spec review without presenting the auto-fix question

#### Scenario: Mixed severities bypass the gate

- **GIVEN** a spec review returns REQUEST CHANGES with one LOW and one HIGH finding
- **WHEN** the verdict is processed
- **THEN** the pipeline exits without presenting the auto-fix question; the HIGH finding takes precedence over the accompanying LOW finding

#### Scenario: Consent invalidated by resume

- **GIVEN** the human consented to auto-fixes and the session was resumed from compressed context before the fixes were applied
- **WHEN** Step 4 resumes
- **THEN** the consent question is re-presented instead of proceeding on the pre-resume consent

### Requirement: Fix iteration semantics

After consented spec auto-fixes or during code-review fix loops,
`/uf.unleash` MUST re-resolve the immutable input, re-validate the
full plan, and rerun every included reviewer from the plan (not only
blocking personas), reusing sibling evidence for the iteration. The
step MUST cap fix iterations at three; exhausting the cap MUST exit
the pipeline with persistent findings and recovery guidance.

#### Scenario: Rerun includes advisory reviewers
- **GIVEN** a consented fix iteration where one reviewer requested changes and two approved with advisories
- **WHEN** the review re-runs
- **THEN** all three included reviewers are dispatched again with recomputed input and plan

#### Scenario: Iteration cap
- **GIVEN** three completed fix iterations without an approving verdict
- **WHEN** the loop evaluates continuation
- **THEN** the pipeline exits at the review step with the persistent findings reported

### Requirement: Verdict mapping

`/uf.unleash` MUST map consolidated verdicts to pipeline decisions:
APPROVE and APPROVE WITH ADVISORIES proceed to the next step;
REQUEST CHANGES enters the fix path (consent gate for specs, fix
loop for code); INCONCLUSIVE and UNAVAILABLE exit the step with the
council's no-success reasons. At least one successful assessment
MUST exist for any progressing verdict.

#### Scenario: Advisory verdict proceeds
- **GIVEN** consolidation returns APPROVE WITH ADVISORIES
- **WHEN** Step 6 processes the verdict
- **THEN** the pipeline proceeds and the advisories are recorded for the final report

#### Scenario: No successful assessments
- **GIVEN** consolidation returns INCONCLUSIVE because no reviewer run succeeded
- **WHEN** the verdict is processed
- **THEN** the pipeline exits at the review step with the no-success reasons

### Requirement: Code review pre-flight gate

Step 6 MUST run the pre-flight check in soft-gate mode before
dispatching reviewers, and pass its results to
`dispatch_review_runs`. When pre-flight reports branch-caused
failures, Step 6 MUST stop, report each failure as a CRITICAL
finding with full output, and finalize the dispatch fail-closed
without dispatching child reviewers. Pre-existing failures MUST be
recorded for the final report without blocking.

#### Scenario: Branch-caused failure
- **GIVEN** pre-flight reports a build failure classified as branch-caused
- **WHEN** Step 6 evaluates the result
- **THEN** no reviewer is dispatched, the failure is reported as a CRITICAL finding, and the dispatch is finalized fail-closed

#### Scenario: Pre-existing failure
- **GIVEN** pre-flight reports a failure classified as pre-existing on the base ref
- **WHEN** Step 6 evaluates the result
- **THEN** the failure is recorded and the review dispatch proceeds

### Requirement: Guardrail consistency

The `/uf.unleash` guardrails MUST name the spec auto-fix consent
gate as the single legitimate mid-pipeline human interaction,
amending the "never pause between steps" rule. The guardrails MUST
retain: never run on `main`, never skip the spec review exit on
HIGH/CRITICAL findings, actionable exit messages, and verbatim demo
output.

#### Scenario: Guardrail names the gate
- **GIVEN** the updated `uf.unleash.md` guardrails section
- **WHEN** a reader searches for the pause prohibition
- **THEN** the exception for the spec auto-fix consent gate is stated explicitly

### Requirement: Byte-identical command mirrors

Changes to `uf.unleash.md` MUST be applied identically to both
mirrors: `.opencode/commands/uf.unleash.md` and
`internal/scaffold/assets/opencode/commands/uf.unleash.md`. The
mirrors MUST remain byte-identical after the change, as enforced by
the existing drift tests.

#### Scenario: Drift test passes
- **GIVEN** both mirrors are updated with the rewritten Steps 4 and 6
- **WHEN** the scaffold drift tests run
- **THEN** the mirrors compare byte-identical and the tests pass

### Requirement: Verification coverage

The implementation MUST verify this change with the existing test
suite: scaffold drift tests (`make test`), plugin tests
(`make plugin-test`), and lint (`make lint`). Because the change is
command markdown only, no new code coverage is required; the tasks
MUST record before/after line and token deltas for the rewritten
steps as the Principle VI measurable outcome.

#### Scenario: Full verification
- **GIVEN** both mirrors are rewritten
- **WHEN** `make test`, `make plugin-test`, and `make lint` run
- **THEN** all pass with no new failures and the deltas are recorded in the tasks artifact
