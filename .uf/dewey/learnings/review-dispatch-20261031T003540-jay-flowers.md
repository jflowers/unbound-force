---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-31T00:35:40Z
identity: review-dispatch-20261031T003540-jay-flowers
tier: draft
---

Before flagging a missing lock on a tool-output channel, grep the suite for existing assertions on that channel: in the forward-aggregate-correlation-id review (2026-10-30), the one-line summary carrier '(correlation_id <id>)' initially appeared untested because the new RD-CF-001 suite reads the ID only from dispatch.metadata — but .opencode/test/dispatch-review-runs.test.ts:780-781 (RD-CR-002 suite, #794) already pins response.output toContain('(correlation_id ${correlationId})'), :807 pins the '(correlation_id none)' validation-failure variant, dispatch-status.test.ts:265 pins explicit-ID precedence over the session map, dispatch-status.test.ts:316 pins malformed-ID rejection, and consolidate-dispatch.test.ts:1663 pins explicit-ID payload retrieval. New suites that capture values via the metadata channel correctly avoid duplicating channel-format assertions when a sibling observability suite pins them — check sibling suites first to avoid false coverage-gap findings, and cite the pre-existing lock when accepting the layering.
