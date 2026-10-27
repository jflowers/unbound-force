---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-26T10:51:41Z
identity: documentation-gate-20261026T105141-jay-flowers
tier: draft
---

Recurrence of the docs-label gotcha (learning documentation-20261023T162203): gate issues are still filed without the `docs` label that label-keyed duplicate checks depend on. unbound-force/unbound-force#834 (spawn-subtask-classification-params documentation-gate issue, filed 2026-10-25) carries only the `documentation` label and is absent from `gh issue list --repo unbound-force/unbound-force --label docs --state open` results (verified 2026-10-26), while the parent gate issue #791 and siblings #781/#778 carry both labels; the same-day unbound-force/website#329 was filed with an empty label set entirely. Until #825 standardizes the label namespace, gate-issue filing should apply both `docs` and `documentation` labels (or label after the fact with `gh issue edit <N> --add-label docs`), and duplicate checks should search by keyword rather than label alone.
