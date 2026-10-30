---
tag: openspec
author: jay-flowers
category: gotcha
created_at: 2026-10-19T13:44:24Z
identity: openspec-20261019T134424-jay-flowers
tier: draft
---

OpenSpec proposal templates ported across Unbound Force sibling repos must remap the Constitution Alignment section to the consuming repo's constitution. The gaze hero constitution (v1.3.0) has four principles (Accuracy, Minimal Assumptions, Actionable Output, Testability); the org constitution in unbound-force/unbound-force (v1.4.0) has six (Autonomous Collaboration, Composability First, Observable Quality, Testability, Security by Default, Deterministic Execution). PR #752's gaze-ai-report proposal copied the gaze principle set verbatim from gaze's reusable-gaze-ai-report change, producing a Constitution Check that assessed the wrong governing document even though the work itself complied with all six org principles. This repo's sibling proposals head the section "Assessed against the Unbound Force org constitution" — authors and reviewers should verify the principle names in any Constitution Alignment section match the constitution of the repo the spec lives in, especially when a change consumes artifacts authored in a sibling repo.
