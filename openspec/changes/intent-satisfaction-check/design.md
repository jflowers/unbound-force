## Context

The review council's CODE review mode validates code quality but
not issue intent. Three seams produce the gap (see proposal.md
Why): the originating issue number is recorded by tier routing
and `.openspec.yaml` but consumed only by `/uf.finale`;
review-context Protocol 2 runs only when an explicit PR number
is provided (the local pre-PR path — `/uf.unleash` Step 6,
which dispatches the council directly through the
review-dispatch plugin — has no PR, so it never runs); and no
persona receives the originating issue's acceptance criteria,
so divisor-guard evaluates intent only against spec artifacts.

The seams this design builds on:

- Branch-scoped tier-routing checkpoint state (`issue_number`),
  re-keyed under the feature branch by `/uf.unleash` substep 7.
- `.openspec.yaml` `originating_issue`, recorded by
  `/opsx-propose` when routed from an issue.
- review-context Protocol 2's fetch/sanitize/extract mechanics
  (gh issue view, truncation, same-repo scoping).
- The `review_context` channel of `dispatch_review_runs` /
  `build_review_prompts`, which already carries bounded context
  into every reviewer prompt.
- divisor-guard's Code Review Mode checklist, whose item 1
  (Intent Drift Detection) already evaluates implementation
  against acceptance criteria — today only the spec's.

## Goals / Non-Goals

### Goals

- Thread the originating issue reference to CODE review
  dispatch as required, machine-readable state.
- Ground and carry the issue's acceptance criteria into
  reviewer prompts with an honestly recorded grounding tier.
- Make divisor-guard's per-criterion evaluation feed the normal
  consolidation and verdict machinery.
- Route legitimate AC-invalidating discoveries to governance
  through a typed intent-deviation finding.
- Record issue reference, grounding tier, and per-criterion
  outcomes in the persisted dispatch artifact.

### Non-Goals

- The general eval harness (Discussion #399, ROADMAP Horizon 2)
  — this change is the review-council instance that may inform
  it, not the harness itself.
- Implementing Discussion #444's typed-interruption framework —
  this change connects to it and adopts its machinery if and
  when it lands.
- SPECS review mode — spec artifacts are already the intent
  source there; the issue is explicit that the check targets
  CODE review mode.
- Changing verdict policy, severity definitions, or iteration
  limits — gatekeeping values are untouched.
- intake-kit integration itself (#541, #543) — its provenance
  is consumed, never required.
- Making an originating issue mandatory — the check activates
  only when one resolves.

## Decisions

### D1: Hybrid ownership — guard evaluates, tool acquires,
commands invoke

The check is split across three layers, each doing what it
is for:

- **Mechanical acquisition** (issue-reference resolution,
  fetch, sanitize, extract, tier) lives in review-dispatch
  plugin tool code — a new acquisition tool sibling to the
  existing gh-resolution precedents
  (`uf_unleash_resolve_issue` resolves issue references
  through gh; `uf_finale_pr_context` resolves the
  originating issue from route-decision state and
  `.openspec.yaml`). Per DE-001/DE-005 the judgment-free
  chain — resolve, fetch, extract, tier, forward — collapses
  into this one tool, covered by plugin unit tests.
- **Invocation** lives in command and skill prose:
  `/uf.unleash` Step 6, `/uf.review-council` Phase 1c, and
  review-context Protocol 2 name and call the acquisition
  tool; they do not restate its procedure.
- **Evaluation** (per-criterion satisfaction judgment) is owned
  by divisor-guard, extending its existing Intent Drift
  Detection item from spec ACs to issue ACs.

Rejected alternatives:

- **Protocol 2 alone (optional to mandatory).** A skill
  supplies context but owns no evaluation or gating; making it
  mandatory also changes the contract for `/uf.review-pr` and
  `/uf.address-feedback`, which share it. And the local pre-PR
  path has no PR body to parse, so a pipeline-state input path
  is required regardless of mandating.
- **A consolidation-phase check.** `consolidate_dispatch` is
  deterministic code; AC satisfaction is judgment. The
  determinism pack and constitution Principle VI place judgment
  in agents and mechanical routing in tools — a finalizer that
  grows evaluation prose violates the split.
- **A new dedicated persona.** Intent fidelity is already
  Guard's domain; a new persona grows the council without a
  new capability.

Constitution ties: Principle VI (the deterministic/judgment
split is the decision's shape), Principle I (all coordination
through artifacts: checkpoint state, dispatch metadata).

### D2: Resolution order and carrier

The acquisition tool resolves the originating issue in this
order: PR-body issue references (existing Protocol 2
parsing), branch-scoped tier-routing checkpoint
`issue_number`, then `.openspec.yaml` `originating_issue`.
This preserves `/uf.finale`'s existing
precedence (route decision over `.openspec.yaml`) and keeps
the PR body authoritative for PR-mode reviews.

The resolved reference, extracted criteria, and grounding tier
ride the existing `review_context` channel into
`dispatch_review_runs`; `input_context` stays frozen
immutable-ref identity and carries no issue content. The
reference and tier are recorded as machine-readable state in
the dispatch session metadata so the persisted artifact and
final report carry provenance. The state's fields are
normative here; the plugin tests pin their exact JSON
serialization:

- `issue_number`: positive integer, digits-only validated at
  resolution
- `resolution_source`: `pr-body` | `tier-routing-checkpoint`
  | `openspec-yaml`, with `reference_count` recorded when a
  source yields multiple in-scope references
- `grounding_tier`: `strict` | `best-effort`
- `criteria`: array of `{ text, origin }` — each criterion
  truncated to Protocol 2's 2000-character body bound, the
  total capped at 8192 characters — or
  `general_intent`: `{ title, body_summary }` when no
  structured criteria exist
- `outcomes`: per-criterion `{ criterion_ref, result:
  satisfied | unsatisfied | deviation, note }`, or a single
  general-intent outcome with its own result enum —
  satisfied | unsatisfied | unevaluable, where unevaluable
  carries a reason
- `skip_unavailable`: `{ state: skipped | unavailable,
  reason }`

### D3: Grounding tiers, detected not assumed

The grounding tier is detected, not judged: `strict` when the
fetched issue carries an explicit intake-kit provenance
signal — an issue label whose text contains `intake-kit`
(case-insensitive), or a criteria section whose heading
carries the literal marker `[intake-kit]`, and no other
structure qualifies — and `best-effort` otherwise,
including when no structured
criteria exist and the issue title and body serve as general
intent context, with the report saying so: evaluation ran
against the issue's general intent, not gated criteria. The
Tester-persona quality description (behavioral
Given/When/Then, no implementation leakage) is advisory
context describing what gated criteria look like; the tier
trigger is the provenance signal, so two compliant
implementations cannot classify the same issue differently.
Provenance is detected, never assumed, keeping the council
fully functional without intake-kit in the flow (Principle
II).

### D4: Evaluation mechanics

divisor-guard emits one outcome per criterion, each citing the
originating issue number and the criterion text, with the
grounding tier attached. Satisfied criteria are recorded as
traceability; unsatisfied criteria are blocking findings that
flow through normal consolidation and severity machinery. The
AC context reaches every reviewer prompt through the shared
review-context channel — no per-persona prompt special-casing
— while Guard alone carries the evaluation mandate. Guard
judges severity per the severity pack; the requirement fixes
blocking, not a severity number.

### D5: Deviation escape hatch

When a criterion is wrong rather than unmet, guard emits a
typed intent-deviation finding carrying the invalidation
evidence and a governance recommendation (amend the
PRD/issue). The finding is not closable by code fixes and is
not silently dismissed. This is the review-council instance of
the IMPLEMENTATION_DEVIATION typed interruption proposed in
Discussion #444; the typed routing adopts that machinery when
it lands. Until then the surface is concrete: the Step 6
code-review fix loop short-circuits on the typed finding
and exits through an `intent-deviation` variant of
`format_unleash_exit` added by the tasks, handing the
amendment decision to the human; the resolution is recorded
in the branch-scoped human-decision record
(`record_human_decision`) naming the finding and the
disposition; the Step 6 resolution step owns the
read-back, reading the record before the next dispatch
and forwarding a disposition naming the finding into the
review context, where guard treats it as resolving the
finding for that run. The
finding carries the
invalidation evidence and recommendation into the pause
payload; the human decides whether to amend the issue/PRD or
override. Rejected: (a) auto-commenting on the originating
issue would make a governance decision without human consent;
(b) deferring until Discussion #444 lands would leave no
surface for present deviations.

### D6: Degradation semantics

No resolved issue means skip with an informational note —
never an error. A resolved-but-unfetchable issue (gh absent,
unauthenticated, network failure, not found) degrades to a
documented unavailable state carrying the failure reason. The
check never blocks review infrastructure; only its findings
block verdicts. This keeps the council testable in isolation
without network access (Principle IV) and composable without
`gh` (Principle II).

## Risks / Trade-offs

- **Prompt growth.** AC context is bounded by Protocol 2's
  existing truncation controls; a single originating issue
  adds a bounded block. Accepted.
- **Untrusted content.** Issue bodies are user-controlled;
  the existing sanitization controls and untrusted-evidence
  delimiters apply, and task 4.3 adds the treat-as-data
  marking to divisor-guard's evaluation instruction (the
  file currently lacks the rule; only the repo-local
  personas divisor-linguist.md and divisor-determinism.md
  carry it). The injection surface is acknowledged and bounded,
  not new.
- **Best-effort false positives.** Semantic evaluation of
  free-form issues can misjudge satisfaction. Mitigated by the
  honest grounding tier, and by the human gates this change
  adds — the `intent-deviation` exit variant and the
  branch-scoped human-decision resolution record — plus the
  existing fix-loop consent gates.
- **Stale issue content.** Criteria are fetched at review
  time; an issue edited mid-review can drift. The fetch
  provenance records what was evaluated. Accepted.
- **Scaffold mirror drift.** Every touched canonical asset
  (commands, skill, agent) has an embedded mirror under
  `internal/scaffold/assets/`; the tasks must update mirrors
  and drift tests in lockstep with canonical files.
- **Active-change coordination.** RC-FR-010..013 avoid the
  RC-FR-001..009 range allocated by the active
  review-council-multi-model-fanout change, and the
  `/uf.unleash` Step 6 region is also touched by the active
  per-task-delegation-budgets change (UO-FR-010) — merge
  order between them may require a routine rebase.

Constitution alignment is assessed per principle in
proposal.md; D1–D6 are its application — I (artifact-carried
state), II (degradation instead of dependency), III
(machine-readable grounding and provenance), IV
(network-free testability), V (untrusted issue bodies
bounded and treated as data), VI (the tool/judgment split).
