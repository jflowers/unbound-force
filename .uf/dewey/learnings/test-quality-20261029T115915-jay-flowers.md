---
tag: test-quality
author: jay-flowers
category: gotcha
created_at: 2026-10-29T11:59:15Z
identity: test-quality-20261029T115915-jay-flowers
tier: draft
---

Retrospective learnings committed inside a change's PR can prescribe fixes the shipped diff does not actually contain. In the derive-per-run-timeout review (PR #860), three .uf/dewey/learnings/*.md files committed with the change each named a specific fix (pin prompt_bytes to Buffer.byteLength; wire the degraded flag through redispatch; assert whole-KiB floor boundaries), yet none of those fixes appeared in the shipped test or source files. Before APPROVE, a reviewer must diff each in-change learning's prescription against the shipped files: a learning that names a fix pattern documents an open gap, not a closed one. Treat in-diff learnings as claims requiring verification against the diff, not evidence of completion.
