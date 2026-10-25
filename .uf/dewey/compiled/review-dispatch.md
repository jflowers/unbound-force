---
tier: validated
compiled_at: 2026-10-25T16:27:09Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - opsxoptional-profile-models-20261004T191022-jay-flowers
  - opsxoptional-profile-models-20261004T191027-jay-flowers
  - opsxoptional-profile-models-20261004T191028-jay-flowers
  - opsxoptional-profile-models-20261004T191031-jay-flowers
  - review-dispatch-20261006T004529-jay-flowers
  - review-dispatch-20261006T004537-jay-flowers
  - shared-agent-executor-20261007T230643-jay-flowers
  - shared-agent-executor-20261007T230654-jay-flowers
  - shared-agent-executor-20261007T230657-jay-flowers
  - review-dispatch-coverage-20261009T031707-jay-flowers
  - dispatch-review-runs-20261009T151133-jay-flowers
  - dispatch-review-runs-20261009T151139-jay-flowers
  - dispatch-review-runs-20261009T151148-jay-flowers
  - review-dispatch-scope-20261010T172639-jay-flowers
  - review-dispatch-patterns-20261010T172843-jay-flowers
  - review-dispatch-20261011T225610-jay-flowers
  - review-dispatch-20261011T232447-jay-flowers
  - review-dispatch-security-20261012T005043-jay-flowers
  - advisor-host-model-fallback-20261012T005348-jay-flowers
  - dispatch-security-20261012T011809-jay-flowers
  - token-reduction-20261013T021613-jay-flowers
  - token-reduction-20261014T110708-jay-flowers
  - review-dispatch-20261014T123132-jay-flowers
  - review-dispatch-20261014T165445-jay-flowers
  - review-dispatch-20261014T165447-jay-flowers
  - review-dispatch-20261014T173704-jay-flowers
  - unleash-direct-review-dispatch-20261014T220345-jay-flowers
  - unleash-direct-review-dispatch-20261014T220410-jay-flowers
  - review-dispatch-20261015T150723-jay-flowers
  - review-dispatch-20261015T182734-jay-flowers
  - plugin-tool-schemas-20261016T132705-jay-flowers
  - review-dispatch-20261016T135620-jay-flowers
  - review-dispatch-20261016T161250-jay-flowers
  - fix-tool-args-schema-mismatch-20261016T161322-jay-flowers
  - fix-tool-args-schema-mismatch-20261016T161325-jay-flowers
  - fix-tool-args-schema-mismatch-20261016T161333-jay-flowers
  - review-dispatch-20261016T162808-jay-flowers
  - review-dispatch-20261016T222933-jay-flowers
  - review-dispatch-20261017T033628-jay-flowers
  - review-dispatch-20261017T142214-jay-flowers
  - review-dispatch-20261017T142216-jay-flowers
  - review-dispatch-20261017T234909-jay-flowers
  - review-dispatch-20261019T104700-jay-flowers
  - review-dispatch-20261019T164209-jay-flowers
  - review-dispatch-20261019T182355-jay-flowers
  - review-dispatch-20261019T182357-jay-flowers
  - review-dispatch-20261019T192212-jay-flowers
  - review-dispatch-20261019T192213-jay-flowers
  - review-dispatch-20261019T192225-jay-flowers
  - review-dispatch-20261019T203906-jay-flowers
  - opsxrouter-pattern-codification-2026-10-19-review-dispatch-20261019T212038-jay-flowers
  - review-dispatch-20261019T212331-jay-flowers
  - review-dispatch-20261019T212934-jay-flowers
  - review-dispatch-20261019T212940-jay-flowers
  - review-dispatch-20261019T214832-jay-flowers
  - review-dispatch-20261019T214836-jay-flowers
  - review-dispatch-20261019T223123-jay-flowers
  - review-dispatch-20261019T223129-jay-flowers
  - review-dispatch-20261019T231355-jay-flowers
  - review-dispatch-20261020T000151-jay-flowers
  - review-dispatch-20261020T000153-jay-flowers
  - review-dispatch-20261020T000155-jay-flowers
  - review-dispatch-20261020T000304-jay-flowers
  - review-dispatch-20261020T000312-jay-flowers
  - review-dispatch-20261020T000313-jay-flowers
  - review-dispatch-20261020T001446-jay-flowers
  - review-dispatch-20261020T001450-jay-flowers
  - review-dispatch-20261020T113854-jay-flowers
  - review-dispatch-20261020T124754-jay-flowers
  - review-dispatch-20261020T124757-jay-flowers
  - review-dispatch-20261020T140939-jay-flowers
  - review-dispatch-20261020T141042-jay-flowers
  - review-dispatch-20261020T143057-jay-flowers
  - review-dispatch-20261020T143059-jay-flowers
  - review-dispatch-20261020T143954-jay-flowers
  - review-dispatch-20261020T143957-jay-flowers
  - review-dispatch-20261020T170534-jay-flowers
  - review-dispatch-20261020T170537-jay-flowers
  - host-model-resolution-20261022T121645-jay-flowers
  - review-dispatch-20261022T121650-jay-flowers
  - review-dispatch-20261022T121714-jay-flowers
  - review-dispatch-20261022T121716-jay-flowers
  - review-diff-security-20261022T130001-jay-flowers
  - review-dispatch-20261022T130006-jay-flowers
  - review-dispatch-20261022T192925-jay-flowers
  - review-dispatch-20261023T001926-jay-flowers
  - review-dispatch-20261023T001930-jay-flowers
  - review-dispatch-20261023T114012-jay-flowers
  - review-dispatch-20261023T124206-jay-flowers
  - review-dispatch-20261023T145629-jay-flowers
  - review-dispatch-20261023T145636-jay-flowers
  - review-dispatch-20261023T145638-jay-flowers
  - review-dispatch-20261023T145645-jay-flowers
  - review-dispatch-20261023T155947-jay-flowers
  - review-dispatch-20261023T204409-jay-flowers
  - review-dispatch-20261023T204414-jay-flowers
  - review-dispatch-20261024T160425-jay-flowers
topic: review-dispatch
---

# Review Dispatch

## Current State (October 2026)

### Session architecture and correlation lifecycle

The review-dispatch plugin (`.opencode/plugins/review-dispatch/index.ts`, mirrored
byte-identically under `internal/scaffold/assets/` for `make check` drift gates):
- Every `dispatch_review_runs` invocation mints a fresh `correlation_id` after input validation
  and re-points the in-memory `sessionCorrelationMap` before any side effect (issue #794, commit
  e491080, Oct 23): each workflow gets its own session directory
  (`$TMPDIR/opencode/dispatch-<correlation>/`), and session metadata is written whenever supplied
  — no first-call-only guard. Session-less outcomes (all-skip, prompt failure) re-point the
  map, so later no-provenance retrieval fails closed as `not_found`.
- Direct `dispatch_agent_run` calls keep mint-or-reuse conversation binding (RD-CR-003): first
  call mints, later calls join it, and a call after an aggregate dispatch joins the latest
  session; per-invocation minting here would shatter multi-call fan-out into N sessions
  consolidation cannot validate as one plan (design D2).
- Run files are `run-divisor-<agent>.json`; archived runs move to `superseded/` so each plan
  entry keeps one active run file. Finalization with provenance mints a fresh artifact
  correlation and `persistEnvelope` retries with a fresh UUID on EEXIST (collision-safe
  publishing). Residual advisory: concurrent aggregate invocations from one session could
  interleave map re-pointing (design D6 closes it).

### Recovery and fix loops

- `redispatch_failed_runs` (DR-FR-002) reuses the persisted prompt/plan entry, archives the
  failed run to `superseded/`, and re-executes only selected agents (agent filter, overridable
  timeout). Live use: divisor-guard timed out at 1200s, re-ran in ~7 minutes with a 1800000ms
  timeout, and the session consolidated 4/4 — never skip a domain-central reviewer; one bounded
  re-run closes the coverage gap.
- `discard_orphaned_submissions` (DR-FR-001) discards submissions from runs that never completed.
- Success scoping (RD-FR-025) excludes non-success submissions with warnings —
  `deduplicateFindings` historically had no status filter, letting failed-run findings
  contaminate the severity ladder (issue #751 class); RD-FR-026 reclassifies post-submission
  `child_message_error` aborts as successful.
- `redispatch_failed_runs` verifies persistence with three gates — `runData === null`
  (pre-execution exits), a `persisted` flag (the shared core's writeFile is best-effort), and a
  catch-all for throws — each restoring the archived prior file before reporting.

### Dispatch pipeline and provenance

- Direct dispatch (driver layer eliminated Oct 14): `resolve_base_ref` -> `capture_review_diff`
  -> `plan_review_dispatch` -> `dispatch_review_runs` -> `consolidate_dispatch` ->
  `finalize_review_dispatch`; the parent calls tools directly instead of a cobalt-crush-dev
  driver child re-reading the 1,145-line council command.
- Emitter/validator single-derivation: `consolidate_dispatch` derives
  `workflow_verdict`/`workflow_result.value` via the finalizer's exact derivation function
  (per-run layer from dispatch-finalize-determinism; top-level from
  fix-dispatch-verdict-derivation after issue #764's divergent emission vs validation produced
  payloads that could never pass). Fix the emitter, never relax the validator; early derivation
  calls pass a structural subset with provably fixed-point defaults (`advisories: []`).
- The no-provenance `consolidate_dispatch` result carries always-present observability fields
  (`warnings`, `proposals`) that must be stripped before forwarding to the finalizer's strict
  schema (RD-FR-027); in-repo exposure is zero.
- The shared `readRunFiles` loader (readdir -> filter `run-*.json` -> sort -> readFile ->
  JSON.parse -> run_id index) is DRY across `consolidate_dispatch`, `dispatch_review_runs`,
  `dispatch_status`, and `read_assessment_fields`, preserving per-site error semantics
  (consolidate fails closed; read_assessment_fields degrades per-run).
- `dispatch_agent_run` provenance is three-way — direct, tier-resolved, host-resolved (advisor
  source with null profile models falls through to `resolveHostModel`); the advisor gate is
  `input.source === "advisor"` behind `z.enum(SOURCE_VALUES)`. `executeDispatchRun` cancellation
  splits pre-execution (`runData` null, no run file) from post-executor (persisted, excluded per
  RD-FR-009); child lifecycle lives in shared `agent-executor.ts`.
- Conventions: 85% branch-coverage gate — test error return paths (`MAX_PROMPT_BYTES` 4 MiB,
  writeFile catches) up front; scaffold mirror edits land in the same commit; new suites extend
  `helpers/aggregate-dispatch-fixtures.ts` (12c5517).

### Diff handling and reviewer inputs

- `capture_review_diff` (`.opencode/lib/review-diff.ts`) diffs tracked modifications repo-wide
  but gathers untracked/ignored files only under `feature_dir`; in uncommitted-local mode (head
  == base, the /uf.unleash posture) new files outside the feature dir are invisible to the review
  diff — `git add` new source files before dispatch.
- The dispatch diff is authoritative for line-cited claims: reviewer agents may execute in a
  working tree at base or another branch (symptoms: pre-change content on reads, diff-added files
  absent from disk — PR #793); working-tree reads are valid only for inventory questions robust
  to the mismatch.
- Changed-files manifests can omit files or list phantom paths (`.uf/dewley/` typo): verify with
  direct reads — glob does not traverse hidden dot-directories, so a glob miss under `.uf/` is
  not evidence of absence.
- `/uf.address-feedback` produces its diff in section 1.4 via `fetch_pr_review_context` (commit
  3c4bb53, Oct 24), closing the gap where its documented `diff_path` had no producing step
  (sections 1.2/1.3 stay authoritative for PR metadata); every documented tool input must be
  anchored to a producing step in the same command's flow.

### Reliability and environment

- Per-run timeout is 1200s (`.uf/review-matrix.yaml`); standard-tier reviewers succeed routinely.
  Timeout edits are gatekeeping values requiring traceable authorization in spec artifacts
  (approver/date/rationale plus Impact entries for the canonical file and its scaffold mirror); a
  CHANGELOG "maintainer-approved" claim is not authorization.
- Quorum: at least one successful reviewer assessment yields a valid verdict; failed runs are
  informational and non-voting (observed 3/4 successes -> APPROVE WITH ADVISORIES). Recurring
  `child_prompt_failed` on one model (heavy-tier claude-opus-4-6) is environmental, not
  branch-caused.
- Context ceiling (~365k input tokens observed) aborts runs during final-response generation —
  check child token counts via `db_read_session` before assuming a child defect; zero-output
  zombie launches (0 tokens, 1 part) are the other trigger. RD-FR-026 rescues post-submission
  aborts.
- Review practice: re-reviews reconcile prior findings against intervening commits
  (resolved/partially/open); diff-added learnings are an open-issues ledger (each documented gap
  is closed-by-hunks, tracked-by-issue, or an admitted finding).

### Security

- `capture_review_diff` defense-in-depth: `isSafeRelativePath` Zod refine (no absolute paths, no
  `..`), `lstat` symlink detection, per-file 256KB cap, 1MB new-file budget, 8MB diff cap,
  200-file count cap, exclusive-create writes (`wx`, 0o600/0o700), `randomUUID()` paths.
- `read_assessment_fields` untrusted-output pattern: boundary Zod (uniqueArray of UUIDs, 64-run
  cap), per-field independent validation with null/unavailable semantics, `JSON.parse` in
  try/catch, `escapeRegExp` on interpolated identifiers (escape, not `^`-anchor, when mid-line
  matching is test-pinned), ReDoS-safe patterns.
- correlation_id -> path mapping is layered: UUIDSchema regex, `AgentNameSchema`
  (`^divisor-[a-z0-9-]{1,63}$`), path-join construction, restricted OS temp dir.
- YAML override merges mitigate prototype pollution (`Object.create(null)`, `hasOwn`); optional
  Zod schemas meeting YAML null need `?? undefined`. Features adding file-path inputs or policy
  loading need a Constitution V assessment — a recurring HIGH blocking finding.

## History

- **Oct 4-12, foundations.** Scaffold-mirror parity; Zod-optional-vs-YAML-null boundary;
  `agent-executor.ts` extraction from invoke-agent; the `dispatch_review_runs` aggregate tool
  replacing acquire_sibling_evidence + build_review_prompts + dispatch_agent_run loops; the
  `fetch_pr_review_context` `runGhCommand` pattern.
- **Oct 13-14, token-reduction arc.** Issue #716 audit: prompt drift is incurable while
  procedures live as prose; the cure is deterministic logic in plugin tools. Direct dispatch
  eliminated the cobalt-crush-dev driver session; first live run on
  opsx/unleash-direct-review-dispatch finalized end-to-end.
- **Oct 14-15, early reliability (partly superseded).** glm-5-3 standard-tier reviewers timed out
  at the then-600s per-run limit; the timeout was later raised to 1200s via an authorized
  gatekeeping change and standard-tier reliability recovered.
- **Oct 15-20, the #746/#760 collision bug family (superseded by the Oct 23 fix).**
  `sessionCorrelationMap` keyed one correlation per parent opencode session and
  `session_metadata` persisted only on the first dispatch call (FR-007 `isFirstCall` guard). A
  second dispatch in one session — /uf.unleash's spec review then code review, or fix-loop
  re-dispatches — overwrote the first's run files and validated new runs against stale
  metadata, failing deterministically with "artifact commit must equal the immutable reviewed
  head SHA" or "model provenance does not match its plan entry" (INCONCLUSIVE). Documented
  recoveries (hand-rewriting `session-metadata.json`, restarting opencode) are obsolete:
  per-invocation minting supersedes them.
- **Oct 16-17, verification hardening.** Manifest omissions and phantom paths; glob's
  hidden-directory blindness; dedup-refactor drift vectors closed only by producer-to-consumer
  tests (PR 745).
- **Oct 19-20, recovery-tool design iterations (fix-review-dispatch-recovery, issue #751).**
  Context-ceiling aborts filed (#751, six sessions Oct 14-19); `redispatch_failed_runs` and
  `discard_orphaned_submissions` designed as archive-then-execute; iteration 2 added
  restore-on-early-exit and the persisted-flag gate after review found best-effort writes could
  brick sessions. Emitter/validator single-derivation established (issue #764);
  `read_assessment_fields` extracted as the fourth inline copy of the run-file loader.
- **Oct 22.** `capture_review_diff` feature-dir scoping discovered via
  unleash-pipeline-hardening; review-diff security pattern documented; heavy-tier
  `child_prompt_failed` on claude-opus-4-6 identified as environmental.
- **Oct 23, the fix.** fix-review-dispatch-correlation-release (issue #794, commit e491080):
  per-invocation correlation minting with latest-wins map re-pointing; direct
  `dispatch_agent_run` binding verified unchanged (RD-CR-003); shared test fixtures extracted
  (12c5517); `redispatch_failed_runs` proven live on a guard re-run
  (delegation-skill-enforcement). A stale-correlation retrieval symptom that morning (round-1
  correlation surfacing after the code-review dispatch) motivated the change; passing explicit
  `correlation_id` to read-side tools remains good practice.
- **Oct 23-24, producer anchoring.** `/uf.address-feedback`'s documented `diff_path` had no
  producing step; quick/address-feedback-diff-path-producer added section 1.4 calling
  `fetch_pr_review_context` (commit 3c4bb53) with a call-site authority note (DE-005 end state is
  follow-up).
