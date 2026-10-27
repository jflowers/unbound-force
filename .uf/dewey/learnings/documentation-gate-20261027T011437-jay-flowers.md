---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-27T01:14:37Z
identity: documentation-gate-20261027T011437-jay-flowers
tier: draft
---

Docs-gate verification greps of superseded sentences under-report on hard-wrapped Markdown: this repo's user-facing docs wrap at ~70 columns, so the same sentence splits across lines differently per file. During the unleash-interactive-clarify review (2026-10-27), grepping the full phrase "ambiguity, review failures" matched docs/usage.md:153 but missed docs/architecture.md:438-440, where the identical sentence wraps as "encounters ambiguity, / review failures, or merge conflicts" — a full-sentence single-line grep would have falsely shown architecture.md clean even though the task record's disposition was accurate. Verify per-file disposition tables by reading the cited line ranges or grepping a fragment too short to wrap; full-sentence single-line greps are not a valid completeness check for hard-wrapped docs.
