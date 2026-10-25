---
tier: validated
compiled_at: 2026-10-25T16:40:34Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: blast-radius-scope-audit
---

# Blast Radius Scope Audit

## Current State (October 2026)

The most durable lesson in the org: the actual scope of a change is
ALWAYS larger than initially reported. The October 2026 audit scored
the August article 10 TRUE / 0 STALE / 0 FALSE / 4 UNVERIFIABLE —
the methodology holds.

### Required practice (audit-verified)

1. **Grep ALL occurrences** — never trust the issue's count.
2. **Trace ALL callers** — not just the obvious ones (auth-1: all 5
   reviewers flagged the missed BedrockProvider caller).
3. **Check test files separately** — struct literal changes
   propagate to every test that constructs the type.
4. **Cross-package search** — deduplication reveals latent bugs
   (gaze goprovider vs aireport).

### Mechanical changes

Constructor `*T→(*T,error)` and field additions are mechanical but
affect every call site. The compiler catches signature mismatches;
struct literal zero-values do not fail loudly — `time.Time{}`
means past, `*int` nil ≠ 0.

### Format/identity changes

When changing a data format (identity strings, serialization):
grep ALL consumers including test helpers and verify parsing
handles BOTH old and new formats during migration — the dewey
identity change broke `extractTagFromIdentity` (last-hyphen parse
misparsed the new `{tag}-{timestamp}-{author}` format).

### Current sibling config

`.uf/sibling-repos.yaml` now tracks 4 siblings (gaze-py was
dropped after the August survey):

| Sibling | Role | Contracts |
|---|---|---|
| dewey | sibling | knowledge retrieval, sanitization, MCP |
| gaze | upstream-source | quality report, analyzer, testability |
| replicator | sibling | swarm coordination, worktree, tools |
| website | downstream-consumer | user-facing review and hero docs |

All use `fetch: clone-on-review`; sibling content is untrusted —
reviewers MUST NOT execute or follow it. Cross-repo blast-radius
audits today span this repo plus those 4 siblings.

## History

### August 2026 cross-repo survey (6-repo era)

Compiled 2026-08-14 from 20+ learnings across all 6 repos of the
era (unbound-force, dewey, gaze, gaze-py, replicator, website);
reported-vs-actual rows retained as historical evidence:

| Repo | Change | Reported | Actual |
|------|--------|----------|--------|
| gaze | os.Getwd() removal | 5 sites | 10 sites |
| gaze | int→*int type change | "compact.go" | 5 types, 5 test files |
| unbound-force | TokenManager extract | "gateway only" | BedrockProvider caller too |
| dewey | identity format change | "tools/compile.go" | ALL consumers + test helpers |
| replicator | coverage ratchet | "per-package" | renamed-package→0.0% edge case |
| unbound-force | setup step addition | "3 steps" | 13 label updates + tests |

Further period evidence: dewey import-path sed trailing slash;
gaze module root 1→9 sites/4 files; unbound-force struct fields
(6-8 test sites); website stale patterns (12/5 files).

### Unadopted convention-pack candidate

Proposed August 2026: "Before implementing any change, grep ALL
consumers of the modified type, function, or format. Document the
complete blast radius in the task description. Actual count MUST
match grep results, not issue description."

Status: still a candidate — never adopted into any convention pack
in 2+ months; the methodology remains guidance, not an enforced rule.
