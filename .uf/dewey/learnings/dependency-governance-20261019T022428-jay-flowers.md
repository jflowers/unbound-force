---
tag: dependency-governance
author: jay-flowers
category: pattern
created_at: 2026-10-19T02:24:28Z
identity: dependency-governance-20261019T022428-jay-flowers
tier: draft
---

When a diff bundles dependency version changes (package.json, package-lock.json) alongside spec artifacts for an unrelated change, the Adversary should flag the dependency change as a commit-scope violation per the Gatekeeping behavioral rule — even in spec review mode. The dependency change expands the attack surface (transitive dependency major version bumps) and requires its own justification branch per the Commit Scope rule. Spec review mode does not exempt dependency changes from security scrutiny when they appear in the diff.
