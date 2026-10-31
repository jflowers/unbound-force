---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-31T00:36:01Z
identity: uf-unleash-20261031T003601-jay-flowers
tier: draft
---

uf_delegate_command's skill field must resolve to a real skill name or script path — Makefile targets and file references like "make plugin-test" or "Makefile" DO NOT resolve and fail with SKILL_NOT_FOUND, burning a delegation round-trip. For deterministic work whose procedure of record is a Makefile target or raw command, pass task_classification "deterministic" with a skill_absent_reason instead (kept under 512 chars — longer reasons are rejected with INVALID_INPUT). Verified 2026-10-30 on branch opsx/forward-aggregate-correlation-id: delegating "make plugin-test" with skill "make plugin-test" failed; re-delegating with skill_absent_reason describing the search (Makefile targets, .opencode/skills/, scripts/) succeeded.
