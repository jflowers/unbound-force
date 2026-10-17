---
tag: openspec
author: jay-flowers
category: reference
created_at: 2026-10-16T22:21:35Z
identity: openspec-20261016T222135-jay-flowers
tier: draft
---

Code-level supersession creates the same OpenSpec archive hazard as spec-delta supersession, but with no detection signal in either change's delta machinery. When a merge deduplicates two independently implemented tools into one behind a compatibility alias (unleash-deterministic-tools absorbing persist-unleash-summary's persist_unleash_summary into write_unleash_summary, PR #745), the superseded change's unarchived delta text still describes the old tool contract (FR-004's three-parameter requirement vs the aliased tool's eight parameters; FR-006 naming the old tool in command prose the rewrite drops), and because the two changes modify different capabilities, openspec strict validation passes both — whichever archives second lands main-spec text contradicting behavior. The sequencing enumeration in the absorbing change's proposal and its deferred-validation tasks (the task 9.2 pattern) MUST cover every unarchived sibling it supersedes in code, not only the siblings its spec deltas resolve against. Detection signal: a compatibility alias or 'merged/deduplicated' note in code comments with no corresponding sequencing bullet in proposal.md. Within one PR's scope, record a sequencing note plus a deferred-validation task; per the 2026-10-14 learnings, the task should encode the durable enforcement location (annotate the superseded change's delta spec with a superseded-by reference before it archives, or land a MODIFIED delta after it archives), because a note in the absorbing change's artifacts alone is not read by the sibling's archive step.
