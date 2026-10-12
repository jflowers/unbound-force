---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-12T14:55:18Z
identity: documentation-gate-20261012T145518-jay-flowers
tier: draft
---

When a change bundles both a feature addition (new checkpoint tools) and a revert (advisor-host-model-fallback removal), the CHANGELOG.md entry is easy to overlook because the revert's CHANGELOG removal masks the absence of a new entry. Each logical change in a PR should have its own CHANGELOG entry — the revert should have a 'Removed' entry and the new feature should have an 'Added' entry.
