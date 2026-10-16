---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-16T16:28:16Z
identity: uf-workflow-testing-20261016T162816-jay-flowers
tier: draft
---

When a defect fix spans both a tool and the command prose that invokes it, pin both layers with tests. The unleash-deterministic-tools change tested write_unleash_summary's tool behavior comprehensively (golden templates, path/slug/mode/symlink contract, plus the real writer-to-reader connecting test in uf-finale.test.ts) and even added command-content assertions for formatter wiring in scaffold_test.go's TestUnleashCommand — yet the command's write_unleash_summary invocation and the ceremony-blockquote count (spec scenario "Ceremony removed", 15 to 2) were left unpinned, so a prose-only revert would pass the full suite and silently reintroduce the defect. Pattern: whenever a spec-delta scenario has a mechanically checkable THEN clause about command markdown (a call, a count, an absence), add a between-span or strings.Count assertion in the command-content test the same diff already touches, rather than recording the verified state as manual counts in tasks.md.
