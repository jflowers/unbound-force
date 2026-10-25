---
tag: unleash-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-25T12:27:32Z
identity: unleash-pipeline-20261025T122732-jay-flowers
tier: draft
---

When a shared procedural block carries an exclusion clause, every entry point that routes into the block must wire the classification the exclusion presupposes — the clause alone does not wire its own filter. In PR 815 (unleash-build-test-fix-loop), the /uf.unleash build/test fix loop's exclusion clause ("Pre-existing and environmental failures never enter the loop") landed alongside per-gate entry edits, but only two of three gates wired the causality classification (phase checkpoint via its verdict rule, Step 6 via an explicit branch-caused filter); the quick-tier pre-flight gate routed on "If any check fails" with no classification step, so the exclusion was unwired at that gate and an environmental failure could burn up to 3 delegated fix attempts. The unwired claim propagated verbatim into the CHANGELOG entry and the byte-identical scaffold mirror. Recipe: when adding a shared block that multiple gates route into, enumerate every entry point and verify each entry condition against the block's exclusion semantics; grep the exclusion claim's signature text across command files, scaffold mirrors, and the CHANGELOG (extends learning documentation-pipeline-20261019T202640); and update structural test pins that pin the entry-condition text.
