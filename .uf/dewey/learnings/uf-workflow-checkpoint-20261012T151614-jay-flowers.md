---
tag: uf-workflow-checkpoint
author: jay-flowers
category: pattern
created_at: 2026-10-12T15:16:14Z
identity: uf-workflow-checkpoint-20261012T151614-jay-flowers
tier: draft
---

When implementing an OpenCode plugin that adds tools to an existing plugin (like adding checkpoint/get_progress/clear_progress to the uf-workflow plugin), export all factory functions and key helpers (sanitizeSlug, resolveKey) for direct unit testing. The pattern of creating a tool via a factory function that accepts dependency-injected dependencies (like GitExec for git operations and a cwd path for filesystem roots) makes tests fast and hermetic — tests can use mkdtempSync for isolated filesystem fixtures and mock functions for git operations, avoiding any need for real git repos or global state. This pattern yielded 40+ tests running in under 200ms with full symlink defense, permission, and idempotency coverage.
