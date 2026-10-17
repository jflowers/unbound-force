---
tag: plugin-architecture
author: jay-flowers
category: reference
created_at: 2026-10-17T12:35:23Z
identity: plugin-architecture-20261017T123523-jay-flowers
tier: draft
---

When a single change introduces a family of sibling tool factories in one plugin (PR 745: 11 uf-workflow tools), per-tool validation glue crosses CS-004's more-than-two-locations threshold silently as the family grows: the repo-relative traversal-failure envelope ended up copied at eight call sites (feature_dir x3 verbatim, tasks_path x2, command_path/expected_artifact x2, paths x1 interpolated) and the CRLF line strip at three — inside the same file that extracted readSpecText/readTasksText and upsertCheckpointStep for exactly this duplication class. Heuristic for implementers: when the third factory copies a guard verbatim from the second, extract the helper in the same change. Reviewer check: grep the new factories for the shared failure-message prefix ("Path traversal blocked:") and count sites before accepting a module docstring's shared-helper claim — the docstring describes the extracted core (resolveRepoRelative), not the unextracted envelope around it.
