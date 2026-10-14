---
tag: documentation-gate
author: jay-flowers
category: gotcha
created_at: 2026-10-14T16:55:41Z
identity: documentation-gate-20261014T165541-jay-flowers
tier: draft
---

OpenSpec/Speckit proposals in unbound-force repos that alter plugin tool output, TUI-visible behavior, tool result envelopes, or scaffold-mirrored assets are user-facing changes under the documentation gates, even when framed as internal echo cleanup or bug fixes. Before approving such a spec, check three documentation surfaces the proposal itself will not name: (1) command templates under .opencode/commands/ that document tool return shapes (e.g., uf.finale.md's "uf_finale_stage → {fileCount}") and their internal/scaffold/assets mirrors; (2) still-active prior openspec/changes/*/ delta specs whose documented behavior the new change reverses (e.g., finale-token-reduction's "MAY print full git output to TUI via console.log()" and "SHOULD log the file list to TUI before staging") — the proposal must acknowledge supersession so archive-time spec sync does not carry stale requirements into main specs; (3) existing open docs-label GitHub issues covering the same tools (gh issue list --label docs) — reference them instead of risking duplicate filings. The spec must carry a documentation-impact assessment plus a task for the CHANGELOG.md entry, the current-repo docs issue, and the constitution-mandated unbound-force/website tracking issue, all before PR merge. A proposal that explicitly declares "User-facing behavior: ..." in its Impact section is not exempt from these gates.
