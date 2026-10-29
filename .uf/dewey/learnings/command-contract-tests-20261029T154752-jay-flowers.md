---
tag: command-contract-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-29T15:47:52Z
identity: command-contract-tests-20261029T154752-jay-flowers
tier: draft
---

Count pins on whitespace-normalized command prose must derive from a semantic inventory of normative sites, not from grep-able contiguous occurrences. strings.Fields-based normalization (strings.Join(strings.Fields(text), " ")) collapses newlines but preserves blockquote '>' markers, so a phrase wrapped across a blockquote line break ('the command MUST' / '>   NEVER merge') normalizes with an intervening '>' and is silently excluded from strings.Count. The pin then (a) misses deletion of the wrapped site — presence-only clauses stay green via other sites — and (b) fails spuriously if the prose is later reflowed to make the phrase contiguous. When adding count pins to command contract tests, enumerate the semantic sites first, verify each site matches the normalized fragment, and treat a site that only matches after stripping '>' markers as a pin-derivation bug (reflow the prose or choose a wrap-safe fragment).
