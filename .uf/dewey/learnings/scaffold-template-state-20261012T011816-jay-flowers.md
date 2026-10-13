---
tag: scaffold-template-state
author: jay-flowers
category: gotcha
created_at: 2026-10-12T01:18:16Z
identity: scaffold-template-state-20261012T011816-jay-flowers
tier: draft
---

When a scaffold asset (internal/scaffold/assets/) serves as both a live command template and a scaffold source, mutable state embedded in the template (like execution checklist markers) propagates to new projects. The uf.unleash.md execution checklist should be reset to its default unchecked state in the scaffold copy, even when the live copy reflects a completed run. This is a recurring tension between scaffold drift prevention (which requires identical copies) and scaffold correctness (which requires template-appropriate defaults).
