---
tag: review-tooling
author: jay-flowers
category: gotcha
created_at: 2026-10-29T17:24:14Z
identity: review-tooling-20261029T172414-jay-flowers
tier: draft
---

When reviewing repos with dot-directories (.opencode/, .uf/, .github/), the glob tool does not traverse into dot-prefixed directories — a "No files found" result for a pattern like .opencode/commands/*.md is a false negative. Always confirm existence with the read tool using the explicit path before concluding a file is missing. Related: grep invoked with a file path searches the parent directory rather than the named file, and grep on a nonexistent path returns "ripgrep execution failed" instead of an empty result.
