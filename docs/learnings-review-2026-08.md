# Dewey Learnings Review -- August 2026

Cross-repo analysis of 131 learnings across 6 repositories
in the unbound-force organization. All learnings were `tier:
draft` at time of review; none had been promoted or compiled.

**Repos surveyed**: dewey (22), gaze (26), gaze-py (4),
replicator (12), unbound-force (55), website (12)

**Authors**: jay-flowers (56), yvonne-devlin (25),
matt-peter (4), gustavo-miranda (2), anonymous (3)

**Categories**: pattern (65), gotcha (60), decision (3),
context (2), reference (1)

---

## Cross-Cutting Themes

Seven themes recur across multiple repositories and
multiple authors. Each represents a systemic pattern or
risk that warrants convention-pack rules, tooling, or
architectural guardrails.

### T1. Blast Radius Scope Audits

**Repos**: dewey, gaze, replicator, unbound-force

When a learning says "issue reported N call sites, actual
count was 2N," that is the blast radius problem. Changing
a format, type, or interface signature silently breaks
consumers that grep alone does not reveal.

**Examples**:
- `identity-format-change-1` (dewey): new identity format
  broke `extractTagFromIdentity` in `tools/compile.go`;
  old parser assumed last-hyphen/numeric, new format was
  `{tag}-{timestamp}-{author}`.
- `038-crap-subdir-coverage` (gaze): issue said 5
  `os.Getwd()` sites, thorough scan found 10.
- `ci-gate-integrity` (gaze): `int` to `*int` change
  touched `crapStepResult`, `ReportSummary`,
  `compactSummary`, `ThresholdResult.Actual`, plus 5
  test files. Council caught `compact.go` omission
  before implementation.
- `auth-1` (unbound-force): all 5 reviewers flagged that
  `TokenManager` extraction missed `BedrockProvider`
  caller; spec only mentioned Vertex.

**Proposed convention**: Every spec involving a type,
format, or interface change MUST include a "Blast Radius"
section listing all consumers found via exhaustive search.
Reviewers MUST verify the list is complete.

### T2. Review Council Value

**Repos**: dewey, gaze, gaze-py, replicator, unbound-force

Multi-agent review consistently catches issues that single
reviewers miss. The pattern: 5 agents find distinct
classes of problems, and parallel execution costs the same
wall-clock time as one agent.

**Examples**:
- `review-council` (dewey): Adversary found security gaps,
  Architect found DRY violations, Tester found TOCTOU
  race conditions (`O_CREATE|O_EXCL`), SRE found ops
  concerns, Curator found doc sync gaps.
- `remote-llm-provider` (dewey): spec review caught 6
  HIGH-severity issues before any code was written
  (credential logging, response body limits, error
  paths).
- `ci-gate-integrity` (gaze): 4/5 reviewers independently
  flagged `ThresholdResult.Actual` needing `*int` (nil =
  unavailable vs 0 = computed).
- `review-council` (replicator): spec review found thread
  safety issues with shared session state that would have
  caused `-race` CI failures.

**Proposed convention**: Already established. Learning here
is that spec reviews (pre-implementation) catch different
and often more valuable issues than code reviews
(post-implementation). Spec review should be mandatory for
all non-trivial changes, not just code review.

### T3. Scaffold Dual-Copy Synchronization

**Repos**: gaze, unbound-force

Files scaffolded by `uf init` exist in two locations:
the active copy (`.opencode/commands/`, `.opencode/agents/`,
`.opencode/skills/`) and the canonical embed.FS copy
(`internal/scaffold/assets/...`). These must be
byte-identical. `TestEmbeddedAssets_MatchSource` catches
drift at build time.

**Examples**:
- `scaffold-rename` (gaze): embed.FS rename auto-propagates
  but hardcoded Cobra `Long` description path string was
  missed by grep.
- `scaffold-testing` (unbound-force): adding
  `.opencode/skills` to `canonicalDirs` walked all skills
  including non-scaffolded ones (openspec-*, replicator-
  scaffolded). Required `knownNonEmbeddedFiles` list and
  hidden-file skip for `.DS_Store`.
- `pre-flight-skill` (unbound-force): scaffold sync
  extends to skill files themselves plus
  `expectedAssetPaths`.

**Proposed convention**: Any PR that touches a scaffolded
file MUST update both copies and run
`go test -run TestEmbeddedAssets_MatchSource ./internal/scaffold/`.
Hardcoded file counts in `main_test.go` must be bumped.

### T4. CRAPload and testing.Short() Guards

**Repos**: gaze (9 learnings by yvonne-devlin)

`gaze crap` runs `go test -short -coverprofile` internally.
Functions guarded by `testing.Short()` contribute zero
coverage to CRAPload calculations. Removing unnecessary
`Short()` guards is the highest-ROI fix -- no code changes
to the function under test, just deleting guard lines.

**Examples**:
- `ResolvePackagePaths`: CRAP 81.6 to 10.1 by removing
  `Short()` guard. Package resolution runs sub-second and
  does not warrant the guard.
- `packages.Load`: required DI so tests use synthetic data
  without `-short` (CRAPload 38 to 32).
- `BuildContractCoverageFunc`: decomposition reduced
  complexity 22 to 7. When adding DI to orchestrators,
  inject ALL data-producing internal helpers, not just
  cross-package ones.

**Proposed convention**: `testing.Short()` MUST only guard
tests that take > 2 seconds or require external resources
(network, database, container). Sub-second tests MUST NOT
use `Short()` guards because they suppress CRAPload
coverage.

### T5. Dependency Injection for Testability

**Repos**: dewey, gaze, replicator, unbound-force

The consistent pattern: functions that call `os.Getwd()`,
`runtime.GOOS`, or make network requests are hard to test
without DI. The learning is to choose the right DI weight.

**Injection patterns (lightest to heaviest)**:
1. **Injectable function parameter**: `resolveAuthor(gitResolver func() string)` -- one call site, one behavior.
2. **Options struct field**: `Options.ResolveRelease` -- optional behavior with nil-means-default.
3. **Deps struct**: `deps{aiMapperFn, buildCoverageFn}` -- multiple behaviors, avoids variadic conflicts.
4. **Full interface**: `TokenRefresher` -- multiple methods, multiple implementations.

**Examples**:
- `testing-patterns-1` (dewey): injectable function param
  as lightweight alternative to interface.
- `doctor-1` (unbound-force): injectable `GOOS` string
  because `runtime.GOOS` is a compile-time constant.
- `crapload-buildcontract` (gaze): needed 4th DI field
  `buildCoverageMapFn` because all data-producing helpers
  must be injectable, not just cross-package ones.
- `mcpclient-architecture` (replicator): `Config` struct
  DI, lazy session init, `sync.Mutex` session state.

**Proposed convention**: When a function is untestable
due to external dependencies, prefer the lightest DI
mechanism that works. Document the choice in the spec.

### T6. Security Checklists

**Repos**: dewey, replicator, unbound-force

The Adversary reviewer consistently catches security
concerns that other agents miss. These form a reusable
checklist for any feature involving external I/O, user
input, or credential handling.

**Recurring checklist items**:
- SSRF: loopback-only validation for proxy endpoints.
- Token redaction: `maskKey()` showing last 4 chars; never
  log full credentials.
- Input validation: model names against `[a-zA-Z0-9._-]+`
  to prevent path traversal and trailer injection.
- Body size limits: `io.LimitReader(10MB)` for HTTP
  responses.
- File permissions: log files `0o600`, temp files
  `O_CREATE|O_EXCL` (TOCTOU prevention).
- Shell injection: env var bindings (`env:`) not `${{ }}`
  interpolation in CI workflows.
- Image pulls: probe containers should use minimal images
  (`busybox:latest`), not dev images that may execute
  entrypoints or read sensitive files.

**Proposed convention**: New features involving network,
credentials, or file I/O MUST include a Security section
in the spec addressing the above checklist.

### T7. Fail-Fast Over Silent Defaults

**Repos**: dewey, gaze, unbound-force

When something goes wrong, explicit errors are better than
silent fallbacks that mask the root cause.

**Examples**:
- `gateway` (unbound-force): global region incompatible
  with `rawPredict` Claude endpoints must error
  explicitly, not silently fall back to `us-east5`.
- `gateway` (unbound-force): failed background token
  refresh must CLEAR the stale token atomically, not keep
  forwarding expired credentials.
- `ci-gate-integrity` (gaze): "no data" silently reported
  as "pass" -- fixed by using `*int` throughout the
  pipeline so nil = unavailable vs 0 = computed.
- `content-sanitizer` (dewey): `vault.ParseDocument()`
  frontmatter properties silently overwrite during
  indexing -- must merge-after-parse.

**Proposed convention**: Functions MUST NOT silently
swallow errors or substitute defaults when the caller
expects accurate data. Use pointer types (`*int`,
`*float64`) to distinguish "not available" from "zero."

---

## Per-Repo Findings

### dewey (22 learnings)

Key themes: content sanitizer pipeline reliability,
release pipeline cross-repo bugs, remote LLM provider
design, review council effectiveness.

**Notable issues**:
- Release pipeline: awk checksum-patching script is
  COPIED across dewey/unbound-force/gaze/replicator
  with the SAME latent bug (assumes `url` appears before
  `sha256` in Homebrew cask). Fix must propagate to all
  4 repos.
- Content sanitizer: extending the 4-tier trust system
  to 5 tiers (adding `untrusted`) required tracing every
  consumer -- schemas, store comments, promotion rules,
  compile filters, documentation.
- Remote LLM provider: constitutional tension between
  "no data leaves machine" and synthesis feature resolved
  as opt-in enhancement vs core embedding (which stays
  local).
- Source type template: adding a new source type
  consistently requires updates to
  `DetermineSanitizeMode()`, `context.Context` threading,
  and `SemanticSearchFilteredInput` schema. This should
  be a checklist or template.

### gaze (26 learnings)

Key themes: CRAPload optimization (9 learnings),
scaffold synchronization, CI gate integrity, local
variable false positives.

**Notable issues**:
- CRAPload dominates: most learnings are about reducing
  CRAPload scores via `Short()` guard removal, DI
  injection, and function decomposition. AST-core
  functions retain 60-70% of original complexity even
  after extraction -- this is structural.
- Cross-repo workflow: `gaze-test-generator` fix was
  applied in the WRONG repo (unbound-force issue #404).
  Canonical source is
  `gaze/internal/scaffold/assets/agents/gaze-test-generator.md`.
  Cross-repo `Fixes:` closes issues in the wrong repo.
- Dedup: `loadTestPackage` existed in both `goprovider`
  and `aireport` with subtle differences -- `goprovider`
  had `pkg.Errors` validation, `aireport` lacked it
  (latent bug). Consolidated to `goprovider.LoadTestPackage`.
- `[P]` marker ambiguity: council flagged "or delete"
  phrasing in specs as ambiguous (4/5). Specs must be
  definitive.

### gaze-py (4 learnings)

Key themes: porting contracts from Go reference
implementation, nullable semantics.

**Notable issues**:
- "No test coverage" means `gaze_crap=null`, NOT `0.0`.
  Go reference: `contract.go:148` -- "no test = no
  coverage data, not 0%." `'measured as zero' != 'not measured'`.
- BFS graph lookup must use `graph.get(fqn, set())` not
  `graph[fqn]` -- `KeyError` silently aborts BFS.
- Return type changes (`list` to frozen dataclass) break
  integration tests. Verify porting contracts against Go
  reference.

### replicator (12 learnings)

Key themes: CI coverage ratchets, MCP transport protocol,
shared client architecture, release pipeline.

**Notable issues**:
- `internal/tools/*` packages at 0% coverage (thin MCP
  wrappers). Excluded from per-package ratchets; global
  floor set to 55% (actual 58.4%).
- MCP Streamable HTTP requires POST JSON-RPC -- plain
  GET returns 400/405. Full handshake: `protocolVersion
  2025-03-26`, `Mcp-Session-Id` header capture, dual
  JSON/SSE response parsing.
- `mcpclient` package shared by `memory.Client` and
  `doctor.deweyHealthProbe()` -- reduced doctor from
  70 to 7 lines via DRY.
- Coverage ratchet gotchas: renamed package reports 0.0%
  (confusing failure); `bc` empty-string produces silent
  pass. Both need guards.

### unbound-force (55 learnings)

Key themes: scaffold dual-copy (8), gateway token
management (5), sandbox/DevPod integration (12),
setup step ordering (4), workflow/process patterns (10+).

**Notable issues**:
- Sandbox is the most learning-dense feature (12
  learnings). DevPod quirks: `--ide` flag irrelevant
  for OpenCode, `devcontainer.json` snapshotted at
  creation, DevPod v0.6.x Bun tunnel crash requires
  status-based suppression, `--workspace-env` not
  `--dotfiles-env` for env injection.
- Gateway token lifecycle: failed refresh must atomically
  clear stale token; proactive refresh uses
  `sync.Mutex.TryLock()` with 5s timeout via
  goroutine+channel; `time.Time` zero-value is in the
  past (breaks 8 struct literals when adding expiry
  fields).
- Setup step labels: `[N/M]` hardcoded as string
  literals. Adding 3 steps requires updating 13 labels
  plus tests. `buildSteps()` ordering must install
  dependencies first (issue #455: Gaze installed before
  `gh` -- reordered, locked by
  `TestBuildSteps_GHBeforeGaze`).
- `fmt.Fscanln` is BROKEN for terminal prompts on
  macOS/iTerm2 (blocks on bare CR `0x0D`). Use
  `bufio.NewScanner` + `Scan()` + `Text()`.

### website (12 learnings)

Key themes: wrong constitution applied (recurring
CRITICAL), verify-against-source accuracy, Hugo
conventions.

**Notable issues**:
- EVERY website change initially assessed against the
  org constitution instead of the website-specific
  `.specify/memory/constitution.md`. Root cause: OpenSpec
  `config.yaml` context block references org constitution.
  Fixed by 3rd change but wasted 2 review cycles.
- Content accuracy: `ANTHROPIC_API_KEY` not
  `ANTHROPIC_AUTH_TOKEN`; `gateway` not `gateway-proxy`;
  config precedence order was inverted in initial
  proposal. Bedrock credentials via
  `aws configure export-credentials` not env-var reads.
- Batch throughput: 19 issues + 12 PRs in single session.
  Skip full council for blog posts after pattern validated
  3+ times.

---

## Proposed Issues

### I1. Shared Release Pipeline (cross-repo)

**Type**: feature / enhancement
**Severity**: HIGH

The awk checksum-patching script for Homebrew cask is
copied across 4 repos (dewey, gaze, replicator,
unbound-force) with the same latent bug: it assumes `url`
appears before `sha256`. The `council-review-action`
composite action is precedent for cross-repo reuse.

**Action**: Extract release pipeline steps into a shared
GitHub Action or reusable workflow. Fix the
order-agnostic awk parsing in one place.

### I2. Source Type Addition Template (dewey)

**Type**: enhancement
**Severity**: MEDIUM

Adding a new source type (e.g., olostep) consistently
requires the same 3 updates: `DetermineSanitizeMode()`
switch, `context.Context` threading, and schema
description. This should be documented as a template
or enforced by a test that verifies all source types
appear in all required locations.

### I3. CRAPload Short-Guard Rule (gaze)

**Type**: enhancement
**Severity**: MEDIUM

9 learnings document the same root cause: `testing.Short()`
guards suppress CRAPload coverage. Gaze could detect and
warn when a `Short()` guard is applied to a test that
completes in < 2 seconds, or when removing a guard would
significantly reduce CRAPload score.

### I4. Website Constitution Config Fix

**Type**: bug
**Severity**: HIGH

OpenSpec `config.yaml` in the website repo references the
org constitution instead of the website-specific one.
This caused incorrect review assessments on at least 2
changes before being caught.

### I5. Dewey Learning Pipeline Health

**Type**: enhancement
**Severity**: MEDIUM

131 learnings are all `tier: draft`. Zero have been
promoted or compiled. The compile pipeline requires
manual synthesis (auto-synthesis config points at
placeholder GCP project). The central Dewey store has
only 58 learning pages vs 131 on disk -- learnings are
not being indexed.

**Action**: Fix indexing configuration to include
`.uf/dewey/learnings/` paths. Configure compile model
for auto-synthesis. Establish a promotion cadence.

### I6. Cross-Repo Fix Propagation

**Type**: process / enhancement
**Severity**: MEDIUM

Multiple learnings note that a fix applied in one repo
was not propagated to sibling repos with the same code.
The release pipeline awk bug (I1) and the
`gaze-test-generator` wrong-repo fix are examples.

**Action**: When a learning identifies a cross-repo
pattern, file issues in ALL affected repos, not just
the one where the fix was developed.

### I7. Convention Pack Integration

**Type**: enhancement
**Severity**: MEDIUM

Five patterns from learnings should be codified in
convention packs:
1. `testing.Short()` usage rule (T4)
2. DI pattern selection guide (T5)
3. `bufio.Scanner` over `fmt.Fscanln` for terminal I/O
4. Security checklist for network/credential features (T6)
5. Blast radius scope-audit section in specs (T1)

---

## Metrics

| Metric | Value |
|---|---|
| Total learnings reviewed | 131 |
| Repos with learnings | 6 |
| Unique tags | 47 |
| Learnings promoted | 0 |
| Learnings compiled | 0 |
| Cross-repo patterns found | 7 |
| Proposed issues | 7 |

---

*Generated: 2026-08-14. Source: `.uf/dewey/learnings/`
across all unbound-force repositories.*
