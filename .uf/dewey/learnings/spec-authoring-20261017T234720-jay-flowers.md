---
tag: spec-authoring
author: jay-flowers
category: gotcha
created_at: 2026-10-17T23:47:20Z
identity: spec-authoring-20261017T234720-jay-flowers
tier: draft
---

When a review finding reports a validation command drifting from its requirement (a ban-list regex missing a token, a count-threshold mismatch), the fix must re-derive the validation from the requirement's complete clause set, not patch only the flagged mismatch. In command-prose-pilot, the iteration-0 fix added the missing "terminate" token to the spec scenario regex but left the same requirement's second clause — the "exit path" phrase ban — with no scenario, task check, or mandated validation step; only the change's own evidence file ran it, labeled advisory. Patching the flagged symptom leaves sibling clauses of the same requirement unvalidated, and the durable artifacts (spec scenarios, task check lists) propagate the gap to future changes that re-execute the mandated procedure. Fix procedure: enumerate every normative clause of the requirement, map each clause to a validation command, then diff that mapped set against all existing validations — not just the flagged one.
