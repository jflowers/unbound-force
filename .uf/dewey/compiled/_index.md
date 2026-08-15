---
title: Compiled Knowledge Articles
created: 2026-08-14
description: Index of synthesized knowledge from 131 learnings across 6 repos
---

# Compiled Knowledge Articles

Synthesized August 2026 from 131 draft learnings across dewey, gaze,
gaze-py, replicator, unbound-force, and website repositories.

Full analysis: [docs/learnings-review-2026-08.md](../../../docs/learnings-review-2026-08.md)

## Validated (Tier 1 — Cross-Cutting Themes)

| Article | Theme | Source Repos |
|---------|-------|-------------|
| [blast-radius-scope-audit](blast-radius-scope-audit.md) | T1: Actual scope > reported scope | all 6 |
| [review-council](review-council.md) | T2: Multi-agent review value | dewey, gaze, replicator, uf |
| [scaffold](scaffold.md) | T3: Dual-copy sync discipline | gaze, uf |
| [security-checklist](security-checklist.md) | T4: Security-from-first-principles | replicator, uf |
| [di-testability](di-testability.md) | T5: DI for testability | gaze, dewey, uf |
| [crapload](crapload.md) | T6: Short() guard removal | gaze |
| [fail-fast](fail-fast.md) | T7: Fail-fast over silent defaults | dewey, uf, website |
| [go-patterns](go-patterns.md) | Go idioms and gotchas | uf |

## Validated (Tier 2 — Per-Feature)

| Article | Domain | Source Repos |
|---------|--------|-------------|
| [sandbox](sandbox.md) | Containerized sessions | uf |
| [gateway](gateway.md) | LLM reverse proxy | uf |
| [mcp-transport](mcp-transport.md) | MCP Streamable HTTP | replicator |
| [release-pipeline](release-pipeline.md) | GoReleaser + awk patching | dewey, gaze, replicator, uf |
| [ci-coverage](ci-coverage.md) | CI coverage ratchets | replicator, gaze |

## Draft (Tier 3 — Hold for Review)

| Article | Domain | Source Repos |
|---------|--------|-------------|
| [remote-llm-provider](remote-llm-provider.md) | Pluggable LLM providers | dewey |
| [spec-workflow](spec-workflow.md) | Specification process | uf |
| [website-content](website-content.md) | Website accuracy | website |

## Cross-Reference Map

Articles are interconnected by these relationships:

- **blast-radius** ↔ **scaffold** — scope audit prevents missed dual-copy sites
- **blast-radius** ↔ **crapload** — grep-all-consumers applies to Short() audit
- **blast-radius** ↔ **review-council** — council catches missed callers (auth-1: 5/5)
- **di-testability** ↔ **crapload** — DI enables Short()-free testing
- **di-testability** ↔ **go-patterns** — injectable funcs, Platform DI
- **security-checklist** ↔ **gateway** — token refresh, credential handling
- **security-checklist** ↔ **sandbox** — SSRF, image pulls, credential injection
- **security-checklist** ↔ **mcp-transport** — session state, body limits
- **fail-fast** ↔ **gateway** — region errors, stale token clearing
- **fail-fast** ↔ **ci-coverage** — renamed-package→0.0% must fail, not pass
- **review-council** ↔ **release-pipeline** — council found awk bug pre-merge
- **release-pipeline** ↔ **scaffold** — shared awk script = cross-repo sync
