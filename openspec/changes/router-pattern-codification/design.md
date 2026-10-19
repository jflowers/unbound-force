## Context

`determinism-codification` (merged) introduced the
`determinism-policy` capability across four layers: constitution
Principle VI, the `.opencode/uf/packs/determinism.md` review
pack (DE-001..DE-004, v1.0.0), the
`.opencode/skills/determinism-first/SKILL.md` authoring skill,
and the AGENTS.md determinism gate. Those rules govern
step-level extraction: a mechanical step becomes a tool.

Issue #758 extends the policy one level: fixed sequences of
tool calls with no judgment between steps (the Router Pattern)
must also collapse into single intent-level tools. The repo
already ships four precedents (`uf_unleash_branch_gate`,
`uf_unleash_detect_resume`, `uf_delegate_command`,
`dispatch_review_runs`), and the in-flight `command-prose-pilot`
change cites DE-002/DE-003/DE-004 — so the existing rule IDs are
load-bearing references that cannot move.

Both target files are repo-local governance artifacts, excluded
from scaffold drift tests (`internal/scaffold/scaffold_test.go:
2212-2214`, `internal/schemas/packvalidator_test.go:188-196`)
— no scaffold or plugin code changes are needed or permitted
here. Constitution alignment is assessed in the proposal (all
principles PASS or N/A; Principle VI needs no amendment because
its wording already covers sequences).

## Goals / Non-Goals

### Goals

- Add DE-005 [MUST] and DE-006 [SHOULD] to the determinism pack
  as a new terminal section, with a version bump to 1.1.0 and an
  updated severity-mapping sentence.
- Extend the determinism-first skill with chain-collapse
  guidance (five prose updates + one new section) so
  authoring-time classification covers sequences, matching the
  pack's review-time rules.
- Record the AGENTS.md layer decision (option b: leave the
  determinism-gate category list unchanged) with rationale.
- Record DE-004 evidence — before/after line and token counts
  for both files — in this change's metrics artifact.
- Keep DE-001..DE-004 byte-unchanged and every existing rule ID
  stable.

### Non-Goals

- No constitution amendment (Principle VI already covers
  sequences).
- No migration of existing command prose to DE-005 — migrations
  happen opportunistically at review time and are tracked by
  #757 and #664.
- No scaffold-asset, plugin-code, or hero-repo changes.
- No AGENTS.md edit (option b).

## Decisions

1. **Append-only rule IDs.** DE-001..DE-004 are cited by the
   determinism-codification spec deltas, the active
   `command-prose-pilot` change, `CHANGELOG.md`, and the skill.
   New rules therefore append as DE-005/DE-006 in a new terminal
   section after `## Efficiency Evidence`; nothing is renumbered
   or inserted mid-document (rule ID == document order).
   Rationale: stable identifiers, Observable Quality.

2. **Pack section: "Intent-Level Orchestration"** (exact content
   the implementation applies verbatim):

   ```markdown
   ---

   ## Intent-Level Orchestration

   Sequence-level collapse, known externally as the Router Pattern: the
   agent outputs a single intent, and deterministic tool code maps it to
   the required sequence of calls. Shipped precedent:
   `uf_unleash_branch_gate`, `uf_unleash_detect_resume`,
   `uf_delegate_command`, `dispatch_review_runs`.

   - **DE-005** [MUST] A fixed sequence of tool calls with no judgment
     between steps — each next call and its arguments fully determined
     by the previous call's structured result — is itself mechanical
     instruction and MUST be collapsed into a single intent-level tool.
     The agent expresses the intent and passes judgment products
     (composed text, human gate decisions) as parameters; ordering,
     batching, retry, failure-stop, and branching on structured results
     belong to the tool. Instructing an agent to chain tools through a
     judgment-free sequence is a DE-001-class violation.

   - **DE-006** [SHOULD] Intent-level tools SHOULD keep judgment at
     their boundary: judgment products arrive as validated parameters,
     and routing decisions (verdict mapping, severity sorting,
     exit-variant selection, batch scheduling, failure-stop) execute
     inside the tool as constants or pure functions. A tool whose
     contract requires the agent to pre-compute its internal routing
     re-introduces the orchestration DE-005 removes.
   ```

   Plus: frontmatter `version: 1.0.0` → `1.1.0`; severity-mapping
   sentence updated to "(DE-001, DE-003, DE-005)" for MUST and
   "(DE-002, DE-004, DE-006)" for SHOULD. The intro paragraph and
   DE-001..DE-004 stay byte-unchanged.

3. **Skill edits: five enumerated prose updates + one new
   section.** The skill is the authoring-time mirror of the pack;
   keeping the pair in step follows the determinism-codification
   precedent. Exact edits (issue #758):

   - Frontmatter `description` second sentence becomes "...Route
     fixed procedures and judgment-free tool chains through
     executable tools instead of improvised prose output." The
     first sentence stays byte-identical so skill-selection
     matching is unaffected.
   - "Classify Before Writing" twice-test paragraph appends:
     "The same test applies one level up: a fixed sequence of
     tool calls with no judgment between steps is itself
     deterministic."
   - Mechanical-procedures bullets add "Orchestration of tool
     chains (ordering, batching, retry, failure-stop)" and
     "Branching on structured results via lookup tables (verdict
     mapping, severity sorting)".
   - Numbered procedure gains step 4: "If the tool now sits in a
     judgment-free chain of calls, collapse the chain into a
     single intent-level tool; pass judgment products (composed
     text, gate decisions) as parameters."
   - "Related Enforcement" becomes "DE-001 through DE-006".
   - New section "Chains Without Judgment Collapse Too" between
     "Deterministic Steps Belong in Tools" and "Judgment Belongs
     in Prose" — mid-document insertion is safe because no rule
     IDs live in the skill body. Exact content:

   ```markdown
   ## Chains Without Judgment Collapse Too

   Extraction does not stop at single steps. When a fixed sequence of
   tool calls with no judgment between steps — each next call and its
   arguments fully determined by the previous call's structured result —
   the sequence is itself a deterministic step. Collapse it into one
   intent-level tool whose code performs the chaining.

   The twice-test applies one level up: if a competent agent executing
   the chain between two judgment points produces the same calls in the
   same order both times, the chain belongs in code. Re-reading and
   re-sequencing ten tool calls on every run costs the same scarce
   context as ten steps of prose choreography.

   Judgment stays at the boundary: composed content and human gate
   decisions arrive as tool parameters; branching on structured results
   (verdict mapping, severity sorting, exit-variant selection, batch
   scheduling, failure-stop) happens inside the tool. Shipped
   precedent: `uf_delegate_command` (command file read → prompt
   assembly → child session spawn → artifact verification →
   checkpoint) and `dispatch_review_runs` (plan → evidence → fan-out →
   consolidate → artifact).
   ```

4. **AGENTS.md: option b (leave alone).** The AGENTS.md
   determinism-gate category list (parsing, existence checks,
   git choreography, output template rendering, enumeration
   loops) does not name tool-chain orchestration. Adding a
   category would grow every prompt that embeds AGENTS.md; the
   pack is the stricter, more specific layer and is what
   reviewers cite; constitution Principle VI supremacy resolves
   conflicts upward; DE-005 extends rather than contradicts the
   AGENTS.md enumeration. Decision recorded in the proposal per
   learning `governance-20261014T151535`.

5. **DE-004 evidence as a metrics artifact.** Before/after line
   and token counts for both files go into
   `openspec/changes/router-pattern-codification/metrics.md`,
   following the `command-prose-pilot` `metrics.md` precedent
   ("Measured Deltas (DE-004)"). The counts are captured at
   implementation time, after the edits land.

6. **Spec delta pins IDs and severity pairs.** The
   `determinism-policy` delta uses ADDED requirements that
   pin DE-005 [MUST] / DE-006 [SHOULD], terminal-section
   placement, the version bump, severity-mapping update, and the
   DE-001..DE-004 byte-stability constraint — mirroring how
   determinism-codification pinned DE-001..DE-004 via its own
   ADDED requirements. No canonical
   `openspec/specs/determinism-policy/` spec exists, so ADDED
   is the structurally correct header (MODIFIED would fail
   `openspec validate --strict`); compliance is mechanically
   checkable at spec review.

7. **Cross-layer wording diffing is an explicit spec-review
   step.** Per learning `governance-20261014T151535`, the
   verification tasks include comparing MUST-rule wording across
   the pack and skill layers so the pair cannot drift. The
   alignment criterion is verbatim-core: the DE-005 MUST core
   clause is verbatim-identical across layers (sentence-initial
   capitalization aside), RFC 2119 markers preserved, no
   softening qualifiers; the routing-decision enumerations are
   unified to the same five items in both layers.

These decisions relate to the constitution principles as
assessed in the proposal: Autonomous Collaboration (rules as
artifacts, no runtime coupling), Composability First (additive,
repo-local, independently consumable files), and Observable
Quality (stable greppable IDs, measured deltas, pinned spec
requirements).

## Risks / Trade-offs

- **Classification ambiguity at the boundary.** Deciding
  whether a chain is truly judgment-free can be contested.
  Mitigation: DE-005's test is the twice-test lifted one level
  (same calls in the same order on re-execution), and DE-006
  frames boundary judgment as SHOULD guidance.
- **Review-prompt token cost.** The pack grows by ~28 lines and
  the skill by ~20; both ride existing auto-discovery into
  every review. Accepted for the same reason
  determinism-codification accepted ~30 lines: rule coverage
  outweighs prompt cost, and #659 tracks the token budget.
- **No automated DE-005 enforcement.** Like DE-001..DE-004,
  enforcement is review-time citation, not CI. Migrations of
  existing prose remain opportunistic (#757, #664).
- **Skill description matching.** Editing frontmatter
  descriptions risks breaking skill selection; mitigated by
  keeping the first sentence byte-identical and extending only
  the second.
- **Golden-file coupling.** Nothing in this change touches
  embedded assets or drift tests, so the existing
  drift-exclusion entries need no updates — verified by
  `make test` in the verification tasks.
