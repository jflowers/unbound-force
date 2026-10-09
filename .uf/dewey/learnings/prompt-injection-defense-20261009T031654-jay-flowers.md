---
tag: prompt-injection-defense
author: jay-flowers
category: pattern
created_at: 2026-10-09T03:16:54Z
identity: prompt-injection-defense-20261009T031654-jay-flowers
tier: draft
---

When building prompt assembly tools that embed untrusted caller content (like diffs, review context, or user-provided strings), delimiter injection is a real threat that requires defense-in-depth. The build_review_prompts tool uses three layers: (1) static untrusted content delimiters wrapping each caller-provided section, (2) an escapeDelimiters() function that escapes ALL delimiter patterns across ALL sections (not just the current section's delimiters), and (3) a defensive preamble within each delimiter block instructing the model to treat enclosed content as data. The key lesson from code review was that single-section escaping creates cross-section injection vectors — a diff could inject delimiters for the changed_files section. Always escape all delimiter patterns regardless of which section the content belongs to. The UNTRUSTED_SECTION_NAMES constant (8 entries: diff, changed_files, input_context, pre_flight_results, review_context, existing_reviews, sibling_evidence, walkthrough) serves as the single source of truth for delimiter patterns.
