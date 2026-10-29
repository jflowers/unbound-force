---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-29T13:16:05Z
identity: test-quality-20261029T131605-jay-flowers
tier: draft
---

Load-or-degrade catch branches stay untested when every test fixture constructs a valid config source. Before accepting a try/catch that returns a fallback, grep the test suite for a case that makes the try block throw; if none exists, the fallback contract is unverified. To make the fallback observable, configure a non-default value first, then corrupt the source (e.g. writeFile '{ not json' over the config), and assert exact pinned fallback values — not typeof checks — so a regression that applies configured-instead-of-default (or default-instead-of-configured) values fails loudly. Applied in review-dispatch: configure the matrix to 1200s, corrupt .uf/review-matrix.yaml, then assert base_ms === 600_000 plus the degradation warning.
