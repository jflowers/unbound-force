---
tag: spec-review-security
author: jay-flowers
category: pattern
created_at: 2026-10-22T20:51:10Z
identity: spec-review-security-20261022T205110-jay-flowers
tier: draft
---

When a spec introduces an escape-hatch parameter that bypasses a security-relevant enforcement (like skill_absent_reason bypassing the skill-reference requirement for deterministic delegations), the spec should include at least one testable example of what constitutes an invalid use of the escape hatch, even if the primary enforcement is review-time judgment. Without a baseline example, the review agent's enforcement is purely subjective and may drift across implementations. The delegation-skill-enforcement spec handles the tool-level enforcement well (fail-closed, structured envelopes) but leaves the escape-hatch audit contract as prose-only guidance.
