---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-14T16:55:42Z
identity: openspec-20261014T165542-jay-flowers
tier: draft
---

When an OpenSpec change combines bulk deletion with a small additive behavior, state the coverage strategy for the additive part unconditionally and identically in design.md and tasks.md. "Add a test if existing coverage is missing" is vacuous for new code -- nothing can already cover a field that does not exist yet -- and a design-level "MAY add a test" contradicts a tasks-level conditional requirement, giving implementers a legitimate skip path. Write "a unit test asserting <field> MUST be added" in both artifacts (observed in openspec/changes/fix-tui-git-output-leak: design.md Decision 5 said MAY while tasks.md 3.2 conditionally required the test).
