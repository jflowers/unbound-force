---
tag: dispatch-review-runs
author: jay-flowers
category: gotcha
created_at: 2026-10-09T15:11:39Z
identity: dispatch-review-runs-20261009T151139-jay-flowers
tier: draft
---

When updating command files to use an aggregate dispatch tool, the command files lose explicit references to encapsulated tools like acquire_sibling_evidence and invoke_agent. Contract tests that check for these tool names will fail. The fix requires: (1) removing clauses that checked for internal dispatch loop details now encapsulated by the aggregate tool (e.g., host_source_behavior, model_provenance clauses in ReviewCouncil tests), (2) replacing dispatch_agent_run fragment checks with dispatch_review_runs checks, and (3) updating the SharedContextAndToolBoundaries test to skip encapsulated tool checks for aggregate commands while preserving them for individual-tool commands. Key gotcha: the submit_review_findings tool check must also be updated since it's now internal to the aggregate tool for some commands but not others.
