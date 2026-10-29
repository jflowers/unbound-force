---
tag: uf-init
author: jay-flowers
category: gotcha
created_at: 2026-10-29T23:24:41Z
identity: uf-init-20261029T232441-jay-flowers
tier: draft
---

make check on opsx/extend-fetch-pr-review-context (2026-10-29) failed at the test stage: cmd/unbound-force TestRunInit_FreshDir reported "expected files processed in [71-75], got 76". Root cause is pre-existing on main: commit 0176f61b (feat(commands): add /uf.fix-ci) added internal/scaffold/assets/opencode/commands/uf.fix-ci.md as the 77th embedded asset but did not bump the main_test.go file-count range, leaving the comment arithmetic (76 total assets, base count 71) and the [71-75] assertion stale by one. Correct model after the addition: 77 assets, base 72, range [72-76]. The failure is environment-gated: it manifests only when all four activation-gated plugin probes succeed (fully-provisioned dev machine: base 72 + 4 = 76 exceeds the stale 75 cap). CI runners complete fewer activation probes, so Local CI on main stays green and the stale range went unnoticed there. Runtime proof: the test fails identically in a detached worktree at the merge-base (09dda515); the branch modified two existing assets and added none (asset count 77 at merge-base and at HEAD). Remediation: bump the range and comment arithmetic in cmd/unbound-force/main_test.go on a separate quick-tier branch per the commit-scope rule (the asset-count growth came from main, not from the feature branch). Reinforces the plugin-scaffold learning: the TestRunInit_FreshDir range must be bumped by the number of new scaffold asset files added.
