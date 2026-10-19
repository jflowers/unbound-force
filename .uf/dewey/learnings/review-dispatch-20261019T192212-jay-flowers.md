---
tag: review-dispatch
author: jay-flowers
category: pattern
created_at: 2026-10-19T19:22:12Z
identity: review-dispatch-20261019T192212-jay-flowers
tier: draft
---

The read_assessment_fields tool demonstrates a sound untrusted-input validation pattern for parsing structured fields from child agent text: per-field Zod schema validation with independent failure (null/unavailable) semantics, bounded string lengths, bounded array counts, and JSON.parse wrapped in try/catch returning null on failure. The key design choice — per-field independence where one field's validation failure does not affect others — prevents a single malformed field from blocking the entire assessment. This pattern is reusable for any tool that extracts structured data from untrusted LLM output.
