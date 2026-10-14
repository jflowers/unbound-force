---
tag: test-coverage
author: jay-flowers
category: reference
created_at: 2026-10-14T16:54:50Z
identity: test-coverage-20261014T165450-jay-flowers
tier: draft
---

In unbound-force repos, verification-task rationales must be validated against the actual scope of the named check before the task is marked complete: `make lint` is Go-only (go vet + golangci-lint, Makefile:13-15) and cannot "cover new markdown files" (markdownlint runs only via MegaLinter in CI), and `make plugin-test` runs entirely against mkdtemp scratch fixtures (build-review-prompts.test.ts writes a hand-authored SAMPLE_PACK into the scratch tree), so it can never verify that a newly added real-repo artifact (convention pack, skill) is included in review prompts or discovered by the real repo's tooling. Observed in determinism-codification (PR #723): task 2.1 claimed lint covered the new markdown governance files and task 2.2 implied plugin-test verified pack auto-discovery, while the same PR shipped learnings (ci-parity-20261014T123137, test-coverage-20261014T151547) documenting that neither check can provide that coverage. Recipe: when writing a verification rationale, name the exact command and confirm its file scope (read the Makefile target and the test fixture setup), or cite the learning that documents the limitation and record the accepted compositional verification explicitly — a PR that ships a learning documenting a verification gap should not simultaneously ship task rationales exhibiting that exact gap.
