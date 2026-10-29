---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-29T06:06:40Z
identity: spec-review-20261029T060640-jay-flowers
tier: draft
---

When a CLI JSON field turns out not to exist and a workaround is adopted (e.g., deriving a PR's base repository from the PR `url` because `gh pr view --json` exposes no `baseRepository` field), the correction must be threaded through all four artifact layers — spec FRs, proposal, tasks, AND the design-decision (D-number) prose that first stated the wrong fact. Observed in openspec/changes/uf-fix-ci: design D3 still claimed "gh pr view returns headRepository and baseRepository" after spec FR-002, proposal step 3, tasks 1.2, and the command had all been corrected to the url-derivation. Cross-artifact consistency walks anchored on FR scenario order and task phase order miss design-decision prose because it reads as rationale, not contract. Verification technique: diff every tool/field/API name a design decision asserts against the pinned invocations in spec.md and the command before approving the change.
