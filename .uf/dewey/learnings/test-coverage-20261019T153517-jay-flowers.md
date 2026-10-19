---
tag: test-coverage
author: jay-flowers
category: pattern
created_at: 2026-10-19T15:35:17Z
identity: test-coverage-20261019T153517-jay-flowers
tier: draft
---

When a behavior change introduces a new persistent end state (e.g. a tool that appends a log entry which itself matches a scan grammar), derive each consuming suite's fixture matrix from those new states, not only from input forms. Verifying a composite flow by cross-suite inference through a shared implementation does not prevent later section- or context-aware exclusions from silently decoupling a probe from its extractor — pin the composite end state (input → tool → probe) with an executed assertion in the suite that enforces the gate.
