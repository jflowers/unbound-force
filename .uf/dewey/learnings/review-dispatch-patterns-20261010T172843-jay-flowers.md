---
tag: review-dispatch-patterns
author: jay-flowers
category: pattern
created_at: 2026-10-10T17:28:43Z
identity: review-dispatch-patterns-20261010T172843-jay-flowers
tier: draft
---

The fetch_pr_review_context tool implementation (October 2026) demonstrated an effective pattern for wrapping external CLI tools in TypeScript plugins: create a centralized runGhCommand() helper function that encapsulates Bun.spawn with consistent timeout handling (AbortSignal.timeout), exit code classification, and error annotation. This helper was called by all 6+ gh CLI invocations in fetchPrReviewContext(), each of which needed different error handling semantics (fatal vs non-fatal). The pattern: runGhCommand returns a discriminated union of success/error, and each call site decides whether to throw, degrade gracefully, or add a warning. Non-fatal sub-calls (CI checks, reviews, inline comments) add structured warnings to the output instead of failing the entire operation. This graceful degradation pattern proved more useful than the spec's original partial_failure error code — the spec was updated to document the actual implementation pattern.
