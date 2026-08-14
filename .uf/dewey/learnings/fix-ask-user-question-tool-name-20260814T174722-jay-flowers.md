---
tag: fix-ask-user-question-tool-name
author: jay-flowers
category: gotcha
created_at: 2026-08-14T17:47:22Z
identity: fix-ask-user-question-tool-name-20260814T174722-jay-flowers
tier: draft
---

The review council code review for the AskUserQuestion-to-question rename (issue #475) surfaced one actionable finding across 5 agents: a missing CHANGELOG entry. This was the only finding that required a fix — two LOW findings (pre-existing formatting inconsistency in speckit.clarify.md lines 144-145, and an optional stale-pattern regression test) were correctly deferred as non-blocking. The CHANGELOG documentation gate from AGENTS.md is consistently enforced by multiple Divisor agents (Guard at MEDIUM, Architect at LOW) and should be addressed proactively during implementation rather than waiting for review to catch it.
