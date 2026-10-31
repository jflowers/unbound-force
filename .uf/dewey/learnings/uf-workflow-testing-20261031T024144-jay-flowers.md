---
tag: uf-workflow-testing
author: jay-flowers
category: gotcha
created_at: 2026-10-31T02:41:44Z
identity: uf-workflow-testing-20261031T024144-jay-flowers
tier: draft
---

When threading an executor-produced identifier (e.g., a child session id) into a tool's failure envelopes, enumerate ALL failure return sites in the tool, not just the executor-failure branch — post-executor failures (artifact verification like EXPECTED_ARTIFACT_MISSING, catch-alls like DELEGATE_ERROR) can fire after the child session existed, and the failure message may direct readers to inspect exactly that child's output while providing no pointer to it. Check the type-doc's presence condition against every failure code the tool can return, and lock both presence AND omission per code with tests. Observed on quick/sibling-evidence-agent-guidance (PR #881, unbound-force): child_session_id was threaded into DELEGATE_FAILED/DELEGATE_CANCELLED envelopes but omitted at EXPECTED_ARTIFACT_MISSING, whose STOP message says "Check the agent output for errors" — while result.childSessionID was in scope at that return site.
