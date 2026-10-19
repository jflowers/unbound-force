<!--
  [P] marks tasks eligible for parallel execution.
  Add [P] when a task: (a) touches different files from
  other [P] tasks in the group, (b) has no dependency
  on prior tasks in the group, (c) can safely execute
  without ordering constraints.
  Do NOT add [P] when tasks modify the same file —
  parallel workers will cause merge conflicts.
  Tasks without [P] run sequentially first, then [P]
  tasks run in parallel.
-->

## 1. Author governance artifacts

- [x] 1.1 [P] Edit `.opencode/uf/packs/determinism.md`: bump
  frontmatter `version: 1.0.0` → `1.1.0`; update the
  severity-mapping sentence to "(DE-001, DE-003, DE-005)" /
  "(DE-002, DE-004, DE-006)"; append the verbatim
  `## Intent-Level Orchestration` section (DE-005 [MUST],
  DE-006 [SHOULD]) from design.md decision 2 after
  `## Efficiency Evidence`. Touch nothing else.
- [x] 1.2 [P] Edit `.opencode/skills/determinism-first/SKILL.md`
  per design.md decision 3: five enumerated prose updates
  (description second sentence with first sentence
  byte-identical; twice-test extension; two new bullets;
  procedure step 4; "DE-001 through DE-006") plus the new
  `## Chains Without Judgment Collapse Too` section between
  `## Deterministic Steps Belong in Tools` and
  `## Judgment Belongs in Prose`.
- [x] 1.3 [P] Add the `CHANGELOG.md` entry: DE-005/DE-006
  added to the determinism pack (v1.1.0), determinism-first
  skill chain-collapse guidance.
- [x] 1.4 File the documentation issue required by the AGENTS.md
  docs-issue gate against this repo (unbound-force/unbound-force):
  DE-005/DE-006 enter every Divisor review prompt via pack
  auto-discovery, altering repo-wide review-council behavior —
  user-facing per the determinism-codification #720 precedent.
  Reference issue #758 and the change branch in the issue body.
  No repository file changes.

## 2. Verification

- [x] 2.1 Record `metrics.md` in this change directory with
  before/after line and token counts for both edited files
  (before counts via `git show` of the pre-change commit,
  after counts from the working tree), per the
  `command-prose-pilot` metrics precedent. Requires 1.1
  and 1.2 (guaranteed by phase ordering).
- [x] 2.2 Run `make test` — drift tests must confirm both
  files remain repo-local (knownNonEmbeddedFiles) with no
  scaffold-asset coupling.
- [x] 2.3 Run
  `go test -race -count=1 ./internal/schemas/... ./internal/scaffold/...`
  — pack validator skip-list entries must hold.
- [x] 2.4 Byte-stability check: `git diff` must show the
  DE-001..DE-004 rule text, the pack intro paragraph, and the
  skill description's first sentence byte-unchanged; new pack
  content must be append-only (version line and
  severity-mapping sentence are the only modified lines).
- [x] 2.5 Cross-layer wording diff: compare the intent-level
  collapse language between the pack (DE-005/DE-006) and the
  skill (Chains Without Judgment Collapse Too) against the
  verbatim-core alignment criterion in the spec; resolve any
  divergence before completion (learning
  `governance-20261014T151535`).
- [x] 2.6 Skill discoverability: confirm the edited frontmatter
  still parses (valid YAML, name/description/tags present).
- [x] 2.7 Constitution alignment check: confirm no
  constitution, AGENTS.md, scaffold-asset, or plugin-code
  changes are included in the diff (option b recorded in the
  proposal, not the tree).
- [x] 2.8 Run
  `openspec validate router-pattern-codification --type change --strict`.
