---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-17T22:21:48Z
identity: spec-authoring-20261017T222148-jay-flowers
tier: draft
---

When a spec defines a rule as both prose and a validation regex (ban lists, token sets, count thresholds), each restatement is an independent drift point — and the regex is the acceptance test, so when it drifts it silently under-checks rather than failing loudly. In the command-prose-pilot review, the ban-list token set appeared five times (design decision D2, requirement prose, requirement scenario, sibling-spec scenario, task check list); the requirement's own scenario regex dropped "terminate" while the prose two paragraphs above kept it, so a file using "terminate" as a control verb would pass that scenario while violating the rule. This compounds the count-divergence mode observed elsewhere (a proposal citing "2 defects" vs design/spec/tasks citing "3 corrections" in the same change). Enumerations that appear in more than one artifact — especially in changes whose deliverable is itself a consistency standard — should be cross-checked token-by-token (or mechanically diffed) before review, with prose and regex derived from one canonical list.
