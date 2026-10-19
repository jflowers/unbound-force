---
tag: uf-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-19T15:35:03Z
identity: uf-workflow-20261019T153503-jay-flowers
tier: draft
---

When a resolution mechanism logs the resolved question verbatim and the question text is itself grammar-matching (a raw-marker-text fallback), the resolution log entry re-triggers the detector and tool-mediated resolution of the mention does not terminate: each resolve consumes the mention by splicing into the log line, then appends a fresh log entry carrying a fresh mention, so the marker count never reaches zero. The terminating path is manual removal (or rewording the log entry without literal marker syntax). Designs that accept a mention-extraction trade-off should state explicitly which path terminates — "resolved or manually removed" implies both work when only one does. Discovered in the clarification-marker-superset code review (2026-10-19): the bare/empty-colon forms' fallback question makes the ## Clarifications entry self-matching, while colon-form questions (extracted text, no brackets) never re-match.
