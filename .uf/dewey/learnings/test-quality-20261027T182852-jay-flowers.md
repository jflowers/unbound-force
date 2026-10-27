---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-27T18:28:52Z
identity: test-quality-20261027T182852-jay-flowers
tier: draft
---

Design-derived test matrices inherit the design's blind spots. When a tasks.md or design decision enumerates test cases, transcribing them verbatim leaves every behavior added during implementation (GoDoc contracts, defensive branches) unverified. In the unbound-force replicator-version-floor change (2026-10), the comparator test table for checkReplicatorVersion covered equal cores and minor/patch transitions, but every case shared major=0, so the major-ordering branch never executed — a refactor breaking major-version ordering would pass the suite. The same matrix omitted the parser's documented non-digit rejection (isAllDigits vs '+7'), the only validation layer guarding the design's self-identified format-drift risk. Rule of thumb: for each new validator or comparator, enumerate one boundary row per component level and per documented rejection before shipping, independent of what the design artifact listed; design matrices describe intent, not coverage completeness.
