---
tag: gaze-artifact-hygiene
author: jay-flowers
category: gotcha
created_at: 2026-10-11T19:32:37Z
identity: gaze-artifact-hygiene-20261011T193237-jay-flowers
tier: draft
---

When performing large-scale removal changes that delete entire packages, the .gaze/ directory can accumulate transient build artifacts (crap_stderr.txt, crap_stdout.txt) from running gaze crap during verification. These files should be added to .gitignore or excluded from staging. The .gaze/ directory is intentionally tracked for baseline.json but not for CLI output logs.
