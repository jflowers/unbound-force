---
tag: command-files
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:22:16Z
identity: command-files-20261030T212216-jay-flowers
tier: draft
---

When inserting a numbered step into an agent command file (e.g., .opencode/commands/speckit.*.md), audit every internal "proceed to step N" cross-reference in the same file, not just the trailing step numbers. Observed in quick/sibling-evidence-agent-guidance: inserting step 5 (sibling repository references) into speckit.specify.md renumbered steps 5-9 to 6-10, and the mechanical update of the validation-results pointer ("proceed to step 8" → "proceed to step 9") left it self-referential — it sits inside step 9 (Specification Quality Validation) while the intended target is step 10 (Report completion). The reliable procedure when renumbering: resolve each pointer to its semantic target first (name the step, not just its number), then apply the new number; a pointer that resolves to the step containing it is always wrong.
