---
tag: hero-removal-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-11T02:37:53Z
identity: hero-removal-architecture-20261011T023753-jay-flowers
tier: draft
---

Large-scale hero removal changes (deleting entire internal packages, CLI binaries, agent files, commands, schemas, and documentation) require a systematic sweep for residual references. The most effective approach is: (1) grep all Go source for import paths of deleted packages, (2) grep all Markdown/YAML for hero names and product terms, (3) verify schema registry counts match test expectations, (4) verify embedded scaffold assets are in sync with canonical sources, (5) verify .gitignore and scaffold gitignore blocks are updated. The remove-mutimind-mxf-orchestration change demonstrates thorough execution of this pattern — no orphaned imports or broken references were found across ~100 changed files.
