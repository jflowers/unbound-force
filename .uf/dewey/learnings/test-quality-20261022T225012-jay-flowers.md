---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-22T22:50:12Z
identity: test-quality-20261022T225012-jay-flowers
tier: draft
---

When a prose-defined interaction protocol is verified with structural pin tests, derive the pin list from the spec's MUST clauses and scenario outcomes, not from the command text's most greppable strings. In the spec-review per-finding gate change (opsx/spec-review-per-finding-gate, 2026-10-22), option labels, gate markers, severity ordering, and consent rules were pinned, but FR-001's visibility directive (finding text printed above the question tool presenting the same details and options — the originating issue's core ask) and FR-007's severity-pack note operative sentence were left with heading/label-presence checks only, so substantive drift of those clauses leaves the suite green. Two corollaries: include absence checks for retired branch wording (e.g., the old HIGH/CRITICAL dead-stop branch), not just retired option labels — manual task-level grep verification (tasks.md 4.1) has no durable automated counterpart; and pin the operative sentence of governance-pack clarifying notes, not their headings, when a spec scenario defines the note's required content.
