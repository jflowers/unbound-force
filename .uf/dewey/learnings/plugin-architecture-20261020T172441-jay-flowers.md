---
tag: plugin-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-20T17:24:41Z
identity: plugin-architecture-20261020T172441-jay-flowers
tier: draft
---

Cross-plugin filesystem contracts in the unbound-force opencode plugin suite (one plugin writes state under .uf/, another reads it) should be extracted to a shared .opencode/lib/ module rather than expressed as duplicated path-construction and guard code in both plugins. Precedents exist: branch-classification.ts and uf-workflow-types.ts single-source shared contracts. The current uf-workflow writeState / uf-finale route-decision reader pair (`.uf/progress/${sanitizeSlug(branch)}/uf.unleash.json`) is test-pinned via an end-to-end connecting test, which prevents silent drift, but a shared path/state helper would make the contract explicit, single-sourced, and refactor-safe. When adding a new writer/reader pair, prefer the shared-module shape; when extending an existing duplicated pair, consider extraction as a follow-up (noting it touches byte-identical scaffold mirrors and needs spec ceremony).
