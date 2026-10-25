---
tag: uf-unleash-workflow
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:35:16Z
identity: uf-unleash-workflow-20261025T183516-jay-flowers
tier: draft
---

/uf.unleash workflow mechanics on unbound-force (learned on opsx/fix-init-speckit-sentinel, 2026-10-25): (1) uf_delegate_command's default 10-minute timeout is too short for /opsx-propose and multi-task implement batches — timed-out children still make partial progress on disk, so on retry tell the child which artifacts already exist ("keep them, produce the rest") and raise timeout to 1800000ms; (2) the Read tool's hashline #HL prefixes are display metadata, NOT file content — edit oldString/newString must be plain text or the edit fails with "oldString not found"; (3) the glob tool returned no files for .opencode/agents/divisor-*.md while bash ls worked — use bash ls for agent discovery; (4) consolidate_dispatch's finalized artifact JSON (.uf/artifacts/dispatch/<correlation>.json) does NOT carry the child lesson proposals — they appear only in the consolidate result's top-level proposals array; full tool outputs land in ~/.local/share/opencode/tool-output/ and can be re-parsed from there (python json.load) when the in-context result was truncated.
