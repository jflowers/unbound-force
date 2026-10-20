---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-20T12:50:33Z
identity: documentation-pipeline-20261020T125033-jay-flowers
tier: draft
---

When a review fix renumbers a command's internal step references, grep external governance documents that cite those step numbers (AGENTS.md and similar), not just the command file itself. External references like "/uf.unleash Step 8" survive an internal-only audit — especially in files the change already touches, where the fix is a one-line edit in the same PR.
