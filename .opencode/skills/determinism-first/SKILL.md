---
name: determinism-first
description: Classify work as deterministic or judgment-based before writing. Route fixed procedures and judgment-free tool chains through executable tools instead of improvised prose output.
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
defaulting to prose. The same test applies one level up: a fixed
sequence of tool calls with no judgment between steps is itself
deterministic.

## Deterministic Steps Belong in Tools

Mechanical procedures that MUST be tool calls, not
instructed prose:

- Parsing structured input (YAML, JSON, diffs, frontmatter)
- Existence and state checks (file present, branch current,
  tool available)
- Git choreography (worktrees, staging, merge-base diffs)
- Prescribed terminal output rendered from templates
- Enumeration loops over directories, files, or checks
- Orchestration of tool chains (ordering, batching, retry,
  failure-stop)
- Branching on structured results via lookup tables (verdict
  mapping, severity sorting)

When a deterministic step is needed:

1. Find an existing tool that performs it and call it.
2. If none exists, extract the procedure to an executable
   script or command with tests — do not restate the
   procedure in prose for the agent to re-derive.
3. Prescribed output MUST be tool-rendered, not
   reconstructed by the agent from a template embedded in
   instructions.
4. If the tool now sits in a judgment-free chain of calls,
   collapse the chain into a single intent-level tool; pass
   judgment products (composed text, gate decisions) as
   parameters.

When prose is extracted into a tool, preserve one or two
real output-format examples near the decision point that
consumes them, so later readers can still recognize correct
output. Behavioral guards written in prose are interim
mitigations, not the mechanism of record.

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
- Review rules DE-001 through DE-006
  (`.opencode/uf/packs/determinism.md`)
