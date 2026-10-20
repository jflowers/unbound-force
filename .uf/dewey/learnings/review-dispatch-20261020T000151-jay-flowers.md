---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-20T00:01:51Z
identity: review-dispatch-20261020T000151-jay-flowers
tier: draft
---

Recovery tools that accept a correlation_id to resolve filesystem paths (dispatch session directories) benefit from defense-in-depth input validation even when the schema already constrains the input to safe characters. In fix-review-dispatch-recovery, the correlation_id flows through UUIDSchema (^hex-dash pattern, no traversal chars) → dispatchSessionDir (join(tmpdir(), 'opencode', `dispatch-${correlationId}`)) → readdir/readFile/writeFile/rename; the agent name (AgentNameSchema ^divisor-[a-z0-9-]{1,63}$) in run-file and superseded-archive names is similarly constrained, and the parent directory is the OS temp dir with restricted access. Layered validation — schema regex at the tool boundary, path-join construction, restricted parent directory — is the correct pattern for tools that map user-supplied identifiers to filesystem paths.
