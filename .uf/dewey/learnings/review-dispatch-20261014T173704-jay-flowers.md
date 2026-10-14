---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-14T17:37:04Z
identity: review-dispatch-20261014T173704-jay-flowers
tier: draft
---

Enum aliasing in verdict projections hides behavior changes from single-severity test fixtures. In the review-dispatch plugin, feedback's APPROVE WITH ADVISORIES and REQUEST CHANGES both project to the native AUTHOR-DECIDES value, which back-projects to APPROVE WITH ADVISORIES — so a feedback test fixture containing only HIGH findings (or only LOW findings) produces identical `advisories` arrays under the old (`verdict === AWA`) and new (`projectedVerdict === AWA`) conditioning, because buildAdvisories filters to MEDIUM/LOW. Only a mixed-severity fixture (one blocking HIGH plus one advisory MEDIUM/LOW finding) makes the derived-field population observable and the conditionings distinguishable. General rule: when a projection collapses distinct enum values into one, cover the collapsed pair with a mixed fixture that exercises the derived fields conditioned on the projected value.
