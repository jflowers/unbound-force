---
tag: scaffold-testing
author: jay-flowers
category: gotcha
created_at: 2026-08-12T17:58:54Z
identity: scaffold-testing-20260812T175854-jay-flowers
tier: draft
---

The always-on-guidance/SKILL.md file contained stale hivemind_* tool references (org_*, comms_*, forge_*, hivemind_find) that violated Spec 022. When scaffolding this file for org-wide propagation, the TestScaffoldOutput_NoHivemindReferences test caught the violation. Must update tool references to current names (replicator_org_*, replicator_comms_*, replicator_forge_*, dewey_store_learning/dewey_semantic_search) before scaffolding any file that contains legacy tool names.
