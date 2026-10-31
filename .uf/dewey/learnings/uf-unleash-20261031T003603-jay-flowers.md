---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-31T00:36:03Z
identity: uf-unleash-20261031T003603-jay-flowers
tier: draft
---

A uf_delegate_command timeout (retryable DELEGATE_FAILED) may still have completed the delegated work — the child session can finish and write files after the parent's tool-call window dies. Before re-delegating, verify the working tree: git status/diff against the expected artifact. Verified 2026-10-30 on branch opsx/forward-aggregate-correlation-id (task 3.3, golden-output-shape label refresh): the delegation timed out but the edits had landed and were correct; re-delegating would have duplicated or conflicted. Pattern: on timeout, inspect the tree first; re-delegate only when the expected changes are absent.
