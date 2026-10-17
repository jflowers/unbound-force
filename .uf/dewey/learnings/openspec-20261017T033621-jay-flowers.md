---
tag: openspec
author: jay-flowers
category: decision
created_at: 2026-10-17T03:36:21Z
identity: openspec-20261017T033621-jay-flowers
tier: draft
---

When change A supersedes an unarchived sibling change B (A's tool absorbs B's tool), pin the archive order explicitly in A's Sequencing section — B MUST archive after A — and add a gate task firing at A's archive gate to annotate B's stale requirement text with superseded-by references. Archiving B first would land its contradicting requirements into the main spec with nothing to reconcile against (e.g., persist-unleash-summary FR-004 pins "All three tool parameters MUST be non-empty" against write_unleash_summary's eight-parameter contract, and FR-006 names persist_unleash_summary in command prose the rewritten /uf.unleash no longer contains). Strict openspec validation cannot flag the contradiction at archive time when the two changes modify different capabilities, so the reconciliation must be encoded as an explicit deferred task (task 9.3 in unleash-deterministic-tools, mirroring the task 9.2 deferred-anchor pattern from unleash-direct-review-dispatch). Verified quotes against the sibling delta before writing them into the proposal — misquoting FR numbers or requirement text in supersession records would create a second layer of spec drift.
