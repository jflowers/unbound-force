---
tag: address-feedback
author: jay-flowers
category: pattern
created_at: 2026-10-26T21:57:09Z
identity: address-feedback-20261026T215709-jay-flowers
tier: draft
---

When address-feedback dispatches twin items that split one root cause across file scopes, the author must treat the twins as one atomic change set and judge each item complete against the root cause, not the item's named files. Verified on PR 839 (2026-10-26, feedback items 4 and 5): the unconditional '/uf.unleash re-run resumes from its durable state' claim is replicated at eight sites in one PR (command file, scaffold mirror, spec delta requirement, spec delta re-run scenario, design D4, design Goals, tasks.md task 1.3, proposal What Changes item 4); item 5 names only the command/mirror pair, item 4 the spec surfaces. An author fixing item 5 in isolation passes TestEmbeddedAssets_MatchSource — item-scoped verification goes green — while the PR's own OpenSpec delta still asserts the false resume semantics; since deltas are the durable behavioral contract that later changes validate against predecessor change files (not the main registry), the contradiction outlives the review cycle. Process rule: when a dispatch's overlap notes name sibling items sharing a root cause, resolve all of them in one commit sweep and re-run the shared verification (drift test plus spec-to-command consistency) across the combined scope before marking either item addressed. Complements the authoring recipe in uf-workflow-20261026T214955-jay-flowers and the reviewer check in uf-workflow-20261026T182020-jay-flowers, which cover the fix content and the review detection, not the twin-item completion semantics.
