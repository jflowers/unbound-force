---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:50:44Z
identity: test-quality-20261025T185044-jay-flowers
tier: draft
---

Pin coverage must be mapped per spec-scenario step, not per paragraph or per gate. In the build/test fix-loop pin suite, the THEN outcomes (budget persistence, exit wiring) were pinned while the sole WHEN wiring instruction -- the resume re-entry rule ("the loop re-enters on a failed verdict") -- matched no pinned phrase; deleting it left the suite green. Two mechanical causes: (1) coverage partitioned by call-site scope (store-site, exit-site) leaves instructions that fall between scopes unpinned; (2) line-wrapped restatements ("never enter the\nloop.") dodge substring pins, so a phrase pinned once can be satisfied by an earlier unwrapped occurrence while a wrapped restatement of the same rule goes unpinned. When auditing pin suites: enumerate each scenario's WHEN and THEN steps, grep the test file for a site-unique phrase from each, and check whether any pinned phrase has multiple command-file occurrences (a wrapped or restated twin may be dodging it).
