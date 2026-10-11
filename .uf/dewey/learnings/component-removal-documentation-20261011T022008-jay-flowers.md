---
tag: component-removal-documentation
author: jay-flowers
category: pattern
created_at: 2026-10-11T02:20:08Z
identity: component-removal-documentation-20261011T022008-jay-flowers
tier: draft
---

When performing large-scale hero/component removal across a meta-repository, documentation files outside the primary docs/ directory (e.g., docs/configuration.md) can be missed even when the main docs (architecture.md, cli-reference.md, heroes.md, usage.md) are thoroughly updated. A systematic approach: after removing all code and primary docs references, grep the entire docs/ directory for the removed component names to catch configuration reference pages, decision records, and learning documents that may still reference the deleted components.
