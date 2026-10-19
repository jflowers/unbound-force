---
tag: change-management
author: jay-flowers
category: pattern
created_at: 2026-10-19T12:51:03Z
identity: change-management-20261019T125103-jay-flowers
tier: draft
---

When a maintainer adopts pre-existing working-tree drift (e.g., a governance-gated pinned-dependency bump) into an in-flight spec change, the adopting proposal must task commit sequencing explicitly: the spec-artifact commit excludes the adopted files (preserving the spec/implement phase boundary), and the gate-coupled lockstep set (manifest, lockfile, scaffold mirrors, enforcement-test expectations, provenance testdata, AGENTS.md/README lines) lands as a single atomic commit so no pushed commit leaves the pin-enforcement gate inconsistent (manifest version vs test-expectation mismatch fails make check). Observed in fix-triage-issue-dispatch-docs: design D7 documented the lockstep obligations and deferred the separate-branch question to re-review, but no task sequenced the commits — leaving both a phase-mixing risk on the spec commit and an interim-commit window where the pin-enforcement test would fail on a push.
