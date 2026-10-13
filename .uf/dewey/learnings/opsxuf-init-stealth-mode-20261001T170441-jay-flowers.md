---
tag: opsxuf-init-stealth-mode
author: jay-flowers
category: pattern
created_at: 2026-10-01T17:04:41Z
identity: opsxuf-init-stealth-mode-20261001T170441-jay-flowers
tier: draft
---

A stealth/local-only init mode that keeps the working tree git-clean must enforce failure atomicity as the CORE invariant. The robust rollback design that emerged after six review-council iterations: (1) capture a pre-init baseline of which canonical scaffold paths pre-existed, the pre-existing untracked-file set, and the pre-existing staged-file set (all fail-fast before any write); (2) on failure, restore the .git/info/exclude file to its pre-init bytes BEFORE running an untracked-file discovery sweep so that files scaffolded into a pre-existing excluded directory become visible and are removed; (3) restrict file deletion to paths matching the canonical scaffolded set (never a blanket delete of the whole post-baseline untracked delta, which would destroy unrelated concurrently-created user files); (4) scope index un-staging to staged-now minus staged-at-start (never a blanket git reset); and (5) return an error naming residual dirty paths instead of silently swallowing restore/chmod/remove failures. Any "leave no trace" feature needs its rollback designed as a first-class, baseline-diffing, fail-fast component, not an afterthought.
