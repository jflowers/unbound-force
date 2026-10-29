---
tag: command-contract-tests
author: jay-flowers
category: gotcha
created_at: 2026-10-29T11:50:43Z
identity: command-contract-tests-20261029T115043-jay-flowers
tier: draft
---

Forbidden-verb structural pins in command contract tests must enumerate every syntactic form of the forbidden operation, not just the plugin tool name and the obvious gh verbs. The merge ban in uf-fix-ci's TestCommandContracts_FixCiCommandStructure forbids `git_merge`, `gh pr merge`, `gh pr approve`, `gh pr close`, and `gh pr review` — but the raw-shell form (`git merge` with a space) and `gh pr update-branch` (which merges base into the PR head server-side) are absent, so a future byte-identical edit adding either vector to canonical+mirror passes the pin test undetected; the scaffold drift tests cannot help because they require both copies to match, not to stay safe. When adding a raw form to such a list, guard against benign substrings the pin would false-positive on (e.g. `git merge` is a substring of `git merge-base`, which a legitimate command may need to name).
