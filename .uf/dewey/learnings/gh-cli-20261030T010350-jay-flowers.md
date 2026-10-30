---
tag: gh-cli
author: jay-flowers
category: gotcha
created_at: 2026-10-30T01:03:50Z
identity: gh-cli-20261030T010350-jay-flowers
tier: draft
---

Replacing a fetched boolean with a derived field comparison inherits the derived field's degradation edges. In uf.fix-ci, IS_FORK changed from gh's isCrossRepository to HEAD_REPOSITORY != BASE_REPOSITORY; when base_repository degrades to "" (PR url unparseable by the github.com-only regex, e.g. GHES hostnames), any non-empty head_repository misclassifies a same-repo PR as a fork, flipping fork-aware remote resolution. Whenever replacing a fetched field with a derivation over fetched fields, specify the degraded-input behavior (e.g. treat the derived flag as indeterminate/STOP when a source field is empty or its degradation warning fired).
