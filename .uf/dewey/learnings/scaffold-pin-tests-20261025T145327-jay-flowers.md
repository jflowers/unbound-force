---
tag: scaffold-pin-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-25T14:53:27Z
identity: scaffold-pin-tests-20261025T145327-jay-flowers
tier: draft
---

Line wrapping silently defeats strings.Contains pins: a phrase split across a command file's 72-character wrap matches zero occurrences even though the wrapped text visually "contains" it. In PR 815 round 3, the pin subtest "fix loop iteration budget survives resume" pinned "total across sessions", which occurs twice in uf.unleash.md's Step 5 — but only the exhaustion-rule occurrence (line 950) is contiguous; the resume paragraph's occurrence (lines 962-963, "total across" / "sessions") is split by the line break, so deleting the entire resume paragraph fails no assertion and the durability mechanism the subtest is named for is unpinned. The same subtest's other phrase, "iteration: [fix-loop iterations", occurs at two wiring sites (quick gate line 801, phase checkpoint line 1180), making each site individually deletable. Recipe: when auditing or writing a pin, count occurrences with single-line grep (not visual reading of wrapped text); for every wiring site the pin claims to cover, confirm at least one contiguous single-line occurrence unique to that site. If a candidate phrase wraps at any site, choose a shorter phrase that fits on one line (e.g. "never 3 more per resume") or reword the command so each site carries a unique single-line marker, as the per-gate loop-entry phrases "(above)" / "(defined below the...)" / "(defined in Step 5)" do.
