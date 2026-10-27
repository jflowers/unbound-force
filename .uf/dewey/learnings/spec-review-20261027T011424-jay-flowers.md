---
tag: spec-review
author: jay-flowers
category: pattern
created_at: 2026-10-27T01:14:24Z
identity: spec-review-20261027T011424-jay-flowers
tier: draft
---

Before accepting a change's MODIFIED requirement anchors as complete, map the full requirement-ownership chain: grep each rewritten requirement's header and key normative phrases across openspec/changes/** to enumerate every unarchived change that carries the requirement live, and confirm the change carries a MODIFIED delta for (or explicitly reconciles with) each owner. Observed during the unleash-interactive-clarify spec review iteration 1 (2026-10-26, branch opsx/unleash-interactive-clarify): the "Guardrail consistency" requirement had a second live owner (unleash-deterministic-tools) beyond the initially mapped one, found only by ownership-chain enumeration. Refined in the iteration-2 form (openspec-consistency gotcha): grep the header plus the normative phrase (e.g. "### Requirement: Guardrail consistency" + "single legitimate mid-pipeline") across openspec/changes/**.
