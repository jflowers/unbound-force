---
tag: spec-review
author: jay-flowers
category: gotcha
created_at: 2026-10-19T02:24:57Z
identity: spec-review-20261019T022457-jay-flowers
tier: draft
---

When an OpenSpec change exists to correct documentation-to-tool drift, every payload field name in its spec delta and tasks must be re-verified against the tool's implementation — not carried forward from the erroneous text being corrected. In fix-triage-issue-dispatch-docs (reviewed 2026-10-18), the delta and task 1.2 instructed agents to read a nonexistent 'reference' field from lesson proposals while the change's own design.md D2 documented the correct {agent, information, tag, category} shape from the plugin source; the correcting change nearly re-institutionalized the exact error class (documented fields not matching tool reality) it existed to fix. Design-vs-delta field-name consistency is a required spec-review check for docs-accuracy changes.
