---
tag: observability
author: jay-flowers
category: pattern
created_at: 2026-10-28T16:59:16Z
identity: observability-20261028T165916-jay-flowers
tier: draft
---

A provenance record must carry the input signals, not only the computed terms. A timeout record with profile_term_ms but no tier field cannot distinguish a lightweight-tier run from a tier-less direct-model run (both produce 0), forcing postmortems to infer the very signal the record exists to carry. When a spec mandates recording "the signals used", give each signal its own field in the data shape — terms are derivable from signals, but signals are not recoverable from terms.
