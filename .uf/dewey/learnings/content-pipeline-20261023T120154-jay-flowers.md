---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-23T12:01:54Z
identity: content-pipeline-20261023T120154-jay-flowers
tier: draft
---

OpenSpec tasks.md documentation phases for changes with user-visible behavior must be modeled on the full documentation-gate set, not the repo-local AGENTS.md gate alone: (1) CHANGELOG.md entry, (2) in-repo docs issue (label docs), (3) unbound-force/website issue per the org constitution's Cross-Repo Documentation rule, and (4) a tutorial issue only when a new multi-step workflow is introduced. The fix-review-dispatch-recovery change (#751) tasks 8.4-8.7 are the canonical template. fix-review-dispatch-correlation-release initially shipped its Phase 5 with only the first two tasks despite classifying itself as user-facing in both task descriptions, and the omission was flagged in its 2026-10-23 spec review. Spec-review detection heuristic: whenever a change touches scaffolded plugin/command surfaces (files with twins under internal/scaffold/assets/), diff its documentation task set against the #751 four-task template before approving the spec.
