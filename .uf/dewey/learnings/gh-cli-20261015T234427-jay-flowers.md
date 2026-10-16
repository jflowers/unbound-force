---
tag: gh-cli
author: jay-flowers
category: gotcha
created_at: 2026-10-15T23:44:27Z
identity: gh-cli-20261015T234427-jay-flowers
tier: draft
---

`gh issue create --body "$(cat <<'EOF' ... EOF)"` fails with "bad substitution" when the body contains backticks (command substitution inside the heredoc-into-variable expansion). Reliable pattern (unbound-force repo, 2026-10-15): write the body to a temp file and pass `gh issue create --body-file <path>` (or `gh issue edit <N> --body-file <path>`). Fetch-then-edit with node string replacement works well for surgical updates to existing issue bodies.
