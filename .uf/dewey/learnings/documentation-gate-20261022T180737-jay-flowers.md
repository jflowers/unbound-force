---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-22T18:07:37Z
identity: documentation-gate-20261022T180737-jay-flowers
tier: draft
---

Documentation-gate exempt-path corollary: when a change legitimately claims a documentation-gate exemption (CI-only / internal quality-gate change with no user-facing surface), the exemption satisfies the gate only when the spec makes it auditable — a dedicated tasks.md assessment task that (a) names the exempting rule, (b) states the no-user-facing-surface determination with its basis, (c) instructs recording the claim in the PR description, and (d) still ships the change-entry artifacts the artifact gate requires independently (CHANGELOG.md entry; AGENTS.md convention sentence when a convention is added). Pattern demonstrated by openspec/changes/ts-plugin-coverage-gate task 3.3 alongside tasks 3.1/3.2: the CI-only exemption is claimed with rationale (internal quality gate on the .opencode/ plugin suite, no CLI/flag/install/hero-capability/pack/constitution surface), and the CHANGELOG and AGENTS.md updates ride along per the change-entry rule.
