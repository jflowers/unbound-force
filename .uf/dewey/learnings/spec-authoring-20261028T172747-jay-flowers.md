---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-28T17:27:47Z
identity: spec-authoring-20261028T172747-jay-flowers
tier: draft
---

When a spec's documentation-gate task (the docs-issue-vs-exemption classification) enumerates the user-facing surfaces the classification MUST weigh, generate the enumeration from the change's complete surface inventory: input contracts, output fields, command prose, AND new configuration fields. Config fields added to schema-validated, scaffold-deployed matrices (.uf/review-matrix.yaml and its registry/deployed/embedded copies) are user-facing configuration surface even when optional with code defaults — sibling website-gate rules classify config fields as user-facing. Observed on derive-per-run-timeout iteration 3: task 8.3 enumerated the input contract, output fields, and command prose but omitted the two new RD-FR-009 review-matrix config fields (per_run_timeout_ceiling_seconds, per_run_timeout_tiers), so an exemption rationale built from the list could skip the config surface and under-enforce the constitution's Cross-Repo Documentation rule. Enumerations assembled from the proposal Impact section's tool-behavior bullets systematically miss config surfaces; cross-check the change's schema deltas when authoring the gate task.
