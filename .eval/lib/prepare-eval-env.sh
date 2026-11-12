#!/usr/bin/env bash
# Build the isolated opencode config evals run under and print the
# directory to use as XDG_CONFIG_HOME.
#
# An eval must load only what is declared here, so a run does not change
# with the host's global opencode config or with whatever branch a local
# plugin checkout is on. The result is uf's intended runtime: the EnMaaS
# provider plus DCP (uf commands rely on its <protect> handling) and
# auto-question (answers the command's questions from the fixture brief),
# both pinned by commit. uf's own plugins and dcp.jsonc come from the
# project snapshot.
#
# Plugin clones are cached under $EVAL_CACHE by commit, so only the first
# run pays for them.
set -euo pipefail

dcp_url=https://github.com/jflowers/opencode-dynamic-context-pruning.git
dcp_sha=79174fc74418be390536b8de887c5327d6ba01e4
aq_url=https://github.com/jflowers/opencode-auto-question.git
aq_sha=6eb86836928b421a6863d8f2f1ef1f303141e3f6

model_id="${EVAL_MODEL:-enmaas/rits/zai-org/glm-5-3}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cache="${EVAL_CACHE:-$HOME/.cache/uf-eval}"
real_config="${XDG_CONFIG_HOME:-$HOME/.config}"

# Clone url at sha into the cache and run a build command there once.
# Callers run this in a command substitution, where bash ignores set -e,
# so every step that can fail returns explicitly. The final argument is
# the file a successful build must leave behind.
fetch() {
  local name="$1" url="$2" sha="$3" entry="$4" dir="$cache/plugins/$1-$3"
  shift 4
  if [ ! -f "$dir/.eval-ready" ]; then
    rm -rf "$dir"
    git init -q "$dir" || return 1
    git -C "$dir" fetch -q --depth 1 "$url" "$sha" || return 1
    git -C "$dir" checkout -q FETCH_HEAD || return 1
    (cd "$dir" && "$@") >&2 || return 1
    if [ ! -f "$dir/$entry" ]; then
      echo "$name: build left no $entry" >&2
      return 1
    fi
    touch "$dir/.eval-ready"
  fi
  echo "$dir"
}

# --legacy-peer-deps: DCP's lockfile has an @opentui/core peer conflict
# that plain npm ci refuses.
dcp_dir="$(fetch dcp "$dcp_url" "$dcp_sha" dist/index.js bash -c 'npm ci --no-audit --no-fund --silent --legacy-peer-deps && npm run --silent build')"
aq_dir="$(fetch auto-question "$aq_url" "$aq_sha" src/index.ts bash -c "git apply '$here/opencode/patches/auto-question-xdg.patch' && bun install --silent")"

xdg="$cache/xdg"
rm -rf "$xdg"
mkdir -p "$xdg/opencode/agents"

# Only opencode's config is replaced. Everything else in the host config
# directory stays reachable, or mise shims would lose their tool pins.
for entry in "$real_config"/* ; do
  name="$(basename "$entry")"
  [ "$name" = opencode ] || ln -s "$entry" "$xdg/$name"
done

sed -e "s|__MODEL__|$model_id|g" -e "s|__DCP__|$dcp_dir|" -e "s|__AUTO_QUESTION__|$aq_dir|" \
  "$here/opencode/opencode.json.tmpl" > "$xdg/opencode/opencode.json"
sed -e "s|__XDG__|$xdg|" "$here/opencode/auto-question.jsonc" > "$xdg/opencode/auto-question.jsonc"
cp "$aq_dir"/agents/*.md "$xdg/opencode/agents/"

echo "$xdg"
