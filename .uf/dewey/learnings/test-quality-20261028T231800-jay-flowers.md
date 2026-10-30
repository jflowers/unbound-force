---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-28T23:18:00Z
identity: test-quality-20261028T231800-jay-flowers
tier: draft
---

Calibration examples with exactly-integral arithmetic do not pin flooring semantics. In run-timeout.test.ts, the 'whole KiB above the free window' example used 179_200 bytes: 179_200 - 65_536 = 113_664 = exactly 111 KiB, so Math.floor, Math.round, and Math.ceil all produce the same 166_500 ms — the documented whole-KiB flooring contract was unpinned, and a regression to Math.ceil passed the whole suite. When a test name claims to cover truncation/rounding behavior, include boundary inputs where the candidate implementations disagree (e.g., free_bytes + 1023 vs free_bytes + 1024); monotonicity loops cannot discriminate rounding modes either, since floor/round/ceil are all monotone.
