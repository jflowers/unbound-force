## Context

OpenCode's DCP plugin compresses user messages during long
sessions but respects `<protect>` tags as non-compressible
markers. Slash commands are injected as user messages and
therefore subject to compression. Six command templates in
`internal/scaffold/assets/opencode/commands/` contain
critical sections that MUST survive compression:

| Category | Examples | Risk if Lost |
|----------|----------|--------------|
| Session-resume guards | Re-read-template instructions | Agent proceeds with stale/missing context |
| Execution checklists | State variables (BRANCH, COMMIT, PR_URL) | Duplicate actions, lost progress |
| Mandatory gates | Human confirmation before posting/pushing | Unconfirmed destructive actions |
| Guardrails | MUST/MUST NOT behavioral constraints | Constitution violations |
| Critical algorithms | Verdict resolution, diff scope rules | Incorrect decisions |

## Goals / Non-Goals

### Goals
- Wrap all critical sections in `<protect>` tags across
  6 command templates.
- Preserve existing content verbatim -- no rewording,
  reordering, or behavioral changes.
- Follow a consistent tagging pattern so future commands
  can apply the same approach.

### Non-Goals
- Modifying command behavior or logic.
- Adding `<protect>` tags to non-command files (skills,
  agents, convention packs).
- Updating already-scaffolded projects (users run
  `uf init --force` to pull updates).

## Decisions

**What to protect**: Each command file's entire
instruction body -- from the `## Instructions` heading
(or first functional section) through the `## Guardrails`
section -- is wrapped in a single `<protect>` tag.

These command files are orchestration pipelines where
every section is execution-critical: step sequences,
branching logic, exit conditions, checkpoint markers,
session-resume guards, mandatory gates, and guardrails.
Selectively protecting a few sections leaves the actual
pipeline steps vulnerable to compression, which causes
skipped steps, lost context, and incorrect execution.

Only the informational header (description, usage, and
arguments) is left outside the tag. This content is
non-critical -- losing it does not affect execution.

**Tag placement**: One `<protect>` tag per file wrapping
the entire instruction body. Example:

```markdown
## Description
[informational -- outside protect]

## Instructions

<protect>

> **SESSION-RESUME GUARD**: ...
[all steps, checklists, gates, guardrails]

</protect>
```

**No nesting**: Only one `<protect>` tag per file.
Inner `<protect>` tags from the previous implementation
are removed.

**Whitespace**: One blank line after `<protect>` open
tag, one blank line before `</protect>` close tag, to
maintain Markdown rendering compatibility.

## Risks / Trade-offs

**Token budget pressure**: Protected content consumes
tokens even when DCP would otherwise compress it. The
6 files total ~4,779 lines; protecting ~85-95% of each
file means ~4,000-4,500 lines are non-compressible.
This is acceptable because these commands are invoked
one at a time (not all 6 simultaneously), and each
command's full content is essential for correct
execution.

**Over-protection is preferable to under-protection**:
The original design tried to minimize protected content
to help DCP compress more. In practice, partial
protection of orchestration pipelines is worse than
full protection because losing any step, gate, or
branching logic causes incorrect execution -- a more
severe failure than token pressure.

**Maintenance burden**: Future edits to protected sections
must preserve the `<protect>` tags. This is a minor
burden since the tags are visible markers. Convention
pack rules could enforce this in future if needed.

**Stale scaffolded copies**: Projects scaffolded before
this change will not have `<protect>` tags until they
run `uf init --force`. This is the existing upgrade
model for all scaffold changes.
