---
tag: uf-unleash
author: jay-flowers
category: pattern
created_at: 2026-10-25T14:53:20Z
identity: uf-unleash-20261025T145320-jay-flowers
tier: draft
---

A universal durability claim must be verified at every gate it names, not only the gates that already have stores. In PR 815 round 3 (unleash-build-test-fix-loop), the fix loop's budget rule said the counter is kept "in the calling gate's durable checkpoint data" with "(total across sessions, never reset by a resume)" and explicitly extended the exhaustion rule to Step 6's code-review-preflight exit — but only the phase checkpoint and quick gate have stores; Step 6's section records none, so a resume mid-Step-6-loop silently grants a fresh 3-attempt budget, the exact outcome the claim forbids. The over-claim propagated to the CHANGELOG ("a durable budget recorded in the gate's checkpoint data, spanning sessions across resumes") and to the spec's universal budget language while its store enumeration named only two gates. Recipe: enumerate every gate named in a durability claim (command, spec, CHANGELOG), then read each gate's own section for the store field; a gate whose section records no store cannot honor the claim — wire the store or scope the claim to the gates that have one.
