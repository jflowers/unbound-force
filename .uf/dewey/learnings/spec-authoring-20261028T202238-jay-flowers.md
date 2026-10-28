---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-28T20:22:38Z
identity: spec-authoring-20261028T202238-jay-flowers
tier: draft
---

When a review iteration corrects a shipped artifact away from a format pinned in spec/tasks text (typically because the pin was inherited from a precedent with a different metadata shape), back-propagate the correction into the pin texts in the same iteration. Verified on port-uf-rebase-pr (2026-10-28): spec review iteration 2 added the convention-required 'Fixes: #851' to the CHANGELOG entry, but the delta spec's Documentation-updates requirement and tasks.md task 3.4 still pin the closing line as (Spec: ...) + (Docs: ...) without the Fixes element — the pin was the root cause of the original omission (the replicator-version-floor precedent carries no originating_issue), and leaving it uncorrected means the archived canonical spec re-seeds the same incomplete template into future precedent-following changes. Artifact corrections that leave their pins stale convert a fixed defect into a recurring one; fix the pin while the change is still mutable pre-archive.
