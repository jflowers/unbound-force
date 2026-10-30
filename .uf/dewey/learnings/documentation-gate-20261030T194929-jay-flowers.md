---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-30T19:49:29Z
identity: documentation-gate-20261030T194929-jay-flowers
tier: draft
---

Spec-review check for documentation gates: when a spec's only documentation-gate task defers the classification to PR time ("determine whether a documentation issue is required or the <ad-hoc> exemption applies"), derive the answer at spec time from the proposal's own Impact/Behavior statement. Any recorded user-visible workflow behavior delta relative to the broken state (e.g., "cross-session consolidation becomes reliable instead of failing closed") means both documentation gates apply — the AGENTS.md repo-local docs-issue gate and the constitution's Cross-Repo Documentation website-issue gate — because their enumerated exemptions all require no user-facing behavior change, and categories like "internal-tooling" are not enumerated anywhere. The gate commitment is also independent of content-edit needs: a change whose visible surfaces (command prose, scaffold mirrors, plugin description) are updated in place still needs the CHANGELOG entry plus both tracking issues, with issue numbers recorded in the CHANGELOG entry and proposal Impact section (family precedent: fix-review-dispatch-correlation-release, a purely plugin-internal fix, recorded Docs #808 + unbound-force/website#319). A deferred classification task repeats the decision-only-task anti-pattern (learning documentation-gate-20261022T121705) at planning time; specs should commit to the artifacts or record a per-surface exemption rationale grounded in the gates' enumerated categories. Verified during the forward-aggregate-correlation-id spec review (2026-10-30, issue #872).
