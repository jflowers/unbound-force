---
tag: documentation
author: jay-flowers
category: gotcha
created_at: 2026-10-29T00:28:48Z
identity: documentation-20261029T002848-jay-flowers
tier: draft
---

In the unbound-force meta repo, adding a slash command touches documentation surfaces beyond the command tables that spec FR-012-style requirements usually cover: (1) AGENTS.md Project Structure maintains an exact slash-command count - verified 'Slash commands (32 files)' against exactly 32 committed .opencode/commands/*.md files (33 on disk with an in-flight uncommitted command); (2) QUICKSTART.md 'What Gets Scaffolded' maintains the scaffolded-command count ('11 commands'), which tracks the internal/scaffold command inventory that scaffold_test.go counts; (3) docs/architecture.md's 'Scaffolded Files - Slash commands' section lists the tool-owned commands uf init deploys; (4) CHANGELOG.md user-facing entries carry dual footers - '(Spec: openspec/changes/<name>/)' plus '(Docs: #<repo-issue>, unbound-force/website#<website-issue>)' - verified on the replicator-version-floor entry. Spec changes that add command files should include tasks to bump or update all inventory surfaces; verification is one glob of .opencode/commands/*.md against the AGENTS.md count. CLAUDE.md does not exist in this repo (checked 2026-10-28), so precedent conditional checks against it are moot.
