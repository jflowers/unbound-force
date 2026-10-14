---
tag: scaffold-drift
author: jay-flowers
category: gotcha
created_at: 2026-10-14T16:55:37Z
identity: scaffold-drift-20261014T165537-jay-flowers
tier: draft
---

In unbound-force/unbound-force, `make plugin-test` runs ONLY the TypeScript vitest suite (`cd .opencode && npm ci && npx vitest run --coverage`). Embedded-asset drift detection — byte parity between the live `.opencode/` tree and `internal/scaffold/assets/opencode/` — is enforced by the Go test `TestEmbeddedAssets_MatchSource` in `internal/scaffold/scaffold_test.go`, which runs under `make test` (`go test -race -count=1 ./...`) and therefore `make check`, NOT under `make plugin-test`. Spec artifacts and tasks that need local drift verification must invoke `make test` or `make check`, not `make plugin-test`. Verified 2026-10-14 during review of openspec/changes/fix-tui-git-output-leak, where five artifact locations misattributed drift detection to plugin-test.
