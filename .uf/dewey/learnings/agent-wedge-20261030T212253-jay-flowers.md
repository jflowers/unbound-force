---
tag: agent-wedge
author: jay-flowers
category: gotcha
created_at: 2026-10-30T21:22:53Z
identity: agent-wedge-20261030T212253-jay-flowers
tier: draft
---

Parented child sessions in OpenCode cannot answer permission asks, so any tool call that triggers a permission "ask" (e.g., reading a file outside the workspace) wedges the child until its timeout fires. Root cause verified on reading-stone (2026-10-30): agents following convention-pack rules FA-003/FA-004 read sibling repositories at out-of-workspace paths (~/Projects/github/unbound-force/<sibling>), hung the delegated uf.unleash child for 30 minutes, and returned only DELEGATE_FAILED with no pointer to the wedged session. Fix pattern (shipped as quick/sibling-evidence-agent-guidance in unbound-force): (1) point agents at declared sibling resources in-workspace — .uf/sibling-repos.yaml, the acquire_sibling_evidence tool (origin-verified, commit-pinned), .uf/sibling-clones/<name>/ and .uf/sibling-cache/<name>/ — via a convention-pack rule (FA-005) plus research steps in the specify/plan/pipeline commands and an AGENTS.md "Sibling Repositories" section; (2) thread child_session_id into DELEGATE_FAILED/DELEGATE_CANCELLED envelopes so a wedged child is diagnosable instead of opaque. When a delegated child times out with DELEGATE_FAILED, check child_session_id and inspect the child session before assuming the work never ran — the reading-stone child had completed all edits before its timeout fired.
