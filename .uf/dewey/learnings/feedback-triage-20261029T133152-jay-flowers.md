---
tag: feedback-triage
author: jay-flowers
category: pattern
created_at: 2026-10-29T13:31:52Z
identity: feedback-triage-20261029T133152-jay-flowers
tier: draft
---

Hybrid maintainer feedback items that bundle a process-policy ask with a concrete artifact fix should be split into separable asks before triage classification. Observed on unbound-force PR 868 (opsx/uf-fix-ci, October 2026, thread anchored at uf.fix-ci.md:173): the item asked (a) to declare extraction issue #861 a blocking dependency for further command surface built on the raw-gh-fetch pattern and (b) to land the three pinned gh fetch invocations in the structural contract test. Ask (b) is DATA-DRIVEN and verifiable from the artifacts: spec FR-002 declares the invocations as MUST-level pinned text, the contract test's own convention pins the gh run rerun invocation verbatim while the d1 clause omits the three fetch strings, and #861 targets exactly those lines — a concrete MEDIUM testing-convention gap with a bounded one-clause fix. Ask (a) is SUBJECTIVE: the shipped artifact is compliant (documented D1 deviation inventory, prior specs-council adjudication, tracked extraction carrier), so blocking-vs-advisory for future work is governance policy the author owns. The split lets the author accept the data-driven half outright while deciding the policy half on its merits, and prevents a subjective process preference from inflating (or a documented adjudication from deflating) the classification of a concrete convention gap.
