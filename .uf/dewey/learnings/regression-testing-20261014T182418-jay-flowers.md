---
tag: regression-testing
author: jay-flowers
category: pattern
created_at: 2026-10-14T18:24:18Z
identity: regression-testing-20261014T182418-jay-flowers
tier: draft
---

When writing a negative-assertion regression test for a deleted output behavior (e.g., removing terminal writes from OpenCode plugin tool handlers), spy the entire API family that can produce the forbidden side effect, not just the specific calls that were removed. In fix-tui-git-output-leak, the handlers had used only console.log/console.error, but the expectNoTerminalWrites helper spies six console methods (log, error, info, warn, debug, trace) plus process.stdout.write and process.stderr.write — so reintroducing the leak via any sibling API (console.info, a direct stream write) fails the same test. Pair the broad spy surface with mockRestore in a finally block and per-test vi.resetAllMocks in beforeEach so spies never mask real output or leak between tests.
