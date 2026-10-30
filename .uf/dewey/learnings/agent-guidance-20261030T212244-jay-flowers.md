---
tag: agent-guidance
author: jay-flowers
category: pattern
created_at: 2026-10-30T21:22:44Z
identity: agent-guidance-20261030T212244-jay-flowers
tier: draft
---

When the same guidance paragraph is deployed across multiple surfaces — command files, a convention-pack rule, AGENTS.md, and a Go scaffold literal that re-emits the AGENTS.md section into deployed repos — designate one surface as canonical (the convention-pack rule) and keep every copy's wording aligned to it verbatim or as a clearly-scoped pointer. Verified on sibling-evidence-agent-guidance (2026-10-30): the sibling-reference guidance landed in four command files with two phrasing variants of the same failure mode ("wedge parented child sessions" vs "parented child sessions cannot answer") while the canonical FA-005 rule combines both; nothing binds the copies together (command files other than uf.* have no scaffold mirrors, and the AGENTS.md section vs the Go literal is only pattern-linked, not drift-tested). Reviewer recipe: for any guidance duplicated across surfaces, grep the canonical phrase across all copies and flag partial paraphrases — they are where future edits silently diverge.
