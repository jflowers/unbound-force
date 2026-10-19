---
tag: test-coverage
author: jay-flowers
category: pattern
created_at: 2026-10-19T17:17:31Z
identity: test-coverage-20261019T171731-jay-flowers
tier: draft
---

Cross-suite fixtures that hand-write another tool's output format (e.g., a resume-probe fixture mimicking resolve_clarification's Clarifications log line) test the consumer's behavior but not fixture realism: if the producer's format changes, the fixture silently stops representing reachable state while still passing. Either derive such fixtures from the producer's executed output (a write-applying fake-deps harness makes this cheap — fakeSpecDeps already persists writes), pin the producer's write format in the producing suite and cross-reference it from the fixture, or both. Verified in opsx/clarification-marker-superset (PR #753): SPEC_WITH_CLARIFICATIONS_LOG_MENTION vs the clarify suite's round-trip write assertions.
