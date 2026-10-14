## Why

Issue #657: the four review commands (`/uf.review-pr`,
`/uf.review-council`, `/uf.triage-issue`,
`/uf.address-feedback`) produce findings, verdict
justifications, and GitHub comment bodies in a fixed prose
style. There is no mechanism to customize review voice —
sentence style, framing, tone — through convention packs.
Users who edit the scaffolded command files directly to
change voice lose their edits on the next `uf init`
upgrade because those files are tool-owned.

The convention-pack system already solves this exact
problem for coding standards (`go.md`/`go-custom.md`),
writing standards (`content.md`/`content-custom.md`), and
CI conventions (`ci.md`/`ci-custom.md`). Review voice is
the remaining uncustomizable dimension of review output.

## What Changes

Ship a `review-voice` convention pack pair and apply it to
the GitHub-posted prose of all four review commands:

1. **New pack pair** — `.opencode/uf/packs/review-voice.md`
   (tool-owned defaults: neutral tone, problem-first
   framing, active voice) and
   `.opencode/uf/packs/review-voice-custom.md` (user-owned
   override stub), scaffolded by `uf init` following the
   established pack pattern.
2. **Scaffold integration** — register the pair in
   `internal/scaffold/scaffold.go` (`alwaysDeployedPacks`,
   `collectDeployedPacks`). Mirror `review-voice.md` into
   `internal/scaffold/assets/opencode/uf/packs/`
   (drift-pinned) and seed the embedded
   `review-voice-custom.md` as the initial deployment
   template; custom packs are exempt from drift comparison
   so the repo's own custom packs may diverge from their
   embedded templates.
3. **Command integration** — each command loads the voice
   packs at its GitHub-posting step and applies them to
   posted prose only:
   - `uf.review-pr.md` Step 8b (inline comments + 8d
     review body)
   - `uf.review-council.md` Step 7d (review body, 7e
     inline comments, 7g post)
   - `uf.triage-issue.md` Phase 4.3 (triage comment body)
   - `uf.address-feedback.md` Phase 4.5 (reply comments)
4. **Style-only precedence** — the pack carries an explicit
   MUST NOT clause: voice rules never alter severities,
   verdicts, finding counts, required footers, tone-tier
   content requirements, reply-template required elements,
   top-15 selection, suggestion-block format, or body size
   limits. Terminal reports keep their fixed format.

Child agent delivery requires zero plugin changes:
`buildReviewPrompts` in
`.opencode/plugins/review-dispatch/index.ts` already
embeds every pack from `.opencode/uf/packs/` into each
child prompt, so the pack self-describes its applicability
to finding/root-cause prose and flows automatically to
all dispatched reviewers.

## Capabilities

### New Capabilities

- `review-voice`: Convention pack governing the prose
  style (sentence style, framing, tone) of review output —
  finding descriptions, root causes, verdict
  justifications, and GitHub comment/reply bodies — with
  per-project customization via `review-voice-custom.md`
  that survives `uf init` upgrades.

### Modified Capabilities

- `scaffold`: `uf init` deploys the review-voice pack pair
  (always-deployed, language-agnostic) and lists it in
  the generated AGENTS.md convention-pack section. Custom
  packs are excluded from embedded-asset drift comparison
  (user-owned by design; embedded copies are initial
  deployment templates).
- `review-dispatch`: Child prompts gain review-voice rules
  through the existing pack-embedding glob (no code
  change; behavior extends).
- `uf.review-pr`, `uf.review-council`, `uf.triage-issue`,
  `uf.address-feedback`: GitHub-posted prose now respects
  review-voice rules; terminal output, structural
  elements, and gates are unchanged.

### Removed Capabilities

- None.

## Impact

- **Files added**: `.opencode/uf/packs/review-voice.md`
  and `.opencode/uf/packs/review-voice-custom.md`, plus
  their embedded copies under
  `internal/scaffold/assets/opencode/uf/packs/` (the
  tool-owned pack is drift-mirrored; the custom stub is
  the initial deployment template).
- **Files modified**:
  - `internal/scaffold/scaffold.go` (pack registration)
  - `internal/scaffold/scaffold_test.go`
    (`expectedAssetPaths` 13 → 15,
    `TestCollectDeployedPacks_*` 7 → 9,
    `TestEmbeddedAssets_MatchSource` custom-pack skip)
  - `internal/schemas/packvalidator_test.go` (skip list)
  - 4 command files under `.opencode/commands/` and their
    byte-identical mirrors under
    `internal/scaffold/assets/opencode/commands/`
  - `AGENTS.md` (pack list; drift-detection convention
    wording per FR-023), `CHANGELOG.md`
  - `README.md`, `QUICKSTART.md`, `docs/usage.md`,
    `docs/architecture.md` (scaffold-inventory counts)
- **No behavior change** for projects that do not
  customize the pack: the default `review-voice.md`
  codifies the neutral style the commands already aim
  for.
- **No gate changes**: severity definitions, verdict
  mappings, review limits, and footers are untouched
  (style-only precedence clause).
- **Out of scope**: `speckit.testreview.md`, terminal
  report styling, and the pre-existing `ci`/`ci-custom`
  pack-listing omission in AGENTS.md and the docs pages
  (separate issue).

## Constitution Alignment

Assessed against the Unbound Force org constitution
(v1.3.1).

### I. Autonomous Collaboration

**Assessment**: PASS

The voice pack is a self-describing artifact consumed
asynchronously by commands and dispatched agents. No
runtime coupling is introduced: commands read the pack at
their posting step; children receive it embedded in
prompts by the existing dispatch pipeline. The pack
carries its own metadata (`pack_id`, `version`) and does
not require any hero to block on another.

### II. Composability First

**Assessment**: PASS

Convention packs are a first-class extension point in the
constitution ("Heroes MUST expose well-defined extension
points (configuration, artifact consumption, convention
packs)"). This change uses that exact mechanism rather
than modifying hero internals — the review-dispatch
plugin requires zero code changes. Projects that never
touch `review-voice-custom.md` keep current behavior;
projects that do get additive value with no mandatory
dependency.

### III. Observable Quality

**Assessment**: PASS

Posted review artifacts keep their machine-parseable
structure (severity labels, verdict values, tables,
footers) — the pack is scoped to prose within those
structures by an explicit precedence clause. The pack
itself is versioned (frontmatter `version: 1.0.0`) and
scaffolded with provenance markers. Drift tests verify
embedded tool-owned assets match canonical sources;
custom packs are exempt because they are user-owned and
the embedded copies are initial deployment templates.

### IV. Testability

**Assessment**: PASS

All changes are verifiable in isolation with existing
test infrastructure: `internal/scaffold/scaffold_test.go`
drift and deployment tests (`expectedAssetPaths`,
`collectDeployedPacks`, the custom-pack drift exemption)
run without network or external services; plugin tests
already cover pack embedding generically. No new external
dependencies. Coverage strategy: extend existing scaffold
tests; the coverage gate applies unchanged.

### V. Security by Default

**Assessment**: N/A

No new dependencies, no input handling changes, no
privilege or CI changes. The pack is static Markdown
content embedded via the existing `embed.FS` asset
pipeline, which is already covered by existing
supply-chain controls.

### Development Workflow — Cross-Repo Documentation

**Assessment**: PASS

This is a user-facing change (a new always-deployed pack
pair; changed GitHub-posted prose of all four review
commands). Task 6.3 files the required documentation
issue in `unbound-force/website` before PR merge. Two
documentation gates apply (constitution: website repo;
repo AGENTS.md: current repo); the constitution target
is selected as the sole documentation issue —
human-authorized during the review-voice-pack spec
review and recorded in the change artifacts so the
reconciliation travels with the change.
