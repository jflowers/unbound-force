---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-14T17:11:08Z
identity: openspec-20261014T171108-jay-flowers
tier: draft
---

When an OpenSpec change supersedes requirements documented in another still-active (unarchived) change, recording the supersession only in the superseding change's proposal is ineffective: the archive-time agent reads only the artifacts of the change being archived, so the stale requirements still sync into openspec/specs/ and can permanently contradict the newer change (example: finale-token-reduction's plugin-tools.md "MAY print full git output to TUI via console.log()" and "SHOULD log the file list to TUI" vs fix-tui-git-output-leak's "MUST NOT write to the terminal"). The supersession must be recorded where the archive-time reader will see it — edit or annotate the superseded change's still-active delta spec, or add the note to that change's own proposal — before either change archives.
