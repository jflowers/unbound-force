---
tag: command-design
author: jay-flowers
category: gotcha
created_at: 2026-10-29T06:06:37Z
identity: command-design-20261029T060637-jay-flowers
tier: draft
---

In uf command design, a recovery narrative like "re-invoke the command to continue with a fresh budget" is only true if the exhaustion exit itself clears the persisted loop counter. The checkpoint/get_progress state is keyed by command+branch and spans invocations — it is cleared only where the command explicitly calls clear_progress (typically the terminal phase). A cap-exhaustion STOP that occurs before the terminal phase leaves the counter persisted, so re-invocation resumes the exhausted count and immediately re-STOPs: the documented recovery becomes a dead end (seen in the uf-fix-ci design R4 vs. the command's never-reset-on-resume 4.0 rule). When writing or reviewing a design decision that promises fresh-budget re-invocation after exhaustion, check it against the state machine's actual clear/reset points — either clear the counter on the exhaustion exit or write the recovery in resume semantics with a documented human reset path.
