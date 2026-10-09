---
tag: schema-design
author: jay-flowers
category: pattern
created_at: 2026-10-09T17:10:28Z
identity: schema-design-20261009T171028-jay-flowers
tier: draft
---

When an aggregate tool serves multiple command modes with fundamentally different input requirements (e.g., code review needs a diff_path while issue triage does not), prefer discriminated union schemas or mode-conditional optional fields over uniform required fields. Uniform required fields force callers in inapplicable modes to pass placeholder values, creating a semantic gap between schema validation and actual usage. The dispatch_review_runs tool's DispatchReviewRunsInputSchema requires diff_path as min(1) for all modes including triage, which has no diff — a pattern that should be avoided in future multi-mode aggregate tools.
