---
tag: opsxrouter-pattern-codification-2026-10-19-uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:20:27Z
identity: opsxrouter-pattern-codification-2026-10-19-uf-unleash-20261019T212027-jay-flowers
tier: draft
---

During the opsx/router-pattern-codification pipeline (2026-10-19), uf_delegate_command failed reproducibly (3 attempts) with error "current assistant active variant is unavailable or invalid", code HOST_MODEL_UNAVAILABLE, retryable=true but never self-healing within the session. The working fallback is the Task tool with subagent_type cobalt-crush-dev: pass the command markdown path or equivalent prompt, verify the expected artifact afterward (the Task worker returns its report), and record the step manually via the checkpoint tool since the auto-checkpoint in uf_delegate_command never runs. This fallback was used for the docs-issue task (filed unbound-force/unbound-force#762) and for all three implement workers.
