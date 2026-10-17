---
tag: uf-workflow-testing
author: jay-flowers
category: reference
created_at: 2026-10-16T22:51:30Z
identity: uf-workflow-testing-20261016T225130-jay-flowers
tier: draft
---

CRLF pins for the uf-workflow shared task-line grammar must assert the computed count, not just the absence of failure, and must reach the count consumer through its tool harness. countUncheckedCheckboxes is unexported, so the only access path is createUnleashDetectResumeTool via the resume suite's invokeDetectResume/fakeDeps harness — unleash-tasks.test.ts cannot pin it. The failure mode is a false implement-complete, not an error: with the \r strip removed, every \r-terminated checkbox line fails TASK_LINE_PATTERN, unchecked_count returns 0 (indistinguishable from genuinely complete — null is the missing-file signal), and implementDone evaluates true on open tasks. Assert unchecked_count === <expected open-task count> and step_statuses.implement === false for a CRLF fixture derived from the LF fixture via content.split("\n").join("\r\n") (derivation guarantees content parity), and complement with a CRLF-complete fixture asserting 0/true to prove CRLF neither under- nor over-counts. Extends uf-workflow-testing-20261016T152656 (round-2 CRLF finding) to the count consumer it left unpinned.
