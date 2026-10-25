---
tag: error-handling
author: jay-flowers
category: gotcha
created_at: 2026-10-25T19:52:17Z
identity: error-handling-20261025T195217-jay-flowers
tier: draft
---

Failure-envelope hardening must audit sibling tools and validate full tokens, not just finiteness. Two gaps surfaced across the uf-finale count-path fixes (rebase-upstream-before-push PR #812, then issue #821): (1) fixing uf_finale_base_state's catch-to-zero left the identical pattern alive in sibling uf_finale_push_state — both tools count git rev-list --count output and both feed gate-deciding values (behindBy / diverged), but only the first was hardened, so the silent zero survived one tool over until a separate issue was filed. When hardening a failure envelope, grep sibling tools for the same coercion/catch pattern and fix them in the same increment. (2) The recorded recipe "Number.isFinite check mapping parse failures to the same failure code" is insufficient alone: parseInt is prefix-tolerant (parseInt('2x', 10) returns 2, which is finite), so partially-numeric stdout passes a finiteness check — the trimmed token must match /^\d+$/ before parseInt runs. Verified on quick/fix-push-state-catch-to-zero (unbound-force, 2026-10-25): the parseRevCount helper implements full-token digit validation and routes both exec throws and unparseable output through retryable PUSH_SYNC_COUNT / BASE_SYNC_COUNT envelopes, with the '2x' case pinned by a regression test and the consuming command's soft-gate branch (plus scaffold mirror) wired in the same increment.
