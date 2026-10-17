---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-17T14:22:16Z
identity: review-dispatch-20261017T142216-jay-flowers
tier: draft
---

Path-based zero-waste findings (misspelled store directories, misplaced learning files) must be verified against the working tree with a direct directory read before filing — never from manifest or diff text alone, and never with glob alone. Verified during the PR 745 round-4 guard review: a candidate MEDIUM finding alleged a retrospective learning was committed to a misspelled .uf/dewley/ directory. Direct reads settled it: the .uf listing shows only the canonical dewey/ directory, and .uf/dewey/learnings/ contains uf-workflow-testing-20261016T225130-jay-flowers.md at the canonical path (325 learnings total). Meanwhile three glob patterns (.uf/dewley/**, .uf/dewey/learnings/*225130*, **/uf-workflow-testing-20261016T225130*) all returned false "No files found" — glob does not traverse hidden dot-directories, so a glob miss under a dot-directory path is not evidence of absence. The working tree is the authoritative merge result; a direct directory read both settles manifest-vs-tree divergence and avoids glob false negatives.
