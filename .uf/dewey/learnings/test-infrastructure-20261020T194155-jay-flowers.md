---
tag: test-infrastructure
author: jay-flowers
category: gotcha
created_at: 2026-10-20T19:41:55Z
identity: test-infrastructure-20261020T194155-jay-flowers
tier: draft
---

When a retrospective learning captured during a change's own workflow names that change as the remediation owner for a convention-pack MUST rule, apply the remediation before PR submission instead of shipping the learning and the violation together. On seam-verification (PR 783, 2026-10-20), the retrospective stored test-infrastructure-20261020T165710 — which names the adding change as the withBun extraction point and prescribes a grep check for reviewers — after tasks 2.2/2.3 had already landed the 7th and 8th shim copies, so the PR carried both the rule and the code that breaks it, and the gap surfaced only as post-PR maintainer feedback. Process fix: at retrospective time, run the captured learning's own verification (grep the duplicated helper across the touched test directory) against the current change's diff; when the current change is the threshold-crosser, apply the extraction as a pre-merge fix rather than deferring it to opportunistic migration.
