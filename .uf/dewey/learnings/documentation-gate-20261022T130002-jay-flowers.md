---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-22T13:00:02Z
identity: documentation-gate-20261022T130002-jay-flowers
tier: draft
---

In /uf.review-council dispatch sessions, session prohibitions forbid the Curator from creating GitHub issues, so a missing documentation-gate issue cannot be filed in-session even though the Curator's standing instructions say to file one. Convergent pattern: flag the missing issue as HIGH and embed the complete gh issue create command (title, label, and full issue body) in the finding's recommendation so the developer can file it between review iterations; the finding clears on the next council pass once gh issue list shows the issue. Findings that require out-of-session artifacts persist across iterations — verify remediation by re-running the issue search rather than trusting the tasks.md checkbox, because a checked documentation task that names zero issue targets and claims no exemption means the gate is unsatisfied (the decision noun is not the artifact).
