---
tag: security-review-removal-changes
author: jay-flowers
category: pattern
created_at: 2026-10-11T19:32:36Z
identity: security-review-removal-changes-20261011T193236-jay-flowers
tier: draft
---

When reviewing large removal changes (50+ deleted files), the Adversary should focus security review effort on: (1) any NEW code introduced alongside the deletion (the /tmp path validation fix was the only security-relevant new code in a 100-file change), (2) whether the removal inadvertently drops security checks that were embedded in the deleted code (e.g., hero detection in doctor/checks.go called orchestration.DetectHeroes which performed file existence checks — but these were informational, not security gates), and (3) whether .gitignore cleanup is complete (the .gaze/ build artifacts slipped through). The bulk of a removal change is inherently safe from a security perspective — deleted code has zero attack surface.
