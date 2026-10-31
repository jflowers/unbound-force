## Context

Issue #884 reports that the two Divisor review-config scaffold
assets have opposite ownership semantics, making a custom review
agent only half-persistent in generated repositories. The
scaffold engine (`internal/scaffold/scaffold.go`) resolves a
disposition per file: never-overwrite (constitution only,
lines 700-702), `--force` overwrite, tool-owned overwrite-on-diff
(`bytes.Equal` at line 301), or user-owned skip.

Registration evidence table (verified at the current HEAD, which
matches the commit cited in the issue):

| Artifact | Role in agent registration | Ownership | Survives plain re-init? |
|---|---|---|---|
| `.opencode/agents/divisor-<name>.md` | Agent definition | user-owned | yes |
| `.uf/review-matrix.yaml` | Run membership, model policy | project-owned (scaffold.go:675-679) | yes |
| `.uf/reviewer-capabilities.yaml` | Eligibility (capability + scopes) | tool-owned (scaffold.go:672-674) | **no — silently reverted** |

The runtime already treats the capabilities manifest as the
project-side registration surface:

- Spec 005 FR-023: the manifest "MUST be the only reviewer
  eligibility source" and "unknown agents MUST require an
  explicit valid review entry with intersecting scope." "Closed"
  describes the eligibility model — only manifest-listed agents
  dispatch, and no other eligibility source exists — not
  immutability of the file by projects. The requirement
  explicitly anticipates project-added ("unknown") agents.
- The review-dispatch planner fails closed for an unlisted
  discovered agent with the remediation "add an entry for
  <agent> to .uf/reviewer-capabilities.yaml"
  (`.opencode/plugins/review-dispatch/index.ts:1897`).
- The reviewer-capabilities JSON Schema accepts any
  `^divisor-[a-z0-9-]{1,63}$` agent name; project-added
  entries are schema-valid and validated at load time.

The scaffold's classification contradicts the runtime contract:
it instructs (via the plugin's remediation) an edit that the
next plain `uf init` silently reverts.

Constitution alignment is assessed in proposal.md; the decisions
below reference those assessments where relevant.

## Goals / Non-Goals

### Goals

- Make a custom Divisor agent registration durable in
  generated repositories: all three registration artifacts
  survive plain `uf init` re-runs.
- Resolve the direction question from issue #884 (symmetrize,
  merge, or document) with a recorded decision, rationale, and
  rejected alternatives.
- Keep the change minimal and test-pinned: predicate flip,
  updated ownership table, one regression test, documentation.

### Non-Goals

- Merge logic for either review-config file (dispositions stay
  create/skip/replace).
- Any change to `--force` or never-overwrite semantics; only
  `specify/memory/constitution.md` is never-overwrite and that
  stays.
- Any change to `.uf/review-matrix.override.yaml`, which remains
  a profiles-only, gitignored per-developer file.
- Any runtime change: the review-dispatch plugin,
  `reviewer-manifest.ts`, the schemas, and the matrix limits
  (`max_personas: 16`, `max_total_runs: 24`) are untouched.
- Any file-format or schema-version change to
  `reviewer-capabilities.yaml` (`version: 1` stays).

## Decisions

### D1. Direction: symmetrize — make the capabilities manifest
project-owned (issue option 1)

**Decision**: Flip the `isToolOwned` branch for
`uf/reviewer-capabilities.yaml` (scaffold.go:672-674) to
`return false`, with a comment mirroring the matrix branch
("project-owned extension point"). Keep the branch explicit
rather than relying on the default fallthrough so the intent is
documented at the point of classification and the ownership
table test pins it directly.

**Rationale**:

1. The three-file registration surface becomes coherent. A
   project edits exactly three artifacts to register an agent;
   after this change all three are user/project-owned and
   seeded once. The capabilities file is currently the lone
   exception, and its tool-ownership is what produces the
   half-persistent state.
2. The runtime contract already declares this file a project
   extension point (FR-023, plugin remediation message, schema
   pattern). Ownership metadata should agree with runtime
   semantics — this is the Autonomous Collaboration assessment
   from proposal.md: two heroes' views of the same artifact
   stop contradicting each other.
3. It follows the repository's own precedent. The matrix was
   made project-owned for the identical reason ("generated
   repositories may customize ... without --force replacing
   their policy"), and agent files are user-owned. Extending
   the same semantics to the third registration artifact is the
   smallest conceptually consistent step — the Composability
   First extension-point rule from proposal.md.

**Rejected alternatives**:

- **Option 2 — tool-owned with append-only merge preserving
  unknown `reviewers:` entries.** Rejected because:
  - The scaffold engine's dispositions are strictly
    create/skip/replace over opaque bytes; a keyed YAML merge
    is a new disposition class introduced for exactly one file
    — special-case machinery with no second consumer (YAGNI).
  - Merge semantics are asymmetric and surprising: additions
    survive, but modifications to canonical entries are
    silently reverted and deletions of canonical entries are
    re-added. Users cannot predict the outcome without
    understanding the merge key.
  - It needs a malformed-local-YAML fallback policy (replace
    loses local additions; skip leaves stale canonical) — new
    error paths requiring new tests.
  - It diverges from the matrix, which does not merge; keeping
    the pair symmetric is simpler to document and reason about.
- **Option 3 — document the workflow as-is.** Rejected because
  it leaves the plugin's fail-closed remediation directing
  users into an edit that the next `uf init` silently reverts —
  actively misleading UX. It also preserves the cross-repo
  workflow (edit unbound-force, sync the deployed `.uf/` copy,
  release) as the only durable path for what is inherently a
  per-project extension, contradicting Composability First.

### D2. Regression test mirrors the constitution-preservation
pattern

**Decision**: Add `TestRun_ReviewerCapabilitiesPreservedOnRerun`
modeled on `TestRun_ConstitutionPreservedOnRerun`
(scaffold_test.go:2312): seed via a first run, append a local
`reviewers:` entry for a `divisor-custom-example` agent, re-run
without `--force`, assert the file is in `Skipped` and its
content is byte-identical. `--force` reset is already covered
generically by `TestRun_ForceOverwrites` (which subtracts
never-overwrite files dynamically); no exclusion is needed
because the capabilities file is not never-overwrite.

**Rationale**: The test verifies observable side effects —
disposition lists and on-disk bytes — with no external
services (Testability assessment in proposal.md). The ownership
table entry at scaffold_test.go:2800 flips to `false` with its
comment updated from "canonical review policy" to extension
point wording.

### D3. Enumerated copy updates stay minimal and drift-free

**Decision**: The embedded asset and this repository's deployed
`.uf/reviewer-capabilities.yaml` are byte-identical today and
the change does not alter either file's content — only the
disposition of the deployed copy on future re-runs. The
drift-detection pairs (scaffold_test.go:1933-1974) and the
DivisorOnly deployment table (scaffold_test.go:3457-3458) are
therefore untouched and must keep passing unchanged.

**Rationale**: Enumerating every affected copy was required by
the originating issue. Affected: `scaffold.go` ownership branch;
`scaffold_test.go` ownership table + new regression test;
`docs/architecture.md`; `docs/configuration.md`; `CHANGELOG.md`.
Unaffected: embedded asset, deployed `.uf/` copies, drift tests,
DivisorOnly deployment, schemas, plugin runtime, matrix.

## Risks / Trade-offs

**Accepted trade-off — canonical updates stop auto-flowing.**
After this change, a generated repository's
`.uf/reviewer-capabilities.yaml` is seeded once; later upstream
changes to the canonical list no longer arrive on plain
re-init. Mitigations:

- The persona set is closed by Spec 005 (six review-capable,
  three content-only); adding a persona is a rare, spec-level
  event that rides a release.
- New upstream agent `.md` files still deploy on re-run
  (create-if-missing applies to user-owned assets). If the
  seeded manifest then lacks the new persona's entry, dispatch
  fails closed with the precise remediation message naming the
  missing agent and file — loud and actionable, never silent.
  This failure mode is strictly better than today's silent
  registration loss, which is the defect being fixed.
- The identical trade-off is already accepted for
  `uf/review-matrix.yaml`: advisor/always/runs membership does
  not flow to existing deployments either.
- Release notes for any future persona addition should mention
  the one-line manual entry (documentation task in tasks.md
  captures the docs-issue filing for this change).

**Risk — upgrade re-run disposition changes.** On upgrade, a
repository with a locally modified capabilities file that
previously showed `Updated` will now show `Skipped`. This is the
intended fix, visible in the scaffold summary (Observable
Quality assessment: dispositions remain machine-parseable via
`Result`).

**Risk — schema/tool disagreement resurfaces elsewhere.** The
root cause was ownership metadata drifting from runtime
semantics. The new `scaffold-ownership` spec delta pins the
expectation as requirements so future review tooling checks
have a citable rule.
