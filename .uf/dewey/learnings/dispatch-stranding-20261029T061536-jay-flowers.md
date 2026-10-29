---
tag: dispatch-stranding
author: jay-flowers
category: gotcha
created_at: 2026-10-29T06:15:36Z
identity: dispatch-stranding-20261029T061536-jay-flowers
tier: draft
---

During the opsx/uf-fix-ci pipeline (unbound-force repo, October 2026), repeated child delegations hit the 30-minute hard cap (uf_delegate_command and dispatch_agent_run runs are bounded to 1,800,000 ms), stranding the parent command mid-pipeline across several sessions. What made recovery cheap instead of catastrophic: every step tool checkpoints durably, and uf_unleash_detect_resume derives review-step completion from the dispatch artifacts under .uf/artifacts/dispatch/ with artifact evidence authoritative over checkpoint claims — so a resumed session re-anchored on get_progress plus parse_tasks plus detect_resume never re-ran green phases or re-verified completed tasks. When a dispatch is stranded specifically by failed children, the review-dispatch plugin carries the issue-751 recovery pair (discard_orphaned_submissions and redispatch_failed_runs) runnable from a fresh parent session. The operating discipline that mattered: budget remaining session time so partial work stays resumable, record budget-only checkpoint steps for fix loops so a mid-loop crash can never be mistaken for a passed gate, and never restart a pipeline that durable state says is nearly done.
