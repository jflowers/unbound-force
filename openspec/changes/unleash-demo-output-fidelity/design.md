## Context

`/uf.unleash` is an 10-step autonomous pipeline. Step 10
(Demo) presents a structured summary ending with prescribed
"Next Steps" options. After heavy context compression, the
agent improvised this output instead of following the
template, producing incorrect exit text.

The existing compression-resilience work (merged
`fba87cf`, #380) added behavioral mitigations (Session-
Resume Guard, execution checklist, per-step checkpoints)
that track pipeline state. This change addresses a
different failure mode: content fidelity at the final
output step, where the agent must emit prescribed text
rather than track state.

The `always-on-guidance` skill is currently repo-local
(listed in `knownNonEmbeddedFiles` in `scaffold_test.go`).
To propagate the template-fidelity rule org-wide, it must
be added to the scaffold embed assets.

## Goals / Non-Goals

### Goals

- Ensure `/uf.unleash` Step 10 Demo always emits the
  prescribed Next Steps text from the template
- Add a cross-cutting rule that applies to all command
  templates: re-read prescribed output before emitting
- Propagate the fidelity rule org-wide via scaffold
- Clarify that `/uf.unleash` Step 8 satisfies the
  pre-PR `/uf.review-council` requirement in AGENTS.md

### Non-Goals

- Fixing compression behavior itself (that is the
  model/infrastructure layer, not the template layer)
- Modifying other commands' exit text (scope is
  `/uf.unleash` only per user decision)
- Archiving the stale `unleash-compression-resilience`
  change directory (separate chore branch)
- Changing Step 8 behavior (it already works correctly)

## Decisions

### D1: JIT re-read instruction in Step 10

Add an instruction at the top of Step 10 Demo requiring
the agent to re-read the Step 10 Demo section of this
template file (from the `### 10. Step 8 -- Demo` heading
through the CHECKPOINT blockquote) before composing any
demo output. Reference the section by heading, not line
numbers, so the instruction remains stable across future
template edits. This is positioned as the first action
in Step 10, before any summarization.

**Rationale**: The Session-Resume Guard (L32-44) tells
agents to re-read the entire template after compression,
but by Step 10 the agent may have already re-read and then
compressed again. The JIT re-read is a targeted last-mile
safeguard specifically for the output-composition step.

### D2: Reconcile divergent Next Steps blocks

The current template has two representations of the same
content:

- **Prose** (L681-685): Describes commands with expanded
  descriptions ("to commit, push, create PR, and return
  to main")
- **Format block** (L707-710): Shows the exact output text
  ("Run `/uf.finale` to create PR and watch CI")

These diverge slightly (e.g., "commit, push, create PR" vs
"create PR and watch CI"). Reconcile into a single source
of truth: keep the format block as canonical (it is the
exact text to emit) and update the prose to reference the
format block rather than paraphrasing it.

**Rationale**: Two divergent descriptions of the same
output create ambiguity. A single canonical source
eliminates interpretation errors.

### D3: Explicit Step 8 equivalence note

Add a note in Step 10's Next Steps prose stating:

> Note: The pre-PR `/uf.review-council` requirement
> (AGENTS.md) is already satisfied by Step 8, which runs
> the review council in Code Review Mode. Do NOT suggest
> `/uf.review-council` as a next step — it has already
> been executed.

**Rationale**: The agent's deviation included wrongly
re-suggesting `/uf.review-council`. This was caused by
the AGENTS.md rule ("MUST run `/uf.review-council` before
PR submission") being recalled from compressed context
without the knowledge that Step 8 already satisfies it.

### D4: Guardrail addition

Add to the Guardrails section:

> NEVER improvise Demo exit text — the "Next Steps"
> section in Step 10 prescribes the exact output; re-read
> and reproduce it verbatim.

**Rationale**: Makes the prohibition explicit alongside the
existing guardrails (L716-740). The existing guardrail
"ALWAYS present exit messages with actionable next steps"
is too vague — it permits the agent to invent its own
actionable next steps.

### D5: Command Template Fidelity rule

Add a new section to `always-on-guidance/SKILL.md`:

```markdown
## Command Template Fidelity

- When a command template prescribes fixed terminal output
  (exit messages, next-step options, formatted blocks),
  re-read that section from the template file before
  emitting — never reconstruct prescribed output from
  memory or compressed context
- After context compression, the template file is the
  sole authority for prescribed output format
```

**Rationale**: This is a cross-cutting behavioral rule
that applies beyond `/uf.unleash`. Any command with
prescribed exit text is vulnerable to the same
improvisation failure after compression.

### D6: Scaffold always-on-guidance for org-wide propagation

Move `always-on-guidance/SKILL.md` from repo-local to
scaffolded:

1. Copy canonical `.opencode/skills/always-on-guidance/
   SKILL.md` to `internal/scaffold/assets/opencode/skills/
   always-on-guidance/SKILL.md`
2. Add `opencode/skills/always-on-guidance/SKILL.md` to
   `expectedAssetPaths` in `scaffold_test.go`
3. Remove `.opencode/skills/always-on-guidance/SKILL.md`
   from `knownNonEmbeddedFiles` in `scaffold_test.go`

The drift test (`TestEmbeddedAssets`) will then enforce
canonical == embedded parity, same as for `uf.unleash.md`,
`pre-flight/SKILL.md`, `review-context/SKILL.md`, and
`speckit-workflow/SKILL.md`.

**Rationale**: User chose org-wide propagation. The
scaffold embed pattern is well-established. This ensures
all hero repos that run `uf init` inherit the template-
fidelity rule.

### D7: AGENTS.md review-council clarification

Amend the review-council rule (L165) from:

> MUST run `/uf.review-council` before PR submission.

to:

> MUST run `/uf.review-council` before PR submission
> (already executed as `/uf.unleash` Step 8; do not
> re-run).

Also update the PR Review Commands table (L194) to add a
note in the "When" column.

**Rationale**: Clarifies equivalence without weakening the
gate. The council still runs; it just runs as part of the
`/uf.unleash` pipeline rather than as a separate
invocation. This prevents agents from wrongly
re-suggesting the command after `/uf.unleash` completes.

The wording uses "already executed as" rather than
"satisfies" to make clear the requirement is met, not
waived. The instruction is specifically about not
duplicating the run, not about skipping it.

### D8: Add `.opencode/skills` to reverse-drift test

The `TestCanonicalSources_AreEmbedded` test (scaffold_test.go)
walks `canonicalDirs` to detect canonical files that are
neither embedded nor excluded. Currently it only walks
`.opencode/commands`, `.opencode/agents`, `.opencode/uf/packs`
— not `.opencode/skills`. Adding `.opencode/skills` to
`canonicalDirs` closes the reverse-drift gap for all
scaffolded skills (not just `always-on-guidance`).

**Rationale**: Without this, a future canonical skill edit
could go unsynced to the scaffold copy, and only the forward-
drift test would catch it (by comparing embedded vs canonical).
The reverse-drift test would not flag a *new* skill file
added without a scaffold entry. This is a one-line fix that
benefits all scaffolded skills.

## Risks / Trade-offs

### R1: Template size growth

Adding a JIT re-read instruction, an equivalence note,
and an extra guardrail increases `uf.unleash.md` by
approximately 15-20 lines (from ~740 to ~760). This is
well within acceptable template size.

**Mitigation**: The additions are concise and targeted.

### R2: Scaffold sync maintenance burden

Adding `always-on-guidance` to the scaffold creates
another file pair requiring sync. Any future edit to
the canonical SKILL.md must be mirrored to the scaffold
copy.

**Mitigation**: The drift test `TestEmbeddedAssets`
catches desync automatically. This is the same pattern
used for 3 other skills and all command templates.

### R3: AGENTS.md amendment could be misread as weakening

A careless reader might interpret the parenthetical as
permission to skip the review council entirely.

**Mitigation**: The MUST language is preserved. The
parenthetical clarifies *how* the requirement is
satisfied, not that it can be skipped. The council
still runs — inside `/uf.unleash` Step 8.

## Test Strategy

All verification is through existing scaffold drift tests.
No new Go *production* source code is introduced. The only
Go file modified is `scaffold_test.go` (test infrastructure),
which updates the asset manifest to include the new scaffold
file. The drift tests enforce:

- `TestEmbeddedAssets`: canonical == embedded for both
  `uf.unleash.md` and `always-on-guidance/SKILL.md`
- `TestEmbeddedAssets_SingleMarker`: exactly one scaffold
  marker per file
- Reverse-drift test: every canonical `.opencode` source
  is either embedded or in `knownNonEmbeddedFiles`
  (D8 adds `.opencode/skills` to `canonicalDirs` to
  close the gap for skills)

Coverage type: integration (scaffold drift tests).
Coverage target: all modified scaffold assets must pass
byte-identity checks. No unit or e2e tests apply — this
change modifies agent instructions and scaffold manifests,
not executable code paths.

Manual verification: grep for `/uf.review-council` in
Step 10 Next Steps to confirm it is absent. Also verify
"NEVER improvise Demo exit text" in Guardrails,
"Command Template Fidelity" in always-on-guidance, and
Step 8 equivalence note in Step 10.
<!-- scaffolded by uf vdev -->
