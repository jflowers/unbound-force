---
tier: validated
compiled_at: 2026-10-25T16:27:44Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - documentation-gate-20261009T171033-jay-flowers
  - documentation-gate-20261010T140558-jay-flowers
  - documentation-gate-20261010T172857-jay-flowers
  - component-removal-documentation-20261011T022008-jay-flowers
  - documentation-gate-20261012T145518-jay-flowers
  - documentation-20261014T120913-jay-flowers
  - documentation-20261014T123134-jay-flowers
  - documentation-20261014T151529-jay-flowers
  - documentation-20261014T165443-jay-flowers
  - documentation-gate-20261014T165541-jay-flowers
  - documentation-gate-20261014T171112-jay-flowers
  - documentation-gate-20261014T173702-jay-flowers
  - documentation-gate-20261014T181318-jay-flowers
  - documentation-gate-20261014T181322-jay-flowers
  - documentation-gate-20261014T182421-jay-flowers
  - documentation-gate-20261014T182424-jay-flowers
  - documentation-gate-20261014T185718-jay-flowers
  - documentation-gate-20261015T123104-jay-flowers
  - documentation-20261015T135914-jay-flowers
  - documentation-gate-20261015T135915-jay-flowers
  - documentation-gate-20261015T141235-jay-flowers
  - documentation-triage-20261015T150712-jay-flowers
  - documentation-gate-20261015T161945-jay-flowers
  - documentation-gate-20261015T164721-jay-flowers
  - documentation-gate-20261015T234405-jay-flowers
  - documentation-gate-20261015T234416-jay-flowers
  - documentation-gate-20261016T115036-jay-flowers
  - documentation-gate-20261016T132704-jay-flowers
  - documentation-gate-20261016T132707-jay-flowers
  - documentation-gate-20261016T135618-jay-flowers
  - documentation-gate-20261016T151132-jay-flowers
  - documentation-20261016T152651-jay-flowers
  - documentation-gate-20261017T031855-jay-flowers
  - documentation-triage-20261017T033612-jay-flowers
  - documentation-gate-20261017T123527-jay-flowers
  - documentation-gates-20261017T222146-jay-flowers
  - documentation-gates-20261017T234706-jay-flowers
  - documentation-gate-20261019T022435-jay-flowers
  - documentation-gate-20261019T122049-jay-flowers
  - documentation-gate-20261019T153508-jay-flowers
  - documentation-gate-20261019T164207-jay-flowers
  - documentation-gate-20261019T171722-jay-flowers
  - documentation-gate-20261019T223127-jay-flowers
  - documentation-gate-20261020T001448-jay-flowers
  - documentation-gate-20261020T165713-jay-flowers
  - documentation-gate-20261020T170538-jay-flowers
  - documentation-gate-20261020T170546-jay-flowers
  - documentation-gate-20261020T182842-jay-flowers
  - documentation-gate-20261022T121705-jay-flowers
  - documentation-gate-20261022T130002-jay-flowers
  - documentation-20261022T180320-jay-flowers
  - documentation-gate-20261022T180737-jay-flowers
  - documentation-gate-20261022T200534-jay-flowers
  - documentation-gate-20261022T224955-jay-flowers
  - documentation-20261022T224957-jay-flowers
  - documentation-gates-20261022T225014-jay-flowers
  - documentation-gate-20261022T225027-jay-flowers
  - documentation-drift-20261023T155950-jay-flowers
  - documentation-20261023T162203-jay-flowers
  - documentation-20261023T202058-jay-flowers
  - documentation-20261023T211827-jay-flowers
  - documentation-gate-20261024T150858-jay-flowers
topic: documentation-gate
---

# Documentation Gate

## Current State (October 2026)

### The gate stack

User-facing changes carry THREE stacked, independent pre-merge requirements — satisfying one
satisfies neither of the others:

1. **AGENTS.md Documentation gate** (bullet 2): docs issue against the CURRENT repo before PR
   merge. Exempts internal refactoring, test-only, CI-only, spec artifacts.
2. **Org constitution Cross-Repo Documentation rule** (v1.4.0,
   `.specify/memory/constitution.md:290-296`): tracking issue in unbound-force/website before
   the implementing PR merges. Exempts ONLY purely internal (refactoring, test-only, CI-only) —
   NO spec-artifacts exemption.
3. **Change-entry assessment gate**: CHANGELOG.md / AGENTS.md / README.md assessment before
   marking tasks complete; retrospective learnings (`.uf/dewey/learnings`, `.uf/dewey/compiled`)
   satisfy it.

A CHANGELOG-entry task alone satisfies neither filing gate. AGENTS.md phrases its gate as
"against the current repo," which reads as the complete requirement; the website rule lives in
the constitution's Development Workflow section and earlier AGENTS.md revisions
(specs/030-agents-md-guidance), so tasks citing "the documentation gate" singular skip it —
Constitution Alignment sections assess only numbered principles and miss it too.

### What triggers the gates (user-facing breadth)

- Any tool registered in a plugin's `server()` is user-facing even if consumed only by sibling
  tools (#696, fetch-pr-review-context, HIGH, blocked APPROVE). Plugin tool output, TUI-visible
  behavior, result envelopes, and scaffold-mirrored assets count too — bug fixes included;
  "behavioral bugfix, no structural or usage change" addresses content impact only, and defect
  fixes that alter observable behavior count (previously-null output now populated).
- `.opencode/skills/` and `.opencode/uf/packs/` additions alter agent and review-council
  behavior repo-wide; "does not propagate via `uf init`" is not "not user-facing." Constitution
  amendments (website constitution page; hero alignment) and convention-pack additions
  (specs/030 data-model lists "New convention pack added") are likewise gated.
- Scaffold mirrors inherit the underlying change's status: byte-identical mirrors of internal
  refactors are exempt; mirrors of user-visible changes deploy as user-facing via `uf init`.
- Countable-set changes (principles, packs) need a repo-wide ordinal-count grep excluding
  point-in-time records; live `.opencode/` hits are drift-enforced against scaffold twins
  (chore-branch delivery), so extend the docs-gate issue in the same change
  (constitution-check.md's stale "four org principles").

### Exemptions and how to claim them auditably

Blanket behavior-neutral instruction-prose exemptions (granted Oct 17 for command-prose rewrites
with preserved contracts) were replaced Oct 17-22 by auditable exempt-or-file decisions: (a)
named exempting rule, (b) no-user-facing-surface determination with basis, (c) PR-description
record, (d) change-entry artifacts still shipped (CHANGELOG entry; AGENTS.md convention
sentence). Pattern: ts-plugin-coverage-gate task 3.3 (CI-only exemption).

"The decision noun is not the artifact" (determinism pack DE-008): a checked documentation task
recording a "documentation-issue decision" with no issue numbers and no exemption rationale is
unsatisfied — HIGH even when CHANGELOG/AGENTS assessment is complete (unleash-pipeline-hardening
7.3; delegation-skill-enforcement 5.3; spec-review-per-finding-gate 3.3, incl. the named-action
variant: "file the issue" checked [x] with no recorded number). Exemption claims must be
reconciled against the change's own behavior-delta statements and can be outlived — a maintainer
may file later without updating the record (#789 after a dated "no repo docs issue" exemption).

### Filing and verification discipline

- **Record both issue numbers at filing time** — tasks.md task line, CHANGELOG "Docs: #N"
  trailer, or proposal Documentation Impact. A checked checkbox is not evidence; reviewers
  verify read-only via `gh issue view <N> --json number,title,state,labels,url`.
- **Labels**: website repo uses `docs` (live-verified Oct 25 2026). Main repo has BOTH `docs`
  (20 open) and `documentation` (13 open); dual-labeling is the emerging fix (#778 precedent).
  Verify filings by issue number, never label-filtered search alone — label filters missed #736,
  #720, #762, #781, #810, plus unlabeled #789/website#303/website#320. The Curator's canonical
  duplicate check is `gh issue list --label docs`; dispatched review sessions prohibit issue
  creation (parent executes filings), so missing-issue findings embed the full `gh issue create`
  command.
- **Duplicate avoidance attaches to every target** — authors duplicate-check the unfamiliar
  website target and skip their own repo, where predecessors live (#728/#710/#706; website
  #234/#262/#300/#302/#307 named in task 8.2 for mechanical verification). Consolidation is
  verified against the target issue body, never the task record; hedge words ("may absorb")
  signal unperformed consolidation; the fix is a scope-table edit on the umbrella issue (#743
  item 3 extending #739). Missing scope row = LOW; missing issue = HIGH.
- **Canonical docs-gate task shape** (task 8.2 exemplar; executed by seam-verification 4.4):
  per-file dispositions for docs/usage.md, docs/architecture.md, docs/heroes.md, AGENTS.md,
  README.md — the FULL gate file set including "no update needed + why" — plus duplicate-checks
  of both targets, recorded numbers, and blog/tutorial reassessment at filing with dated
  maintainer decisions. A docs-gate issue with a Dispositions section is the change's
  documentation blast-radius manifest (#810), verifiable from one `gh issue view`.
- **Review-phase fixes feed back into earlier-written docs**: a fix commit extending a failure
  contract (PR #812, commit 8359baa, retryable BASE_SYNC_COUNT envelope) leaves the CHANGELOG
  entry, usage sentences, and gate-issue bodies (#810, website#320) stale until re-checked in
  the same commit; design corrections feed back into design.md (D8's false "no external
  references" claim).
- **Derived surface lists**: grep the repo for the changed syntax — including conceptual
  phrasings, not just exact old labels (docs/heroes.md:117 survived an exact-label grep) — not
  merely pages named in the tracking issue; teaching surfaces often live in command/skill files
  the issue omits.

### Known open gaps

- uf.agent-brief.md still lists a stale "Website gate" in its 8-rule checklist; the main-repo
  label namespace is unstandardized; learnings do not propagate into new change authoring
  without an enforcing checklist (delegation-skill-enforcement regressed to a two-file
  assessment two days after the canonical shape was documented).

## History

- **Jun 5 2026 (cfd5b68)**: AGENTS.md "Website gate" renamed to the current-repo Documentation
  gate, moving the cross-repo requirement into the constitution — the root cause of persistent
  single-gate filings.
- **Sep 29 2026 (e2edd46)**: note added that retrospective Dewey learnings satisfy the
  CHANGELOG/AGENTS/README assessment gate.
- **Oct 9-12**: docs deliverables named in proposals systematically deferred past
  implementation; docs-gate tasks absent from tasks.md; #696 established plugin tools as
  user-facing.
- **Oct 14**: two-gate stacking first articulated; fix-tui-git-output-leak task 3.4 checked [x]
  while the website issue was never filed (website issue #305 predated it) and #710 was never
  updated — establishing record-the-number discipline and the PR #718/#717/website#303 label-gap
  case.
- **Oct 15-16**: dual-filing precedents (unleash-direct-review-dispatch 6.2/6.3;
  dispatch-finalize-determinism 4.4/4.6; #728+website#307; #739+website#309; PR #744
  #740+website#310); task 8.2 exemplar codified; label asymmetry documented with reversals — the
  filing flow was observed labeling `documentation` while the canonical check used `docs` (and
  earlier the reverse); coexisting labels quantified (12 `docs` vs 8 `documentation` open).
- **Oct 17-22 exemption hardening**: blanket instruction-prose exemptions replaced by auditable
  exempt-or-file decisions; scaffold-mirror inheritance rule stated; "decision noun is not the
  artifact" classified HIGH (Oct 22); ts-plugin-coverage-gate task 3.3 demonstrated the
  auditable exemption.
- **Oct 20-24 label failures and feed-back rules**: #720/#762/#781 invisible to `--label docs`
  (query returned 16, none of the three); dual-label precedent #778 (PR #783); unlabeled #789
  surfacing only via keyword search; #810/website#320 filed with empty label sets; review-phase
  fixes must extend CHANGELOG/docs/gate-issue bodies in the same commit; Dispositions-section
  blast-radius manifest (#810).
- **Oct 25 audit**: live verification of the gate stack, label state (website `docs`; main repo
  20 `docs` / 13 `documentation`), and the stale uf.agent-brief.md Website-gate entry.
