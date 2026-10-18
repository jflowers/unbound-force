---
tag: command-prose
author: jay-flowers
category: gotcha
created_at: 2026-10-17T23:47:04Z
identity: command-prose-20261017T234704-jay-flowers
tier: draft
---

When piloting a prose or style standard on a real artifact, record a conformance check for every requirement of the standard, not only the lexically checkable ones. In command-prose-pilot, the five rg scans (ban list, stale references, Gate Relay verb, session-resume guard, exit-path phrase) verified token-level rules but not the structural Step Template requirement — so the rewritten command applied the Action/On-failure template unevenly (step 2's gh invocation gained an On-failure branch; step 3's fallible plan-file validation did not) and used non-glossary action verbs ("Determine", "Receive") at two steps the ten-verb glossary could not express. The pilot command itself needing verbs outside the glossary is the earliest evidence available for the phase-2 glossary extension, yet the design's risk note attributed glossary incompleteness only to "other commands". A requirement-by-requirement conformance matrix in the change record (requirement, check performed, result or recorded deviation) closes both gaps: it verifies structural rules mechanically or by checklist, and it captures standard-insufficiency evidence where the promotion-phase change can find it.
