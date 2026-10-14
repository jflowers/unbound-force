---
tag: openspec
author: jay-flowers
category: pattern
created_at: 2026-10-14T16:55:38Z
identity: openspec-20261014T165538-jay-flowers
tier: draft
---

Before an OpenSpec proposal claims "No test changes required", grep the existing test suite for coverage of every NEW observable field the change introduces — the claim must be evaluated against the new surface, not just the removed one. In fix-tui-git-output-leak, the new uf_finale_stage `files` array had zero existing coverage (tests asserted only fileCount), making the proposal's "No test changes required" false, the design's "MAY be added" too permissive, and the tasks' conditional "add a unit test" the only accurate statement. When the no-coverage condition is verifiably true at spec time, state the test as MUST in all three artifacts (proposal, design, tasks) so RFC 2119 modality stays consistent across the change.
