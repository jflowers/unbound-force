## Context

The token-reduction arc (epic #659, the uf.unleash audit in issue
#716, and the compiled Dewey article
`.uf/dewey/compiled/token-reduction.md`, draft tier pending human
promotion) established that behavioral
guards mitigate prompt-drift symptoms while tool-executed
determinism cures the cause. The practice is not yet codified, so it
regresses with every new command template and gives reviewers no
rule to cite. The proposal's constitution alignment (all five
principles PASS) frames this design.

Verified drift-test facts that constrain the design:

- `specify/` scaffold assets are starter templates, excluded from
  drift tests (scaffold_test.go:115-119) — the live constitution can
  be amended without touching the scaffold.
- AGENTS.md is not embedded; edits are repo-local by construction.
- `.opencode/{commands,agents,skills,uf/packs}` are walked by
  `TestCanonicalSources_AreEmbedded` — any new unmirrored file MUST
  be listed in `knownNonEmbeddedFiles` or `make test` fails.
- `.opencode/skills/always-on-guidance/SKILL.md` IS embedded and
  byte-identical drift-enforced — a repo-only edit to it is not
  viable.

## Goals / Non-Goals

### Goals
- Codify the determinism principle at four enforcement layers:
  constitution (planning-time Constitution Check), AGENTS.md
  Behavioral Rule (session-time, CRITICAL classification), review
  convention pack (Divisor review prompts), and skill (coding agent
  guidance).
- Keep every change repo-local; no scaffold asset is created,
  modified, or removed.
- Zero runtime dependencies and zero plugin code changes.
- All existing gates stay green (`make test`, `make plugin-test`).

### Non-Goals
- Extracting uf.unleash instruction into plugin tools — that is
  issue #716's follow-on increments, not codification.
- Propagating the pack or skill to hero repositories via `uf init`.
- Editing the `always-on-guidance` skill (embedded and
  drift-enforced; a new skill avoids the conflict).
- Retroactively rewriting existing command templates — DE rules
  govern new and modified instruction; cleanup happens
  opportunistically at review time.

## Decisions

1. **Four-layer codification.** Each layer reaches a different
   consumer: the constitution binds planning-time Constitution
   Checks org-wide; the AGENTS.md rule binds every session in this
   repo and gives reviewers a CRITICAL classification; the pack
   injects the rules into every Divisor review prompt via existing
   readdir auto-discovery; the skill guides coding agents at
   authoring time. Defense in depth with no single point of
   enforcement.

2. **New skill rather than editing `always-on-guidance`.** The
   existing skill is scaffold-embedded and drift-enforced; a
   repo-only edit breaks `make test`. A new
   `determinism-first/SKILL.md` plus a `knownNonEmbeddedFiles`
   entry keeps the scaffold frozen (Composability First: the skill
   is independently consumable and removable).

3. **`knownNonEmbeddedFiles` as the repo-local mechanism.** It is
   the sanctioned exclusion map for local-only files (precedent:
   speckit, opsx, gaze commands). A two-line test-file change
   registers both new files; no scaffold asset exists for either.

4. **Hero adoption via constitutional alignment, not scaffolding.**
   Principle VI adds MUST rules, so hero repositories must open
   alignment issues within one release cycle under the existing
   `## Hero Constitution Alignment` mechanism. Slower than scaffold
   propagation, but principle adoption is a governance act per repo
   and the pack/skill wording may need per-hero adaptation.

5. **Constitution amendment as a spec-exempt rider.** AGENTS.md
   exempts constitution amendments from the spec workflow; the
   amendment rides this change's PR for a single review cycle.
   Version bumps 1.3.1 → 1.4.0 (MINOR: new principle). No migration
   plan is required — no principle is altered or removed — but the
   SYNC IMPACT REPORT comment is updated per the established format
   and the hero alignment obligation is recorded.

6. **Pack rules DE-001..DE-004 follow the governance-pack
   conventions** (`content.md`/`ci.md` precedent) — RFC 2119
   markers with severity mapping to the severity pack, in
   domain-specific sections rather than the coding-pack H2
   schema. The DE- prefix is verified unused across live packs
   and scaffold assets; TD- was rejected because it collides with
   the content pack's TD-001..TD-008 in the globally co-loaded
   rule namespace (including a MUST-vs-SHOULD conflict on
   TD-002). DE-001 and DE-003 are MUST (violations are CRITICAL
   findings); DE-002 and DE-004 are SHOULD (guidance that is
   valuable but not universally applicable — not every change
   touches instruction text, and MUST would manufacture
   false-positive CRITICALs).

7. **AGENTS.md pack listing made exhaustive.** While adding
   `determinism.md` to the Convention Packs section, the unlisted
   `ci.md` and `ci-custom.md` are also added, making the listing
   match the directory (Observable Quality: the listing becomes a
   verifiable inventory).

8. **Validator skip-list entry for the governance pack.**
   `ValidateConventionPack` requires `pack_id`/`language`/
   `version` frontmatter and six coding H2 sections; a
   governance-style pack does not fit that schema. The pack is
   added to the `TestValidateConventionPack_AllPacksValid` skip
   list with a rationale comment, mirroring the `severity.md`,
   `content.md`, and `ci.md` precedent rather than forcing
   governance rules into coding-section scaffolding.

## Risks / Trade-offs

- **Classification ambiguity.** "Mechanical" versus "judgment" is
  itself a judgment call. Mitigated by the skill's heuristic (fixed
  procedure, same output every time → tool) and concrete examples
  in the pack (parsing, existence checks, git choreography,
  template rendering, enumeration loops).
- **Review-prompt token cost.** Every Divisor prompt gains the pack
  (~30 lines). Accepted: governance rules are the intended payload
  of packs, and the pack prevents larger future prose accumulation.
- **Golden-test coupling.** `.opencode/test/` may assert pack sets
  in prompt assembly. If a golden breaks, the fixture is updated —
  verification is a task with `make plugin-test`.
- **No automated DE enforcement.** DE rules are review-enforced,
  not lint-enforced. A prose-pattern linter is a possible future
  increment; out of scope here.
- **Hero alignment overhead.** New MUST rules trigger alignment
  issues across hero repos within one release cycle. This is the
  standard, intended cost of a constitutional amendment.
