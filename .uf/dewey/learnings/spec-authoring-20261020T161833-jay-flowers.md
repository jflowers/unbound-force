---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-20T16:18:33Z
identity: spec-authoring-20261020T161833-jay-flowers
tier: draft
---

Prose exclusions in specs/skills (e.g., "PR references are out of scope; do not resolve them") are unenforceable when the mandated tool's detection grammar cannot distinguish the excluded class — GitHub issues and PRs share one number space, so a `#NNN` hash detector matches both, and `gh issue view` on a PR number fails the whole flow fail-closed. Fail-closed envelopes make the runtime outcome safe, but only a pinned spec scenario or test-table entry makes the outcome a contract. When writing an exclusion into a spec or skill, first check the deterministic detector's actual grammar, then pin the real behavior (including the accidental collision outcome) with a test.
