---
tag: spec-codification
author: jay-flowers
category: gotcha
created_at: 2026-10-15T16:19:47Z
identity: spec-codification-20261015T161947-jay-flowers
tier: draft
---

When codifying a recorded manual procedure into a spec requirement, diff the codified rule against the recipe it replaces — conditions that are implicit in manual practice drop silently. Case: the unleash-deterministic-tools spec wrote the review-resumability rule as "the most recent artifact for its mode records an approving verdict", dropping two conditions from the recorded recipe (learning uf-unleash-20261014T151916-jay-flowers): the artifact must be for the current branch, and its recorded head_sha must match the current HEAD. Because .uf/artifacts/dispatch/ is a flat repo-global directory shared across branches (files keyed by correlation ID, not branch), the weaker rule lets another change's approving artifact falsely mark review steps done on a new branch. Dispatch artifacts carry branch and head SHA in their provenance, so specs that consume them as completion evidence MUST specify branch matching and head-SHA recency explicitly rather than relying on "most recent".
