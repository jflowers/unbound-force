---
title: Compiled Knowledge Articles
created: 2026-10-25
description: Index of synthesized knowledge from 639 learnings (this repo) plus cross-repo themes
---

# Compiled Knowledge Articles

Synthesized 2026-10-25 from 639 learnings in this repository's
store (205 tag clusters consolidated) plus eight cross-repo
theme articles regenerated from the sibling audits. Every article was promoted to tier: validated on 2026-10-25 after
human review.

Full analysis: [docs/learnings-review-2026-10.md](../../../docs/learnings-review-2026-10.md)

## Governance and Workflow

| Article | Theme | Sources |
|---------|-------|---------|
| [gatekeeping](gatekeeping.md) | Protected gates, lockstep records, authorized strengthening | 16 |
| [constitution](constitution.md) | Org constitution v1.4.0, six principles, amendments | 9 |
| [spec-workflow](spec-workflow.md) | Three-tier spec routing, ordering, task bookkeeping | 6 |
| [change-management](change-management.md) | Commit scope, staging, SHA citation, fix-loop claims | 15 |
| [determinism](determinism.md) | Deterministic vs judgment classification, one grammar | 24 |
| [documentation-gate](documentation-gate.md) | Three-gate docs stack, exempt-or-file decisions | 62 |
| [content-pipeline](content-pipeline.md) | Verifiable dispositions, two issue halves, thresholds | 11 |
| [documentation-pipeline](documentation-pipeline.md) | Claim-level verification, lockstep surfaces | 22 |

## Review System

| Article | Theme | Sources |
|---------|-------|---------|
| [review-dispatch](review-dispatch.md) | Session architecture, correlation lifecycle, recovery | 97 |
| [review-council](review-council.md) | Composition, verdicts, fix-loop convergence | 23 |
| [spec-review](spec-review.md) | Per-finding consent gate, delta content requirements | 22 |
| [issue-triage](issue-triage.md) | Triage verdicts, untrusted input, GitHub lifecycle | 12 |
| [seam-verification](seam-verification.md) | DE-007 layers, census discipline, value invariants | 10 |

## Unbound Force Pipeline

| Article | Theme | Sources |
|---------|-------|---------|
| [uf-workflow](uf-workflow.md) | Single-source grammars, checkpoint state, fallbacks | 31 |
| [uf-unleash](uf-unleash.md) | Steps 1-8, tier routing, dispatch and resumability | 24 |
| [uf-workflow-testing](uf-workflow-testing.md) | Real implementations, fixture discipline, pinning | 15 |
| [finale](finale.md) | Branch safety, PR creation, CI polling, base sync | 4 |
| [command-contract-tests](command-contract-tests.md) | What is pinned, derivation rules, baselines | 7 |

## Specification System

| Article | Theme | Sources |
|---------|-------|---------|
| [openspec](openspec.md) | Artifact contracts, RD-FR registry, supersession | 39 |
| [spec-authoring](spec-authoring.md) | Enumeration discipline, delta stacking, RFC 2119 | 22 |

## Platform and Tooling

| Article | Theme | Sources |
|---------|-------|---------|
| [plugin-architecture](plugin-architecture.md) | Tool factories, shared lib, pins, mirror sync | 21 |
| [scaffold](scaffold.md) | Dual-copy architecture, ownership predicates | 34 |
| [sandbox](sandbox.md) | Backend detection, credential isolation, DevPod | 20 |
| [gateway](gateway.md) | Reverse proxy, region handling, token lifecycle | 5 |
| [dewey](dewey.md) | Vault and store, lifecycle, compile, promotion | 9 |

## Engineering Disciplines

| Article | Theme | Sources |
|---------|-------|---------|
| [test-discipline](test-discipline.md) | Go and TS conventions, coverage gating, fixtures | 32 |
| [go-patterns](go-patterns.md) | stdin scanning, injectability, Options, %w, DRY | 6 |
| [ci-coverage](ci-coverage.md) | Scope-based gate, CRAP baseline, pre-flight modes | 10 |
| [dependency-governance](dependency-governance.md) | Pin exceptions, lockstep sets, engine floors | 14 |
| [security-checklist](security-checklist.md) | Credentials, injection, sandbox, untrusted content | 16 |

## Cross-Repo Themes

Regenerated from the 2026-10-25 sibling audits; sources cite the
cross-repo learning identity (`ci-1`) plus any repo learnings
folded in.

| Article | Theme | Repos |
|---------|-------|-------|
| [blast-radius-scope-audit](blast-radius-scope-audit.md) | Actual scope > reported scope | all |
| [crapload](crapload.md) | CRAP regression gating, DI in gaze | gaze |
| [di-testability](di-testability.md) | Five-level DI hierarchy | gaze, uf |
| [fail-fast](fail-fast.md) | Fail-fast over silent defaults | all |
| [mcp-transport](mcp-transport.md) | MCP Streamable HTTP client | replicator |
| [release-pipeline](release-pipeline.md) | GoReleaser, org-infra, Homebrew patching | all |
| [remote-llm-provider](remote-llm-provider.md) | Ollama + Vertex synthesis, credentials | dewey |
| [website-content](website-content.md) | Website accuracy, constitution drift | website |

## Cross-Reference Map

- **blast-radius** ↔ **scaffold** — scope audit prevents missed
  dual-copy sites
- **determinism** ↔ **command-contract-tests** — DE rules drive
  what contract tests must pin
- **gatekeeping** ↔ **dependency-governance** — pin updates are
  the narrow authorized exception path
- **dewey** ↔ **documentation-gate** — learnings satisfy the
  assessment gate, not the issue gate
- **spec-review** ↔ **review-council** — consent gates and
  override carry-forward span both flows
- **uf-workflow** ↔ **uf-workflow-testing** — every workflow
  contract has a pinning test family
