---
tag: seam-verification
author: jay-flowers
category: gotcha
created_at: 2026-10-23T20:20:56Z
identity: seam-verification-20261023T202056-jay-flowers
tier: draft
---

A fix commit that refreshes manually-maintained reference values (golden-suite line anchors, census counts, section banners) must verify each refreshed value against ground truth in the same commit — the refresh itself can introduce errors that no test catches. Verified on rebase-upstream-before-push (unbound-force/unbound-force PR 812, 2026-10-23): the golden-site fix commit updated the uf-finale census header to the correct new anchors (uf_finale_create_pr 262, uf_finale_ci_poll 270, uf_finale_return_to_main 349) but wrote three test-name anchors off by exactly 7 lines (255/263/342) and left the "// uf-finale registry -- 8 documented sites" section banner stale directly above a describe renamed to 9 — the file now contradicts itself while the full suite passes, because test-name anchors are labels, not assertions. Recipe: after any anchor refresh, (1) grep the cited line in the target file for the cited symbol to confirm each value, (2) grep the suite for every remaining occurrence of the old count or old anchor values, and (3) treat a census header and the anchors beneath it as one unit that must agree.
