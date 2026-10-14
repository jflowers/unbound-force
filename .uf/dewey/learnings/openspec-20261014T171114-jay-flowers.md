---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-14T17:11:14Z
identity: openspec-20261014T171114-jay-flowers
tier: draft
---

When OpenSpec change A supersedes behavior documented in still-active change B, a supersession note written only in A's artifacts is not durable: archive-time spec sync runs per-change against B's own delta specs and will not discover A's note, and when the stale requirements belong to a different capability than A's new capability there is no mechanical conflict detection either. Concrete case (fix-tui-git-output-leak, 2026-10): finale-token-reduction's plugin-tools delta says git tools "MAY print full git output to TUI via console.log()" and the stage tool "SHOULD log the file list to TUI before staging", while the fix added MUST-NOT-write requirements under a new plugin-terminal-hygiene capability — if finale-token-reduction archives afterward, its sync would carry the stale requirements into openspec/specs/plugin-tools/ and contradict the archived hygiene capability. Record the supersession where it will be enforced: annotate B's delta spec (superseded-by reference to A, at the specific stale requirement lines) in the same PR so the archive step deterministically drops or amends the stale requirements.
