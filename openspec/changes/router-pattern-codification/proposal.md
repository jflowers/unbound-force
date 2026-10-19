## Why

The determinism governance layer codifies step-level extraction
(DE-001: a mechanical step becomes a tool) but not
sequence-level collapse. The Router Pattern — the agent outputs
a single intent; deterministic code in the wrapper maps that
intent to the required sequence of tool calls — is the next
level of the same principle, and the repo already applies it
opportunistically (`uf_unleash_branch_gate`,
`uf_unleash_detect_resume`, `uf_delegate_command`,
`dispatch_review_runs`). Issue #758 tracks the codification.

Constitution Principle VI already covers sequences:
"deterministic procedures MUST execute in tools rather than be
re-reasoned from prose". An agent that chains five tool calls by
reading instruction prose is re-reasoning a deterministic
procedure from prose — the constitution's wording already
governs sequences. No constitution amendment is required (and
none is attempted). What is missing is the pack- and skill-level
spelling-out of that coverage, exactly as DE-001 was for single
steps. Without it the pattern regresses: new command templates
accumulate judgment-free chain choreography, and reviewers must
stretch DE-001's single-step framing to cite it.

## What Changes

1. **`.opencode/uf/packs/determinism.md`** — version 1.0.0 →
   1.1.0 (additive rules). New terminal section "Intent-Level
   Orchestration" after `## Efficiency Evidence` with:

   - **DE-005** [MUST]: a fixed sequence of tool calls with no
     judgment between steps — each next call and its arguments
     fully determined by the previous call's structured result —
     is itself mechanical instruction and MUST be collapsed into
     a single intent-level tool. The agent expresses the intent
     and passes judgment products (composed text, human gate
     decisions) as parameters; ordering, batching, retry,
     failure-stop, and branching on structured results belong to
     the tool.
   - **DE-006** [SHOULD]: intent-level tools keep judgment at
     their boundary — judgment products arrive as validated
     parameters, and routing decisions (verdict mapping,
     severity sorting, exit-variant selection, batch
     scheduling, failure-stop) execute inside the tool as
     constants or pure functions.

   The severity-mapping sentence is updated to read
   "(DE-001, DE-003, DE-005)" for MUST and "(DE-002, DE-004,
   DE-006)" for SHOULD. The intro paragraph is unchanged.
   DE-001..DE-004 text is byte-unchanged: rule IDs are stable
   identifiers cited by `command-prose-pilot`, `CHANGELOG.md`,
   and the skill, so the new rules append in a new terminal
   section — no renumbering, no mid-document insertion.

2. **`.opencode/skills/determinism-first/SKILL.md`** — five
   enumerated prose updates plus one new section:

   - Frontmatter `description`: second sentence extended to
     "...Route fixed procedures and judgment-free tool chains
     through executable tools..." (first sentence byte-identical
     so skill-selection matching is unaffected).
   - "Classify Before Writing" twice-test paragraph: appended
     sentence extending the test one level up to fixed tool-call
     sequences.
   - Mechanical-procedures bullet list: two new bullets —
     orchestration of tool chains (ordering, batching, retry,
     failure-stop) and branching on structured results via
     lookup tables (verdict mapping, severity sorting).
   - Numbered extraction procedure: new step 4 — collapse
     judgment-free chains into a single intent-level tool,
     passing judgment products as parameters.
   - "Related Enforcement": `DE-001 through DE-004` →
     `DE-001 through DE-006`.
   - New section "Chains Without Judgment Collapse Too" between
     "Deterministic Steps Belong in Tools" and "Judgment Belongs
     in Prose" (no rule IDs involved, so mid-document insertion
     is safe).

3. **AGENTS.md layer decision (option b)** — the AGENTS.md
   determinism-gate category list is left unchanged. The pack is
   the stricter/more specific layer; constitution Principle VI
   supremacy resolves conflicts upward, and DE-005 extends
   rather than contradicts the AGENTS.md enumeration. Decision
   recorded here per learning `governance-20261014T151535`;
   cross-layer wording diffing is an explicit spec-review step.

4. **DE-004 evidence in the change record** — before/after line
   and token counts for both files, recorded in this change's
   metrics artifact (the `command-prose-pilot` `metrics.md`
   precedent).

5. **`CHANGELOG.md`** — entry for the additive rules.

Explicitly NOT in scope (per issue #758): constitution
amendment (Principle VI already covers sequences); migrating
existing command prose to comply with DE-005 (per the pack's
migration rule, existing prose migrates opportunistically at
review time — tracked by #757 and #664); any scaffold-asset or
plugin-code changes (both files are repo-local governance
artifacts, excluded from scaffold drift tests at
`internal/scaffold/scaffold_test.go:2212-2214` and
`internal/schemas/packvalidator_test.go:188-196`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `determinism-policy`: extends the codified rules from
  step-level extraction to sequence-level collapse (the Router
  Pattern) — DE-005 [MUST] / DE-006 [SHOULD] in the review pack,
  chain-collapse guidance in the determinism-first skill.

### Removed Capabilities

None.

## Impact

- **Files**: `.opencode/uf/packs/determinism.md`,
  `.opencode/skills/determinism-first/SKILL.md`,
  `CHANGELOG.md`, and this change's metrics artifact. AGENTS.md
  and the constitution are untouched; no other files modified.
- **Review dispatch**: DE-005/DE-006 enter every Divisor review
  prompt via existing pack auto-discovery — no plugin changes.
- **Hero repositories**: none. The pack and skill are repo-local
  and do not propagate via `uf init`; hero adoption of Principle
  VI is unaffected.
- **Tests**: `make test` (drift tests confirm the repo-local
  exclusions still hold) and
  `go test ./internal/schemas/... ./internal/scaffold/...`.
  No `make plugin-test` needed (no TypeScript changes).
- **Docs gate**: CHANGELOG entry in-change. No structural
  AGENTS.md/README changes; the AGENTS.md Convention Packs
  listing already includes `determinism.md`. Docs-issue gate:
  a documentation issue MUST be filed against this repo
  before PR merge — DE-005/DE-006 alter repo-wide
  review-council behavior via pack auto-discovery, which is
  user-facing per the #720 precedent; task 1.4 carries the
  filing.
- **Content pipeline**: website gate N/A — the website tracks
  the constitution principle set (website#305, already six
  principles) and dispatch/tooling docs, not the pack rule
  inventory; this change amends no principle and adds no
  pack, CLI command, or hero capability. Blog: the Router
  Pattern story rides the tracked deterministic-tools post
  (#742); the #757/#664 migration rollout is the natural
  blog moment.

## Constitution Alignment

Assessed against the Unbound Force org constitution (six active
principles).

### I. Autonomous Collaboration

**Assessment**: PASS

Codifies the pattern through well-defined governance artifacts
(convention pack, skill) rather than runtime coupling. The rules
themselves direct judgment-free orchestration into tools with
structured, self-describing results.

### II. Composability First

**Assessment**: PASS

Additive rules to two repo-local files; no new runtime
dependencies. Each file remains independently consumable —
removing either leaves the rest of the governance stack
functional. No scaffold assets are created or modified.

### III. Observable Quality

**Assessment**: PASS

Rule IDs and RFC 2119 severity markers stay machine-greppable
and stable (DE-001..DE-004 byte-unchanged, DE-005/DE-006
appended in document order). DE-004 evidence — before/after
line and token counts for both files — is recorded in the change
record, so the efficiency claim rests on measurement.

### IV. Testability

**Assessment**: PASS

Both files are covered by existing drift-test exclusions that
`make test` verifies; the change adds no code and therefore no
new test surface. Spec scenarios pin the exact rule IDs,
severity pairs, and section placement so compliance is
mechanically checkable.

### V. Security by Default

**Assessment**: N/A

The change touches no permissions, dependencies, secrets, or CI
surfaces. (Incidentally, the codified pattern moves chain
orchestration from instructed prose into tool code, reducing
improvisation surface — but that is not this change's mechanism.)

### VI. Deterministic Execution

**Assessment**: PASS

This change is Principle VI's own codification extended one
level: it spells out, in the pack and skill layers, the
sequence-level coverage the principle's wording already carries.
The constitution text itself is untouched.
