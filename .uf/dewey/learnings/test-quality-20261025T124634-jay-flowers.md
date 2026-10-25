---
tag: test-quality
author: jay-flowers
category: pattern
created_at: 2026-10-25T12:46:34Z
identity: test-quality-20261025T124634-jay-flowers
tier: draft
---

Second instance of the span-pin phrase-presence trap (PR 815, build/test fix loop): a feature wired into three gates — quick-tier pre-flight (uf.unleash.md ~782), per-phase checkpoint (~1170), and the Step 6 soft gate (~1235, covered by the separate codeReviewStep span) — was pinned with one generic feature-phrase Contains plus a parameter table holding only quick-tier and loop-block phrases, leaving the phase-checkpoint wiring (green-supersession and resume re-entry semantics) undetectable by regression. Audit procedure for pin depth: for each wiring site of the pinned feature, delete that site's text (mentally or in a scratch copy) and confirm at least one assertion fails; if none fails, the site is unpinned. Parenthetical qualifiers that naturally distinguish wiring sites — 'run the build/test fix loop (above)' vs '(defined below the classification contract in this step)' vs '(defined in Step 5)' — make serviceable per-site pins without rewording the command template; hyphenated ('fix-loop') and capitalized ('Build/test fix loop') variants do not match a lowercase strings.Contains pin and provide no coverage.
