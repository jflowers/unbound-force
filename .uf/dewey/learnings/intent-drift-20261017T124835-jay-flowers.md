---
tag: intent-drift
author: jay-flowers
category: pattern
created_at: 2026-10-17T12:48:35Z
identity: intent-drift-20261017T124835-jay-flowers
tier: draft
---

When a change redefines which signal is authoritative (e.g., checkpoint state → dispatch artifacts in /uf.unleash resumability), sweep every prose surface that states the old authority model — preambles, guard blocks, and mirrored scaffold copies — not just the step that implements the new model. In PR #745, Step 2 was rewritten to the artifact-first resumability model, but the SESSION-RESUME GUARD preamble at the top of the same file still declared "Only checkpoint state is authoritative for resumability", misdirecting the first decision every resumed session makes. Authority statements live in more places than the code that implements them; a grep for the old model's vocabulary (e.g., "checkpoint state is authoritative") across canonical and mirrored copies catches them cheaply at review time.
