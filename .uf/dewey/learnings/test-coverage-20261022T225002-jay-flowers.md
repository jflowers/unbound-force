---
tag: test-coverage
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:02Z
identity: test-coverage-20261022T225002-jay-flowers
tier: draft
---

When a spec delta adds normative command-protocol fragments (option labels, gate markers, recording formats, resume guards), extend the structural pin tests in the same increment to cover every FR that carries an acceptance scenario — and enumerate the FR→pin mapping in the tasks so test-to-requirement traceability stays explicit. Option labels and gate-blocking rules reliably get pinned; the fragments most often missed are consent/auditability records (checkpoint payload shapes, justification requirements) and session-resume guards, precisely the fragments whose silent loss weakens human-oversight guarantees without failing any test. (Branch opsx/spec-review-per-finding-gate, 2026-10-22.)
