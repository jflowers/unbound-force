---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-20T00:14:48Z
identity: documentation-gate-20261020T001448-jay-flowers
tier: draft
---

A spec's documentation-gate task covering only the content assessment (CHANGELOG.md entry + AGENTS.md/README.md impact confirmation) reads as complete gate compliance but satisfies neither issue-filing gate. In unbound-force/unbound-force, user-facing changes require TWO issue filings before PR merge: the AGENTS.md in-repo docs-labeled issue and the constitution Cross-Repo Documentation issue in unbound-force/website. Classifying a change as a "behavioral bugfix, no structural or usage change" addresses documentation-content impact only — bugfix is not among the gates' enumerated exemptions (internal refactoring, test-only, CI-only, spec artifacts). Verdict-pipeline fixes that change user-visible workflow outcomes — and their internal/scaffold/assets mirrors deployed by uf init — are user-facing even when command specs and documented contracts are unchanged. Exemplar task pattern: dispatch-finalize-determinism tasks 4.4/4.6, one task per gate, each naming the target repo, duplicate-checking open issues first, and recording the filed issue number in tasks.md at filing time.
