---
tier: draft
compiled_at: 2026-08-14T19:59:19Z
compiled_by: claude-opus-4-6
sources:
  - ci-1
topic: spec-workflow
---

# Theme: Specification Workflow Patterns

## Current State (August 2026)

Cross-repo learnings reveal process patterns that improve spec-to-implementation throughput and reduce iteration cycles.

## Pre-Resolving Decisions

The highest-impact process optimization: resolve design decisions BEFORE running `speckit specify`, not during clarification rounds.

**Evidence**: gaze 039-baseline-gazecrap-threshold achieved a whole pipeline zero-findings single `/uf.unleash` run. Success factor: design decisions pre-resolved before the specify phase, eliminating NEEDS CLARIFICATION cycles.

Similarly, review-context-skill triage resolved 3 decisions upfront (hard-dependency over graceful-degradation, matching pre-flight precedent) → clean 5/5 APPROVE from council.

## Spec Artifact Quality

### Most-Missed Elements
From finale and spec-review learnings:
1. **Error-path scenarios**: Consistently underspecified in slash-command delta specs
2. **Algorithm specificity**: Vague descriptions like "process the data" instead of explicit steps
3. **Task phrasing**: "or delete" style options are ambiguous — specs must be definitive (4/5 council flagged)
4. **[P] markers**: Can't cross section dependencies — verify task independence before marking parallel

### Spec Review vs Code Review
Different defect classes caught at different phases:
- **Spec review**: Missing coverage strategy, missing error paths, thread safety requirements
- **Code review**: Assertion quality, DRY violations, naming conflicts

### Design Artifact Maintenance
Update design artifacts when implementation simplifies — e.g., `errors.As` dropped during implementation should be reflected in the design doc (replicator spec-design-alignment).

## Process Anti-Patterns

1. **Don't halt at invented gates**: No gate points in the review-council pipeline except REQUEST CHANGES
2. **Don't mix phase artifacts**: Spec phases produce spec artifacts only; implementation produces source code
3. **Don't skip post-release verification**: Separate from implementation tasks (dewey go-module-v3)
4. **OpenSpec supersession**: Use supersession notes for replaced tasks, don't uncheck completed work

## Cross-Command Consistency
Architect flags DRY violations when instruction substance differs between similar commands. When consolidating, be explicit about strict-parity vs intentional-expansion.

## Speckit CLI Contract (v0.9.4+)
```bash
specify init --here --integration opencode --offline
```
- `--here` replaces `name` positional arg
- `--ai` renamed to `--integration`
- Non-interactive defaults to copilot
- `--offline` uses bundled wheel

## History
- gaze 039-baseline: Pre-resolving decisions
- unbound-force review-context-skill: Upfront decision resolution
- unbound-force finale: Most-missed spec elements
- unbound-force ci-causality-soft-gate: Skill mode design
- unbound-force specify-cli: Speckit CLI contract changes
