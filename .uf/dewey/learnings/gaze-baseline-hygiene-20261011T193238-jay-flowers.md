---
tag: gaze-baseline-hygiene
author: jay-flowers
category: gotcha
created_at: 2026-10-11T19:32:38Z
identity: gaze-baseline-hygiene-20261011T193238-jay-flowers
tier: draft
---

When regenerating .gaze/baseline.json as part of a large removal change, the gaze CLI also produces crap_stderr.txt and crap_stdout.txt in the .gaze/ directory. These transient build artifacts should be excluded from staging. Consider adding .gaze/crap_stderr.txt and .gaze/crap_stdout.txt to .gitignore alongside the tracked baseline.json, or use explicit staging (git add .gaze/baseline.json) rather than git add .gaze/.
