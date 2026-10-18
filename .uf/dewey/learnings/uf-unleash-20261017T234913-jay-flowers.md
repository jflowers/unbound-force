---
tag: uf-unleash
author: jay-flowers
category: gotcha
created_at: 2026-10-17T23:49:13Z
identity: uf-unleash-20261017T234913-jay-flowers
tier: draft
---

In this environment (2026-10-17, opsx/command-prose-pilot run) the /uf.unleash pipeline must run with two degraded tools, both with working fallbacks: (1) child-session delegation is broken — uf_delegate_command fails HOST_MODEL_UNAVAILABLE, Task-tool spawns of general/explore fail "Forbidden: model not allowed for this user", cobalt-crush-dev silently no-ops; the working fallback is direct execution by the coordinating agent (documented as acceptable), while invoke_agent works for divisor-* reviewer agents on enmaas/rits/zai-org/glm-5-3 and the dispatch plugin path (plan_review_dispatch → dispatch_review_runs → consolidate_dispatch) works. (2) The checkpoint tool is broken — every call fails CHECKPOINT_ERROR "undefined is not an object (evaluating 'input.replace')" (its declared schema takes no parameters but the implementation expects an input object); the fallback is relying on persisted artifacts for resume (dispatch artifacts under .uf/artifacts/dispatch/, feature-dir spec files, tasks.md checkboxes) and clear_progress at pipeline end (idempotent). Failures of these convenience tools do not gate pipeline completion; the review and evidence artifacts are the authoritative state.
