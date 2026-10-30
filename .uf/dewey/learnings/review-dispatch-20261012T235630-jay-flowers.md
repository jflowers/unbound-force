---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-12T23:56:30Z
identity: review-dispatch-20261012T235630-jay-flowers
tier: draft
---

The code review council's consolidate_dispatch tool has a correlation_id tracking limitation when multiple dispatches occur in the same session (e.g., spec review followed by code review). The tool reuses the session's correlation_id and accumulates runs from all dispatches, causing "run has no included plan entry" errors when runs from an earlier dispatch do not match the current plan entries. This manifests as INCONCLUSIVE verdicts even though all individual runs succeeded. The workaround is to search child sessions directly for individual agent verdicts using search_sessions with the session IDs from list_sessions, then manually determine the aggregate verdict. This should be fixed in the dispatch infrastructure to scope runs to their specific dispatch invocation.
