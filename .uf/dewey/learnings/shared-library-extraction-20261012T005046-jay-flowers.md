---
tag: shared-library-extraction
author: jay-flowers
category: gotcha
created_at: 2026-10-12T00:50:46Z
identity: shared-library-extraction-20261012T005046-jay-flowers
tier: draft
---

When extracting a function to a shared library (like resolveHostModel from invoke-agent to agent-executor.ts), verify that the design document's export/private classification matches the actual implementation needs. In this case, VariantSchema was classified as 'module-private' in the design but needed to be exported because invoke-agent imports it. The design doc should be updated to reflect the actual export surface before implementation begins, or the discrepancy should be noted during spec review.
