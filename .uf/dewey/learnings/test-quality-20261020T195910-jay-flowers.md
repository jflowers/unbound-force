---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:59:10Z
identity: test-quality-20261020T195910-jay-flowers
tier: draft
---

Vitest/Jest suite-wide "never invoked" guards on a shared module-level mock are silently windowed by any afterEach(() => mock.mockClear()) that a sanctioned-caller describe declares earlier in the file: the final expect(mock).not.toHaveBeenCalled() only observes calls made after the last clear, so leaks in earlier tests are invisible to it. In unbound-force's unleash-resolve-issue.test.ts (PR #784 review), the guard survived only because the sanctioned contract test's unrelated toHaveBeenCalledTimes(1) exact-count assertion incidentally caught pre-clear leaks — an undocumented coupling that degrades silently if the count is ever weakened. Pattern to prefer: count the sanctioned calls instead of clearing them — drop the afterEach clear and assert toHaveBeenCalledTimes(N) with a comment naming the sanctioned callers — or isolate sanctioned callers in their own test file so the shared history needs no clearing. Never write a comment claiming "the accumulated call history across the whole file" when an afterEach clears it mid-file.
