# intent-satisfaction-check — PR notes

This file records the constitution-alignment verification for task 7.1
of `openspec/changes/intent-satisfaction-check/` (originating issue
#563), written for the PR body. Each principle below carries
file:line evidence from the implemented working tree — the state this
PR ships. The verification method is evidence-based reading of the
change artifacts and the implemented files, plus targeted re-runs of
the six touched plugin test files (all green: 173 tests combined —
`acquire-intent-context.test.ts`, `intent-satisfaction.test.ts`,
`unleash-formatters.test.ts`, `golden-output-shape.test.ts`,
`plugin-integration.test.ts`, `scratch-smoke.test.ts`). Task 7.2 (final CI parity via `make plugin-test`, the
scaffold drift tests, `make lint-instructions`, and `make check`)
still runs before the change is marked complete.

## Constitution alignment

Verified against `.specify/memory/constitution.md` v1.4.0. All six
principles are satisfied; no gaps found.

- **I. Autonomous Collaboration — satisfied (artifact-carried
  coordination only).** The check coordinates through on-disk
  artifacts, never runtime coupling: the acquisition tool resolves the
  originating issue from branch-scoped tier-routing checkpoint state
  (`.uf/progress/<branch>/uf.unleash.json`,
  `resolveTierRoutingCheckpoint`,
  `.opencode/plugins/review-dispatch/index.ts:12148`) and the change's
  `.openspec.yaml` `originating_issue` (`resolveOpenspecYaml`,
  `index.ts:12263`). The resolved state then rides existing artifact
  channels end to end: the dispatch session metadata persisted as
  `session-metadata.json` (`index.ts:3752`, `4537`), the persisted
  review-dispatch artifact payload (`index.ts:3267`, `6429-6431`), and
  every reviewer prompt through the shared `review_context` channel
  (`index.ts:8082-8104`). The state is self-describing JSON validated
  by `IntentSatisfactionStateSchema` (`index.ts:1013-1028`) — issue
  number, resolution source, grounding tier, criteria or general
  intent — so any consumer interprets it without consulting the
  producer. Command prose forwards the state verbatim
  (`.opencode/commands/uf.review-council.md:709-723`;
  `.opencode/commands/uf.unleash.md:1715-1741`).

- **II. Composability First — satisfied (degradation instead of
  dependency).** The council stays functional in every degraded mode.
  No resolved issue returns `skipped` — informational, never an error
  (`IntentSkipUnavailableSchema`, `index.ts:963-971`; the skip result
  in the tool's execute path, `index.ts:12564-12577`). A failed fetch
  (gh absent, unauthenticated, network failure, not found) returns
  `unavailable` carrying the failure reason and never blocks the
  review (`unavailableResult`, `index.ts:12121-12133`). An issue
  without intake-kit provenance grounds `best-effort`
  (`detectIntentGroundingTier`, `index.ts:11883-11891`). Tests pin
  each mode leaving the review unaffected: a skipped state completes
  its dispatch run and approves
  (`.opencode/test/intent-satisfaction.test.ts:785-812`), and so does
  an unavailable state raised from `gh: command not found`
  (`:814-846`). The command eval fixture proves the no-`gh` story end
  to end: its stub refuses every gh call by design
  (`.eval/fixtures/intent-satisfaction-check/stubs/gh`) and the
  assertions require the clean change to still approve
  (`.eval/fixtures/intent-satisfaction-check/assertions.yaml`). No
  hero gains a hard dependency — the check activates only when an
  issue resolves (`.opencode/commands/uf.review-council.md:709-716`).

- **III. Observable Quality — satisfied (machine-readable reference,
  tier, and per-criterion provenance).** `IntentSatisfactionStateSchema`
  (`index.ts:1013-1028`) carries the originating-issue reference
  (`issue_number`), `resolution_source`, `grounding_tier`,
  `criteria [{text, origin}]` or `general_intent`, per-criterion
  `outcomes`, and `skip_unavailable` — machine-parseable JSON, no
  prose-only form. The state persists at three observable surfaces:
  the dispatch session metadata written at dispatch time
  (`index.ts:4537`), the finalized artifact payload (`index.ts:3267`,
  `6429-6431`) echoed by `read_dispatch_artifact`'s summary section
  (`index.ts:7809`), and the compact finalization result
  (`index.ts:5488-5493`). Validation fails closed on unknown enum
  values and unknown keys, surfacing the rejected value
  (`index.ts:935-943`; rejection pinned in
  `.opencode/test/intent-satisfaction.test.ts:848-879`). The
  write→read round-trip — acquisition, dispatch session metadata,
  reviewer prompts, persisted artifact, consolidation result — is
  pinned end to end (`.opencode/test/intent-satisfaction.test.ts:643-698`).

- **IV. Testability — satisfied (network-free isolated tests).** The
  acquisition chain runs on injected dependencies — branch resolver,
  gh issue fetcher, and file reader
  (`AcquireIntentContextDependencies`, `index.ts:11730`; production
  wiring at `index.ts:12342`) — so tests never spawn processes or
  touch the network (`.opencode/test/acquire-intent-context.test.ts:19-24`
  and the fake fixture at `:59-82`;
  `.opencode/test/intent-satisfaction.test.ts:29-39` drives
  `dispatch_review_runs` against a scratch project with a
  model-echoing fake client). Re-verified in the working tree at
  review time: the two new files pass 59 tests in 323 ms — a duration
  that itself rules out network calls. The full-suite checkpoint is
  recorded green in the change record (`tasks.md` task 3.2,
  `openspec/changes/intent-satisfaction-check/tasks.md:84-110`):
  `make plugin-test` exit 0, 76 test files, 2706 tests, statements
  96.12 percent against the 94 percent floor. The eval fixture
  exercises the threaded path end to end with deterministic
  assertions read from tool outputs, not assistant prose
  (`.eval/fixtures/intent-satisfaction-check/assertions.yaml`).

- **V. Security by Default — satisfied (untrusted issue bodies
  bounded and treated as data).** Bounds are enforced three times:
  at acquisition (`buildBoundedCriteria`, `index.ts:12097`), at
  dispatch (`truncateIntentSatisfactionState`, `index.ts:1186`), and
  by schema maxima (`index.ts:949`, `959`) — each criterion cut at
  2000 characters (`INTENT_CRITERION_MAX_CHARS`, `index.ts:926`) and
  the total criteria context at 8192
  (`INTENT_CRITERIA_TOTAL_MAX_CHARS`, `index.ts:930`). Issue text is
  treated as data, never instructions: the prompt builder wraps the
  `review_context` channel in untrusted-evidence delimiters with a
  treat-as-data preamble and delimiter escaping
  (`index.ts:6815-6850`), and the Guard instruction states the rule
  directly (`.opencode/agents/divisor-guard.md:69`). Every candidate
  reference is validated before any fetch — digits-only, positive
  (`validateIssueReferenceValue`, `index.ts:11905`) — and the gh
  fetch argument is constructed from the validated numeric reference
  only, through a spawn argument array with no shell layer
  (`createAcquireIntentContextDependencies`, `index.ts:12342`).
  Filesystem reads are traversal-safe: branch-derived paths pass a
  segment allowlist (`deriveFeatureDirFromBranch`, `index.ts:11987`)
  and every read resolves within the project root
  (`resolveWithinProject`, `index.ts:12031`). Bounds, delimiters, and
  the exact 8192 total are pinned by tests
  (`.opencode/test/intent-satisfaction.test.ts:360-375`, `424-459`,
  `674-677`, `754-781`).

- **VI. Deterministic Execution — satisfied (design D1
  mechanical/judgment split).** The mechanical chain — resolve,
  fetch, extract, tier, forward — is one executable tool with unit
  tests (`createAcquireIntentContextTool`, `index.ts:12423`; 33
  tests in `.opencode/test/acquire-intent-context.test.ts`). Command
  and skill prose name the tool and never restate its procedure
  (`.opencode/commands/uf.review-council.md:722-723`;
  `.opencode/commands/uf.unleash.md:1733-1735`;
  `.opencode/skills/review-context/SKILL.md:87-104`). Judgment stays
  in agent prose: divisor-guard owns per-criterion satisfaction
  evaluation and deviation recognition
  (`.opencode/agents/divisor-guard.md:62-92`). The new prescribed
  output is tool-rendered, not hand-composed: the `intent-deviation`
  exit renders through `format_unleash_exit`'s twelfth variant
  (`renderIntentDeviationExit`, `.opencode/lib/unleash-templates.ts:476-487`;
  variant registered at `:60`) with golden-template tests
  (`.opencode/test/unleash-formatters.test.ts:536-566`).

## Coordination note

- RC-FR-010..013 stay inside this change's allocated requirement
  range; RC-FR-001..009 belong to the active
  `review-council-multi-model-fanout` change. The allocation is
  recorded in the spec delta header
  (`openspec/changes/intent-satisfaction-check/specs/review-council/spec.md:5-18`).
- The `/uf.unleash` Step 6 region is also touched by the active
  `per-task-delegation-budgets` change (UO-FR-010): its fix-loop
  phase-checkpoint `remaining_ms` prose sits inside the Step 6 fix
  loop (`.opencode/commands/uf.unleash.md:1507-1514`) and its
  delegation-classification rule names the code-fix calls in Step 6
  (`:1036`). Merge order between the changes may require a routine
  rebase.

## Instruction budget deltas

Review finding 8 (DE-004, determinism pack Efficiency Evidence):
measurable line/token deltas for the instruction text this change
adds, so efficiency claims are backed by before/after counts rather
than impressions. Recomputed from the current working tree against
the git HEAD baseline.

Method: the repo's instruction-lint estimator
(`.opencode/lib/instruction-lint.ts`, `estimateTokens`) — text
normalized CRLF → LF, tokens estimated as ceil(chars / 4); lines
counted as newlines (`wc -l` semantics). Line counts cross-checked
against `wc -l` for both HEAD and working-tree versions.

| Instruction file | HEAD (base) | Working tree | Delta |
|---|---|---|---|
| `.opencode/agents/divisor-guard.md` | 220 lines / 3300 tokens | 267 lines / 3869 tokens | +47 lines / +569 tokens |
| `.opencode/commands/uf.review-council.md` | 1487 lines / 16602 tokens | 1505 lines / 16820 tokens | +18 lines / +218 tokens |
| `.opencode/commands/uf.unleash.md` | 2143 lines / 21413 tokens | 2217 lines / 22320 tokens | +74 lines / +907 tokens |
| `.opencode/skills/review-context/SKILL.md` | 257 lines / 1995 tokens | 285 lines / 2297 tokens | +28 lines / +302 tokens |
| `AGENTS.md` | 445 lines / 5441 tokens | 458 lines / 5596 tokens | +13 lines / +155 tokens |
| **Total** | **4552 lines / 48751 tokens** | **4732 lines / 50902 tokens** | **+180 lines / +2151 tokens** |

The growth carries the intent-satisfaction contract only: the
Guard's per-criterion evaluation duties and untrusted-data rule
(divisor-guard), the acquisition-and-forwarding steps in the two
commands, the review-context skill's tool hand-off, and the
AGENTS.md review-council description. The mechanical chain —
resolve, fetch, extract, tier, forward — adds no procedural prose:
it lives in the `acquire_intent_context` tool, and the instruction
text names the tool rather than restating its steps (DE-001/DE-002
upheld; the deltas above are the judgment surface the check needs).

Fix iteration 2 (findings 7-17) trimmed the judgment surface back
toward the baseline while keeping the mandated intent-deviation
gates. Deltas measured the same way, iteration-1 working tree
against the current one; loaded counts from the instruction-lint
IL-031 emission (AGENTS.md context + self + loaded skills/packs).

| Instruction file | Iteration 1 | Iteration 2 | Delta |
|---|---|---|---|
| `.opencode/skills/review-context/SKILL.md` | 285 lines / 2297 tokens | 212 lines / 1770 tokens | -73 lines / -527 tokens |
| `.opencode/commands/uf.unleash.md` | 2217 lines / 22320 tokens (loaded 34042) | 2178 lines / 21825 tokens (loaded 33547) | -39 lines / -495 tokens (loaded -495) |
| `.opencode/commands/uf.review-council.md` | 1505 lines / 16820 tokens (loaded 33552) | 1493 lines / 16667 tokens (loaded 32872) | -12 lines / -153 tokens (loaded -680) |

What the trims removed: the review-context skill's Steps 1-6,
deleted and replaced by a tool-description pointer (DE-001);
uf.unleash Step 6 substep f detail trimmed to a tool-contract
pointer with the intent-deviation branch and re-dispatch notes
compressed; uf.review-council Protocol 2 and the fix-loop section
compressed, with the SKILL.md shrink contributing to the loaded
reduction. Three governance-pin restorations clawed a few tokens
back (Part C): the SYNTH-002 synthetic-prompt-not-consent block
in uf.unleash restored verbatim (the intent-deviation stop duty
stays in Step 6 substep f and the in-step-inputs list, so nothing
was lost), and the command-contract tests' pinned rerun-semantics
fragments and dispatch limit-parameter names restored in both
commands. uf.unleash sits at net +412 tokens over the pre-change
21413 baseline — the remainder is the intent-deviation gates
findings 7-9 mandate. The eval fixture assertions were re-derived
from the internal-acquisition contract (finding 17): the run now
asserts `acquire_intent_context` is never called separately and
the unavailable state surfaces through `consolidate_dispatch`.
`make lint-instructions` exits 0; warnings are unchanged in kind
(IL-030/IL-031 pre-existing budget warnings).

Fix iteration 3 (review council re-review, Part C' scaffold sync)
reconciles the consumer instructions with the tool contracts and
closes the documentation gate. Measured the same way as above
(`.opencode/lib/instruction-lint.ts` `estimateTokens`: CRLF to LF,
ceil(chars/4); loaded from IL-031 emission; `make
lint-instructions` run at 2026-11-25T00:41Z from the working tree).

| Instruction file | Iteration 2 (end) | Iteration 3 (current) | Delta |
|---|---|---|---|
| `.opencode/skills/review-context/SKILL.md` | 212 lines / 1770 tokens | 215 lines / 1825 tokens | +3 lines / +55 tokens |
| `.opencode/commands/uf.review-pr.md` | 1309 lines / 13928 tokens | 1310 lines / 13941 tokens (loaded 34982) | +1 line / +13 tokens |
| `.opencode/commands/uf.address-feedback.md` | 1453 lines / 17151 tokens | 1453 lines / 17156 tokens (loaded 23958) | 0 lines / +5 tokens |
| `.opencode/commands/uf.review-council.md` | 1493 lines / 16667 tokens (loaded 32872) | 1489 lines / 16604 tokens (loaded 32864) | -4 lines / -63 tokens (loaded -8) |
| `.opencode/commands/uf.unleash.md` | 2178 lines / 21825 tokens (loaded 33547) | 2172 lines / 21747 tokens (loaded 33469) | -6 lines / -78 tokens (loaded -78) |

What iteration 3 changed: consumers aligned to the two
acquisition paths — dispatch-owned `acquire_intent_context`
(via `dispatch_review_runs` session metadata) versus standalone
`acquire_intent_context` for `uf.review-pr` step 3.8b and
`uf.address-feedback` Tier 1 — with each command now naming only
its path's tool contract; Result Format Linked Issues rescoped to
non-dispatch paths; substep g conditional removed; guardrails list
cleaned; Phase 1c and Step 6 substep f restated contracts trimmed
to tool-description pointers. Documentation gate closed in-repo via
#1207 and externally via unbound-force/website#449; CHANGELOG
footer and proposal Impact updated. Tests: delimiter-escape,
isolation, and gh object-form label cases added (8 tests,
`acquire-intent-context.test.ts`); `make plugin-test` stays green.

`make lint-instructions` exits 0; warnings unchanged in kind
(IL-030/IL-031 pre-existing budget warnings, IL-021 pack-level
informational warnings).
