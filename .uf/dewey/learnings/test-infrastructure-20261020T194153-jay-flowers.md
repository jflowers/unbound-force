---
tag: test-infrastructure
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:41:53Z
identity: test-infrastructure-20261020T194153-jay-flowers
tier: draft
---

A retrospective learning that names the in-flight change as the extraction point for a duplication threshold does not self-execute — shipping the learning file is not compliance with it. In seam-verification (unbound-force PR 783, 2026-10), the change added the 7th and 8th identical withBun shim copies to .opencode/test/ while its own diff included learning test-infrastructure-20261020T165710, which counted those same 8 copies and stated the adding change must extract the helper to a shared module in the same change; the duplication reached review as maintainer feedback instead of being fixed at implementation time. Reviewer/author check: when a PR's diff contains a learning that names the PR's own additions as crossing a threshold, verify the threshold-crossing fix appears in the same diff — the learning documents the obligation, it does not discharge it.
