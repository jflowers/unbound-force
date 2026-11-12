#!/usr/bin/env bash
# Run eval fixtures in the isolated environment.
#
# Usage: EVAL_DRIVER=/path/to/eval-infra/driver/run-eval.ts .eval/run.sh [run-eval args]
# Example: .eval/run.sh --only review-council-clean --output /tmp/out
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
driver="${EVAL_DRIVER:?path to eval-infra driver/run-eval.ts}"
model="${EVAL_MODEL:-enmaas/rits/zai-org/glm-5-3}"

# Tools and API keys: chezmoi's env.sh locally, plain env vars in CI.
if [ -r "$HOME/.config/shell/env.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.config/shell/env.sh"
fi
: "${ENMAAS_KEY:?ENMAAS_KEY must be set}"

xdg="$(bash "$root/.eval/lib/prepare-eval-env.sh")"
export XDG_CONFIG_HOME="$xdg"

cd "$root"
echo "opencode $(opencode --version) ($(command -v opencode))"
exec bun run "$driver" --fixtures "$root/.eval/fixtures" --model "$model" \
  --answerer plugin --agent autonomy --require-tools compress "$@"
