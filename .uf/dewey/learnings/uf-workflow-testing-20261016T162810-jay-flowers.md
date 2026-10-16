---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-16T16:28:10Z
identity: uf-workflow-testing-20261016T162810-jay-flowers
tier: draft
---

When a markdown line parser normalizes CRLF for matching but must edit raw bytes (e.g., mark_task_complete's single-byte checkbox flip), normalize only at the match layer and keep offset arithmetic on raw line lengths. findTaskLine strips the trailing \r before matchTaskLine but accumulates lineStart from rawLine.length + 1, so the flip offset (lineStart + 3, covering `- [ ]`'s space byte) stays byte-correct because the flip point precedes any carriage return. Pin the invariant with a single-byte-flip assertion (same total length, exactly one differing byte index) on a CRLF fixture — the round-2 HIGH finding was precisely this normalization layer being missing.
