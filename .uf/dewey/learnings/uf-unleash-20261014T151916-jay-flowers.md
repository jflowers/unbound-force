---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-14T15:19:16Z
identity: uf-unleash-20261014T151916-jay-flowers
tier: draft
---

uf.unleash resumability when the checkpoint/get_progress plugin tools are broken: the .uf/artifacts/dispatch/*.json review-dispatch artifacts are the durable record of review-council runs — each carries timestamp, branch, mode, verdict, and findings. During determinism-codification (2026-10-14), these artifacts revealed that the prior session exited spec review with REQUEST CHANGES (7 HIGH findings), that fixes were committed afterward without a confirming re-run, and that code review had never run — while filesystem state alone (all tasks [x], tests passing) overstated completeness. Recipe: on resume, list .uf/artifacts/dispatch by mtime, parse the newest artifact for the current branch, compare its recorded head_sha against git rev-parse HEAD, and treat a review step as complete only when a passing artifact exists at or after the implemented head commit. Beware /tmp dispatch-* directories with placeholder SHAs (aaaa.../bbbb...) — those are plugin-test fixtures, not real reviews.
