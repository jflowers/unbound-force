---
tag: gatekeeping
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:05:44Z
identity: gatekeeping-20261020T170544-jay-flowers
tier: draft
---

Pinned GitHub Action updates riding an unrelated feature branch are indistinguishable from unauthorized gate modifications at review time. The gatekeeping documentation must live inside the carrying change — documented security/CI-reliability rationale, upstream-verified SHA (CI-002: resolve the tag via the API, never from memory), rollback path to the previous SHA, and validation evidence — or the bump must ship as a separate CI-reliability change / dependabot PR. Observed on PR #776 (fix-review-dispatch-recovery): actions/upload-artifact was manually bumped v4.6.2→v7.0.2 in ci_local.yml with no in-change authorization, rationale, or verification evidence.
