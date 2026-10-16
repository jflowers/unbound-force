---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-15T23:44:05Z
identity: documentation-gate-20261015T234405-jay-flowers
tier: draft
---

OpenSpec documentation-gate tasks must name the target repository for the documentation issue. The Unbound Force org constitution's Cross-Repo Documentation rule mandates the issue in unbound-force/website for changes affecting user-facing behavior or workflows (exemptions limited to purely internal refactoring, test-only, or CI-only changes), while repo-level AGENTS.md gates additionally require an issue against the current repo. A task that says 'file a documentation issue' without a target, prefaced by an exemption rationale like 'internal workflow plumbing with user-visible effect', invites skipping a constitutional MUST — user-visible effect is the gate trigger, not an exemption. Sibling-change convention (unleash-direct-review-dispatch, determinism-codification, review-voice-pack, fix-tui-git-output-leak) is to name unbound-force/website explicitly and cite the Cross-Repo Documentation rule.
