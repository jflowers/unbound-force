---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-20T16:18:34Z
identity: test-quality-20261020T161834-jay-flowers
tier: draft
---

A coverage percentage recorded in a change artifact (e.g., design.md risk notes: "94.61% baseline") documents a baseline but enforces nothing — Constitution-style ratchet requirements demand automated enforcement, and prose numbers cannot regress-fail. When governance rules (AGENTS.md gatekeeping) forbid adding the coverage gate within the change itself, convert the deferral into a tracked follow-up issue and record its number in the artifact's risk note. Untracked deferrals are indistinguishable from abandoned ones; tracked ones (with an issue number cited alongside the baseline) preserve the intent and give the follow-up an owner and trigger.
