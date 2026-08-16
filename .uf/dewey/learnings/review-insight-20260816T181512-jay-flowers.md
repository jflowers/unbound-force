---
tag: review-insight
author: jay-flowers
category: gotcha
created_at: 2026-08-16T18:15:12Z
identity: review-insight-20260816T181512-jay-flowers
tier: draft
---

During the scaffold-dcp-config code review, the Curator agent's REQUEST CHANGES verdict was the most actionable: it caught a missing CHANGELOG entry and the absence of a documentation issue for the website (filed as #503). The other 5 agents all APPROVEd with LOW findings. The most common review finding across agents was the FR-003 spec/impl gap where the spec said "preserving existing configuration keys" but the implementation overwrites with canonical content. This was resolved by adding a code comment referencing the design trade-off (D3). A consistent pattern: when the spec uses aspirational language ("preserving existing keys") but the design explicitly documents a simpler trade-off, the code comment should reference the design decision to close the traceability gap.
