---
tag: scaffold-pin-tests
author: jay-flowers
category: pattern
created_at: 2026-10-25T17:15:26Z
identity: scaffold-pin-tests-20261025T171526-jay-flowers
tier: draft
---

Pin suites for a new multi-gate loop feature reliably cover the entry half of the contract (gate-entry wiring phrases, delegation shapes, budget store keys) because those are what the tasks enumerate first; the exit half routinely ships unpinned: the fail-closed/fallback classification rule, each gate's exhaustion-exit sentence, the green-supersession sentence at the checkpoint recording site, and summary restatements in the Guardrails exit list. Audit procedure: after drafting the pin tables, extract every sentence the diff adds to the command asset and sort it into entry / body / exit / summary; any sentence that changes gate behavior on deletion needs one contiguous phrase unique to its site. Two traps observed on PR 815 iteration 3: (1) a bare-word pin like "superseding" is site-ambiguous when the loop block restates the gate sites' semantics -- deleting the recording-site sentence still passes the pin; (2) spans that terminate at "## Guardrails" leave the guardrails section itself uncovered, so exit-list edits shipped in the same diff have zero coverage.
