# Tasks: unleash-direct-review-dispatch

## 1. Baseline and Step 4 (Spec Review) rewrite

- [x] 1.1 Record baseline metrics in this artifact: line counts of the Step 4 section, Step 6 section, and guardrails section in `uf.unleash.md`, plus total command line count (Principle VI before/after deltas)
  - Baseline (2026-10-14): Step 4 section: 67 lines; Step 6 section: 66 lines; guardrails section: 37 lines; total command: 791 lines
- [x] 1.2 Rewrite Step 4 in `.opencode/commands/uf.unleash.md`: replace the `cobalt-crush-dev` Task-tool delegation (full `uf.review-council.md` payload + Spec Review Mode override) with the direct-call sequence — announce, `resolve_base_ref`, head SHA + immutable diff capture (tracked `git diff <base_sha> -- .`, untracked `git ls-files --others --exclude-standard`, `uncommitted: true` local context with null `pr_number` when no commits ahead), reviewer discovery from `.opencode/agents/divisor-*.md` (fail-closed on zero), `dispatch-advisor` skill + `plan_review_dispatch` (mode `specs`, `full: false`, `augment: false`, display plan JSON exactly, proceed only on ready/null workflow_result/empty errors), `dispatch_review_runs` (command `review-council`, spec artifacts as `review_context`, plan limits), `consolidate_dispatch` once per finalization attempt; cite the council command's protocol sections as the normative reference instead of embedding them
- [x] 1.3 Add the spec auto-fix consent gate to Step 4 verdict processing: on REQUEST CHANGES with only LOW/MEDIUM findings, question tool with the council's three options (Apply auto-fixes / Review findings first / Skip auto-fixes -- report only); on consent the PARENT applies LOW/MEDIUM fixes per `.opencode/uf/packs/severity.md` (HIGH/CRITICAL report-only), then re-resolves input, re-validates the plan, reruns every included reviewer with sibling evidence reused, 3-iteration cap; on decline or remaining REQUEST CHANGES exit with tier-specific recovery guidance (speckit: `/speckit.clarify`; openspec: update artifacts under `openspec/changes/<name>/`) and the "paused at: spec review" template; HIGH/CRITICAL findings exit immediately; preserve mid-loop and post-step checkpoints with iteration data

## 2. Step 6 (Code Review) rewrite

- [x] 2.1 Rewrite Step 6 in `.opencode/commands/uf.unleash.md`: pre-flight in soft-gate mode first (execute all checks, baseline via CI API then worktree fallback, causality classification; branch-caused failures → stop, report each as CRITICAL finding with full output, finalize fail-closed with no child reviewers; pre-existing recorded, non-blocking; Gaze Phase 1b conditional/informational), then the same direct-call sequence with mode `code` and `pre_flight_results` passed to `dispatch_review_runs`; verdict mapping (APPROVE/APPROVE WITH ADVISORIES → proceed, REQUEST CHANGES → fix loop, INCONCLUSIVE/UNAVAILABLE → exit with no-success reasons); fix loop up to 3 iterations with `cobalt-crush-dev` retained for code-fix application (no consent gate — council code mode has none); 3-cap exit with persistent findings and circular-dependencies sections; preserve checkpoints

## 3. Guardrails amendment

- [x] 3.1 Amend the "NEVER pause between steps" guardrail in `.opencode/commands/uf.unleash.md` to name the spec auto-fix consent gate as the single legitimate mid-pipeline human interaction; confirm all other guardrails unchanged (never run on main, never skip spec review exit on HIGH/CRITICAL, actionable exit messages, verbatim demo output)

## 4. Mirror sync

- [x] 4.1 Copy the edited command to `internal/scaffold/assets/opencode/commands/uf.unleash.md` and verify byte-identity (`cmp` both mirrors)

## 5. Verification

- [x] 5.1 Run `make test` — scaffold drift tests and full Go suite must pass
- [x] 5.2 Run `make plugin-test` — TypeScript plugin suite must pass
- [x] 5.3 Run `make lint` — vet + golangci-lint must pass
- [x] 5.4 Record after-deltas in this artifact: new line counts for Steps 4, 6, guardrails, total command, and approximate token delta (Principle VI measurable outcome)
  - After (2026-10-14): Step 4 section: 147 lines; Step 6 section: 196 lines; guardrails section: 42 lines; total command: 1006 lines. Delta vs baseline: +215 lines, +1,227 words (~+1,600 tokens, ~44% growth; 3625 → 4852 words)

## 6. Documentation

- [x] 6.1 [P] Add a CHANGELOG.md entry describing the direct review dispatch and consent gate
- [x] 6.2 [P] File a documentation issue against this repo for the user-facing command behavior change (documentation gate); assess AGENTS.md (no structural change expected — behavior, not structure) and note the assessment result
  - Filed unbound-force/unbound-force#728. AGENTS.md assessed: no structural change (pipeline behavior, not project structure/conventions/build commands) — no AGENTS.md update required
- [x] 6.3 [P] File the cross-repo documentation issue in `unbound-force/website` required by the org constitution's Cross-Repo Documentation rule (user-facing workflow change): title `docs: <what changed>`, covering the direct review dispatch, the consent-gate interaction, and the guardrail amendment; search the website repo's open issues first and reference #234, #262, #300, and #302 — consolidate with the tier-aware pause guidance rather than duplicating
  - Filed unbound-force/website#307; open issues searched first (50 listed); consolidation guidance included for #302/#300, #262, #234

## 7. Constitution alignment verification

- [x] 7.1 Verify constitution alignment: Principle I (collaboration via self-describing dispatch artifacts, driver session removed), II (`uf.review-council.md` and review-council spec unchanged and standalone), III (all dispatches still flow through plan/dispatch/consolidate tools), IV (drift + plugin + lint verification as the coverage strategy for a markdown-only change), V (no new dependencies or input surfaces; consent gate strengthens spec artifact protection), VI (deterministic call sequences, preserved human decision point, recorded deltas); resolve any gap before finalizing
  - Verified 2026-10-14 against constitution v1.4.0: all six principles aligned, no gaps. I: reviews artifact-mediated (dispatch artifacts with correlation IDs/provenance/verdicts); II: council command byte-untouched, standalone; III: plan/dispatch/consolidate flow preserved incl. fail-closed UNAVAILABLE finalization; IV: make check green (drift + 577 plugin tests + lint, ratchets enforced); V: zero new dependencies/code/input surfaces; VI: tool-call sequences replace driver re-reasoning, consent gate preserved as prose decision point, before/after deltas recorded. Dev Workflow rules also verified: Cross-Repo Documentation (website#307), branching, gatekeeping integrity (no gate values changed)
