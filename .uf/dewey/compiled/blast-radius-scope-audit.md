---
tier: validated
compiled_at: 2026-08-14T19:56:49Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: blast-radius-scope-audit
related: scaffold, crapload, review-council
---

# Theme: Blast-Radius Scope Audits

## Current State (August 2026)

The single most recurring lesson across all 6 repos: the actual scope of a change is ALWAYS larger than initially reported. This theme appears in 20+ learnings spanning every repository.

## The Pattern

When a learning or issue reports N affected sites, thorough investigation consistently finds more:

| Repo | Change | Reported | Actual |
|------|--------|----------|--------|
| gaze | os.Getwd() removal | 5 sites | 10 sites |
| gaze | int→*int type change | "compact.go" | 5 types, 5 test files |
| unbound-force | TokenManager extract | "gateway only" | BedrockProvider caller too |
| dewey | identity format change | "tools/compile.go" | ALL consumers + test helpers |
| replicator | coverage ratchet | "per-package" | renamed-package→0.0% edge case |
| unbound-force | setup step addition | "3 steps" | 13 label updates + tests |

## Required Practice

### Before Implementation
1. **Grep ALL occurrences** — never trust the issue's count
2. **Trace ALL callers** — not just the obvious ones (auth-1: 5/5 reviewers flagged missed Bedrock caller)
3. **Check test files separately** — struct literal changes propagate to every test that constructs the type
4. **Cross-package search** — deduplication reveals latent bugs (gaze goprovider vs aireport)

### Format/Identity Changes
When changing a data format (identity strings, serialization):
1. Grep ALL consumers including test helpers
2. Verify parsing logic handles BOTH old and new formats during migration
3. The dewey identity format change broke `extractTagFromIdentity` — old last-hyphen parse misparsed new `{tag}-{timestamp}-{author}` format

### Mechanical Changes
Constructor `*T→(*T,error)` and field additions are mechanical but affect every call site:
- Compiler catches function signature mismatches
- But struct literal zero-values can introduce subtle bugs (time.Time{} = past, *int nil ≠ 0)

## Convention Pack Candidate

**Proposed rule**: "Before implementing any change, grep ALL consumers of the modified type, function, or format. Document the complete blast radius in the task description. Actual count MUST match grep results, not issue description."

## Evidence Across Repos
- dewey: identity format (CRITICAL), import path sed (trailing slash), source type additions (3 update sites per type)
- gaze: os.Getwd (10 not 5), int→*int (blast across 5 types + 5 test files), module root (1→9 sites/4 files)
- replicator: coverage ratchet renamed-package edge case
- unbound-force: auth extract (Bedrock missed), setup steps (13 labels), struct fields (6-8 test sites)
- website: stale patterns (12 instances/5 files including blog, missed initially)
