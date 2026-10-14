## Context

Issue #657 asks for a review-voice convention pack so the prose
style of review output (sentence style, framing, tone) is
customizable per project without editing tool-owned command
files that `uf init` overwrites on upgrade.

The command architecture changed substantially since the issue
was filed (Oct 7-9 dispatch-tooling rewrite). All four review
commands now dispatch child agents through
`dispatch_review_runs` → `buildReviewPrompts`
(`.opencode/plugins/review-dispatch/index.ts:3733`), which
embeds **every** `.md` file from `.opencode/uf/packs/` into
each child prompt. Child agents write the finding descriptions
and root causes; parent commands compose the summaries,
verdicts, and GitHub-posted bodies. The original issue's "Step
4.5 between subagent return and Step 5" no longer exists — in
`uf.review-pr.md` the posting logic is now Step 8b (line ~710)
through 8d.

The pack system already supports the required override
semantics (`go.md`/`go-custom.md` pattern) and the scaffold
engine already has the registration points for a new
always-deployed pack (`ci` pack is the most recent precedent).

## Goals / Non-Goals

### Goals

- Ship `review-voice.md` (tool-owned neutral defaults) and
  `review-voice-custom.md` (user-owned overrides) under
  `.opencode/uf/packs/`, scaffolded by `uf init` for all
  projects.
- Apply voice rules to **GitHub-posted prose only**:
  - `uf.review-pr.md` Step 8b (inline comments) and 8d (review
    body)
  - `uf.review-council.md` Step 7d (review body), 7e (inline
    comments), 7g (post)
  - `uf.triage-issue.md` Phase 4.3 (comment body)
  - `uf.address-feedback.md` Phase 4.5 (reply comments)
- Deliver voice rules to child agents through the existing
  pack-embedding glob (zero plugin code changes).
- Guarantee style-only behavior with an explicit precedence
  clause that protects all gates and structural output
  requirements.

### Non-Goals

- Styling terminal reports (Step 6 outputs stay fixed format) —
  decided during planning; GitHub-posted prose only.
- `speckit.testreview.md` integration.
- Any change to `.opencode/plugins/review-dispatch/index.ts`.
- Fixing the pre-existing AGENTS.md omission of
  `ci`/`ci-custom` (separate issue).
- Altering severity definitions, verdict mappings, required
  footers, tone-tier content requirements, reply-template
  required elements, top-15 selection, suggestion-block
  format, or body size limits.

## Decisions

### D1: Zero plugin change for child delivery

`buildReviewPrompts` already embeds all packs into every child
prompt in every mode (code, triage, feedback). The pack
self-describes its applicability ("governs prose style of
finding descriptions and root causes") so children apply it
without any plugin awareness.

**Rationale**: This is exactly the Composability First
extension-point model from the proposal's constitution
alignment — convention packs are the sanctioned integration
surface; no hero patching. A dedicated plugin section would add
TypeScript code and tests for no functional gain.

**Trade-off**: The pack also flows to children in modes where
it is redundant (e.g., triage classification children).
Accepted: `content.md` already flows everywhere the same way,
and self-describing applicability bounds the effect to review
prose.

### D2: Parent commands load at point of use, GitHub-posted steps only

Each command reads `review-voice.md` + `review-voice-custom.md`
immediately before composing GitHub-bound prose:

- `uf.review-pr.md` Step 8b — applies to 8b inline comments and
  the 8d review body (same load; 8c is mechanical mapping).
- `uf.review-council.md` Step 7d — applies through 7e and 7g.
- `uf.triage-issue.md` Phase 4.3 — comment composition.
- `uf.address-feedback.md` Phase 4.5 — reply composition (packs
  already loaded by the Phase 2.1 `*.md` glob; 4.5 only adds
  the apply directive).

**Rationale**: Keeps voice scoped to posted prose per the
planning decision, avoids touching review-pr Step 3.9 (whose
`content.md` exclusion precedent stays intact), and avoids
loading packs for phases that never use them.
Load-at-point-of-use also keeps each command edit local and
reviewable.

### D3: Pack structure follows the non-coding pack pattern

Frontmatter (`pack_id: review-voice`, `language: Any`,
`version: 1.0.0`), scaffold marker,
`# Convention Pack: Review Voice` title, and RV-NNN rules
(RFC 2119) in sections: Applicability, Style-Only Precedence,
Neutral Voice Defaults. The custom stub uses CR-NNN rules and
the standard sentinel comment, matching
`content-custom.md`/`ci-custom.md`.

### D4: Pack validator exemption

`TestValidateConventionPack_AllPacksValid`
(`internal/schemas/packvalidator_test.go`) validates coding
packs against a 6-section requirement and skips non-coding
packs (`severity.md`, `content.md`, `ci.md`). `review-voice.md`
joins the skip list with the same justification: it is a voice
convention pack with RV-NNN sections, not a coding pack.

### D5: Scaffold registration mirrors the ci-pack precedent

- `alwaysDeployedPacks` (`scaffold.go:755`): add
  `review-voice: true`, `review-voice-custom: true`
  (language-agnostic, always deployed).
- `collectDeployedPacks` (`scaffold.go:1691`): add both files
  to the candidates list so generated AGENTS.md lists them
  (always-deployed candidates grow from 7 to 9).
- Mirror `review-voice.md` byte-identically into
  `internal/scaffold/assets/opencode/uf/packs/`; seed the
  embedded `review-voice-custom.md` as the initial deployment
  template (see D7).
- `expectedAssetPaths` (`scaffold_test.go:704`): 13 → 15
  entries.
- `isToolOwned` / `-custom` survivor semantics and DivisorOnly
  deployment come free from existing logic (`isConventionPack`,
  basename `-custom` check, `isDivisorAsset`).
- Empty-stub filtering (`filterEmptyCustomPacks`) applies to
  `review-voice-custom.md` exactly as it does to other custom
  packs.

### D6: Style-only precedence clause is normative pack content

The pack itself carries a MUST NOT clause: voice rules never
alter severities, verdicts, finding counts, required footers,
tone-tier content requirements (triage), reply-template
required elements, top-15 selection, suggestion-block format,
or body size limits. Where a voice rule conflicts with a
structural requirement, the structural requirement prevails.

**Rationale**: This satisfies the constitution's Gatekeeping
Integrity rule (agents must not weaken gates) at the artifact
level — the pack is the artifact future agents will read, so
the protection travels with it.

### D7: Custom packs are exempt from drift comparison

`TestEmbeddedAssets_MatchSource` (`scaffold_test.go:93`)
byte-compares every embedded asset against its canonical
source. Custom packs (`*-custom.md`) are user-owned by design:
`uf init` deploys the embedded copy only on first run and
never overwrites the canonical copy thereafter. Byte-parity
checking contradicts that ownership model — it pins this
repository's canonical custom packs to their embedded
templates, preventing the repository from making use of its
own custom packs.

The test MUST skip `opencode/uf/packs/*-custom.md` assets,
following the established skip pattern (`devcontainer/`,
`specify/`, `uf/sibling-repos.yaml`) with a justification
comment. Embedded custom packs remain in the asset tree and
pinned in `expectedAssetPaths` — they are the initial
deployment templates seeded onto user machines.

**Rationale**: Aligns the drift test with the existing
`isToolOwned` semantics (false for `-custom` basenames).

**Trade-off**: Embedded custom templates are no longer
drift-checked (an accidental edit ships undetected). Accepted:
they are seeded from the canonical stub at creation, change
rarely, and their existence remains pinned by
`expectedAssetPaths`.

## Risks / Trade-offs

- **Redundant child context**: the pack embeds in all dispatch
  modes (accepted, see D1; bounded — two additional pack files
  alongside the existing 13).
- **Compliance-only precedence enforcement**: the FR-031
  precedence clause is enforced by agent compliance, not an
  automated test. Mitigated: the protected structural elements
  (severity labels, verdict values, finding counts, footers,
  top-15 selection) are computed mechanically by dispatch and
  command tooling, not authored as free prose; all convention
  packs share this enforcement model.
- **Pre-existing inconsistency preserved**: `content.md` flows
  to children even though review-pr Step 3.9 excludes it
  parent-side. This change neither fixes nor worsens that;
  noted for a future change.
- **Voice vs. tone-tier interaction (triage)**: the Phase 4.3
  tone tiers (VALID=factual, INVALID/OPINION=warm
  non-dismissive, NEEDS-CLARIFICATION=specific questions) are
  content requirements. The precedence clause (D6) explicitly
  subordinates voice to them, so voice styles the sentences
  within the mandated tone, never replaces it.
- **Perceived incompleteness**: users may expect terminal
  reports to be voiced too. Documented as a non-goal; a
  follow-up change can extend application points without
  schema changes.
- **Drift exemption for customs**: embedded `*-custom.md`
  templates are not byte-compared (see D7 trade-off).
- **Validator drift**: if the skip list (D4) is forgotten, the
  new pack fails `TestValidateConventionPack_AllPacksValid`;
  covered by tasks and CI parity (`make test`).
