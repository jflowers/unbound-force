---
name: determinism-first
description: Classify work as deterministic or judgment-based before writing. Route fixed procedures through executable tools instead of improvised prose output.
tags: [determinism, authoring, tools]
---

# Determinism First

Agent context is a scarce shared resource (Constitution
Principle VI, "Deterministic Execution"). Deterministic
procedures MUST execute in tools rather than be re-reasoned
from prose on every run. This skill is the authoring-time
check that keeps mechanical work out of instruction text.

## Classify Before Writing

Before writing or modifying a command, agent, skill, or any
instruction text, classify every step of the work:

- **Deterministic** — fixed procedure, same output every
  time. It belongs in a tool call (script, CLI command, or
  plugin), not improvised output.
- **Judgment-based** — a decision, an evaluation, or human
  interaction. It belongs in prose.

The test: if a competent agent follows the step twice, does
it produce the same result both times? If yes, the step is
deterministic and belongs in a tool. When classification is
uncertain, look at the concrete examples below before
defaulting to prose.

## Deterministic Steps Belong in Tools

Mechanical procedures that MUST be tool calls, not
instructed prose:

- Parsing structured input (YAML, JSON, diffs, frontmatter)
- Existence and state checks (file present, branch current,
  tool available)
- Git choreography (worktrees, staging, merge-base diffs)
- Prescribed terminal output rendered from templates
- Enumeration loops over directories, files, or checks

When a deterministic step is needed:

1. Find an existing tool that performs it and call it.
2. If none exists, extract the procedure to an executable
   script or command with tests — do not restate the
   procedure in prose for the agent to re-derive.
3. Prescribed output MUST be tool-rendered, not
   reconstructed by the agent from a template embedded in
   instructions.

When prose is extracted into a tool, preserve one or two
real output-format examples near the decision point that
consumes them, so later readers can still recognize correct
output. Behavioral guards written in prose are interim
mitigations, not the mechanism of record.

## Judgment Belongs in Prose

Decisions, evaluation, and human interaction are genuinely
judgment-based and stay in prose: choosing between designs,
triaging severity, weighing trade-offs, and interacting
with the user. Prose is the right medium only where the
output legitimately varies with context.

## Related Enforcement

- Constitution Principle VI, "Deterministic Execution"
  (`.specify/memory/constitution.md`)
- "Determinism gate" Behavioral Rule in `AGENTS.md`
- Review rules DE-001 through DE-004
  (`.opencode/uf/packs/determinism.md`)
