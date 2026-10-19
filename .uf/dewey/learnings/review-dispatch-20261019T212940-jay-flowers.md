---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T21:29:40Z
identity: review-dispatch-20261019T212940-jay-flowers
tier: draft
---

When a reviewer offers multiple hardening remedies as equivalents ("anchor with ^ or escape"), verify each option against the behavior the existing test suite pins before endorsing one: escaping an interpolated RegExp segment is behavior-preserving for constant callers, while a naive ^-anchor changes match-position semantics and can silently break tolerated input shapes. Verified in PR 761 feedback triage (maintainer comment 4318057937 on assessmentFieldMarker in review-dispatch/index.ts): the marker intentionally matches mid-line because bulleted labels ("- **category**: bug") place the marker after the list prefix — a test-pinned tolerance ("tolerates bulleted labels") that ^-anchoring would break, while escaping the four metacharacter-free constant field names is a no-op keeping every existing test green. Recipe: map every proposed remedy to the tests that would detect its side effects, and prefer the remedy whose test-diff is empty.
