#!/usr/bin/env bash
# Intent-satisfaction-check threaded path (RC-FR-010/011): a council
# dispatch whose originating issue resolves from the change's
# .openspec.yaml.
#
# Builds the same clean mini-repo as review-council-clean-change, then
# records an originating issue in the change's .openspec.yaml as one
# extra commit on the feature branch — the shape /opsx-propose writes
# when a change is routed from an issue. The council's
# dispatch_review_runs call acquires the absent intent_satisfaction
# internally (review finding F3), so a compliant run never invokes
# acquire_intent_context as a separate step: the internal acquisition
# resolves the reference through the openspec-yaml source, constructs
# the gh fetch from the validated numeric reference, and the eval stub
# refuses it by design (EV-FR-002), so the run exercises the documented
# unavailable degradation (design D6): the failure reason is recorded,
# the state rides the dispatch session metadata into the finalized
# artifact and the final report, and the review is never blocked — the
# clean change still approves.
set -euo pipefail

fixture="${EVAL_FIXTURE_DIR:?}"

bash "$fixture/../../lib/setup-repo-copy.sh" \
  bash "$fixture/../../lib/make-mini-repo.sh" feature-clean

cd "${EVAL_WORKDIR:?}"

# The change directory the feature-clean variant creates. The guard
# fails loudly if the mini-repo layout moves, rather than silently
# producing a run whose originating issue never resolves (the same
# rule the mini-repo base hook follows).
change_dir="openspec/changes/ref-lookup"
[ -d "$change_dir" ] || {
  echo "mini-repo feature-clean no longer creates $change_dir" >&2
  exit 2
}

# The openspec-yaml resolution path derives a change directory from the
# branch name for opsx/, speckit/, and NNN- prefixes only
# (deriveFeatureDirFromBranch in the review-dispatch plugin), so the
# originating issue resolves only while the feature branch keeps the
# opsx/ prefix the variant's .branch file records. Fail loudly if that
# branch moves, rather than silently producing a run whose acquisition
# degrades to the skipped state.
branch="$(git branch --show-current)"
[ "$branch" = "opsx/ref-lookup" ] || {
  echo "mini-repo feature-clean no longer checks out opsx/ref-lookup (on '$branch')" >&2
  exit 2
}

# The mini repo's fictional originating issue for the ref-lookup
# change, in the format this repo's own change directories carry. Any
# positive integer threads; 128 is pinned so the assertions can match
# the stub's record of the fetch attempt (gh issue view 128 --json
# number,title,body,labels).
cat > "$change_dir/.openspec.yaml" <<'YAML'
schema: unbound-force
created: 2026-11-24
originating_issue: 128
YAML

# Commit on the feature branch, where /opsx-propose records the
# reference: the council reviews it as part of the change, exactly as
# a change routed from an issue would carry it. The identity matches
# the one the mini-repo scripts and the eval CI workflow already use.
git add "$change_dir/.openspec.yaml"
git -c user.name=eval -c user.email=eval@example.invalid \
  commit -q -m "chore(openspec): record the originating issue"
