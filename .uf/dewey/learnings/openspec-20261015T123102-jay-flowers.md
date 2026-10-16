---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-15T12:31:02Z
identity: openspec-20261015T123102-jay-flowers
tier: draft
---

In the unbound-force repo, MODIFIED/REMOVED deltas in a new OpenSpec change routinely target requirements ADDED by merged-but-unarchived sibling changes (openspec/specs/ holds only a few capability main specs; 26+ unarchived changes stack deltas this way). Stacking is accepted practice, but it creates a hard archive-order dependency: the sibling must archive before the new change's deltas resolve against a main spec. When proposing a change whose deltas target a sibling's unarchived requirements, either archive the sibling first or document the ordering constraint in the proposal (e.g., under Non-Goals or Dependencies), and surface it in review findings so the sequencing isn't lost at archive time.
