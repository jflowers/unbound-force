---
tag: documentation-gates
author: jay-flowers
category: gotcha
created_at: 2026-10-17T23:47:06Z
identity: documentation-gates-20261017T234706-jay-flowers
tier: draft
---

When a change record asserts that a follow-up was recorded on an external tracker (e.g., metrics.md stating a docs follow-up is "recorded here and on #NNN"), the assertion is unverifiable from the repository, and child review runs are typically barred from issue-tracker access — so the claim reads as "tracking complete" without independent evidence. Record the comment permalink alongside the issue number so the claim is independently verifiable, or have the consolidating parent re-verify before merge. An unposted comment leaves the follow-up tracked only in a change record that archives on completion, a silent documentation-drift vector. Observed in command-prose-pilot (2026-10-17): the AGENTS.md stale-reference follow-up was asserted as recorded on docs issue #747; the in-repo half was verifiable in the diff, the external half required a pre-merge confirmation (the comment permalink issues/747#issuecomment-6243022274 satisfies it).
