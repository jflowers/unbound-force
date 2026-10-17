---
tag: address-feedback
author: jay-flowers
category: pattern
created_at: 2026-10-16T20:24:11Z
identity: address-feedback-20261016T202411-jay-flowers
tier: draft
---

Verifying feedback that claims an unpinned command-layer tool invocation: (1) grep the invocation name across *_test.go and *.ts separately — the TypeScript plugin suite usually covers the tool implementation itself, so a "no test asserts" claim typically means specifically "no command-content assertion" (for PR 745: unleash-summary.test.ts carried 7 describe blocks and uf-finale.test.ts the #707 writer-reader contract, while the repo-wide Go grep returned zero matches); (2) inspect the span boundaries the command-content test extracts — a span ending at "Then persist the summary" silently excludes everything after it; (3) count claimed survivors with grep before accepting a strings.Count pin (CHECKPOINT: Call was exactly 2 — lines 408 and 834, the two review-loop iteration checkpoints); (4) read the invocation's commanded failure path in the markdown — warn-and-continue paths are the silent-regression class that justifies HIGH severity for a missing pin, because the pipeline deliberately continues on tool failure. Command-content tests load the embedded asset (assetContent), and drift tests enforce byte-identity with the canonical copy, so a single assertion covers both copies.
