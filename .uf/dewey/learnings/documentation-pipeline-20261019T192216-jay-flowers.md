---
tag: documentation-pipeline
author: jay-flowers
category: gotcha
created_at: 2026-10-19T19:22:16Z
identity: documentation-pipeline-20261019T192216-jay-flowers
tier: draft
---

A changelog entry that enumerates corrected behaviors across a primary file "(and the mirrored sections in X, Y, Z)" distributes every enumerated claim to every named section — treat it as a per-section claim list and verify each claim against each named section before merge. In fix-triage-issue-dispatch-docs (fixes #735), the CHANGELOG said /uf.triage-issue §2.3/§2.4 "(and the mirrored §4/§5 sections in /uf.review-council, §2.3.7/§2.3.8 in /uf.address-feedback, §5a in /uf.review-pr) now document ... FR-001 transient/permanent/all-skip failure behavior," but the spec had scoped the sibling corrections to proposal-sourcing only (FR-005), so only triage-issue §2.3 received the failure-behavior block; the changelog lost the per-command scoping when compressing the design's goal list into one distributed enumeration. A distributed enumeration is only as true as its weakest named section; the cheapest countermeasure is a per-item × per-section verification pass over the named files.
