---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-23T11:40:12Z
identity: review-dispatch-20261023T114012-jay-flowers
tier: draft
---

Reviewer agents dispatched against a saved PR diff may execute in a local working tree checked out to a different branch/state than the PR head. Symptom (observed in the PR #793 divisor-guard re-run): file reads show pre-change content (new parameters absent from call blocks) and grep line numbers sit at a consistent offset from BOTH sides of the diff hunks. Failure mode it prevents: filing false findings against working-tree content that is not the reviewed state (e.g., "the change is missing from the command template" as a false CRITICAL). Rule: anchor every line-cited claim to the dispatch diff text, which is authoritative (pre-flight/CI validate the recorded head SHA); use working-tree greps only for inventory questions robust to the mismatch (caller inventories, registration sites — valid when the diff adds no new call sites and the working tree is a later descendant of the base); state the environmental caveat in the review body rather than converting it into a finding.
