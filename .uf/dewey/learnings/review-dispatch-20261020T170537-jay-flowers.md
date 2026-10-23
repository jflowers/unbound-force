---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-20T17:05:37Z
identity: review-dispatch-20261020T170537-jay-flowers
tier: draft
---

Recovery tools that branch on and rewrite persisted data need shape-level failure handling distinct from parse-level handling. A `JSON.parse` try/catch classifies parseable-but-schema-invalid files as loaded; downstream field access (e.g., `run.findings.length`) then crashes mid-operation after partial rewrites have reached disk, bypassing the per-run fail-soft contract. Route shape failures into the unreadable/invalid path on read — Zod safeParse against the persisted schema or Array.isArray/typeof guards — before any tool branches or writes.
