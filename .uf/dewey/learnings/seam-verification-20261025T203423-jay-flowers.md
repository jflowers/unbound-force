---
tag: seam-verification
author: jay-flowers
category: pattern
created_at: 2026-10-25T20:34:23Z
identity: seam-verification-20261025T203423-jay-flowers
tier: draft
---

Golden-output-shape documented-site annotations — the census comment's command:line pairs and the [command.md:NNN] segments inside test names — are display labels, not assertions, so partial rename passes stay green. This failure mode has now recurred twice: PR 812 (census header corrected, three test-name anchors off by 7, stale site-count banner) and PR 829 fix-push-state-catch-to-zero (an 8-line uf.finale.md insertion shifted four sites; the pass updated three labels plus the census comment but missed uf_finale_return_to_main, leaving test label [uf.finale.md:349] contradicting the comment's 357 and the actual file). Manual grep recipes are enumeration-fragile — the recipe recorded after PR 812 was not applied on PR 829. Deterministic fix per Constitution Principle VI: extract an executable consistency check — a test that parses the census comment's command:line pairs and every [command.md:NNN] label in the suite's test names, then asserts each cited line against the grep-verified actual line of the documented site in the command file (census header and the anchors beneath it treated as one unit that must agree). That converts label drift from a silently-passing manual-pass dependency into a CI failure.
