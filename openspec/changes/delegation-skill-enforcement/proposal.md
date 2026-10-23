## Why

The `/uf.unleash` audit (session `ses_e9fe30bfbffez1lcQrExaqQqL2`,
finding F6) identified that mechanical tasks delegated through
`uf_delegate_command` can skip the required skill or script
reference. PR #786 closed the finding with a prose instruction in
`uf.unleash.md` ("Mechanical tasks use repo tooling"): the
delegation prompt MUST name the skill or script. The instruction
is agent-compliance only. Nothing detects a delegation that skips
the reference; a post-compaction drift, a hurried re-run, or a
future command simply repeats the defect.

The org constitution names this exact posture: "Behavioral guards
such as re-read rules and emit-time verification are interim
mitigations, not the mechanism of record" (Principle VI). The
prose rule is the interim mitigation; this change is the
mechanism of record.

The gap is cross-cutting. `uf_delegate_command` is the single
delegation surface for quick-tier whole-change implement,
per-task implement delegation, plan/tasks generation, code-fix
iterations, and every future command that
delegates content work. Enforcement at the tool level covers all
of them at once; enforcement in `uf.unleash.md` covers one
command's prose.

## What Changes

Four layers, one per enforcement surface, in dependency order:

1. **Tool contract** (`.opencode/plugins/uf-workflow/index.ts`):
   `uf_delegate_command` gains three parameters --
   `task_classification` (`deterministic` | `judgment`, required
   for prompt-only delegation), `skill` (a repo skill name
   resolved against the skill directories, or a repo-relative
   script path, existence-verified), and `skill_absent_reason`
   (the recorded justification when deterministic work has no
   applicable repo skill or script). Deterministic-classified
   delegations without a skill reference or a recorded reason
   fail closed with `SKILL_REFERENCE_REQUIRED`; unresolvable
   references fail with `SKILL_NOT_FOUND`. Supplied skills are
   injected into the composed prompt as a tool-rendered
   directive, and the classification, resolved reference, and
   any justification are recorded in the checkpoint data and
   success envelope for audit.
2. **Convention pack** (`.opencode/uf/packs/determinism.md`):
   new rule DE-008 [MUST] -- deterministic-classified delegation
   MUST carry a verified skill/script reference or a recorded
   absence reason, and delegation instruction MUST use the
   parameter contract rather than prose-only skill instructions.
   Pack version 1.2.0 → 1.3.0; severity mapping updated (DE-008
   joins the MUST/CRITICAL list).
3. **Review enforcement** (`.opencode/agents/divisor-guard.md`):
   the Guard's Code Review Mode checklist gains a Deterministic
   Delegation Discipline section -- self-describing, naming the
   parameter contract rather than citing the repo-local DE-008
   (the agent definition is scaffold-embedded) -- flagging
   delegation instruction that binds mechanical work to skills
   via prose only, deterministic delegations lacking skill
   references or recorded justifications, and Swarm-path spawn
   prompts for deterministic `[P]` tasks that omit them.
4. **Documentation and template**
   (`.opencode/skills/determinism-first/SKILL.md`,
   `.opencode/commands/uf.unleash.md`): the skill's Related
   Enforcement section and body reference the parameter contract
   and DE-008; the command template's "Mechanical tasks use repo
   tooling" prose becomes a self-describing classification step
   plus the parameter contract (the template is scaffold-embedded
   and cites no repo-local artifacts), every prompt-only
   delegation call block -- quick-tier whole-change, per-task,
   code-fix -- carries the new parameters, and the Swarm
   parallel-path spawn prompts carry the classification and
   skill reference.

Plus tests for every seam (plugin suite) and scaffold-mirror
updates with drift-detection tests kept green for the three
embedded sources that change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `unleash`: the command delegation tool contract gains the
  classification/skill/justification parameters, failure
  envelopes, prompt-injection directive, and audit recording;
  mechanical task tool references move from template guidance to
  the tool-enforced contract, and every delegation path --
  quick-tier whole-change, per-task, code-fix, and the Swarm
  parallel spawn path -- carries the classification.
- `determinism-policy`: the convention pack gains DE-008 with a
  version bump; the determinism-first skill gains delegation
  guidance and enforcement references; divisor-guard enforces
  DE-008 in code review mode.

### Removed Capabilities

- None.

## Impact

- `.opencode/plugins/uf-workflow/index.ts` -- delegation tool
  input contract, skill resolution, prompt composition, failure
  envelopes, checkpoint and output recording (+ tests)
- `.opencode/test/unleash-delegate.test.ts` -- new describes:
  classification validation, skill resolution and injection,
  justification escape hatch, checkpoint recording, judgment
  pass-through
- `.opencode/uf/packs/determinism.md` -- DE-008, severity
  mapping, version 1.3.0 (repo-local, not scaffold-embedded)
- `.opencode/skills/determinism-first/SKILL.md` -- delegation
  guidance and enforcement references (repo-local, not
  scaffold-embedded)
- `.opencode/agents/divisor-guard.md` -- Code Review Mode
  checklist section
- `.opencode/commands/uf.unleash.md` -- implement-section
  classification step, delegation call blocks, and
  parallel-execution spawn-prompt guidance
- `internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts`,
  `internal/scaffold/assets/opencode/commands/uf.unleash.md`,
  `internal/scaffold/assets/opencode/agents/divisor-guard.md` --
  embedded mirrors, drift-detection tests stay green
- `CHANGELOG.md` -- change entry per the documentation gate
- User-facing impact: the change modifies the `/uf.unleash`
  workflow contract and the Guard's review capabilities -- both
  documentation-gate triggers; the repo documentation issue and
  the `unbound-force/website` issue are mandatory and are
  committed tasks in tasks.md (5.4)
- Downstream hero repos receive the tool and template changes via
  `uf init` scaffold sync; the repo-local pack and skill are
  shared as source, not scaffolded, and the scaffolded sources
  cite no repo-local artifacts, so nothing dangles downstream
- Replicator follow-up: tool-level validation on the Swarm
  parallel path is Replicator-owned; task 5.5 files the
  cross-repo issue tracking forge spawn-subtask
  parameter-contract parity, giving the deferral a closure path
- Content coverage: blog assessed yes (candidate: a prose
  guard graduating to a fail-closed tool contract — Principle
  VI applied to its own enforcement gap; covered by the
  epic-level blog tracker (#742) rather than a new post unless
  reassessed at filing per task 5.4); tutorial assessed no
  (developer-facing tooling contract, documented via
  CHANGELOG and the command template)

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.4.0).

### I. Autonomous Collaboration

**Assessment**: PASS

Skill binding moves from prose instructions (which drift under
context compression) to a tool input contract with structured
failure envelopes. The classification, resolved skill reference,
and absence justification become durable checkpoint records that
any consumer -- review agents, resume logic, audits -- reads
without consulting conversation state.

### II. Composability First

**Assessment**: PASS

All layers land in artifacts the delegation path already
depends on; no new plugin, registration, or dependency. The
parameters are optional for command-path delegation, so
existing callers (plan/tasks generation) function unchanged.
Unsynced hero repos keep the old contract; nothing breaks
downstream.

### III. Observable Quality

**Assessment**: PASS

The two new failure envelopes (`SKILL_REFERENCE_REQUIRED`,
`SKILL_NOT_FOUND`) carry remediation text, not bare errors --
the error-contract precedent from the pipeline-hardening change.
The success envelope and checkpoint data expose the
classification and skill reference machine-parseably, giving
review agents an audit trail instead of prompt archaeology.

### IV. Testability

**Assessment**: PASS

Skill resolution uses the tool's existing injected
`fileExists` dependency; classification and cross-field rules
are pure input validation. Every scenario in the spec deltas has
a plugin-suite test using the established fakes
(`fakeClient`, `fakeReadText`, `fakeFileExists`) -- no real
filesystem, sessions, or external services.

### V. Security by Default

**Assessment**: PASS

Skill references resolve through the existing
traversal-protected repo-relative path guard; no new trust
boundary, no shell execution of the reference (the tool injects
a directive; the child agent loads the skill through its normal
skill tooling). No gate values change.

### VI. Deterministic Execution

**Assessment**: PASS

This change is Principle VI applied to Principle VI's own
enforcement gap: the prose rule that binds delegated mechanical
work to repo tooling becomes a validated tool contract, a citable
review rule (DE-008), and a reviewer checklist. The behavioral
guard graduates from interim mitigation to mechanism of record.

## Task 5.3 Verification Record

Recorded 2026-10-22 against the final diff (`git diff
upstream/main -- .opencode/ internal/scaffold/assets/
openspec/changes/delegation-skill-enforcement/`): 11 tracked
files, +2723/-339. The three scaffold mirrors verified
byte-identical to their sources (`cmp`), the Go
drift-detection tests green
(`TestEmbeddedAssets_MatchSource`,
`TestCanonicalSources_AreEmbedded`), and the plugin suite
re-run green for this record (77/77 in
`unleash-delegate.test.ts`; 191/191 paired with
`uf-workflow.test.ts`).

### Constitution re-check (final diff)

Each principle re-verified against the diff itself, not the
proposal-time assessment. All PASS:

- **I. Autonomous Collaboration.** The classification,
  resolved skill reference, and absence reason land as
  structured checkpoint-data and success-envelope fields
  (additive JSON keys, written only when supplied) that any
  consumer -- review agents, resume logic, audits -- reads
  without consulting conversation state; the two failure
  envelopes carry codes and remediation text. No synchronous
  coupling added.
- **II. Composability First.** No new plugin, registration,
  or dependency. All three parameters are schema-optional;
  command-path callers omitting them validate unchanged
  (command-path exemption tested), and checkpoint keys are
  added only when present, so calls omitting the new fields
  keep the exact pre-change record shape. Unsynced hero
  repos keep the old contract.
- **III. Observable Quality.** `SKILL_REFERENCE_REQUIRED`
  and `SKILL_NOT_FOUND` are machine-parseable envelopes
  (code, `retryable: false`, remediation text); the audit
  fields surface in the success envelope. Claims
  re-verified by execution: 77/77 and 191/191 plugin
  tests, drift-detection green.
- **IV. Testability.** Skill resolution runs on the
  injected `fileExists` dependency; the cross-field rules
  are pure zod validation; every spec scenario has a
  plugin-suite test on the established fakes -- no real
  filesystem, sessions, or external services.
- **V. Security by Default.** Script-path references pass
  through the existing traversal guard (`SKILL_TRAVERSAL`
  on escape attempts, tested); values are length-bounded
  and enum-validated; the tool performs an existence check
  only -- no shell execution of the reference; no new
  dependency; all validation precedes the child spawn. No
  gate values change.
- **VI. Deterministic Execution.** The prose rule is now
  the tool contract (fail-closed before any child session
  spawns), the skill directive is tool-rendered from a
  design constant pinned by golden-shape tests, and the
  classification step that remains in the template is
  judgment -- legitimately prose. The change is the
  principle applied to its own enforcement gap, as
  designed.

### Gatekeeping integrity

DE-008 strengthens the determinism gate; nothing is
weakened. Verified against the `determinism.md` diff: the
only edits are the version bump 1.2.0 → 1.3.0, the
severity-mapping paragraph gaining DE-008 in the
MUST/CRITICAL enumeration (DE-001, DE-003, DE-005, DE-007
→ + DE-008; the SHOULD list DE-002, DE-004, DE-006
unchanged), and the new DE-008 section appended. No
existing rule text, severity, threshold, CI flag, agent
setting, review limit, or pinned dependency is modified
anywhere in the diff. The originating issue (#787,
recorded as `originating_issue` in `.openspec.yaml`) is
the documented authorization.

### Documentation dispositions

**CHANGELOG.md -- updated.** Entry added under Unreleased →
Added covering the tool contract, command template,
governance layers (pack, skill, Guard), scaffold mirrors,
and tests (Refs: #787), satisfying the determinism-policy
spec delta's change-record requirement.

Per-file dispositions (AGENTS.md documentation gate):

- **docs/usage.md -- covered by the filed documentation
  issues.** usage.md documents the human-typed command
  surface (`/uf.unleash [description]`, tier routing,
  pipeline steps), none of which changed; the delegation
  parameter contract is agent-facing and nothing in the
  file is now false. The Impact section classifies the
  `/uf.unleash` workflow-contract change as a user-facing
  documentation-gate trigger, so whether to surface the
  deterministic-delegation enforcement in user docs is
  tracked by the task-5.4 docs issue (with the
  blog/tutorial reassessment at filing). Issue number to
  be recorded by task 5.4.
- **docs/architecture.md -- not applicable.**
  architecture.md documents the Go binary architecture and
  the scaffolded file layout; it describes no plugin tool
  contract or pack rule inventory (zero plugin
  references), and this change alters no layout or
  architectural surface it covers. Pre-existing gap noted
  honestly: the convention-pack listing omits
  `determinism.md` -- a gap that predates this change
  (the pack shipped in determinism-codification) and is
  neither caused nor widened by this diff; folding that
  fix into the task-5.4 docs issue is recommended at
  filing.
- **docs/heroes.md -- covered by the filed documentation
  issues.** heroes.md describes the Guard at persona
  level (intent, cohesion, zero-waste, neighborhood) and
  the Divisor council's capabilities coarsely; the new
  Deterministic Delegation Discipline checklist section
  extends what the Guard flags without making any
  existing statement false. The Impact section names the
  Guard's review capabilities a documentation-gate
  trigger; whether heroes.md should mention the new check
  is tracked by the task-5.4 docs issue and the
  `unbound-force/website` issue. Issue numbers to be
  recorded by task 5.4.
- **AGENTS.md -- not applicable.** Verified: (a) no new
  build commands -- the diff touches no Makefile or
  command surface AGENTS.md documents; (b) no
  project-structure change -- every modified path sits
  inside already-documented directories, and the
  convention-pack list already names
  `.opencode/uf/packs/determinism.md`; (c) the existing
  "Determinism gate" behavioral rule already covers
  DE-008's substance (agents MUST classify work
  deterministic vs judgment and MUST NOT express
  mechanical procedures as prose where an executable tool
  is feasible -- DE-008 is that rule's delegation-specific
  application, and its CRITICAL severity mapping matches
  the rule's violations-are-CRITICAL clause), so the rule
  remains accurate without amendment, as the design's
  Non-Goal predicted.
- **README.md -- not applicable.** README describes the
  org, hero table, constitution principles (its
  Deterministic Execution summary remains accurate --
  this change implements it), installation, and repo
  contents; no description-level content changed.

The documentation-issue numbers (docs-labeled issue in
this repo and the `unbound-force/website` issue, task 5.4)
and the Replicator parity issue (task 5.5) will be recorded
in this change record by those tasks.

## Task 5.4 Documentation Issues

Filed 2026-10-22 after the pre-filing overlap check. Known
candidates reviewed first -- #739 (docs for the prior
unleash-deterministic-tools change, different scope), #742
(epic-level blog tracker), #781 (seam-verification docs,
DE-007, different change) -- and both repos searched for open
issues mentioning delegation skill enforcement,
`uf_delegate_command`, `task_classification`, or DE-008. No
existing coverage found; no duplicates filed.

- **unbound-force/unbound-force#791** (labeled
  `documentation`): the AGENTS.md documentation-gate record
  for this change. Covers the CHANGELOG entry (task 5.3),
  the docs/usage.md and docs/heroes.md dispositions (both
  tracked by that issue per this record's Documentation
  dispositions), and the pre-existing docs/architecture.md
  gap (convention-pack listing omits determinism.md; fix
  recommended alongside). References this change directory
  and #787.
- **unbound-force/website#317**: the constitution
  Cross-Repo Documentation issue. Covers user-facing
  documentation of the delegation classification contract
  (`task_classification`/`skill`/`skill_absent_reason`
  parameters, fail-closed behavior, Guard review check) for
  the `/uf.unleash` workflow.

Blog/tutorial disposition reassessed at filing (from the
proposal Impact section): **blog -- covered by #742** (#742
is open and tracks the epic-level story this change's
candidate -- a prose guard graduating to a fail-closed tool
contract, Principle VI applied to its own enforcement gap --
falls under; no new post filed); **tutorial -- no**
(developer-facing tooling contract, documented via the
CHANGELOG entry and the command template).

The Replicator parity issue (task 5.5) remains to be
recorded by that task.

## Task 5.5 Replicator Parity Issue

Filed 2026-10-22 after the duplicate check (open issues in
unbound-force/replicator searched for spawn-subtask,
parameter-contract, delegation classification, and skill
reference; the only hits were the unrelated scaffolding
chores #92 and #52). **unbound-force/replicator#143** tracks
adding parameter-level delegation validation to the forge
spawn-subtask tool, mirroring `uf_delegate_command`'s
contract: a `task_classification` (`deterministic` |
`judgment`) parameter, an existence-verified skill/script
reference parameter, an absence-reason parameter for the
justification escape hatch, the
deterministic-requires-reference-or-reason rule, and
reference existence verification before the subtask spawns.
The issue records the parent context (this change, #787, and
the `uf_delegate_command` contract with its fail-closed
`SKILL_REFERENCE_REQUIRED`/`SKILL_NOT_FOUND` envelopes and
tool-rendered skill directive), the current prose-only
posture on the Swarm path (template-level requirement plus
Guard review flagging, no tool-level validation), and the
design Non-Goal that makes tool-level validation on that path
Replicator-owned -- this issue is its tracked closure.

<!-- scaffolded by uf vdev -->
