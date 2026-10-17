---
tag: plugin-activation
author: jay-flowers
category: pattern
created_at: 2026-10-17T14:52:31Z
identity: plugin-activation-20261017T145231-jay-flowers
tier: draft
---

Derived import-closure tests harden only the registration list they assert against. PR 745 added TestStageReviewPluginSources_CoversImportedLibModules, which derives the lib-module set from the staged plugin's imports and closes the staging direction of the registration-drift class -- but lib-module registration is a three-list lockstep (stageReviewPluginSources, isToolOwned, isDivisorAsset) and the test asserts only staging, leaving the ownership-predicate direction uncovered (found as a LOW in round 5 of the PR 745 review council). Pattern: when adding a derived closure test over a hand-maintained list, enumerate every sibling list that must move in lockstep (grep an existing entry across registration surfaces to discover them) and extend the derived-set assertion loop to cover each sibling predicate.
