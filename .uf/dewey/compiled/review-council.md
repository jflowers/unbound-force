---
tier: validated
compiled_at: 2026-10-25T16:31:12Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - review-council-1
  - review-context-skill-20260629T125308-yvonne-devlin
  - review-context-skill-20260629T125311-yvonne-devlin
  - review-pr-20260805T193241-jay-flowers
  - review-council-20260805T193254-jay-flowers
  - review-pr-20260805T201628-jay-flowers
  - review-insight-20260816T181512-jay-flowers
  - review-council-multi-model-fanout-20261002T164840-jay-flowers
  - review-council-multi-model-fanout-20261002T164850-jay-flowers
  - review-council-multi-model-fanout-20261002T164850-jay-flowers-2
  - review-insight-20261007T185906-jay-flowers
  - hero-removal-review-20261011T022008-jay-flowers
  - hero-removal-architecture-20261011T023753-jay-flowers
  - intent-drift-detection-20261012T160739-jay-flowers
  - intent-drift-detection-20261012T173202-jay-flowers
  - review-council-20261014T184912-jay-flowers
  - review-council-20261016T162812-jay-flowers
  - review-council-20261016T162819-jay-flowers
  - review-council-20261017T123525-jay-flowers
  - review-council-20261017T145233-jay-flowers
  - opsxrouter-pattern-codification-2026-10-19-swarm-20261019T212035-jay-flowers
  - intent-drift-20261020T001114-jay-flowers
  - review-workflow-20261022T225001-jay-flowers
topic: review-council
---

# Review Council

## Current State (October 2026)

### Command and Modes

`/uf.review-council` (`.opencode/commands/uf.review-council.md`, 1332+ lines) runs Code Review,
Spec Review, triage, and feedback modes. PR reviews resolve immutable base/head SHAs; local
no-PR runs where branch head equals base fall back to the working tree (tracked edits via
`git diff <base_sha> -- .`, untracked files via `git ls-files --others --exclude-standard`).
Canonical command file and scaffold copy (`internal/scaffold/assets/opencode/commands/
uf.review-council.md`) are edited byte-identically (TestCommandContracts_CanonicalScaffoldParity);
normalizeCommandText substring checks pin phrases like `base_sha...head_sha` exactly.

### Composition and Dispatch

Six review personas — adversary, architect, curator, guard, sre, testing
(`.uf/reviewer-capabilities.yaml`) — plus three content-only personas (envoy, herald, scribe)
discovered but never dispatched for review; AGENTS.md says "5+ Divisor agents". Dispatch runs
via the review-dispatch plugin in parallel batches capped at `max_parallel_runs: 4`
(`.uf/review-matrix.yaml:72`), `per_run_timeout_seconds: 1200`. `/uf.unleash` Step 6 satisfies
the pre-PR council requirement by dispatching directly via the plugin, not by spawning the
command file. Auto-discovered plugins under `.opencode/plugins/` do not load into sessions
started before they existed; absent dispatch tools, the council falls back to embodied
multi-persona review (sound findings, no canonical dispatch artifacts or native
finalize_review_dispatch verdict) — restart the session after scaffolding new plugins.

### Verdicts and Gates

Verdicts: APPROVE, APPROVE WITH ADVISORIES, REQUEST CHANGES, INCONCLUSIVE, UNAVAILABLE;
severity ladder CRITICAL/HIGH/MEDIUM/LOW. Designed gate points exist throughout (the
August-era "no gate points except REQUEST CHANGES" claim is stale): Phase 1a pre-flight soft
gate stops on branch-caused failures; Step 7f is MANDATORY human confirmation before posting;
Spec Review carries per-finding consent gates (issue #777); the pre-flight skill runs
soft-gate mode. Override carryforward (opsx/spec-review-per-finding-gate, 2026-10-22):
findings matching a recorded override (same file, same root cause) carry forward as resolved
across re-run iterations and the overrides array accumulates — otherwise fresh reviewers
re-report waived findings each iteration and fix+override cycles exhaust the iteration cap
citing explicitly-waived findings; no-re-ask rules must cover re-run iterations too.

### Fix-Loop Convergence

Loops converge when each round fixes HIGH+MEDIUM findings in code, defers LOWs to verified-OPEN
tracked issues carrying concrete fix text, runs the full gate between rounds (make check: 818
vitest tests, Go -race suites, coverage), and re-derives the diff from the working tree rather
than reusing the prior round's manifest. Observed on unleash-deterministic-tools (2026-10-16):
round 1 structural gaps; round 2 byte-level defects invisible to prose review (CRLF in a
single-byte checkbox flip; staging closure missing three of eight lib modules); round 3
advisory-only LOWs → APPROVE WITH ADVISORIES. Deferral verification belongs in the
duplicate-check step: confirm the issue is OPEN and carries each deferred finding with fix
text, then treat as addressed-by-tracking, not re-raised (#741-#743).

Learnings committed after the last fix commit are the next round's defect-observation queue:
sort the diff's `.uf/dewey/learnings` by created_at relative to fix commits; for each learning
newer than the last fix, grep the named file for the prescribed state and file a finding when
absent; older learnings need only a spot check. A learnings-only head commit makes every diff
learning a fresh queue — disposition by owning domain via tag (uf-workflow-testing → Tester,
plugin-architecture → Architect, review-council/documentation-gate → Curator) rather than
out-of-scope findings (PR 745).

### Cross-Repo Remediation

Findings whose remediation lives outside the repository — filing a constitution-mandated
tracking issue in unbound-force/website, commenting on a docs issue — cannot be cleared by
the review agent or local edits, deadlocking local no-PR councils at REQUEST CHANGES even
when code passes clean. Convergent pattern (fix-tui-git-output-leak, 2026-10-14, iterations
1→2→3: 6 findings → 3 → APPROVE WITH ADVISORIES): the parent executes the GitHub actions
exactly as each finding's remediation text specifies, records resulting URLs/issue numbers
in-repo (proposal.md Documentation Impact + CHANGELOG entry), re-runs one confirmation
iteration, and verifies clearance read-only via `gh issue view` — low-risk and unblocking.

### Council Value Evidence (Domain-Specific Catches)

- Tester: sole dissent on the fix-review-pr-step7-gate spec — HIGH gaps the other four
  approved past: verification tasks without pass/fail criteria; no task for the
  zero-findings APPROVE scenario (the reported bug itself).
- Curator: most actionable verdict on scaffold-dcp-config — missing CHANGELOG entry and docs
  issue (#503) while five agents APPROVEd with LOWs; verifies claimed issue filings are OPEN.
- Guard: scaffold-copy desync (`.opencode/commands/` mirrors under `internal/scaffold/assets/`
  must be updated together; TestEmbeddedAssets_MatchSource caught a dismissed finding in CI);
  greps ALL constitution sections for stale hero references on removals.
- Regression tests: 3/5 reviewers independently flagged a bug-fix proposal lacking regression
  tasks (TC-006); a regression test must reproduce the original failure
  (`strings.NewReader("y\r")`, not `"y\n")`); coverage claims verified by searching files.
- Documentation completeness: reliably catches missing CHANGELOG entries, stale AGENTS.md
  structure comments, and missing content assertions in activation-test branches.
- Spec/impl traceability: aspirational spec language over a documented simpler trade-off is
  closed with a code comment citing the design decision; specs state minimal required imports.

### Adjacent Review-Workflow Patterns

Triage resolving dependency, parity, and verification questions before the spec produced a
clean 5/5 APPROVE with zero HIGH/CRITICAL (#295); scaffold-embedded skills are structurally
guaranteed present, so fallback logic is dual-path burden. Collateral gating in command
files — one condition gating both framing text and the AskUserQuestion prompt
(uf.review-pr.md Step 7, #441) — means each conditional block gates exactly its instructions.
Intent drift: MODIFIED and REMOVED requirements on one file both need tasks; PR-scoped
checkpoint keying needs `key` in every call; a reversed design decision requires updating
the proposal. Coverage gates deriving packages from git merge-base pass vacuously on
uncommitted work; classify by actual purity (internal/artifacts and internal/schemas do
filesystem I/O: 80% helper scope). Fresh swarm worktrees cannot read untracked spec dirs —
pass pinned design content verbatim in shared_context, cherry-pick worker branches, run
scan_conflict_markers.

## History

- May 2026: five-reviewer council; 3/5 independently caught a missing regression-test
  requirement — the domain-expertise rationale for multi-reviewer review.
- June 2026: triage-before-spec yields clean 5/5 APPROVE; skills as hard dependencies.
- August 2026: Adversary, Architect, Guard, SRE, Tester lineup; Tester-only dissent;
  scaffold-parity and collateral-gating lessons (#441); "no gates beyond REQUEST CHANGES"
  now stale.
- October 2 (opsx/review-council-multi-model-fanout): working-tree fallback for local
  reviews; plugin session-reload requirement; coverage-gate scope classification.
- October 14-17: fix-loop mechanics codified — parent-executed cross-repo remediation,
  deferral verification, gate-between-rounds convergence, learnings-as-queue (PR 745).
- October 22 (issue #777): Spec Review per-finding consent gates and override carryforward.
- Since: 5 reviewers → 6 review + 3 content-only personas; driver sessions → direct plugin
  dispatch (/uf.unleash Step 6); per-run timeout 600 → 1200 seconds; parallel cap 4.
