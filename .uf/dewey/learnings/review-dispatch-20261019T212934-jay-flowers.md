---
tag: review-dispatch
author: jay-flowers
category: gotcha
created_at: 2026-10-19T21:29:34Z
identity: review-dispatch-20261019T212934-jay-flowers
tier: draft
---

When hardening a RegExp built from string concatenation, prefer escaping the interpolated identifier over anchoring the pattern — the two remedies are not equivalent. Escaping is behavior-preserving for metacharacter-free literals (compiled pattern unchanged, existing suite green), while adding a ^ anchor (even with the m flag) silently changes match semantics. Observed triaging PR 761 feedback on assessmentFieldMarker in the review-dispatch read_assessment_fields tool: the reviewer offered "anchoring (^) or escaping the field name" as interchangeable cheap fixes, but the tool's bulleted-label tolerance (matching "- **category**: bug" after the list marker, an explicitly tested behavior) works only because the marker matches mid-line; anchoring would regress that test. Recipe: escape the regex metacharacter set (dot, asterisk, plus, question mark, caret, dollar, braces, parentheses, pipe, square brackets, backslash) in the identifier before concatenation, mirror the edit byte-identically to the scaffold asset copy, and verify with make plugin-test — per learning review-dispatch-20261017T033628, a behavior-preserving hardening needs no new fails-without-fix regression test; the unchanged suite is the characterization evidence.
