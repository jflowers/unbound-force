---
tag: gatekeeping
author: jay-flowers
category: pattern
created_at: 2026-10-19T16:11:32Z
identity: gatekeeping-20261019T161132-jay-flowers
tier: draft
---

Maintainer-override posture for gatekeeping re-flags (opsx/clarification-marker-superset, 2026-10-19): when a maintainer keeps a pinned-dependency bump that lacks the gatekeeping exception's typed justification, the correct posture is honest declaration plus moved gates, not stealth. Declare the update in proposal/design (scope derived from the lock diff, new packages called out), move every pin-enforcement record with the pin (scaffold mirrors, exact-version test constants, rollback baseline SHA, the spec requirement that mandates the pin — via a MODIFIED requirement anchored to the predecessor change, AGENTS.md Technology Stack plus Node floor), document rollback, run the local verification suite (audit, engine floor). With that posture the council's guard classified the re-flag MEDIUM (naming PR review and CI approval as the completing conditions) while the adversary re-flagged HIGH; the maintainer records REQUEST CHANGES as the TERMINAL verdict for both spec review and code review and proceeds — because re-review loops cannot change the verdict while the override stands, and burning iterations on them is waste. The human decision point (per-finding question gate with recommendations before fixing) is what keeps the override legitimate: every other finding gets fixed, only the declared item is overridden.
