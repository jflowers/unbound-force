---
tag: spec-review
author: jay-flowers
category: pattern
created_at: 2026-10-19T22:31:24Z
identity: spec-review-20261019T223124-jay-flowers
tier: draft
---

When a change extends a tool's input contract (e.g., adding an optional correlation_id parameter to consolidate_dispatch/dispatch_status) or introduces new operator-facing tools, the owning capability's spec delta must carry the requirement and its negative input scenarios (malformed input, unknown session, empty selection) even when design.md and tasks.md document the signature. Design and tasks are derivations; the delta is the durable record future reviews and archive readers diff against. In fix-review-dispatch-recovery (issue #751), fully-tested negative-input handling shipped with its only spec homes in design.md/tasks.md, leaving both deltas silent on the parameter and the failure modes — a gap caught only at review, remediable doc-only.
