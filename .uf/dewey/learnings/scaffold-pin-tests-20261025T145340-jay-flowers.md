---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T14:53:40Z
identity: scaffold-pin-tests-20261025T145340-jay-flowers
tier: draft
---

Applying the per-region negative-scoping remedy (learning test-quality-20261025T133555: "one negative per delegation region") requires re-running the call-site census first. When the whole-span command_path: negative in scaffold_test.go was narrowed to the per-task block (PR 815 head), the quick-tier whole-change delegation (uf.unleash.md:757-772) — one of Step 5's three prompt-only uf_delegate_command call shapes, and the site issue #787 had already missed — lost its only command_path: guard, because the narrowing comment justified re-guarding only the fix-loop site. Rule: before narrowing any span-level negative, grep the old span for every call site of the guarded tool and confirm each site is either inside a new narrowed span or covered by a dedicated pin; write the census into the narrowing comment so the enumeration is auditable.
