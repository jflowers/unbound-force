---
tag: commit-scope-bundling
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:55:20Z
identity: commit-scope-bundling-20261012T145520-jay-flowers
tier: draft
---

When a change bundles multiple logically independent modifications (e.g., a feature revert + a new feature + spec amendments), each independent modification should be evaluated against the Commit Scope rule separately. The checkpoint spec (uf-workflow-checkpoint) has a clear, well-defined scope: replace Edit-tool checkbox tracking with persistent checkpoint tools. The WORKFLOW_TIER simplification and the advisor-host-model-fallback revert are separate concerns that should be on separate branches. Bundling them makes the review harder, increases the risk of unintended regressions, and violates the traceability principle that each branch should map to one spec or change.
