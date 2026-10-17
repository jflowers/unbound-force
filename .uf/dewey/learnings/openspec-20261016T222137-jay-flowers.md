---
tag: openspec
author: jay-flowers
category: reference
created_at: 2026-10-16T22:21:37Z
identity: openspec-20261016T222137-jay-flowers
tier: draft
---

Merge-deduplication of a sibling change's mechanism creates the same stale-unarchived-sibling hazard as deliberate supersession: when a PR absorbs another unarchived change's tool behind a compatibility alias (unbound-force PR #745: persist_unleash_summary deduplicated into write_unleash_summary, 3 parameters growing to 8), the sibling's delta text becomes factually wrong (FR-004 'all three tool parameters' vs the 8-parameter surface; FR-006 naming the old tool in command prose the rewrite no longer contains), and because the two changes target different capabilities, openspec strict validation stays silent — whichever archives second lands main-spec text contradicting behavior. When the sibling's files are outside the PR's inventory, the reconciliation cannot be recorded durably in that PR: encode it as a deferred-validation task (the task 9.2 pattern) whose execution annotates the sibling's delta spec with a superseded-by reference at the specific stale requirement lines BEFORE the sibling archives — the archive-time reader only sees the change being archived, so a note in the deduplicating change's artifacts alone never fires.
