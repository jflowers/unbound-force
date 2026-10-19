---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-19T15:35:16Z
identity: uf-workflow-20261019T153516-jay-flowers
tier: draft
---

In the uf-workflow plugin, when a clarification marker's extracted question is itself marker syntax (the raw-text fallback forms: completely bare `[NEEDS CLARIFICATION]` or colon-empty `[NEEDS CLARIFICATION: ]`), resolve_clarification's appended ## Clarifications log entry re-embeds a grammar match — each resolution of such a mention appends a new entry containing the same marker syntax, so `remaining` never reaches 0 through the tool (pinned behavior: remaining:1 plus rescan re-surfacing). Bare-with-text and colon forms terminate because their questions are plain text. Termination for fallback forms relies on the unanswerable→human exit or manual removal; guard against a future Clarifications-section exclusion in the detect_resume probe silently decoupling it from the extractor.
