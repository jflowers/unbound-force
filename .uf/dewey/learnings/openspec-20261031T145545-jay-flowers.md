---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-31T14:55:45Z
identity: openspec-20261031T145545-jay-flowers
tier: draft
---

In OpenSpec changes, derive proposal.md's Capabilities inventory from the specs/ delta structure, not from conceptual impact. A capability declared under 'Modified Capabilities' requires an existing spec under openspec/specs/<capability>/ and a MODIFIED Requirements delta inside the change; a delta containing only ADDED Requirements introduces a new capability whose exact name must appear in the proposal's inventory. These mismatches survive `openspec validate` (validation checks deltas against the main specs tree, not proposal prose against deltas) but break traceability after archive: the main spec tree gains the delta's capability name while the change record points at names that never exist. Pre-archive check: every proposal-declared capability has a specs/<capability>/ delta directory, every 'Modified' declaration has a MODIFIED Requirements section targeting a requirement that exists in openspec/specs/, and every delta directory's capability is declared in the proposal. Found in reviewer-capabilities-init-survival: the proposal declared 'file-ownership-model' (Modified) and 'reviewer-registration-durability' (New) while the delta was ADDED-only under 'scaffold-ownership'.
