---
tag: content-pipeline
author: jay-flowers
category: pattern
created_at: 2026-10-23T13:35:32Z
identity: content-pipeline-20261023T133532-jay-flowers
tier: draft
---

A change that renumbers or inserts steps in a scaffolded slash command cannot scope its documentation blast radius by reading the command file and its scaffold mirror alone: a repo-wide grep for the command name surfaces step-number references the in-file audit misses. Verified on rebase-upstream-before-push (unbound-force/unbound-force, 2026-10-23): design D8 claimed 'no step-number references outside the command file and its scaffold mirror', but grep for 'uf.finale' found openspec/changes/triage-mandatory-gate/proposal.md citing 'uf.finale Steps 2/5' (step 5 = PR creation, shifted to 6 by the insertion), openspec/changes/uf-workflow-checkpoint/design.md tabulating the finale checkpoint-step sequence (which gains 'sync-base'), and .opencode/test/golden-output-shape.test.ts anchoring all 8 finale tool sites by uf.finale.md line number (every anchor shifts when a step is inserted). Recipe for step-renumbering changes: (1) grep repo-wide for the command name; (2) classify each hit outside the command file and its mirror as step-number, step-sequence, or line-anchor reference; (3) disposition each as historical (implemented-but-unarchived sibling change, D9-style reasoning) or live (add to the update scope); (4) name the test files carrying line anchors in tasks.md so the anchors get refreshed alongside tool-list assertions. Companion gap in the same change: the tasks.md documentation-impact task enumerated only CHANGELOG/AGENTS/README, omitting docs/usage.md and docs/architecture.md (which carry the /uf.finale workflow summary and command-table rows) and the docs-issue filing gate — partial enumeration of a multi-prong gate silently narrows it.
