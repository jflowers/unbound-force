---
tier: validated
compiled_at: 2026-08-14T19:54:08Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - review-council-1
  - review-council-20260805T193249-jay-flowers
  - review-council-20260805T193254-jay-flowers
  - review-council-20260811T174015-jay-flowers
topic: review-council
related: blast-radius-scope-audit, security-checklist, release-pipeline
---

# Review Council: Multi-Agent Code Review

## Current State (August 2026)

The review council (`/uf.review-council`) runs 5+ specialized Divisor agents in parallel against proposed changes. 10 learnings across unbound-force, dewey, and replicator repos validate its effectiveness.

## Proven Value

### Distinct Issue Classes per Agent
Each council member consistently catches different defect categories:
- **Adversary**: Security vulnerabilities, injection risks, defensive scenario gaps
- **Architect**: Architectural violations, DRY opportunities, package naming conflicts
- **Tester**: Testability gaps, race conditions (TOCTOU → `O_CREATE|O_EXCL`), assertion quality
- **SRE**: Operational concerns, timeout budgets, credential management
- **Curator**: Documentation sync requirements, cross-repo doc impact
- **Guard**: Scope drift, constitution alignment, zero-waste

### Quantified Impact
- **Parallel execution**: Same wall-clock time as running a single agent — 5x coverage at 1x cost
- **Pre-implementation catches**: Spec reviews routinely find 3-7 HIGH issues BEFORE any code is written (remote-llm-provider: 6 HIGH; replicator mcpclient: thread safety, SSE edge cases, timeout budgets)
- **Coverage vs assertion quality**: Spec review finds missing test coverage; code review finds assertion quality issues (gaze p1-local-var learning)
- **Zero-iteration implementations**: When council findings are addressed in the spec phase, implementations achieve zero-iteration acceptance (gaze extract-violation-helper, review-context-skill)

### Cross-Repo Patterns
- dewey: Council on fix-cask change — Adversary + Tester independently found defensive-scenario gaps
- replicator: Thread safety for shared session state (4/5 flagged — would cause `-race` CI failures)
- gaze: Council caught compact.go omission pre-implementation; 4/5 flagged `ThresholdResult.Actual` needing `*int`
- gaze-py: Council verified porting contracts against Go reference `internal/crap/contract.go`

## Anti-Patterns
1. **DON'T halt at invented gates**: No gate points exist in the council pipeline except REQUEST CHANGES. Inventing intermediate gates slows the process without adding value.
2. **Skip for validated patterns**: After 3+ blog post reviews confirm consistent patterns, skip full council for that content type (website learning).
3. **Ambiguous task phrasing**: Council members flag 'or delete' style options as ambiguous — specs must be definitive (4/5 flagged in gaze crapload).

## Process Insights
- Most common finding across councils: temp-file cleanup on abort (3/5 reviewers in finale spec)
- Most-missed spec elements: error-path scenarios and algorithm specificity (slash-command delta specs)
- Cross-command consistency: Architect flags DRY violations when instruction substance differs between similar commands

## History
- review-council-1: Initial validation of parallel council value
- review-council-20260805: Cross-repo pattern recognition
- dewey review-council learnings: fix-cask defensive gaps
- replicator review-council: Spec review catches real impl bugs pre-code
