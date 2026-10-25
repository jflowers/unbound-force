---
tag: scaffold-delegation
author: jay-flowers
category: gotcha
created_at: 2026-10-25T18:34:57Z
identity: scaffold-delegation-20261025T183457-jay-flowers
tier: draft
---

Scaffold sentinel-collision pattern (found in unbound-force fix-init-speckit-sentinel): when a scaffold engine's embedded-asset walk runs before sub-tool delegation, any asset whose mapped target path equals or falls under a sub-tool's sentinel path silently creates that sentinel and suppresses the tool's init. The bare `.specify` sentinel was satisfied by the scaffolded starter constitution, so every fresh non-force `uf init` skipped `specify init` with no visible indication — and CI stayed green because unit tests called initSubTools() directly, bypassing Run()'s scaffolding phase that creates the collision. Durable fixes: (1) point sentinels at paths only the real tool creates (`.specify/scripts`, `openspec/config.yaml`), never bare directories the scaffold itself may create; (2) hoist the tool table to package level and guard it with a test that walks the embedded FS through the production mapping and asserts no asset lands under any sentinel; (3) make the sentinel skip a visible result instead of a silent nil return, so regressions surface in output even when tests miss them.
