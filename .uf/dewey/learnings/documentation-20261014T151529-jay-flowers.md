---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-14T15:15:29Z
identity: documentation-20261014T151529-jay-flowers
tier: draft
---

Constitution amendments that change a countable set (principles, rules, packs) must sweep live instruction text for hard-coded enumerations, not only README/docs/.specify/templates: in unbound-force/unbound-force, .opencode/agents/constitution-check.md:43,95 (with its byte-identical scaffold twin internal/scaffold/assets/opencode/agents/constitution-check.md) still enumerates "the four org principles (I, II, III, IV)" — stale since v1.3.0 (Principle V) and widened to two-behind by v1.4.0 (Principle VI, determinism-codification), whose SYNC IMPACT REPORT assessed only .specify/templates/*. Gotcha: .opencode/{agents,commands,skills} files are drift-enforced against scaffold copies (TestCanonicalSources_AreEmbedded), so the fix cannot ship on the feature branch and must go via a separate chore/uf.init-sync-style branch — meaning the miss silently becomes an untracked follow-up unless the tracking issue is filed in the same change. Sweep recipe: repo-wide grep for ordinal count words near the set name, excluding immutable point-in-time records (specs/, openspec/changes/ other than the active change, CHANGELOG history, .uf/dewey/ learnings); for live hits under .opencode/, file or extend the change's docs-gate issue (e.g., #720) to cover them, cross-referencing related scaffold-rework issues (e.g., #527) so genericization and count fixes land together. Extends constitution-amendment-20261014T123136 (which covered constitution body + README only).
