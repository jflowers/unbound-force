## Context

Across 24 files (18 source + 6 scaffold assets), interactive
confirmation gates reference `AskUserQuestion tool` — a name
that does not exist in OpenCode's tool registry. The actual
tool is `question`. This mismatch may cause agents to skip
interactive gates entirely.

The proposal (proposal.md) confirmed constitution alignment:
all five principles are N/A or PASS since this is a text-only
rename with no functional changes.

## Goals / Non-Goals

### Goals
- Replace all occurrences of `AskUserQuestion tool` (and
  variants) with `question tool` across all 24 affected files
- Maintain drift detection parity between `.opencode/` source
  files and `internal/scaffold/assets/opencode/` embedded copies
- Preserve all existing gate logic unchanged

### Non-Goals
- Refactoring gate logic or adding new interactive gates
- Adding a tool alias mechanism to OpenCode
- Addressing mandatory gate markers (#474) or guardrail
  hardening (#473) — those are separate issues
- Modifying any Go source code or test logic
- Updating historical OpenSpec change artifacts or CHANGELOG
  entries that reference the old tool name — these are accurate
  historical records of what was implemented at the time

## Decisions

### D1: Direct rename (Option A from #475)

Replace all occurrences directly rather than defining an alias.
The tool name should match the actual tool. Relying on agents
to infer the mapping is fragile and adds indirection.

### D2: Case-sensitive replacement patterns

The occurrences use several formatting variants that must all
be caught:

| Pattern | Replacement |
|---|---|
| `**AskUserQuestion tool**` | `**question tool**` |
| `**AskUserQuestion**` (bold, no "tool") | `**question**` |
| `AskUserQuestion tool` (plain) | `question tool` |
| `AskUserQuestion` (standalone reference) | `question` |

The core replacement is `AskUserQuestion` → `question` in all
contexts, preserving surrounding formatting (bold markers,
backticks) and suffixes (`tool`, `tool call`, `response`,
`Required`). Each file must be reviewed individually to ensure
the replacement reads naturally in context.

### D3: Scaffold asset lockstep update

The embedded scaffold assets under
`internal/scaffold/assets/opencode/` are canonical copies of
the `.opencode/` source files. Both must be updated in the same
commit to pass drift detection tests. The 6 affected scaffold
files are:

- `internal/scaffold/assets/opencode/commands/uf.address-feedback.md`
- `internal/scaffold/assets/opencode/commands/uf.finale.md`
- `internal/scaffold/assets/opencode/commands/uf.review-council.md`
- `internal/scaffold/assets/opencode/commands/uf.review-pr.md`
- `internal/scaffold/assets/opencode/commands/uf.triage-issue.md`
- `internal/scaffold/assets/opencode/skills/speckit-workflow/SKILL.md`

## Risks / Trade-offs

### Low risk: Mechanical edit scope

The change is entirely mechanical (text replacement). However,
with 24 files and 100+ occurrences, manual review of each
replacement is warranted to avoid breaking surrounding markdown
formatting or instruction context.

### Mitigation: Drift detection

Existing drift detection tests will catch any mismatch between
`.opencode/` and `internal/scaffold/assets/opencode/` files,
providing a safety net against incomplete updates.
