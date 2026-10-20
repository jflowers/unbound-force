<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, and (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Shared Libs

- [x] 1.1 [P] Extend `classifyBranch` with a `quick` branch
  type: `quick/<name>` → `branchType: "quick"`, `changeName:
  "<name>"`, `isMain: false`. Keep `main`/`master` behavior
  unchanged. File:
  `internal/scaffold/assets/opencode/lib/branch-classification.ts`
- [x] 1.2 [P] Extend `WORKFLOW_TIERS` to
  `["speckit", "openspec", "quick"]`. Add quick branches to
  `specReviewRecoveryGuidance` and `demoRefinementOption` (quick
  skips spec refinement; offer a follow-up change). File:
  `internal/scaffold/assets/opencode/lib/unleash-templates.ts`

## 2. Route Decision Tool

- [x] 2.1 Implement `uf_unleash_route_decision` in the
  uf-workflow plugin: params `{tier, change_name, rationale,
  description, issue_number?}`; tier MUST be in WORKFLOW_TIERS;
  records the decision via the checkpoint system; when tier is
  quick, creates and checks out `quick/<change_name>` via the
  injected git exec; returns JSON with tier, change_name,
  branch, rationale, issue_number. As-amended by 9.1: params gain
  optional `risk_signals` (quick rejected when any is present).
  File:
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [x] 2.2 [P] Tests: route decision recording, quick branch
  creation (injected GitExec assertions), rejection of invalid
  tiers, speckit/openspec do not create branches. File:
  `.opencode/test/unleash-route-decision.test.ts`

## 3. Gate and Resume Support

- [x] 3.1 Extend `uf_unleash_branch_gate`: accept `quick/*` as
  tier `quick` with no artifact prerequisites. NO_TASKS and
  NO_SPEC envelopes and STOP messages remain unchanged; ON_MAIN
  and UNRECOGNIZED_BRANCH envelopes now carry the command's
  routing messages. File:
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [x] 3.2 Extend `uf_unleash_detect_resume`: quick branches
  treat clarify/plan/tasks/spec-review as done and derive
  implement from the `implement` checkpoint claim recorded by
  `uf_delegate_command` (checkpoint reconciliation runs before
  probes); `feature_dir` becomes optional, required for
  speckit/openspec tiers. As-amended by 10.2: quick-tier implement
  derives from BOTH the `implement` claim AND the
  `quick-pre-flight` gate claim (implement claimed without the
  gate is incomplete). File:
  `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`
- [x] 3.3 [P] Tests: gate accepts quick/*, gate still STOPs on
  tier-named branches with missing artifacts, quick resume
  probing from checkpoint claims, routing messages on
  ON_MAIN/UNRECOGNIZED_BRANCH. File:
  `.opencode/test/unleash-branch-gate.test.ts`,
  `.opencode/test/unleash-resume.test.ts`

## 4. Tier-Routing Skill

- [x] 4.1 Create the skill with the routing rubric (speckit /
  openspec / quick definitions, scope signals), risk floors
  (security-sensitive, auth, data-loss, public-API-breaking →
  minimum openspec), issue-reference classification guidance
  (`#NNN`, gh issue URLs, `gh issue view` invocation, untrusted
  content rules), and the announcement format (tier, change
  name, rationale). File:
  `internal/scaffold/assets/opencode/skills/tier-routing/SKILL.md`

## 5. Command Rewrite

- [x] 5.1 Add the routing step to the uf.unleash template:
  `$ARGUMENTS` description capture, issue-ref resolution
  guidance, dirty-tree guard, rubric invocation via the
  tier-routing skill, `uf_unleash_route_decision` call, and
  per-tier orchestration (speckit → delegate
  `speckit.specify.md` + gate re-run verification → clarify;
  openspec → delegate `opsx-propose.md` + gate re-run → spec
  review; quick → direct implement). Update the quick-tier
  pipeline path (skip clarify/plan/tasks/spec-review, keep
  implement → pre-flight → review → retrospective → demo) and
  the resumability step's quick branch. File:
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`

## 6. Finale and Review Council

- [x] 6.1 [P] Support `quick/*` branches in the uf-finale
  plugin (PR creation, branch classification via the shared
  lib) and thread the originating issue number into the PR body
  (`Closes #N` when the route decision recorded one). Files:
  `internal/scaffold/assets/opencode/plugins/uf-finale/index.ts`
  and any finale command template that enumerates tiers.
  Done: startup classification flows from the shared
  `classifyBranch` (quick/* -> branchType "quick"); the
  route-decision issue number is read from the branch-scoped
  `.uf/progress/<slug>/uf.unleash.json` state in
  `uf_finale_pr_context`, taking precedence over
  `.openspec.yaml`.
- [x] 6.2 [P] Quick-branch awareness in the review council
  command: quick tiers review in code mode (no spec artifact).
  File:
  `internal/scaffold/assets/opencode/commands/uf.review-council.md`
  Done: auto-detection classifies `quick/*` as the quick
  workflow (code paths by definition); explicit `specs` mode on
  a quick branch stops with a no-spec-artifacts message.
- [x] 6.3 [P] Tests for finale quick-branch classification and
  issue threading. File: `.opencode/test/` (finale test file)
  Done: `.opencode/test/uf-finale.test.ts` — startup quick
  classification, route-decision issue threading (exact state
  path), precedence over `.openspec.yaml`, and fail-closed
  behavior without a recorded tier-routing step.

## 7. Docs

- [x] 7.1 Update the website workflow documentation: routing
  section describing the three tiers and when `/uf.unleash`
  picks each, replacing manual tier-selection advice. File:
  `content/docs/getting-started/common-workflows.md` (in the
  website repo)
  Done: quick-reference row, section intro (description → demo
  framing), new "Tier Routing" subsection (description
  gathering with issue refs, rubric, risk floors, announce
  and start, quick pipeline), Branch Safety rewritten for
  three branch patterns + never-modify-on-main, finale tier
  list + issue closing, and the Bug Fix (Tactical) intro now
  points at automatic routing. Delivered via branch
  `docs/unleash-tier-routing` and PR unbound-force/website#315
  (merge pending; will close #314 on merge; never committed to
  website main).
- [x] 7.2 File the cross-repo documentation tracking issue in
  unbound-force/website per the org constitution Cross-Repo
  Documentation rule, before the implementing PR merges.
  Done: unbound-force/website#314 (docs label); PR
  unbound-force/website#315 will close #314 on merge.
  Follow-through: the feature PR for this change tracks website
  PR #315 — the gate is met at filing; closure completes when
  the website PR merges (never record past-tense closure before
  the merge).
- [x] 7.3 File the docs-labeled documentation issue against
  unbound-force/unbound-force per the AGENTS.md documentation
  gate.
  Done: unbound-force/unbound-force#772 (docs label); AGENTS.md
  Specification Workflow table gains the quick tier row and
  CHANGELOG.md gains the Unreleased entry.
- [x] 7.4 Redefine documentation task done-criteria: done means
  tracking issues filed and docs landed via branch + PR, never
  an uncommitted working-tree edit; correct the recorded
  website docs path.
  Done: 7.1 path corrected to
  content/docs/getting-started/common-workflows.md; issue and
  PR numbers recorded above.

## 8. Verification

- [x] 8.1 Full `.opencode/test/` suite green via the
  repository's test command
  Done: `npx vitest run` (and `--coverage`) — 33 files, 926
  tests passed; `go test ./internal/scaffold/ -count=1` ok.
- [x] 8.2 `openspec validate --change unleash-tier-routing`
  passes
  Done: valid; only house-norm long-text warnings (same
  class as pending unleash-deterministic-tools).

## 9. Spec Review Fixes

- [x] 9.1 Enforce the risk floor mechanically in
  `uf_unleash_route_decision`: add an optional `risk_signals`
  parameter; reject tier `quick` with an actionable escalation
  error when any signal is present, before creating any branch;
  update the uf.unleash template's Step 1a.4 call shape to pass
  identified floor signals and re-route at openspec or above on
  rejection; update the tier-routing skill to instruct passing
  identified floor signals. Table-driven tests: each floor
  signal with quick rejected; signals with openspec/speckit
  allowed; no signals with quick allowed. Files: uf-workflow
  plugin, uf.unleash.md, tier-routing SKILL.md,
  `.opencode/test/unleash-route-decision.test.ts` (live and
  scaffold mirrors).
  Done: `risk_signals` (free-form strings, max 32) on the schema;
  ROUTE_RISK_FLOOR rejection before any git call naming the
  signals and directing escalation; Step 1a.4 passes signals and
  re-routes (not STOP) on rejection; skill Phase 4 hands signals
  to the tool, Phase 5 call shape updated. 9 new table-driven
  tests (4 signals + multi-signal + speckit/openspec allowed +
  omitted/empty allowed). Live files and scaffold mirrors in
  sync.
- [x] 9.2 Thread the issue number end-to-end for speckit and
  openspec routes: uf.unleash Step 1a.5 delegation prompts carry
  the resolved issue number when present; after the Step 1a.6
  gate re-run succeeds, the pipeline re-records the tier-routing
  checkpoint under the created feature branch key (checkpoint
  tool key override) so `/uf.finale`'s branch-scoped read finds
  it. End-to-end handoff test: route decision recorded under
  the pre-route key, state re-keyed under the feature branch,
  `uf_finale_pr_context` emits `Closes #<N>`. Files:
  uf.unleash.md, uf-workflow plugin,
  `.opencode/test/uf-finale.test.ts` (live and scaffold
  mirrors).
  Done: Step 1a.5 speckit/openspec prompts carry issue_number
  (openspec child records `originating_issue` in
  `.openspec.yaml`); new substep 7 re-keys tier-routing under
  the verified feature branch via the existing checkpoint tool's
  key override (no new helper needed — data passed through from
  the decision); end-to-end test composes route decision ->
  checkpoint re-key -> `uf_finale_pr_context` over one in-memory
  state store and asserts `originatingIssue` 743 at the exact
  feature-branch path. Live files and scaffold mirrors in sync.
- [x] 9.3 Fix the "proceed directly to Step 8" cross-reference
  ambiguity in uf.unleash.md: the implement section's
  continuation targets code review (Step 6), not the Demo step;
  audit all internal step cross-references for the same
  ambiguity. Files: uf.unleash.md (live and scaffold mirror).
  Done: all end-of-section continuations now use the
  frontmatter's 8-step pipeline numbering with names —
  Clarify=1 through Demo=8 (the quick-implement "Step 8" bug
  and 15 sibling references fixed); pre-pipeline sections
  reference the Branch Safety Gate and Resumability Detection
  by name; correct section/step references (Step 1a, Step 4
  spec review, Steps 0-10 count) left as-is. Live file and
  scaffold mirror in sync; scaffold contract tests green
  ("CHECKPOINT: Call" count still 2). Round-2 widening (task
  10.4): the audit extended to external governance documents —
  AGENTS.md's two stale "/uf.unleash Step 8" review-council
  references corrected to Step 6 (Code Review).
- [x] 9.4 Update AGENTS.md Specification Workflow with the
  quick tier (table row + branch pattern) and add the
  CHANGELOG.md Unreleased entry.
  Done: AGENTS.md quick row and Branches note; CHANGELOG.md
  Unreleased/Added entry for unleash-tier-routing.
- [x] 9.5 Reconcile proposal.md with design D6 (checkpoint
  state, not the removed progress artifact), record the
  sibling-change archive-order constraint, and correct the
  website docs path in Impact.
  Done: What Changes bullets and Constitution Alignment III
  updated; Impact carries the website path, PR/issue numbers,
  and the unleash-deterministic-tools archive-after note.
- [x] 9.6 Full `.opencode/test/` suite green,
  `go test ./internal/scaffold/ -count=1` passing, and
  `openspec validate --change unleash-tier-routing` passing
  after 9.1-9.3.
  Done: vitest 33 files / 936 tests passed (coverage run clean);
  `go test ./internal/scaffold/ -count=1` ok (drift + template
  contracts); `openspec validate unleash-tier-routing` valid
  with only the house-norm long-text warnings already accepted
  at 7.x. Coverage criterion recorded per Constitution IV:
  94.61% statements (round-1 verification measurement) anchors
  the new TypeScript against regression — the plugin suite has
  no configured coverage gate (adding one is a separate
  governance change).

## 10. Round-2 Spec Review Fixes

- [x] 10.1 Extract issue reference resolution into a tested
  `uf_unleash_resolve_issue` tool: injected gh runner (zero real
  subprocess calls in tests), `#NNN` and issue-URL detection,
  pass-through when no reference is present, fail-closed
  non-retryable envelopes for gh missing / unauthenticated /
  not-found, untrusted body passed through as data only. Rewire
  template Step 1a.1 and the tier-routing skill Phase 1 to call
  the tool, trimming 1a.1's duplicated description-gathering
  prose to a pointer at the skill (single source of truth).
  Table-driven tests in
  `.opencode/test/unleash-resolve-issue.test.ts`.
  Done: factory `createUnleashResolveIssueTool(ghRunner, cwd)`
  registered beside `uf_unleash_route_decision`; 22 tests green;
  Step 1a.1 trimmed; skill Phase 1 rewired; registration
  inventories updated; live files and scaffold mirrors in sync.
- [x] 10.2 Make the quick tier's pre-flight hard gate durable
  across resumes: the template records a `quick-pre-flight`
  checkpoint only after the gate passes, and
  `uf_unleash_detect_resume` requires both the `implement` and
  `quick-pre-flight` claims for quick-tier implement-done (the
  payload exposes the individual claims; implement claimed
  without the gate resumes at implement without re-delegation).
  Tests in `.opencode/test/unleash-resume.test.ts`.
  Done: quick-tier derivation requires both claims (payload
  fields quick-tier-only, OpenSpec/Speckit shapes unchanged);
  resume cases green.
- [x] 10.3 Reconcile the sibling `unleash-deterministic-tools`
  artifacts: proposal branch-classification list gains the quick
  tier and the gate outcome is reworded from "exact STOP
  message" to the routing message; tasks 2.1/2.4 annotated with
  the as-amended routing semantics; design risks note plus new
  sibling task 9.4 encoding the archive-order constraint (the
  sibling references `uf_unleash_route_decision`).
- [x] 10.4 Fix AGENTS.md's two stale `/uf.unleash` Step 8
  review-council references (Behavioral Rules and the PR Review
  Commands table) to Step 6 (Code Review); task 9.3's Done note
  records the widened audit scope.
- [x] 10.5 Correct task 7.2's closure record to futurative
  wording (website PR #315 will close #314 on merge) with
  follow-through tracking, and record the plugin-suite coverage
  baseline as this change's coverage criterion (9.6 + design
  risks; no gate configuration touched).
- [x] 10.6 Artifact completeness: design D5 enumeration gains
  `risk_signals`; D6 records the quick-pre-flight durable
  record; proposal Impact gains the content-coverage line and
  the live `.opencode/` counterpart paths; the proposal's
  issue-resolution and quick-tier bullets and Constitution VI
  enumeration name the tested tools; spec.md's floors scenario
  is reworded at the enforced mechanical boundary; the
  issue-reference requirement names `uf_unleash_resolve_issue`;
  the quick-tier resumability requirement records the
  both-claims derivation.
- [x] 10.7 Full verification after 10.1-10.6: `.opencode/test/`
  suite green, `go test ./internal/scaffold/ -count=1` passing,
  `openspec validate unleash-tier-routing` valid, live/mirror
  sync verified, fresh coverage measurement recorded.
  Done: vitest 34 files / 961 tests passed; coverage clean at
  94.58% statements (round-2 fresh measurement; the round-1
  baseline of 94.61% recorded at 9.6 stands as the change's
  criterion); `go test ./internal/scaffold/ -count=1` ok (drift
  + template contracts — live/mirror sync verified);
  `openspec validate unleash-tier-routing` valid with 0 errors
  (only the house-norm long-text warnings already accepted at
  7.x).

## 11. Round-3 Spec Review Fixes

- [x] 11.1 Complete the sibling reconciliation: the
  unleash-deterministic-tools spec's quick-mode clause mirrors
  the both-claims derivation (implement AND quick-pre-flight);
  sibling design/proposal swept clean of single-claim wording.
- [x] 11.2 As-amended annotations on tasks 2.1 (risk_signals
  via 9.1) and 3.2 (both-claims via 10.2).
- [x] 11.3 De-stale repo docs: docs/usage.md and
  docs/architecture.md teach the three-tier model and automatic
  routing; #772 scope extended via comment.
- [x] 11.4 Pin three spec MUSTs with scenarios: gate-pending
  implement claim, openspec no-branch, quick council code mode.
- [x] 11.5 Reconcile website-PR wording: proposal Impact and
  7.1 use merge-pending futurative wording (PR #315 verified
  open).
- [x] 11.6 Pin accidental behaviors: hash-form PR reference
  stops fail-closed (test + SKILL.md wording, mirrors in sync),
  issues/12a URL non-match row, uf-finale state-reader guard
  branches (non-integer issue number, corrupt JSON).
- [x] 11.7 Track the deferred plugin-suite coverage gate:
  unbound-force/unbound-force#780 filed and recorded in the
  design risk note.
- [x] 11.8 Full verification after 11.1-11.7: `.opencode/test/`
  suite green, `go test ./internal/scaffold/ -count=1` passing,
  `openspec validate unleash-tier-routing` valid.
  Done: vitest 34 files / 965 tests passed (4 new round-3
  pins); `go test ./internal/scaffold/ -count=1` ok (drift +
  template contracts — live/mirror sync verified);
  `openspec validate unleash-tier-routing` valid with 0 errors;
  sibling sweep greps clean (no residual single-claim quick-mode
  wording in unleash-deterministic-tools).

## 12. Code Review Advisories

- [x] 12.1 Doc de-staling completed for the code-review
  sweep: architecture.md Spec Pipelines intro + decision
  diagram, README framework enumeration, QUICKSTART Next
  Steps, heroes.md capability list, usage.md /uf.unleash
  argument form (A1-A5).
- [x] 12.2 Fail-closed enumeration: uf.unleash Step 1a.1 and
  the skill's Phase 1 name both ISSUE_RESOLVE_FAILED and
  ISSUE_RESOLVE_ERROR (live + scaffold mirrors).
- [x] 12.3 Test pins: A11 rename, A12 boundary rows (slug
  grammar, 128-char cap, risk_signals bounds), A13 three
  resolve-issue edges, A14 defaultGhRunner contract.
- [x] 12.4 AGENTS.md originating-issue precedence sentence
  (route-decision state overrides .openspec.yaml on routed
  branches).
- [x] 12.5 Deferrals recorded: prose-rendered templates
  noted in design risks; plugin helper extraction tracked as
  unbound-force/unbound-force#782; coverage-gate ratchet
  remains tracked by #780 (A15 wording softened).
- [x] 12.6 Full verification after 12.1-12.5.
  Done: vitest 34 files / 978 tests passed (13 new advisory
  pins); `go test ./internal/scaffold/ -count=1` ok (mirrors
  in sync, CHECKPOINT count 2); `openspec validate
  unleash-tier-routing` valid with 0 errors.
