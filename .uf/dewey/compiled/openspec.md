---
tier: validated
compiled_at: 2026-10-25T16:28:14Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - openspec-quality-20261010T161811-jay-flowers
  - openspec-design-drift-20261010T172633-jay-flowers
  - openspec-design-accuracy-20261010T172636-jay-flowers
  - openspec-design-drift-20261010T172837-jay-flowers
  - openspec-design-drift-20261010T185928-jay-flowers
  - openspec-20261014T151540-jay-flowers
  - openspec-20261014T165538-jay-flowers
  - openspec-20261014T165542-jay-flowers
  - openspec-20261014T171108-jay-flowers
  - openspec-20261014T171114-jay-flowers
  - openspec-20261015T123102-jay-flowers
  - openspec-20261015T164725-jay-flowers
  - openspec-20261016T222131-jay-flowers
  - openspec-20261016T222135-jay-flowers
  - openspec-20261016T222137-jay-flowers
  - openspec-20261017T031902-jay-flowers
  - openspec-20261017T033621-jay-flowers
  - openspec-20261017T222142-jay-flowers
  - openspec-20261017T222144-jay-flowers
  - openspec-20261019T164204-jay-flowers
  - opsxrouter-pattern-codification-2026-10-19-openspec-20261019T212030-jay-flowers
  - openspec-20261019T223604-jay-flowers
  - openspec-20261020T001116-jay-flowers
  - openspec-20261020T001444-jay-flowers
  - openspec-20261020T001452-jay-flowers
  - openspec-20261020T113857-jay-flowers
  - openspec-20261020T114849-jay-flowers
  - openspec-20261020T124802-jay-flowers
  - openspec-20261020T125032-jay-flowers
  - openspec-20261020T140943-jay-flowers
  - openspec-20261020T161825-jay-flowers
  - openspec-20261020T170545-jay-flowers
  - openspec-20261022T180734-jay-flowers
  - openspec-20261022T224959-jay-flowers
  - openspec-20261022T225010-jay-flowers
  - openspec-supersession-20261022T225016-jay-flowers
  - openspec-20261022T225029-jay-flowers
  - openspec-20261023T120151-jay-flowers
  - openspec-20261023T120157-jay-flowers
topic: openspec
---

# OpenSpec

## Current State (October 2026)

### Change lifecycle & artifact discipline

A change's artifacts — proposal.md, design.md, tasks.md, specs/ deltas — form one contract. When a design
decision evolves during implementation (fetch-pr-review-context D2: BunShell template literals replaced
by Bun.spawn argument arrays), propagate the update to EVERY artifact referencing it: grep all of
openspec/changes/<name>/ for the old terminology — review flags stale references as MEDIUM intent drift
even when the new implementation is superior. A decision that reverses a proposal mechanism must be
reconciled in the same change (unleash-tier-routing D6), and the proposal's Capabilities section must
name exactly the capabilities the delta spec files ship. tasks.md [P] markers require a same-file
collision check across the whole task group, re-run whenever a task is added (late-added
reconciliation tasks are the usual culprit). Coverage modality must be identical across proposal,
design, and tasks: for new observable surface, state the test as MUST in all three —
fix-tui-git-output-leak's design-level "MAY add a test" against a conditional tasks item opened a
legitimate skip path, nothing can already cover a field that does not exist yet, and "No test changes
required" must be evaluated against the NEW surface, not just the removed one.

The delta spec is the durable baseline (design.md archives with the change): diff design term
definitions against the requirements derived from them, and annotate verbatim-pinned blocks with the
superseding task ID when a verification task amends them. Embedded validation commands (rg ban-list
regexes) must be mechanically derived from the canonical token enumeration. Evidence-recording
obligations must pin a concrete artifact destination ("the change record" is polysemous). Cross-change
constraint and risk-register "was corrected" claims are contracts — verify them against both files.

Constitution is v1.4.0 with six principles (V: Security by Default; VI: Deterministic Execution,
2026-10-14). Stacked changes inherit the predecessor's Constitution Alignment template including
its principle count — re-derive the section from the current constitution version on every
amendment (fix-dispatch-verdict-derivation assessed only I-IV). A Dewey learning is the memory of
a defect, not its remediation: apply the prescribed artifact fix in the same iteration — an
unfixed advisory becomes a permanent false statement once the delta archives. /uf.finale must
commit untracked openspec/changes/ artifacts with the implementation edit. Gold-standard exemplar:
fetch-pr-review-context (trust boundaries, O_EXCL temp files, retryable errors, warnings, coverage).

### Requirement-ID allocation

IDs are allocation-managed, not free-form. Registry of record (openspec-20261023T120151):
RD-FR-001..008 in review-council-multi-model-fanout; RD-FR-009..018 reserved and RD-FR-019..024
allocated to review-matrix deltas (numbering note atop optional-profile-models/specs/
review-matrix.md); RD-FR-025..027 in fix-review-dispatch-recovery; DR-FR-001..003 in
dispatch-recovery. Next free: RD-FR-028+; a new prefix band needs an explicit numbering note.

Before allocating IDs or naming capabilities, survey ALL active changes under openspec/changes/ — not
just openspec/specs/ — and honor explicit ID reservations; if base IDs live in an unarchived change,
reference them without renumbering or coordinate before either archives. A legacy unqualified FR-NNN
scheme (dispatch-review-runs) coexists; its FR-007 visually collides with RD-FR-007, so qualify legacy
references with the change name. IDs are load-bearing (tool descriptions and plugin source comments
cite them). Renumbering sweeps must cover spec deltas, tasks, design, proposal, CHANGELOG, AND
.uf/dewey/learnings/ — stale citations feed Dewey retrieval and mislead future reviews.

### Supersession & deferred validation

The archive step syncs only the archiving change's own delta; it never rewrites requirements introduced
by other changes, and per-capability conflict detection stays silent across capabilities. Record
supersession where the archive-time reader looks: annotate the superseded sibling's delta with
superseded-by references at the specific stale requirement lines (the only order-independent
enforcement point), pin archive order in the proposal's Sequencing section, and add deferred-validation
tasks (the task 9.2/9.3 pattern from unleash-direct-review-dispatch / unleash-deterministic-tools). A
note written only in the superseding change's artifacts is never read by the sibling's archive step.

Deferred-validation tasks fire only at the deferring change's own archive gate: "after sibling X
archives, re-verify anchors" is safe when Sequencing pins X first, but "before sibling Y archives,
annotate its delta" never fires if Y archives first; verify quotes against the sibling delta before
recording them. Code-level supersession — a compatibility alias or merge deduplication (PR #745:
persist_unleash_summary absorbed into write_unleash_summary, 3 parameters growing to 8) — creates the
same hazard with no detection signal; an alias preserves the registration surface but NOT the input
contract, and an alias or "merged/deduplicated" code comment with no sequencing bullet in proposal.md
is the detection heuristic. The Supersedes enumeration must be compiled mechanically: grep all of
openspec/changes/ for the retired mechanism's distinctive vocabulary (name, option labels, scenario
phrasings) and name every normative carrier — enumerating definers but missing pinners resurfaces
as a main-spec contradiction (spec-review-per-finding-gate missed unleash-deterministic-tools'
pinned consent-gate MUSTs). To supersede a clause inside a sibling-defined requirement, ship a MODIFIED
Requirements section for it in the superseding change's delta, or an explicit tasks.md item owning the
registry edit — deferring to "the archive step" leaves no executable owner.

### MODIFIED-delta handling

MODIFIED-delta stacking is one-level absorption and archive-order-fragile: absorb the FULL chain's
text, record the ordering constraint in design Risks (or proposal Dependencies), or prefer
all-ADDED deltas. Stacked changes whose deltas target a predecessor's unarchived requirements
cannot pass `openspec validate` until the predecessor archives (validation resolves against
openspec/specs/, not pending changes) — record the deferred validation as an explicit task to
re-run validation and re-check anchors after archive. When the target capability has no main spec
yet, verify inter-delta consistency against the unarchived predecessor's delta directly.

### Unarchived changes as second ledger

openspec/specs/ holds three main specs (ci, graphthulhu-distribution, review-council) while
openspec/changes/ carries ~150 unarchived change directories, so normative requirements live in two
ledgers: live specs/ and prior change deltas. An ADDED-only delta under a new capability leaves the
old MUSTs live, and archive-time merges fold obsolete requirements into live specs as direct
contradictions — record supersession explicitly, and scope stale-reference sweeps to active change
deltas, not just commands, skills, and docs. Before creating a new capability directory, check
openspec/specs/, changes/archive/, and every active change's specs/ deltas for existing coverage (a
parallel review-dispatch-consolidation capability fragmented dispatch-finalization). Placement
is nearly immutable after archive: review-time fix = rename; post-archive = migration.

### Ripple sweeps

In multi-round reviews, every round-N contract amendment must re-trigger the ripple sweep: re-verify
every surface the amended term touches — sibling change deltas, earlier-round task texts, governance
docs, scaffold mirrors — and maintain a per-term ripple checklist (unleash-tier-routing round 3 missed
a round-2 fix in a sibling delta round 2 had already reconciled, leaving contradictory MUSTs).
Requirement-ID renumbering is a repo-wide ripple including learnings.

## History

- Oct 10 — fetch-pr-review-context set the artifact-quality bar; a same-day design-drift cluster
  established that decision evolution must propagate to every artifact.
- Oct 14 — [P]-collision and coverage-modality lessons; first supersession gotchas
  (fix-tui-git-output-leak's MUST-NOT-write vs finale-token-reduction's live MAY/SHOULD).
- Oct 15 — stacking framed (26+ unarchived changes, hard archive-order dependency);
  validate-deferral converted from proposal prose into an explicit task.
- Oct 16 — PR #745's compatibility-alias dedup produced the four-point pattern: MODIFIED/REMOVED
  deltas anchored to sibling text, Sequencing bullets with pinned order, deferred-validation
  task 9.2, superseded-by annotations where scope permits.
- Oct 17 — trigger-location asymmetry explained (deferred tasks fire only at the deferring change's
  gate, so guarding a sibling's archive needs the task 9.3 order pin); regex-derivation and
  design-vs-spec term checks from command-prose-pilot.
- Oct 19 — RD-FR collision found: fix-review-dispatch-recovery assigned RD-FR-009..011 into
  optional-profile-models' reserved RD-FR-009..018 range.
- Oct 20 — the identity-collision fix executed as renumbering to RD-FR-025..027 and extended into
  dewey tooling (learnings citing old IDs swept in the same commit); constitution re-derivation,
  capability-registry checks, learning-as-memory-not-remediation, ripple sweeps.
- Oct 22 — second-ledger framing consolidated; mechanical supersedes enumeration via
  distinctive-literal grep; proposal-capabilities/delta mismatch.
- Oct 23 — the registry map of record codified the allocation-managed RD-FR namespace (next free
  RD-FR-028+); the correlation-release review produced the MODIFIED-Requirements remedy.
