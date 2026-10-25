---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-25T17:15:20Z
identity: documentation-gate-20261025T171520-jay-flowers
tier: draft
---

A documentation-gate task that files an issue in a sibling repository must encode BOTH closure requirements in the task line itself: recording the filed issue number in the change artifacts at filing time, AND applying the target repo's standard label (`docs`). Learnings documentation-gate-20261014T173702 (label half) and documentation-gate-20261020T001448 (cross-reference half) each document one half; in PR 815 (unleash-build-test-fix-loop), tasks.md 3.2 encoded only the cross-reference half, so the check-off passed while unbound-force/website#322 shipped with no labels — even though all 20 of its open docs-tracking siblings (#254-#320, including the /uf.unleash siblings #307/#309/#314/#317) carry `docs`. Verified 2026-10-25: `gh issue list --repo unbound-force/website --label docs` omits #322, so label-filtered duplicate checks are blind to the very issue they must find. Review-side verification must query the referenced issue's labels directly (`gh issue view N --json labels`), because a label-filtered list cannot surface an unlabeled issue; and the label requirement must live in the checked-off task text (or the exemplar task pattern), not only in tribal knowledge, or the cross-reference half gets verified and the label half silently regresses.
