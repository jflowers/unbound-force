## Context

The convention pack system deploys code-quality and content rules to
`.opencode/uf/packs/`. Language packs (`go.md`, `typescript.md`, `python.md`)
and universal packs (`default.md`, `severity.md`, `content.md`) each have a
corresponding `-custom.md` override file that survives `uf init`. Review
commands (`review-pr`, `review-council`, `triage-issue`, `address-feedback`)
load packs during their assessment phase to apply rules.

The `/uf.review-pr` command loads packs at Step 3.9, passes them to child
agent prompts for code analysis, then formats prose output in Steps 7 (terminal
report) and 9 (GitHub review posting). The `/uf.address-feedback` command
loads all packs via `opencode/uf/packs/*.md` glob and produces reply comments
in Phase 4.5. Neither command has a mechanism to apply prose-style rules to
their formatted output.

A user-local `review-voice` skill exists at `~/.config/opencode/skills/review-voice/SKILL.md`
defining Socratic review voice rules (sentence length, diagnostic-question
framing, severity signaling through specificity). This skill is not scaffolded,
survives neither `uf init` nor re-scaffold, and is not available on other
machines without manual setup.

## Goals / Non-Goals

### Goals
- Ship a canonical `review-voice.md` convention pack scaffolded by `uf init`
  with the same Socratic voice rules currently in the user-local skill.
- Ship a `review-voice-custom.md` empty stub that survives `uf init` so teams
  can customize review voice without editing tool-owned files.
- Have `/uf.review-pr` load and apply these voice rules to prose in Steps 7
  and 9 (findings, summary, verdict justification, GitHub comment bodies).
- Have `/uf.address-feedback` apply voice rules to reply comment prose in
  Phase 4.5.
- Exclude voice rules from structured data: CI tables, walkthrough tables,
  coverage matrices, JSON artifacts, and tool output.

### Non-Goals
- Applying voice rules to `/uf.review-council` — the council command produces
  structured review body output, not freeform prose.
- Applying voice rules to `/uf.triage-issue` — triage output is structured
  classification data, not reviewer-authored prose.
- Passing voice packs to child agent prompts — voice is an output formatting
  concern, not a code analysis rule.
- Replacing the user-local `review-voice` skill — that skill remains an
  alternative loading mechanism for users who invoke `/uf.review-pr` in repos
  that have not been scaffolded with the pack.
- Auto-loading `content.md` or `content-custom.md` in review-pr — these
  remain excluded per existing Step 3.9 rule 5.

## Decisions

### D1: Voice packs as convention packs, not skills

**Decision**: Ship voice rules as `.opencode/uf/packs/review-voice.md`, not
as a skill at `.opencode/skills/review-voice/SKILL.md`.

**Rationale**: Convention packs are always-deployed, survive `uf init`, are
automatically listed in `AGENTS.md`, and follow the established `-custom.md`
override pattern. Skills require separate loading via the `skill` tool and are
not automatically discovered. The pack mechanism is the right fit for
repo-local, scaffolded configuration.

### D2: Voice packs not passed to child agents

**Decision**: `review-voice.md` is loaded by the orchestrating command (Steps
3.9/7/9 in review-pr, Phase 4.5 in address-feedback) but never included in
child agent prompts.

**Rationale**: Child agents analyze code against code-quality packs (`go.md`,
`default.md`, `severity.md`). Voice rules are purely about how the orchestrator
presents findings, not what the child agents look for. Including voice rules
in child prompts wastes tokens and confuses the agent about its role.

### D3: Voice applied at prose boundaries, not universally

**Decision**: Voice rules apply only to findings, summary text, verdict
justification, and GitHub comment bodies. They explicitly do NOT apply to
structured tables (CI status, walkthrough, dispatch provenance), tool output,
or JSON payloads.

**Rationale**: The issue specification calls this out. Structured data must
remain machine-parseable and is not improved by Socratic reframing. Voice
rules are about reviewer-authored prose, not system-generated data.

### D4: `review-voice-custom.md` is user-owned

**Decision**: `isToolOwned()` in `scaffold.go` already returns `false` for
files containing `-custom` (line ~678: `return !strings.Contains(base, "-custom")`).
No code change needed — the custom pack inherits user-ownership automatically.

**Rationale**: This is the established pattern for `go-custom.md`,
`typescript-custom.md`, etc. No reason to deviate.

### D5: `review-voice.md` and `review-voice-custom.md` are always-deployed

**Decision**: Add both to `alwaysDeployedPacks` in `scaffold.go`.

**Rationale**: Review voice is language-agnostic. Every generated repository
benefits from having review voice rules available, regardless of detected
language. This is consistent with `default.md`, `severity.md`, `content.md`,
and their custom counterparts — all always-deployed.

### D6: `address-feedback` gets explicit voice directives

**Decision**: Even though `address-feedback` already loads all packs via glob,
add explicit instructions in Phase 4.5 to apply `review-voice.md` rules to
reply comment prose.

**Rationale**: The glob ensures `review-voice.md` is available, but without
explicit instructions the agent won't know to apply voice rules specifically
to prose output. The direction must be structured and scoped — apply to
accept/modify/reject/ask reply text, exclude structured artifact JSON.

## Risks / Trade-offs

- **Risk**: Users who prefer direct, declarative review language (rather than
  Socratic questions) will need to override via `review-voice-custom.md`. The
  canonical pack defaults to Socratic framing because that's the established
  voice for this project. Mitigation: the `-custom.md` file is documented as
  the user's override point.
- **Risk**: Voice rules add token overhead to command execution (loading and
  applying the rules). Mitigation: the `review-voice.md` file is concise (~80
  lines), comparable to `severity.md`. The overhead is negligible relative to
  diff content and child agent prompts.
- **Trade-off**: Auto-deploying `review-voice.md` to all repos means repos
  that don't use `/uf.review-pr` still get the file. This is consistent with
  existing always-deployed packs (`ci.md`, `content.md`) and causes no harm —
  the file is inert without command support.