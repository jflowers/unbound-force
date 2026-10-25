---
tag: test-architecture
author: jay-flowers
category: gotcha
created_at: 2026-10-25T20:10:01Z
identity: test-architecture-20261025T201001-jay-flowers
tier: draft
---

When a production data table's entry shape changes (sentinel path, base args, forceFlag), unit tests that mirror the entry via inline struct literals keep passing while exercising a synthetic configuration that matches no real entry — the fixture silently goes stale. In unbound-force fix-init-speckit-sentinel, TestInitSimpleTool_ForceReinitFails was converted to look up the real simpleTools specify entry (task 2.6 rationale: "a stale inline copy that can silently diverge from the table"), but TestInitSimpleTool_SentinelExistsNoForce kept its inline literal and now pins the old bare-.specify / no---force-in-args / forceFlag---force shape against the changed table. Rule: when hoisting or reshaping a production data table, grep the test suite for inline literal mirrors of its entries and convert them to real-table lookups in the same change (or mark them deliberately synthetic) — the lookup is cheap and keeps direct-call unit tests honest about the configuration they actually exercise.
