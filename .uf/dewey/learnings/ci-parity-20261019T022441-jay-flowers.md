---
tag: ci-parity
author: jay-flowers
category: pattern
created_at: 2026-10-19T02:24:41Z
identity: ci-parity-20261019T022441-jay-flowers
tier: draft
---

OpenSpec verification phases habitually derive CI parity from the Go/TypeScript test workflows (ci_local.yml surfaces: plugin-test, test, lint) and forget the CI Checks workflow (ci_checks.yml: MegaLinter over Go, Actions, Bash, and Gitleaks — markdownlint DISABLED in .mega-linter.yml — plus PR-title commitlint). Because CI does not lint Markdown in this repository, a local Markdown style pass over new .md artifacts is deliberately beyond CI (style consistency), not CI parity — frame it that way rather than as post-push-failure prevention, and verify every claimed CI surface against .mega-linter.yml and the workflow files before writing it into a parity note.
