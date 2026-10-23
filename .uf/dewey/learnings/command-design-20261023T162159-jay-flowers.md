---
tag: command-design
author: jay-flowers
category: gotcha
created_at: 2026-10-23T16:21:59Z
identity: command-design-20261023T162159-jay-flowers
tier: draft
---

When a command step delegates a MUST to a later step by prose ("step N MUST include a warning"), the target step needs its own durable anchor — a text hook or an explicit read of the earlier step's checkpoint data — or the behavior is lost on session resume. Checkpoints exist precisely because mid-command resume is a designed-for scenario, so delegated behavior that survives only as in-context carry-forward is a gap. Verified on rebase-upstream-before-push (unbound-force/unbound-force, 2026-10-23): uf.finale step 4's "Continue without rebase" option delegates a behind-base warning to step 6, but step 6's text never mentions it and never reads the sync-base checkpoint data {behindBy, rebased}; a resume at step 6 drops the spec-mandated warning even though the checkpoint carries the values. Recipe: when writing a cross-step delegation, add the consumption instruction to the target step in the same edit, naming the checkpoint field it reads.
