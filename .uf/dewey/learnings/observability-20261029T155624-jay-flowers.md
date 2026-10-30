---
tag: observability
author: jay-flowers
category: gotcha
created_at: 2026-10-29T15:56:24Z
identity: observability-20261029T155624-jay-flowers
tier: draft
---

Non-fatal warnings (e.g., degraded per-run timeout limits from a failed review-matrix load) that live only in a tool's ephemeral return value are lost precisely when the parent tool-call window dies mid-operation — the exact scenario persisted operation records exist for. Persist warnings into operation-window records for every operation kind, not only the kinds a spec explicitly mandates. In review-dispatch, the recovery path persists warnings but the dispatch path's settleOperationRecord omits them, so a dispatch that ran on degraded limits leaves no durable trace once its parent window is gone (observed in derive-per-run-timeout, commit 34438f13).
