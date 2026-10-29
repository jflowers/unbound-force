---
tag: documentation-gate
author: jay-flowers
category: pattern
created_at: 2026-10-29T18:27:46Z
identity: documentation-gate-20261029T182746-jay-flowers
tier: draft
---

A spec's documentation-impact assessment task should verify the full user-facing docs surface, not a fixed five-file list (AGENTS.md, docs/usage.md, docs/architecture.md, README.md, QUICKSTART.md). In unbound-force/unbound-force the docs/ tree also carries heroes.md, cli-reference.md, configuration.md, fullsend-setup.md, and RELEASE_PROCESS.md. Cheap verification recipe for additive plugin-tool changes: grep docs/ plus README.md and QUICKSTART.md for the tool names, the affected command name, and the raw mechanics strings the change replaces (e.g. "gh pr checks", "gh run view") — zero matches outside internal learnings-review retrospectives confirms the no-change disposition extends to the unnamed files. Record the sweep result in the docs-gate issue so the disposition's completeness is auditable, extending the 2026-10-27 superseded-sentence sweep practice (learning documentation-gate-20261027T132015) to no-change scope verification.
