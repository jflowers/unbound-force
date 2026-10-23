---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-22T22:50:29Z
identity: openspec-20261022T225029-jay-flowers
tier: draft
---

When authoring an OpenSpec change, the proposal's Capabilities section must name the same capabilities as the delta spec files under changes/<name>/specs/. Listing command or pack filenames as 'Modified Capabilities' while shipping an unrelated consolidated delta (e.g., specs/<new-name>.md with ADDED requirements) breaks archive-time traceability: the archive creates a capability the proposal declares as not-new, and the declared modified capabilities have no deltas to merge. Verified convention in unbound-force/unbound-force: unleash-direct-review-dispatch declares 'New: unleash' matching specs/unleash/spec.md; the spec-review-per-finding-gate change (2026-10-22) instead declared 'New Capabilities: None' plus Modified 'uf.review-council'/'uf.unleash'/'severity' while shipping specs/spec-review-gate.md. Fix pattern: either list the consolidated delta's capability under New Capabilities, or ship MODIFIED deltas against the superseded capabilities named in the Supersedes note.
