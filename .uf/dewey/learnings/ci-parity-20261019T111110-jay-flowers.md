---
tag: ci-parity
author: jay-flowers
category: pattern
created_at: 2026-10-19T11:11:10Z
identity: ci-parity-20261019T111110-jay-flowers
tier: draft
---

Derive local CI-parity checklists from the changed file list mapped to workflows, not from the change's primary language surface. Manifest-touching changes (package.json/package-lock.json, go.mod) must cover the workflows that consume those files — in the unbound-force meta repo, ci_security.yml (OSV-Scanner, runs on PRs via reusable_vuln_scan) and ci_dependencies.yml (dependency review) — alongside the usual build/test/lint surfaces; markdown artifacts need the MegaLinter markdownlint pass; only .go source changes need build/coverage-gate. The clarification-marker-superset Phase 4 plan covered ci_local + ci_checks and documented the build/coverage-gate exclusion, but omitted the security/dependency workflows even though the change carried a lockfile refresh with new transitive packages. Every CI surface should appear in the parity note as either covered by a local task or explicitly excluded with rationale.
