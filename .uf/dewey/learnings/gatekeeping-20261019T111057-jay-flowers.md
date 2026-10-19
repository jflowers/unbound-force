---
tag: gatekeeping
author: jay-flowers
category: gotcha
created_at: 2026-10-19T11:10:57Z
identity: gatekeeping-20261019T111057-jay-flowers
tier: draft
---

Pinned dependency values in this repository are dual-mandated: test-enforcement gates (scaffold_test.go exact-version assertions, testdata rollback baseline lock SHA) AND spec text (the unarchived review-council-multi-model-fanout change's SC-FR-003 "Reproducible Plugin Dependencies" pins @opencode-ai/plugin 1.4.10 and hardcodes rollback baseline lock SHA b628c764…). A declared pin bump that moves only the test constants and the AGENTS.md Technology Stack line leaves the active spec MUST contradicted by the manifests and testdata, and the stale pin flows into baseline specs when the mandating change archives. When planning or reviewing a pin move, enumerate BOTH mandates in the gates-remain-enforced list and include a spec delta modifying the mandating requirement — the in-repo pattern is a MODIFIED requirement anchored to the unarchived predecessor's text (as clarification-marker-superset does for the unleash capability). Discovered in the clarification-marker-superset iteration-2 review (2026-10-19).
