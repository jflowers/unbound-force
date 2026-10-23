---
tag: spec-authoring
author: jay-flowers
category: pattern
created_at: 2026-10-22T20:05:31Z
identity: spec-authoring-20261022T200531-jay-flowers
tier: draft
---

When a governance change touches both repo-local artifacts (convention packs, repo skills — listed in knownNonEmbeddedFiles in internal/scaffold/scaffold_test.go) and scaffold-embedded mirrors (agent definitions, command templates under internal/scaffold/assets/), the scaffolded sources must carry self-describing guidance and must NOT cite the repo-local pack or skill: repo-local files do not ship to hero repos via uf init, so a rule-ID citation would dangle downstream. The delegation-skill-enforcement change demonstrates the split: .opencode/agents/divisor-guard.md and .opencode/commands/uf.unleash.md name the task_classification/skill/skill_absent_reason parameter contract inline (self-describing), while only the repo-local determinism.md pack and determinism-first SKILL.md cite DE-008. Design D7 exists specifically to keep this boundary clean — future governance changes that span both surfaces should replicate it.
