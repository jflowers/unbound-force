---
tier: validated
compiled_at: 2026-10-25T16:31:27Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - cross-command-consistency-20260623T195632-jay-flowers
  - stale-command-refs-20260929T214200-jay-flowers
  - documentation-pipeline-20261019T022450-jay-flowers
  - documentation-pipeline-20261019T022454-jay-flowers
  - documentation-pipeline-20261019T125054-jay-flowers
  - documentation-pipeline-20261019T182348-jay-flowers
  - documentation-pipeline-20261019T192216-jay-flowers
  - documentation-pipeline-20261019T192222-jay-flowers
  - documentation-pipeline-20261019T202640-jay-flowers
  - documentation-pipeline-20261019T204946-jay-flowers
  - documentation-pipeline-20261019T211515-jay-flowers
  - opsxrouter-pattern-codification-2026-10-19-documentation-pipeline-20261019T212032-jay-flowers
  - documentation-pipeline-20261020T000306-jay-flowers
  - documentation-pipeline-20261020T000308-jay-flowers
  - documentation-pipeline-20261020T001112-jay-flowers
  - documentation-pipeline-20261020T125028-jay-flowers
  - documentation-pipeline-20261020T125030-jay-flowers
  - documentation-pipeline-20261020T125033-jay-flowers
  - documentation-pipeline-20261020T161829-jay-flowers
  - documentation-pipeline-20261020T172443-jay-flowers
  - documentation-pipeline-20261020T195900-jay-flowers
  - documentation-pipeline-20261023T145641-jay-flowers
topic: documentation-pipeline
---

# Documentation Pipeline

## Current State (October 2026)

### Claim-level verification

The verification unit for a false-claim correction is the claim,
not the section. Grep the claim's signature text and paraphrases
(field names like `runs_completed`, not just tool names) across
all command files, scaffold mirrors, docs/, and AGENTS.md. False
tool-output claims live at two sites per command: the call-site
description ("The tool returns <fields>...") and the consumption
site ("use the <field> from..."); a sibling scope from one site
misses the other. After editing, re-grep at head SHA and require
zero surviving hits before writing any CHANGELOG scope sentence.

Triage every hit into three buckets: embedded prose copies of
the corrected claim (fix them); normative references citing a
corrected command's protocol sections (inherit the fix); bare
call instructions making no output claim (no action). replaceAll
only after verifying every occurrence is in scope (exclude
archived specs, changelogs, test logic); grep evidence cited in
specs is itself a claim -- quote actual results, never "no X
references". Cross-repo completion claims need target-repo
verification before past-tense recording; done means a committed
branch or PR with both tracking issue numbers, never uncommitted
website edits.

### Lockstep surfaces

A lockstep group declaring one factual constraint across
surfaces (manifest field, README prose, AGENTS.md bullet, spec
FR) must reconcile every surface to a single authoritative
upstream value, diffed as one check. Disjunctive ranges with
gaps (ini 7: ^22.22.2 || ^24.15.0 || >=26.0.0) cannot be any
single-value floor; declare the verbatim range. Value-asserting
tests ship in the same commit as the correction. Any
package.json bump must be paired with an AGENTS.md Technology
Stack update in the same change (now @opencode-ai/plugin
1.19.0, in sync).

### Enumeration sweeps

Enumeration drift outruns command-name greps: tier counts, step
numbers, and branch prefixes go stale in entry-point docs
(README, QUICKSTART, docs/) and the command's own frontmatter.
Sweep phrasings -- tier-count text ("two pipelines", "N tiers",
"both X and Y"), framework enumerations, external step
citations ("uf.unleash Step N" in AGENTS.md) -- keeping line
budgets stable so test anchors do not shift; the tracking
issue's impact list must cover every hit. When a spec bounds a
selection criterion (risk floors on tier routing), grep every
doc presenting it. Still-open gap: risk floors live in
uf.unleash.md and tier-routing SKILL.md but are missing from
the docs/usage.md workflow table and the AGENTS.md Quick row.

### In-change staleness feedback

Docs written earlier in a change go stale as review-phase fixes
land: corrections must feed back into CHANGELOG entries,
design.md claims, usage docs, and filed gate-issue bodies in
the same commit. Mid-review scope expansion requires
re-deriving the doc-gate task's scope phrase from the full
post-expansion surface. Identical `index <before>..<after>`
blob hashes across canonical/mirror hunks prove pair sync;
drift tests remain authoritative.

### Deferral routing (in-PR fix vs tracked follow-up)

Before granting a scope-cut sibling gap follow-up treatment:
(1) are the incomplete mandates lines the current diff added?
New mandates carry their failure-contract obligation, so
changed-line impact keeps the fix in-PR. (2) Does the change's
own record (CHANGELOG, proposal Impact) claim the behavior in
those siblings? Then deferral would merge a false record; port
the semantics or narrow the claim. Gaps in pre-existing,
untouched sibling text legitimately route to a tracked
follow-up. Unnamed "follow-up issues" have no enforcement path:
every deferral needs a filed issue by number or a tasks.md item
owning the filing, with the gap's scope verified by grepping
the deferred artifacts for the signature text. Issue-filing
tasks must mandate duplicate searches (label + keyword) across
target repos' trackers and anchor adjacent-issue scope to
immutable references; the docs label is "documentation".

## History

- Cross-command consistency (2026-06-23): reviewers flag DRY
  violations when shared command-file instructions differ in
  substance; copy from the most complete version.
- Proposals-array claim fixes (fix-triage-issue-dispatch-docs,
  PR 761, 2026-10-19): the false claim that `dispatch_review_runs`
  returns a validated `proposals` array survived at dispatch
  sections of uf.review-council, uf.review-pr, and uf.triage-issue
  while corrections landed elsewhere in the same files, and the
  CHANGELOG overclaimed the counts-only contract. All instances
  now scope to the consolidate_dispatch no-provenance payload
  (~333/~442/~345), each followed by "Never source the proposals
  from dispatch_review_runs".
- Two-tier text sweep (unleash-tier-routing, 2026-10-20): after
  the quick tier landed, stale "two tiers"/"both Speckit and
  OpenSpec" text survived in usage.md, architecture.md, README,
  QUICKSTART, and heroes.md; swept repo-wide, zero hits remain.
- Plugin-version lockstep fix (PR 761 feedback, 2026-10-19): the
  Node engine floor shipped as four surfaces carrying three
  values (manifest engines, AGENTS.md bullet, README, FR-007);
  reconciled, and AGENTS.md now documents plugin 1.19.0.
- Deferral rule (20261019T204946): legitimized tracked
  follow-ups for pre-existing gaps; diff-added mandates and
  record-claimed behaviors stay in-PR.
