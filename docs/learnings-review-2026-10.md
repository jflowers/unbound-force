# Learnings Review — October 2026

**Date**: 2026-10-25
**Scope**: 649 learnings in `.uf/dewey/learnings/` (218 topic tags, spanning
2026-05-09 through 2026-10-24), 18 compiled articles in
`.uf/dewey/compiled/`, and the knowledge-graph state after the
August 14, 2026 compile cycle.
**Method**: dewey index + lint --fix (embedding coverage restored to 1.0),
claim-by-claim verification of every validated article against the
current tree via five parallel audit agents, temporal contradiction
sweep across the top learning clusters, full recompile, then
promotion.

## Executive Summary

The August compile cycle left 18 validated articles. As of this
review, 16 remain fundamentally sound but every one carries drift;
2 are actively misleading in material sections and must not be
relied on without correction:

- **security-checklist.md** — 7 of 23 checkable claims reference
  code that never merged to main (lives only on
  `origin/opsx/ollama-proxy` and `origin/714-opencode-v2-dual-support`).
- **remote-llm-provider.md** — the provider trio
  (Vertex/Bedrock/Anthropic) is wrong; Dewey now supports only
  ollama + vertex, the factory was renamed, and the credential
  path moved to the ADC library.

Two articles are much fresher than assumed:
**plugin-architecture.md** and **token-reduction.md** were compiled
2026-10-14 (a mid-October mini-cycle), not August 14 — both are
near-current and healthy.

Full recompile (Phase 4) regenerates all articles to the
October 2026 current state, absorbing the ~518 learnings stored
since August.

## Cycle Facts

- Learnings: 649 total (was 131 at the August cycle), 218 topic
  tags (was effectively ~40). Top clusters: review-dispatch (75),
  documentation-gate (45), openspec (32), documentation-pipeline
  (19), spec-authoring (15), uf-workflow (13), determinism (13),
  uf-workflow-testing (12), spec-review (12).
- Lint after fix: embedding coverage 1.0 (15,970 embeddings); 649
  uncompiled (info — resolved by this cycle's compile); 1 stale
  decision (sandbox-8 — see below); 0 auto-detected contradictions.
- Curation (`dewey curate`): not applicable — no
  `knowledge-stores.yaml` has ever been configured in this repo
  (the August cycle also ran without it). No stores were invented
  for this cycle.

## Article Health Matrix (Phase 3a Audit)

Each of the 18 articles was claim-audited against the current
tree by a dedicated verification agent (file:line evidence
captured per claim). Counts are TRUE / STALE / FALSE /
UNVERIFIABLE over checkable claims.

| Article | Compiled | T/S/F/U | Health |
|---|---|---|---|
| gateway | Aug 14 | 13/1/0/0 | Healthy; `ExecCommandFunc` named type never existed (injection uses unnamed func type) |
| plugin-architecture | **Oct 14** | 9/1/0/1 | Excellent; finale template grew 333→391 lines since compile |
| token-reduction | **Oct 14** | 6/2/0/0 | Freshest; both "latent defects" fixed days after compile |
| release-pipeline | Aug 14 | 6/4/0/4 | Healthy; awk-bug headline story resolved in all 4 repos |
| go-patterns | Aug 14 | 8/1/0/2 | Healthy; one live `fmt.Fscanln` violation remains at `internal/sandbox/sandbox.go:793` |
| fail-fast | Aug 14 | 9/2/0/3 | Mostly holds; setup-ordering claim was stale even at compile time |
| scaffold | Aug 14 | 11/3/0/1 | Mechanics current; counts drifted (5→20 learnings; '39 files' now a 70–74 range) |
| mcp-transport | Aug 14 | 13/1/0/3 | Solid vs replicator clone; test-mock conformance claim drifted |
| blast-radius-scope-audit | Aug 14 | 10/0/0/4 | Good historical record; "6 repos" → 4 tracked siblings now |
| di-testability | Aug 14 | ~9/4/0/2 | Pattern alive; 3 of 5 code examples drifted (renames/removals) |
| review-council | Aug 14 | 17/1/0/5 | Healthy; "no gates except REQUEST CHANGES" stale (see gate drift) |
| spec-workflow | Aug 14 | 10/1/0/9 | Core advice valid; predates quick tier entirely |
| sandbox | Aug 14 | 14/3/1/2 | gh-credential relay claim false since May (stale at compile) |
| crapload | Aug 14 | 9/1/3/4 | Central premise flipped: `gaze crap` no longer defaults `-short` |
| ci-coverage | Aug 14 | 14/1/2/3 | Ratchets intact; ε=0.5 + CI-baseline "fixes" never merged |
| website-content | Aug 14 | 14/4/1/3 | Constitution claims false — governance changed (see below) |
| remote-llm-provider | Aug 14 | 4/5/2/2 | **Stalest** — provider list, factory, credentials all wrong |
| security-checklist | Aug 14 | 13/2/7/1 | **Worst** — 7 phantom claims from never-merged branches |

## Key Findings

### F1. Phantom branch claims (CRITICAL for article integrity)

The August compiler absorbed learnings from work that never
merged. These claims describe code that main has never contained:

- SSRF loopback-only validation, `redactToken()`, proxy model
  charset, 10MB body limit (security-checklist items 1–4) —
  only on `origin/opsx/ollama-proxy`.
- `internal/pidfile/` and `internal/auth/` extraction
  (security-checklist #8) — same unmerged branch; on main the
  logic still lives in `internal/gateway/{pid,provider,refresh}.go`.
- `maskKey()` (security-checklist #12, remote-llm-provider #6) —
  exists nowhere reachable in any repo or branch audited.
- CRAP-load ε=0.5 epsilon and CI-runner baseline regeneration
  (ci-coverage #7–8, crapload #15) — only on unmerged
  `origin/036-ci-crap-baseline`; main delegates to
  complytime/org-infra with a manually committed
  `.gaze/baseline.json`.

**Correction applied in Phase 4/5**: excise from current-state
sections; retain only as clearly-labeled unmerged-proposal
history, or drop entirely.

### F2. A mid-October compile cycle already happened

`plugin-architecture.md` and `token-reduction.md` carry
`compiled_at: 2026-10-14`. The August "18 validated articles"
figure includes two October articles. Implication: the compile
backlog is 16 August-era articles plus ~500 learnings, not a
uniform 2.5-month gap. Both October articles verify near
perfectly — the newer compile methodology (post direct-dispatch
rework) produced accurate output.

### F3. Review-pipeline gate drift

Both review-council.md and spec-workflow.md assert "no gate
points exist in the council pipeline except REQUEST CHANGES."
The current pipeline has designed gates: Phase 1a pre-flight
soft gate on branch-caused failures, Step 7f MANDATORY human
confirmation before posting, Spec Review per-finding consent
gates, and five verdict values (APPROVE, APPROVE WITH ADVISORIES,
REQUEST CHANGES, INCONCLUSIVE, UNAVAILABLE). The council also
grew to 6 review personas (+3 content-only personas discovered
but not dispatched for review), with dispatch concurrency capped
at 4 via the review-dispatch plugin.

### F4. `/uf.unleash` tier routing is new

The quick tier and tier-routing skill landed 2026-10-19/20
(commits fe2adef, e708065). Every August-era article describing
the two-tier (speckit/openspec) workflow is incomplete: routing
now has three tiers with risk floors forcing escalation.

### F5. `gaze crap` no longer defaults to `-short`

The `--test-short` flag is now opt-in for `gaze crap` (defaults
false; only `gaze self-check` defaults true). This flips the
premise of the Short()-guard sections in ci-coverage.md and
crapload.md, and the proposed "no Short() on sub-1s tests"
convention-pack rule was never adopted (the landed rule, go.md
TC-011, endorses guards only for genuinely slow tests).

### F6. Dewey LLM provider drift (remote-llm-provider.md)

- Supported synthesis providers: **ollama + vertex only** (not
  Vertex/Bedrock/Anthropic).
- `NewSynthesizer()` → `NewSynthesizerFromConfig(cfg ProviderConfig)`.
- Env var is the lowest-priority fallback, not an override;
  precedence: per-vault YAML > legacy compile_model > global
  `~/.config/dewey/config.yaml` > `DEWEY_GENERATION_MODEL`.
- Credentials moved from gcloud shell-out to
  `google.FindDefaultCredentials` (ADC) with injectable `tokenFn`.
- Embeddings now support a Vertex backend (Ollama
  granite-embedding:30m remains default).

### F7. Sandbox credential model changed

- The gh-credential relay (D9) was removed May 10, 2026 (commit
  7e79388, "defer D9") — the sandbox.md claim was false even at
  compile time. Current devcontainer postStartCommand only
  starts `opencode serve --port 4096`.
- Credential mounts were removed entirely in favor of
  gateway-based isolation; the no-gateway fallback forwards
  provider keys via `-e` env vars (`internal/sandbox/config.go:133-148`).

### F8. Website governance changed

website-content.md's constitution claims are false: the website
repo's `.specify/memory/constitution.md` is now the
scaffold-default org-style constitution (Autonomous
Collaboration / Composability First / Observable Quality /
Testability / Security by Default) — Content Accuracy, Minimal
Footprint, and Visitor Clarity survive only in historical spec
artifacts. The org constitution (v1.4.0, amended 2026-10-14)
now asserts supremacy over hero constitutions on cross-cutting
concerns. Live tech-debt signal: the site currently contains
the `ANTHROPIC_AUTH_TOKEN` / `gateway-proxy` mistakes in 3 doc
files the article warns about.

### F9. Counts and line references drifted (routine)

Learning counts per topic grew (sandbox 10→11, scaffold 5→20,
website 12→30); release.yml line counts changed in all repos
(unbound-force 284→399); `internal/sandbox/config.go:79` → :87;
`TestEmbeddedAssetsMatchSource` → `TestEmbeddedAssets_MatchSource`;
the hardcoded '39 files processed' assertion became a 70–74
range. All corrected in the Phase 4 recompile.

### F10. Resolved narratives (mark as history)

- The shared awk `url`/`sha256` ordering bug: fixed in all four
  repos (unbound-force Oct 7 via order-agnostic matching;
  replicator extracted a tested `patch-homebrew-cask.sh`).
- token-reduction.md's two latent defects: both fixed Oct 16+
  (`write_unleash_summary` now writes the summary artifact;
  uf.unleash fix loop is consent-gated).

## Phase 3a — Per-Article Audit Detail

Only STALE / FALSE / UNVERIFIABLE claims are listed with
corrections; TRUE claims are counted in the matrix above. File
evidence is abbreviated; the audit agents' full tables are in
the session record.

### security-checklist.md (13/2/7/1)

| Claim | Verdict | Correction |
|---|---|---|
| SSRF loopback-only validation for proxy targets | FALSE | Never merged; `origin/opsx/ollama-proxy` only |
| `redactToken()` in all log output | FALSE | Never merged; 0 hits across all repos/branches |
| Model charset `[a-zA-Z0-9._-]+` (proxy context) | FALSE | Unmerged; branch uses extended charset incl. colon. (The TS git-trailer validation with this charset IS true — different context) |
| 10MB `io.LimitReader` body limit | FALSE | Unmerged (branch uses `http.MaxBytesReader`); no limit in main gateway |
| Extract `internal/pidfile/`, `internal/auth/` | FALSE | Never merged; logic remains in `internal/gateway/` |
| `maskKey()` last-4-chars | FALSE | No implementation anywhere reachable |
| Convention-pack Adversary Security Checklist rule | FALSE | Never adopted into any pack |
| Branch validation prevents feature-branch releases (replicator) | STALE | Only dewey implements it; replicator spec unarchived |
| Credentials via stdin (sandbox gh auth) | STALE | Relay removed 7e79388; principle remains guidance-only |

### remote-llm-provider.md (4/5/2/2)

| Claim | Verdict | Correction |
|---|---|---|
| Providers: Vertex, Bedrock, Anthropic | FALSE | ollama + vertex only (`dewey/llm/provider.go:37-49`) |
| `maskKey()` | FALSE | Gone from dewey |
| `NewSynthesizer()` factory | STALE | `NewSynthesizerFromConfig(cfg)` |
| Env var overrides config | STALE | Env var is lowest-priority fallback; global config layer added |
| stdlib + charmbracelet/log only | STALE | Now also yaml.v3, embed, x/oauth2 (still no LLM SDK) |
| gcloud shell-out + `ExecCommandFunc` + `DEWEY_VERTEX_ACCESS_TOKEN` rejected | STALE | Now `google.FindDefaultCredentials` ADC with injectable `tokenFn` |
| Embeddings local-only via Ollama | STALE | Vertex embedding backend added; Ollama default retained |

### crapload.md (9/1/3/4)

| Claim | Verdict | Correction |
|---|---|---|
| `gaze crap` runs `-short` internally | STALE | Opt-in flag now; defaults false |
| CI fix: baseline on runner + ε=0.5 | FALSE | Never merged to main (only `origin/036-ci-crap-baseline`) |
| Convention-pack "no Short() on sub-1s tests" | FALSE | Never adopted; TC-011 endorses guards for slow tests only |
| History: 9 crapload learnings | FALSE | 11 exist (article's intro even says 11) |

### ci-coverage.md (14/1/2/3)

| Claim | Verdict | Correction |
|---|---|---|
| Fix 1: CI-runner baseline generation | FALSE | Baseline manually committed; no post-merge workflow |
| Fix 2: ε=0.5 epsilon | FALSE | Never landed on main; strict `>` comparison in Makefile |
| `gaze crap` runs `-short` | STALE | See above |

### release-pipeline.md (6/4/0/4)

| Claim | Verdict | Correction |
|---|---|---|
| awk script copied verbatim across 4 repos | STALE | 3 divergent local variants + 1 extracted tested script; preflight centralized in org-infra |
| Line counts 415/400/333/284 | STALE | Now dewey 317, replicator 283, gaze 372, unbound-force 399 |
| url-before-sha256 ordering bug | STALE (fixed) | Order-agnostic in all 4 repos |
| Simultaneous-fix recommendation | STALE (done) | Fully implemented |
| Branch validation (replicator) | STALE | Only dewey enforces currently |

### review-council.md (17/1/0/5)

| Claim | Verdict | Correction |
|---|---|---|
| No gate points except REQUEST CHANGES | STALE | Pre-flight soft gate, Step 7f human confirmation, per-finding consent gates, 5 verdict values; 6 review personas, concurrency capped 4 |
| Source learning 20260805T193249 | missing | Cited source absent from tree (3 of 4 exist) |

### spec-workflow.md (10/1/0/9)

| Claim | Verdict | Correction |
|---|---|---|
| No gates except REQUEST CHANGES | STALE | Same as review-council |
| (whole article) two-tier workflow | incomplete | Predates quick tier + tier routing (Oct 19/20) |

### sandbox.md (14/3/1/2)

| Claim | Verdict | Correction |
|---|---|---|
| gh token relay in postStartCommand | FALSE | Removed 7e79388 (May 10); false even at compile time |
| Two credential paths (gateway vs direct-mount) | STALE | Credential mounts removed; env-var forwarding fallback |
| 10 sandbox learnings | STALE | 11 now |
| autoDetectBackend must call isPersistentWorkspace | STALE | Kept separate by design; both detect what they need |

### scaffold.md (11/3/0/1)

| Claim | Verdict | Correction |
|---|---|---|
| 5 scaffold learnings | STALE | 20 now |
| Hardcoded '39 files processed' count | STALE | Range assertion [70,74] in main_test.go |
| TestEmbeddedAssetsMatchSource (no underscore) | STALE | Real name `TestEmbeddedAssets_MatchSource` |

### website-content.md (14/4/1/3)

| Claim | Verdict | Correction |
|---|---|---|
| Website constitution = Content Accuracy/Minimal Footprint/Visitor Clarity | FALSE | Now scaffold-default org-style constitution |
| Org constitution does not apply to website | STALE | Org constitution v1.4.0 (Oct 14) asserts supremacy over hero constitutions |
| 12 website learnings | STALE | 30 now |
| config.go:79 placeholder | STALE | Now :87 |
| Two credential paths | STALE | Same as sandbox |

### gateway.md (13/1/0/0)

| Claim | Verdict | Correction |
|---|---|---|
| Injectable `ExecCommandFunc` named type | STALE | Injection real but via unnamed func type; named type never existed |

### mcp-transport.md (13/1/0/3)

| Claim | Verdict | Correction |
|---|---|---|
| Mock validates POST method + jsonrpc field | STALE | Current mock checks Content-Type, Accept, method only |
| "5 learnings from replicator" | inconsistent | Only 4 listed in History; frontmatter cites ci-1 |

### go-patterns.md (8/1/0/2)

| Claim | Verdict | Correction |
|---|---|---|
| `resolveAuthor` returns `(string, error)` | STALE | Now returns `string` only (dewey) |
| Fscanln ban | unadopted | Rule never landed; live violation at `internal/sandbox/sandbox.go:793` |

### di-testability.md (~9/4/0/2)

| Claim | Verdict | Correction |
|---|---|---|
| gaze `Deps struct` fields (LoadPackages/BuildCoverageMap/AIMapperFn) | STALE | Renamed: `contractCoverageDeps{loadAndAnalyze, classifyResults, loadTestPkg, assess, aiMapperFn}` |
| `TokenRefresher` interface example | STALE | No longer exists in any repo; use `Provider` (gateway) / `Backend` (sandbox) |
| `ExecCommandFunc func(...) *exec.Cmd` | STALE | Actual: `func(string, ...string) ([]byte, error)` |

### fail-fast.md (9/2/0/3)

| Claim | Verdict | Correction |
|---|---|---|
| dewey ParseDocument silently overwrote metadata | STALE | Overwrite path no longer exists in current dewey |
| setup installs Gaze before gh | STALE | Fixed Aug 12 (two days before compile) — stale at compile time |

### blast-radius-scope-audit.md (10/0/0/4)

| Claim | Verdict | Correction |
|---|---|---|
| "across all 6 repos" | historical | Now 4 tracked siblings (gaze-py dropped from sibling-repos.yaml) |
| Convention-pack grep-all-consumers rule | still candidate | Never adopted in 2+ months — note as unadopted |

### token-reduction.md (6/2/0/0 — compiled Oct 14)

| Claim | Verdict | Correction |
|---|---|---|
| `uf_finale_pr_context` reads artifact no tool writes | STALE (fixed) | `write_unleash_summary` landed Oct 16 |
| uf.unleash auto-fix contradicts consent gate | STALE (fixed) | Fix loop now consent-gated per finding |

### plugin-architecture.md (9/1/0/1 — compiled Oct 14)

| Claim | Verdict | Correction |
|---|---|---|
| Finale template ~300 lines | STALE | Now 391 (base-sync step added) |

## Phase 3b — Contradiction Sweep

Five parallel agents read ~340 learnings across the top clusters
(review-dispatch 79+4, documentation-gate 45+11,
documentation-pipeline 19, content-pipeline 11, spec-authoring 15,
spec-review 12, openspec 32, uf-unleash 10, uf-workflow 13,
uf-workflow-testing 12, determinism 13, gatekeeping 9,
plugin-architecture 8, seam-verification 7, review-council 7,
command-contract-tests 7, dependency-governance 7) and verified
against current code. Full agent tables are in the session
record; findings below.

### Contradiction landscape

- **review-dispatch** — the dominant conflict family is the
  session/correlation collision bug (#746/#760): ten learnings
  (Oct 12–20) describe first-call-only session metadata, one
  correlation per session, second-dispatch overwrites, and
  hand-rewrite recovery procedures. All superseded by the #794
  fix (commit e491080, Oct 23): every dispatch mints a fresh
  correlation; metadata written whenever supplied. Later
  learnings (20261023T145636/-145638/-145645) are authoritative.
  Also: recovery paths DR-FR-001/002 shipped (superseding "no
  sanctioned recovery path"); address-feedback gained its §1.4
  diff producer Oct 24; shared `readRunFiles` loader replaced
  the "fourth inline copy"; per-run timeout 600s → 1200s.
  One later learning was itself wrong:
  `review-dispatch-20261019T214836` claimed uf.review-pr never
  calls consolidate_dispatch — never true (git-verified).
- **documentation-gate** — label hygiene contradictions
  (website issues are `docs`-labeled, not conventionally
  unlabeled — `20261014T220253` is false); main repo has BOTH
  `docs` (20 open) and `documentation` (13 open) labels with
  dual-labeling emerging as the fix; exemption lists split by
  gate (AGENTS.md repo gate exempts spec artifacts; constitution
  website gate does not); blanket exemptions for
  behavior-neutral prose refactors replaced by auditable
  exempt-or-file decisions.
- **spec-review** — the biggest process reversal: the pre-Oct-22
  policy (LOW/MEDIUM auto-fixed in one pass, HIGH/CRITICAL
  dead-stop) was replaced by the per-finding human consent gate
  (issue #777, commit eeb7d09, Oct 23).
- **uf-unleash / uf-workflow** — 10 pairs, all resolved toward
  the later state: consent gates replaced full autonomy;
  `dispatch_review_runs` replaced `invoke_agent` fan-out;
  envelope-timestamp ordering replaced mtime heuristics;
  shared marker grammar replaced divergent grammars;
  two-tier became three-tier (quick added);
  `countUncheckedCheckboxes` column-0 counting fixed the
  grammar disagreement; RD-FR allocation renumbered to 025–027.
- **governance clusters** — staged override posture codified
  (HIGH at spec-review pre-disposition, MEDIUM post-human-
  override; the 1.4.10→1.19.0 plugin pin bump was
  maintainer-authorized, declared, and reconciled via SC-FR-003
  SUPERSEDED-BY); engine floors must be manifest-level (`engines`
  field landed); arrow notation is a uf.finale convention, not a
  repo standard (DE-002 mandates shape examples, not form).
  Ten gap-descriptions (P6–P15) were closed by the fixes they
  prescribed (all 8 write_unleash_summary params pinned, golden
  suite 44-of-48 + per-variant dispatch tests, shared
  artifact-path module, marker superset extractor, etc.).

### Learning deletion candidates (never-true or actively misleading)

Per the approved policy, deletion is reserved for learnings that
were never true or would mislead if retrieved today. Ten meet
the bar (user confirmation pending):

| # | Learning | Reason |
|---|---|---|
| 1 | `opsxrouter-pattern-codification-2026-10-19-review-dispatch-20261019T212024` | Instructs bypassing consolidate_dispatch with a hand-corrected payload; premise fixed; actively harmful if retried |
| 2 | `review-dispatch-20261019T182401` | Self-expiring recovery guidance ("until #760 is fixed") whose condition is now false |
| 3 | `review-dispatch-20261020T165720` | Asserts first-call-only metadata as present tense; prescribes rewriting correct state |
| 4 | `review-dispatch-20261012T235630` | Workaround abandons consolidation validation; the fix it demanded shipped |
| 5 | `review-dispatch-20261015T234424` | Redundant bug-record with false premise (family history retained in 150723) |
| 6 | `review-dispatch-20261019T161123` | Same family; redundant with 150723 |
| 7 | `documentation-gate-20261014T220253` | False suppression directive ("do not flag missing website labels") contradicted within 24h; unique content duplicated elsewhere |
| 8 | `spec-review-20261008T223721` | Endorses the removed auto-fix/dead-stop policy; contradicts the mandatory per-finding gate |
| 9 | `uf-unleash-20260814T174736` | Wrong step count/numbering, removed mechanisms, reversed autonomy philosophy — every operational particular false today |
| 10 | `review-council-20260811T174015` | Never-true (attributes /uf.unleash phases to /uf.review-council, git-verified) + "no gate points" directly contradicts the test-enforced mandatory gate |

Retained-with-annotation (not deleted):
`review-dispatch-20261015T150723` (family historical record;
uniquely documents persistEnvelope collision-safe UUID retry),
`review-dispatch-20261017T234909` (run-file layout facts still
accurate), `review-dispatch-20261019T214832` (sound except one
never-true survey sentence — correct in place).

Surgical in-place corrections (keep files, fix sentences):
`content-pipeline-20261017T232053` (phantom FA-006 citation),
`spec-review-20261022T205113` (wrong .gitignore mechanism —
actually the @-path glob quirk),
`content-pipeline-20261022T192850` and
`spec-authoring-20261017T222148` (dangling references to
nonexistent learnings).

### Compile guidance from the sweep

- Deduplicate near-simultaneous stores (the same gotcha is
  routinely stored 3–4× within minutes).
- Respect supersession: compile against the later/authoritative
  learning in every pair above; treat fixed-defect learnings as
  history, not current state.
- Weigh learning age against current code: many documented gaps
  were subsequently fixed; the compiled articles must state
  present-tense facts only from code-verified claims.

## Phase 3c — sandbox-8 Stale Decision

The lint flagged learning `sandbox-8` (decision, 174 days old,
unvalidated). Audit result: the decision — use `--workspace-env`
(not `--dotfiles-env`) for gateway env injection, HIGH severity,
design-time — **holds and is implemented** (`internal/sandbox/devpod.go:107-115`,
D4 comment; no `--dotfiles-env` anywhere in Go code).
Resolution: fold into the Phase 4 recompiled sandbox article and
promote alongside it (see Phase 6), closing the stale_decision
finding.

## Phase 4 — Recompile

Executed 2026-10-25 as a full rebuild via `dewey compile`.

- **Input**: 639 learnings in the store (post-pruning, see
  Phase 5), clustered into 205 tag clusters.
- **Wipe**: the rebuild removed the previous compiled set —
  the 18 August articles, the 2026-10-14 mini-cycle articles
  (`plugin-architecture`, `token-reduction`), and `_index.md`.
  `token-reduction` was subsumed: its cluster content folded
  into the related regenerated articles, so it does not
  reappear as a standalone article. `plugin-architecture`
  was regenerated from its now-21-learnings cluster.
- **Synthesis**: no LLM synthesizer is configured, so the
  compile returned clusters with synthesis prompts (the
  intended agent-performed flow). The 205 clusters were
  mapped onto 30 repo articles (covering all 639 learnings
  exactly once) plus 8 cross-repo theme articles regenerated
  from the Phase 3a audit results. Synthesis ran as 38
  parallel sub-agents, each instructed to apply this
  review's corrections: keep audit-verified TRUE claims,
  replace STALE/FALSE values with the audited current
  values, and confine phantom/resolved narratives to a
  History section.
- **Recovery note**: the `dewey` article's agent failed
  silently (empty result, no file); the article was written
  directly from the learning set plus session-verified
  mechanics (reload/reIngestLearnings, deletion path,
  store_compiled format, promote gotcha).
- **Output**: 38 articles stored via `dewey store_compiled`
  (tier: draft, compiled_by: rits/zai-org/glm-5-3, full
  source-identity lists) at `.uf/dewey/compiled/`, plus a
  regenerated `_index.md`. Largest article: `review-dispatch`
  (97 sources). The `sandbox-8` decision is folded into the
  `sandbox` article per Phase 3c.

## Phase 5 — Corrections and Deletions

Applied under the user-approved policy: correct at article
level via temporal supersession in the recompile; delete only
never-true or actively misleading learnings.

### Deletions (10 learnings, user-confirmed)

Learning pages are store-backed and read-only to the MCP
delete tool, so deletion required removing the markdown file
(`git rm`) and the store row (SQLite `DELETE FROM pages`,
cascading blocks/links/embeddings). Learning rows went from
649 to 639, matching the 639 files on disk.

| Learning | Reason |
|----------|--------|
| `documentation-gate-20261014T220253` | never true (constitution gate applies to all user-facing changes, no docs-only exemption) |
| `opsxrouter-pattern-codification-...-20261019T212024` | actively misleading (pattern superseded by `plan_review_dispatch` route) |
| `review-council-20260811T174015` | never true (5 verdict values from first implementation) |
| `review-dispatch-20261012T235630` | superseded/misleading (correlation model replaced by issue #794) |
| `review-dispatch-20261015T234424` | never true (session metadata mechanism) |
| `review-dispatch-20261019T161123` | never true (workflow contract) |
| `review-dispatch-20261019T182401` | never true |
| `review-dispatch-20261020T165720` | never true |
| `spec-review-20261008T223721` | never true (spec artifacts are always committed by /opsx-propose) |
| `uf-unleash-20260814T174736` | never true (branch gate rejects ON_MAIN) |

### In-place learning corrections (4)

- `content-pipeline-20261017T232053` — phantom FA-006
  citation removed (the content pack holds FA-001..004 only).
- `spec-review-20261022T205113` — wrong mechanism corrected:
  the `.gitignore` claim replaced with the actual `@`-path
  glob quirk.
- `content-pipeline-20261022T192850` — dangling reference to
  a nonexistent learning removed.
- `spec-authoring-20261017T222148` — dangling `spec-writing-1`
  reference removed.

One additional minor correction was identified but skipped as
not worth the churn: `review-dispatch-20261019T214832` carries
a single never-true survey sentence; the regenerated
`review-dispatch` article supersedes it.

### Article-level corrections

All STALE/FALSE findings from Phase 3a are folded into the
regenerated articles (current-state sections carry the audited
values; phantom narratives such as the never-merged
`ollamaproxy-1` branch are confined to History sections with
citation warnings). The sweep's deduplication guidance was
applied by cluster mapping: superseded duplicates (e.g. the
pre-#794 correlation family) appear in articles only as
history.

## Phase 6 — Promotion

Executed 2026-10-25 with explicit user approval ("Yes, promote
all").

- **39 promotions**: all 38 compiled articles
  (`dewey promote compiled/<tag>`) plus `learning/sandbox-8`,
  which closes the one stale_decision lint finding.
- **Frontmatter sync in the same change**: promote updates
  graph.db but not the durable markdown, so all 38 article files
  were edited `tier: draft` -> `tier: validated` (mechanical
  in-place rewrite) and `_index.md` prose updated to record the
  promotion. This follows the repo's own promote-does-not-
  rewrite-markdown learning (dewey-20261014T120918).
- **Post-promotion lint**: uncompiled_learnings 0,
  stale_decisions 0, contradictions 0, embedding_gaps 0. The 109
  remaining sanitization findings are all on external web/github
  source pages (untrusted tier, pre-existing) and are out of
  scope for this change.
