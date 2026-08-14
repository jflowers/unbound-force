---
tag: fix-ask-user-question-tool-name
author: jay-flowers
category: pattern
created_at: 2026-08-14T17:47:07Z
identity: fix-ask-user-question-tool-name-20260814T174707-jay-flowers
tier: draft
---

When performing a mechanical text rename across many files (like renaming AskUserQuestion to question across 24 markdown files), the most efficient approach is to parallelize by file group: commands, agents, skills, and scaffold assets as separate worker batches. Each worker handles its file group independently, verifies zero remaining occurrences via rg -c, and reports back. The scaffold assets must be updated in lockstep with their source counterparts — the drift detection test TestEmbeddedAssets_MatchSource catches any mismatch. A grammar check after rename is important: changing AskUserQuestion to question required an article fix from "an" to "a" in speckit.implement.md. This is easy to miss in bulk renames.
