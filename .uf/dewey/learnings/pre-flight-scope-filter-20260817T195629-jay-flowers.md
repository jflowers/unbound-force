---
tag: pre-flight-scope-filter
author: jay-flowers
category: gotcha
created_at: 2026-08-17T19:56:29Z
identity: pre-flight-scope-filter-20260817T195629-jay-flowers
tier: draft
---

When adding a new capability to a skill's instruction body (like adding Phase 2b scope filtering to the pre-flight skill), there are three locations that must be updated in sync within the same SKILL.md file: (1) the detailed phase section where the new behavior is documented, (2) the summary or overview table at the top of the file that describes each execution mode's behavior, and (3) the frontmatter description field that agents see when deciding whether to load the skill. The code review caught that the Execution Policies table still said "Run all detected tools" instead of "Run all detected in-scope tools" and the frontmatter description did not mention scope filtering. This is a skill-specific variant of the scaffold sync gotcha — within a single file, the overview and detailed sections must stay consistent.
