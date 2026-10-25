---
tier: validated
compiled_at: 2026-10-25T16:37:57Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - openspec-workflow-20260623T195615-jay-flowers
  - specify-cli-20260811T174019-jay-flowers
  - openspec-conventions-20261010T140556-jay-flowers
  - openspec-parallel-markers-20261012T000228-jay-flowers
  - spec-workflow-20261015T182731-jay-flowers
  - spec-workflow-20261022T192854-jay-flowers
topic: spec-workflow
---

# Spec Workflow

## Current State (October 2026)

### Three Tiers

All non-trivial changes route into one of three spec tiers:

| Tier | Tool | Scope | Artifacts | Branch |
|------|------|-------|-----------|--------|
| Strategic | Speckit | >= 3 stories or cross-repo | specs/NNN-*/ | NNN-<name> |
| Tactical | OpenSpec | < 3 stories, single-repo | openspec/changes/* | opsx/<name> |
| Quick | /uf.unleash routing | trivial fixes, chores, docs | none | quick/<name> |

Quick-tier changes carry no spec artifacts but run full quality gates.
Speckit pipeline: constitution -> specify -> clarify -> plan -> tasks ->
analyze -> checklist -> implement.

### Ordering and Phase Boundaries

- Constitution before specs; spec before plan; plan before tasks; tasks
  before implementation.
- Spec artifacts MUST be committed and pushed before implementation
  begins. opsx-propose never commits artifacts by design, so the
  /uf.unleash implement phase can land commits on opsx/<name> while
  openspec/changes/<name>/ stays untracked; guard reviewers flag this
  mixed state (the review context's working-tree note shows the
  committed/uncommitted/untracked split) and remediation is to commit
  and push spec artifacts together with the implementation edit before
  /uf.finale creates the PR.
- Before merge, reconcile review-phase learnings that contradict
  design.md decisions or proposal claims (observed on PR #733, where
  design rationale claimed enforcement a same-PR learning disproved):
  either act on the learning or amend the rationale to cite it as a
  tracked follow-up. Shipping both leaves an inconsistent change record;
  future contributors trust the design doc over the learning.

### Tier Routing and Risk Floors

/uf.unleash routes changes via the tier-routing skill (Oct 19-20, 2026):

- Scope signals select quick vs. spec tier.
- Escalate-only risk floors forbid quick for security-sensitive, auth,
  data-loss, and public-API-breaking changes.
- Issue references (#NNN or URL) resolve via gh.
- ON_MAIN and UNRECOGNIZED_BRANCH states trigger routing.

### Task Bookkeeping

- Mark checkboxes [x] immediately on completion.
- [P] marks parallel-eligible tasks; verify independence first. [P] is
  validated at the file level, not task-independence: two logically
  independent tasks editing the same file still violate the [P] contract
  because parallel workers conflict on that file (documented in the
  tasks.md template header, easy to overlook).
- When new tasks supersede completed ones, annotate the completed task
  with a supersession note ("superseded by tasks X.Y") instead of
  unchecking it, preserving the audit trail. Conversely, uncheck a
  completed scaffold-sync task when later tasks modify the same file,
  preventing stale scaffold copies.
- Review-dispatch plugin tool specs follow a standing 4-phase task
  structure -- (1) Tool Implementation, (2) Dual-Copy Sync, (3) Tests,
  (4) Verification -- with the FR-009 dual-copy sync requirement repeated
  verbatim across specs (build-review-prompts, dispatch-review-runs,
  fetch-pr-review-context); usable as a template for future tool additions.

### What Requires a Spec

Requires a spec: new features, signature-changing refactors,
multi-function test additions, agent changes, CI changes, data-model
changes. Exempt: constitution amendments, typo fixes, emergency hotfixes
(retroactively documented). When in doubt, start with OpenSpec; escalate
to Speckit if scope grows past 3 stories or crosses repos.

## History

- The two-tier model (Speckit strategic / OpenSpec tactical) became
  three-tier when quick routing was added Oct 19-20, 2026: /uf.unleash
  gained the tier-routing skill with scope signals, escalate-only risk
  floors, gh-based issue-reference resolution, and ON_MAIN /
  UNRECOGNIZED_BRANCH triggers.
- specify-cli (Speckit) changed its CLI contract around v0.9.4+: bare
  `specify init` requires --here or a project name; --ai was replaced by
  --integration; non-interactive sessions default to copilot, not
  opencode; --offline uses bundled wheel assets instead of GitHub
  Releases downloads. The pinned uf init invocation is `specify init
  --here --integration opencode --offline`, passed via simpleTools
  extraArgs (scaffold.go:1854) and asserted in tests.
