---
tag: commit-scope
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:50:38Z
identity: commit-scope-20261025T185038-jay-flowers
tier: draft
---

Multi-iteration review councils accrue untracked Dewey learnings after the last fix commit, and the diff under review silently undercounts them. PR #815 iteration 4: the reviewed diff (captured at head 6852e52) carried 14 .uf/dewey/learnings/*.md files (newest timestamped 13:35), while the working tree held 25 dated that day — the 14:53-17:15 batches (between-iteration fix work, docs-issue filing, and iteration-4 child-reviewer proposals) were untracked, and the parent session's own review context repeated the undercount ("14 dewey learnings"). Because AGENTS.md commit scope requires workflow learnings to ride the feature PR while forbidding git add -A / git add . on feature branches, the explicit-staging discipline stages the learnings the author knows about and silently drops the post-head delta. Recipe: before /uf.finale, list .uf/dewey/learnings/ filtered to the change's working-date range and compare against the PR's committed set (the diff's changed-files list); stage the delta explicitly in the final pre-PR commit so the reviewed and submitted learning sets match, and derive any learning count cited in review context from the directory, not from the last commit's memory.
