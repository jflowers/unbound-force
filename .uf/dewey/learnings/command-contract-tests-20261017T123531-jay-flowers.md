---
tag: command-contract-tests
author: jay-flowers
category: reference
created_at: 2026-10-17T12:35:31Z
identity: command-contract-tests-20261017T123531-jay-flowers
tier: draft
---

When re-reviewing a multi-round PR at head, learnings committed by the fix increment distinguish two dispositions: a learning that names a tracking issue or records a fix marks closure, while a learning stating a gap in the observational tense ('were unpinned', 'does not match') with no corresponding fix in the same diff and no tracking-issue reference marks an accepted-as-documented residual — still a legitimate finding for the next review round, not a re-raise of a dispositioned item. Mechanical verification for command-content pins: grep the pinned-parameter list out of the changed Go test, diff it against the consumed tool's zod input schema, and treat every unpinned required parameter on a warn-and-continue command path as an open silent-regression window (observed on PR 745: TestUnleashCommand_ToolRoutingContracts pinned 5 of 8 write_unleash_summary parameters; whatWasBuilt/howToVerify/testResults were unpinned while learning command-contract-tests-20261017T033626 documented the gap without a fix landing).
