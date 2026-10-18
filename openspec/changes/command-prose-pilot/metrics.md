# command-prose-pilot — Measured Deltas (DE-004)

Static metrics for `.opencode/commands/uf.run-pipeline-plan.md`,
per design.md D13. Baseline captured before any rewrite.

## Baseline (before rewrite)

| Metric | Value | Measurement |
|---|---|---|
| Line count | 225 | `wc -l .opencode/commands/uf.run-pipeline-plan.md` |
| Word count | 1,005 | `wc -w .opencode/commands/uf.run-pipeline-plan.md` |
| Procedural sentences over 20 words | 2 | sentence split of the `## Instructions` section (157 procedural sentences total); both offenders are 21 words |
| Ban-list tokens | 0 | `rg -in '\b(abort\|halt\|terminate\|terminalize\|bail)\b' .opencode/commands/uf.run-pipeline-plan.md` — no matches |
| Bare-number references | 1 | `rg -n '\b[Ss]tep \d+\b'` — line 132: "Step 8 (code review) MUST NOT be skipped" (the documented cross-command defect) |
| Maximum nesting depth | 2 | deepest list nesting (2-space indent steps) |

### Over-limit procedural sentences (21 words each)

1. "(PR created), confirm return to `main` with a clean
   working tree (`git status --short` is empty) before
   starting the next item." — Clean tree between items
2. "When a subagent encounters a mandatory human
   confirmation gate, it MUST STOP execution and return a
   structured value to the orchestrator:" — Gate Relay
   Protocol (also the documented STOP-collision defect)

### Notes

- Ban-list tokens are already zero; the rewrite must keep
  it zero.
- "Subagent 1/2/3" and "Phase 0" are definition sites that
  carry their names; they are not counted as bare-number
  references (design D3). The single bare-number reference
  is the line-132 "Step 8" defect the rewrite corrects.
- Maximum nesting depth 2 = numbered list with one level of
  sub-bullets; no three-level nesting exists.

## Task 3.1 — rg conformance checks (after rewrite)

All scans run against `.opencode/commands/uf.run-pipeline-plan.md`:

| Check | Command | Result |
|---|---|---|
| Ban-list scan | `rg -in '\b(abort\|halt\|terminate\|terminalize\|bail)\b' .opencode/commands/uf.run-pipeline-plan.md` | PASS — no matches |
| Stale reference scan | `rg -n 'Step 8' .opencode/commands/uf.run-pipeline-plan.md` | PASS — no matches |
| Gate Relay verb scan | STOP in the Gate Relay Protocol section | PASS — STOP does not appear |
| Session-resume guard scan (advisory follow-up) | STOP in the SESSION-RESUME GUARD block | PASS — guard states a precondition, no STOP |
| Exit-path phrase scan | `rg -in 'exit path'` | PASS — no matches |

## Task 3.2 — make check (after rewrite)

`make check` run on the post-rewrite tree (the Phase 2
checkpoint run; the tree is unchanged since): **EXIT=0**.
26 Go packages `ok` including
`github.com/unbound-force/unbound-force/internal/scaffold`
(contains `TestEmbeddedAssets_MatchSource`, verifying the
byte-identical dual-copy sync). Plugin suite passed with
94.5% statement coverage.

## Task 3.3 — After metrics and before/after table

| Metric | Before | After | Direction |
|---|---|---|---|
| Line count | 225 | 239 | +14 — decision tables (D6) and On-failure branches (D7) add structure; clarity, not shrinkage, is the goal |
| Word count | 1,005 | 1,088 | +83 — same cause as above |
| Procedural sentences over 20 words | 2 | 0 | intended: both over-limit sentences eliminated |
| Ban-list tokens | 0 | 0 | held at conforming zero |
| Bare-number references | 1 | 0 | intended: the "Step 8" defect corrected to a name-based reference |
| Maximum nesting depth | 2 | 2 | held at conforming 2; no nested conditional prose introduced |

Sentence measurement note: decision-table rows are D6
content, not procedural sentences, and are excluded from
the sentence count (170 procedural sentences after the
rewrite; 157 before).

## Task 4.1 — Gold answer key (comprehension A/B)

Derived from the Behavioral Contract Preservation
requirement and its scenarios in
`specs/run-pipeline-plan/spec.md`. Each question scores
0 / 0.5 / 1 (1 = every gold element present, 0.5 =
partial, 0 = wrong or missing). Max 4 points per session.

### Scenario (a): plan file containing an [INVESTIGATION] item

- **Q1.** Before any work starts, what does the pipeline
  do with an item tagged `[INVESTIGATION]`?
  **Gold:** the item is presented to the human for
  explicit resolution; the pipeline does not auto-execute
  it.
- **Q2.** Who resolves the flagged item, and what are the
  valid resolutions?
  **Gold:** the human, through the question tool; valid
  resolutions are remove, convert to mechanical, and
  defer.

### Scenario (b): mid-gate interruption during work-item execution

- **Q3.** A subagent hits a mandatory human confirmation
  gate mid-execution. What does the subagent do, and what
  MUST it not do?
  **Gold:** it pauses and returns a structured
  `GATE:<name>` value to the orchestrator containing the
  exact question, the full findings, and the options; it
  must not invoke the question tool itself; it stays
  resumable.
- **Q4.** After the human answers, what does the
  orchestrator do?
  **Gold:** the orchestrator asks the question through
  the question tool with the exact text and options, then
  resumes the same subagent via `task_id` with the
  answer; it does not spawn a replacement.

## Task 4.2 — Comprehension A/B results

**Methodology deviation (recorded honestly):** the
intended fresh `general` sessions cannot spawn in this
environment (`general`/`explore`/`cobalt-crush-dev`
spawns fail: model-forbidden / HOST_MODEL_UNAVAILABLE).
The A/B instead ran through `invoke_agent` with three
review-capable reader agents (divisor-architect,
divisor-guard, divisor-adversary) on
`enmaas/rits/zai-org/glm-5-3`, each given a naive-reader
prompt (persona instructions explicitly set aside, no
tools, text only). The same three readers, same model,
and same questions were used for both versions, so the
reader persona is a controlled constant. Presentation
order was not counterbalanced — every reader scored
the pre-rewrite version first and the post-rewrite
version second — so practice and order effects are
uncontrolled confounds; the aggregate is directional
evidence, not an isolated attribution to the text
version. The stronger signal is qualitative (below):
the Q3 gain matches the specific semantic the RELAY
correction targets. Three sessions per version (the
D13 minimum), as D13 specifies.

### Per-session scores (max 4 each)

| Reader | Pre-rewrite | Post-rewrite |
|---|---|---|
| divisor-architect | 3.5 | 4.0 |
| divisor-guard | 3.5 | 3.5 |
| divisor-adversary | 3.0 | 3.5 |
| **Aggregate** | **10.0 / 12 (83.3%)** | **11.0 / 12 (91.7%)** |

### Qualitative observation

The post-version gain concentrates in Q3 (gate-relay
semantics): all three post-version readers stated the
subagent "stays resumable via its task_id", matching the
RELAY verb's definition. All three pre-version readers
reported "MUST STOP execution" and none mentioned
resumability — the pre-rewrite text does not state it in
the Gate Relay Protocol. Q4 answers were also temporally
more precise post-version: readers answered what happens
after the human answers (resume the same subagent)
rather than reciting the whole orchestrator sequence.

Both versions communicated the core contract (Q1, Q2
perfect across all six sessions). The rewrite improved
comprehension of the gate-relay pause/resume semantics —
the exact semantic the RELAY correction targets.

## Task 5.2 — Documentation issue (AGENTS.md gate)

Filed: unbound-force/unbound-force#747
("Docs gate: command-prose-pilot rewrite of
/uf.run-pipeline-plan"), assigned to jflowers. The issue
records the full documentation-impact assessment:
CHANGELOG entry added; AGENTS.md needs no update (the
standard lives in this change's design.md pending
phase-2 promotion); docs/ and README.md contain no
references to the command.

**Website gate (org constitution Cross-Repo
Documentation) — explicit decision: EXEMPT.** The
behavioral contract is preserved verbatim in intent, so
website workflow/command documentation remains accurate;
no user-facing behavior changed. (Records the decision
the spec-review advisory requested; no spec artifact was
modified.)

**Assessment correction (code-review iteration 1):**
"AGENTS.md needs no update" above missed one downstream
coherence impact: AGENTS.md's review-council rule and
PR-command table say "already executed as /uf.unleash
Step 8" — markdown-section numbering where the house
standard now requires name-based referencing ("the Code
Review step of /uf.unleash"). AGENTS.md is a governance
file outside this change's declared file scope, so the
stale reference is recorded here and on #747 as a
follow-up docs fix rather than edited in this change.

**Content-pipeline disposition (dated maintainer
decision, 2026-10-17): deferred to the phase-2
promotion change.** The pilot sits below blog/tutorial
significance thresholds (no new agent, command, executed
migration, or hero capability; validation evidence is
directional). The phase-2 change that adds the skill +
convention pack crosses the documentation thresholds at
once — a website documentation issue is required there —
and the phase-3 rollout is the blog moment; this
change's before/after metrics and A/B evidence serve as
source material.

## Task 5.3 — Constitution re-assessment (post-implementation)

Re-assessed against the six active principles and the
claims made in `proposal.md`:

1. **Autonomous Collaboration — PASS.** Commands remain
   the intent medium; the rewrite removes ambiguity (one
   verb one meaning, name-based references). No runtime
   coupling introduced or removed.
2. **Composability First — PASS.** No new dependencies;
   the command remains standalone.
3. **Observable Quality — PASS.** Evidence is measurable
   and reproducible: six before/after metrics (DE-004)
   and the comprehension A/B (10/12 -> 11/12 against the
   gold key) are recorded in this file.
4. **Testability — PASS.** All validation executed
   without external services: `make check` EXIT=0 at
   every phase checkpoint, five rg conformance scans
   clean, metrics diff, fixed-scenario A/B.
5. **Security by Default — PASS.** No dependencies,
   permissions, CI surfaces, or gates changed. All seven
   command guardrails preserved (scaffold drift sync,
   explicit staging, stray-file removal, no force-push,
   PR targeting, closes linkage, no auto-merge).
6. **Deterministic Execution — PASS.** No mechanical
   prose added; the three existing tool-output examples
   (GATE: block, plan-file contract, todowrite tracker)
   are preserved unchanged (DE-002); no new
   rendered-shape previews (DE-003); metrics recorded
   (DE-004).

**Proposal claims verified:** behavioral contract
preserved (spec review + A/B confirm); dual-copy
byte-identity (cmp clean, TestEmbeddedAssets_MatchSource
passed); three documented corrections applied (scans
clean); rg conformance validation (5/5 PASS); make check
green; before/after metrics recorded; comprehension A/B
run (methodology deviation recorded above); /uf.unleash
dogfooded on this change (this pipeline run is the
dogfooding).

**Gatekeeping rule confirmed:** no gate, threshold, CI
flag, agent setting, or pinned dependency was touched.
Files changed by this change:
`.opencode/commands/uf.run-pipeline-plan.md`,
`internal/scaffold/assets/opencode/commands/uf.run-pipeline-plan.md`
(byte-identical pair), `openspec/changes/command-prose-pilot/`
(spec artifacts + this metrics.md), `CHANGELOG.md` (entry),
`.uf/dewey/learnings/` (retrospective learnings). No
`.github/workflows/`, `coverage-gate.json`, `.uf/` review
config, `go.mod`, or `package.json` modifications.
