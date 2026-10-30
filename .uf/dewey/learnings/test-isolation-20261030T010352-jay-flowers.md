---
tag: test-isolation
author: jay-flowers
category: gotcha
created_at: 2026-10-30T01:03:52Z
identity: test-isolation-20261030T010352-jay-flowers
tier: draft
---

Restoring a process.env variable by assignment cannot represent "originally unset": `process.env.TMPDIR = savedValue` stringifies a captured `undefined` into the literal string "undefined", so `os.tmpdir()` returns a relative "undefined" path for the rest of the process — filesystem tests then silently write into the working tree while staying green (test and code under test read the same corrupted env). Restore with `if (saved === undefined) delete process.env.X; else process.env.X = saved;`, or use `vi.stubEnv`/`vi.unstubAllEnvs`. Note TMPDIR is always set on macOS but unset on Linux/CI runners, so this class of bug hides locally and surfaces in CI (or as untracked-file residue). Observed in .opencode/test/fetch-failed-run-logs.test.ts permissions test.
