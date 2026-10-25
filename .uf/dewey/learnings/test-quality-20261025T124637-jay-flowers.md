---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-25T12:46:37Z
identity: test-quality-20261025T124637-jay-flowers
tier: draft
---

Recurrence of the span-pin site-ambiguity trap (PR 815; extends learning/test-quality-20261024T160650-jay-flowers): the subtest 'blocking gates run the build/test fix loop before exiting' pinned the bare phrase 'build/test fix loop' over the Step 5 span while the feature is wired at two gates inside that span (quick-tier pre-flight ~uf.unleash.md:781, phase checkpoint ~:1170) — deleting the phase-checkpoint wiring, including the new checkpoint green-supersession semantics, leaves the suite green. Pre-flight check that prevents this: before adding a span pin, count case-sensitive occurrences of the exact pinned phrase inside the extracted span (grep the phrase against the command file and map hits to the span boundaries). If the count is greater than 1, the pin is site-ambiguous — replace it with one distinct phrase per wiring site. Ready-made anchors are the template's distinguishing parentheticals: 'build/test fix loop (defined below' for the quick gate, 'build/test fix loop (above)' for the phase checkpoint, 'build/test fix loop (defined in Step 5)' for Step 6. Nearby non-matches also matter: the capitalized loop-definition header ('Build/test fix loop') and hyphenated line-split mentions ('build/test fix-loop call') silently dodge a lowercase pin, so grepping the exact pinned string is the only reliable census.
