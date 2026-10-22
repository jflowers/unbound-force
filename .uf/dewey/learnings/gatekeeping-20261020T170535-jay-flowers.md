---
tag: gatekeeping
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:05:35Z
identity: gatekeeping-20261020T170535-jay-flowers
tier: draft
---

A one-line `uses:` SHA bump in a GitHub workflow is a constitutional gate modification, not an incidental tweak. When reviewing multi-file feature diffs, trace every workflow diff line back to the active change's spec/tasks: pin updates require documented rationale, an upstream-verified target SHA, a documented rollback path, and validation evidence per AGENTS.md gatekeeping. Observed case: an actions/upload-artifact v4.6.2→v7.0.2 pin bump rode the fix-review-dispatch-recovery PR with none of the required documentation, failing gatekeeping and commit-scope rules simultaneously.
