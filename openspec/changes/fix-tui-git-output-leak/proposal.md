## Why

The uf-workflow and uf-finale OpenCode plugins run inside the
opencode server process, which shares its terminal with the
TUI. Their tool handlers deliberately re-emit captured git/gh
subprocess output via console.log/console.error. Because the
TUI renders on the alternate screen of the same tty, these
writes interleave with and corrupt the TUI display: users see
raw fetch/push/merge/rebase output, staged file lists, diff
stats, and CI poll progress splattered across TUI elements.

The subprocess plumbing is already correct -- every git/gh
child process is spawned with piped stdio (execFileSync with
stdio ["pipe","pipe","pipe"], Bun.spawn with stdout/stderr
"pipe", execFile with captured callbacks). The leak is purely
the echo layer: 18 console calls in uf-workflow and 32 in
uf-finale, duplicated across the live .opencode/ tree and the
embedded internal/scaffold/assets/opencode/ tree.

## What Changes

Remove all 50 console.log/console.error calls per tree --
100 total across the live and scaffold-embedded copies --
from the uf-workflow and uf-finale plugin tool handlers.
Tool output flows exclusively through the structured JSON
result envelopes, which already carry the data (diffStat,
recentLog, statuses, errors via failure()).

- uf-workflow: 18 calls across git_fetch, git_push,
  git_push_force_with_lease, git_merge, git_merge_abort,
  git_rebase, git_rebase_abort, git_conflict_files, and
  git_commit_no_edit.
- uf-finale: 32 calls across startup, stage, commit_context,
  push_state, pr_context, create_pr, ci_poll, and
  return_to_main.
- uf_finale_stage envelope gains a `files` array (the staged
  file list is currently console-only data and would
  otherwise be lost).
- ci_poll 30-second progress messages are dropped entirely;
  final status is already returned in the envelope, and
  silent waiting is correct behavior for a TUI tool.

## Capabilities

### New Capabilities

- `plugin-terminal-hygiene`: uf-workflow and uf-finale tool
  handlers MUST NOT write to the opencode server terminal;
  all output flows through tool result envelopes, and the
  stage envelope exposes the staged file list.

### Modified Capabilities

- None -- no existing main capability spec covers plugin
  tool output behavior. The still-active
  finale-token-reduction change documents TUI-echo
  behavior that this change supersedes; see
  Documentation Impact below.

### Removed Capabilities

- None.

## Impact

- 4 TypeScript files modified (2 live plugins + 2 embedded
  scaffold copies, edited identically):
  - .opencode/plugins/uf-workflow/index.ts (18 calls)
  - .opencode/plugins/uf-finale/index.ts (32 calls)
  - internal/scaffold/assets/opencode/plugins/uf-workflow/index.ts
  - internal/scaffold/assets/opencode/plugins/uf-finale/index.ts
- No Go source changes. No dependency changes.
- Test change required: no existing tests assert console
  output, and the new uf_finale_stage files array has zero
  existing coverage -- a unit test asserting the field
  (staged paths plus empty-array default) MUST be added,
  along with a spy-based regression test asserting zero
  terminal writes per handler invocation (TC-006).
  Drift-detection tests enforce live/embedded sync and
  continue to apply.
- User-facing behavior: TUI no longer corrupted by stray git
  output; agent-visible tool results unchanged except the
  stage envelope enrichment.

### Documentation Impact

This is a user-facing change (TUI rendering behavior and
the uf_finale_stage result envelope):

- CHANGELOG.md: a change entry MUST be written when the
  implementation lands.
- Docs issues: open issue #710 ("docs: document uf-finale
  plugin and expanded uf-workflow git tools") is referenced
  rather than duplicated; its scope was updated with a
  comment covering envelope-only output, the files array,
  and silent ci_poll (unbound-force/unbound-force#710,
  issuecomment-6175394955). The constitution-mandated
  unbound-force/website tracking issue is filed ahead of
  the implementing PR merge: unbound-force/website#306
  (https://github.com/unbound-force/website/issues/306).
- Command templates: .opencode/commands/uf.finale.md and
  its scaffold mirror
  (internal/scaffold/assets/opencode/commands/uf.finale.md)
  document the uf_finale_stage envelope and MUST be
  assessed for the new files array.
- AGENTS.md / README.md: assessed — no structural,
  convention, build-command, or description changes are
  needed for this change; no updates required.
- Supersession: the still-active finale-token-reduction
  change states git tools "MAY print full git output to
  TUI via console.log()" and the stage tool "SHOULD log
  the file list to TUI before staging". This change
  supersedes that documented behavior; archive-time spec
  sync MUST NOT carry the stale TUI-output requirements
  forward.

## Constitution Alignment

Assessed against the Unbound Force org constitution (v1.3.1).

### I. Autonomous Collaboration

**Assessment**: PASS

Tool results remain self-describing JSON envelopes consumed
asynchronously by the agent. Removing the console side-channel
strengthens artifact-based communication; no new runtime
coupling is introduced.

### II. Composability First

**Assessment**: PASS

The plugins remain independently installable and usable
alone. No new dependencies and no logger library are
introduced -- the change is a straight deletion.

### III. Observable Quality

**Assessment**: PASS

All output remains machine-parseable through tool envelopes.
Observability improves: uf_finale_stage's staged file list --
previously visible only as a terminal echo the agent could
not read -- becomes part of the structured envelope.
Provenance metadata is unaffected.

### IV. Testability

**Assessment**: PASS

The change is verified by the existing make plugin-test suite
(unit, integration, smoke, coverage) plus the Go
drift-detection tests under make test that pin the live and
embedded copies in sync, a unit test MUST be added for
the new uf_finale_stage files array, and a spy-based
regression test MUST be added asserting zero terminal
writes per handler invocation. Envelope additions are
assertable return values.

### V. Security by Default

**Assessment**: PASS

No dependencies are added and no input validation changes.
Removing terminal echoes of git/gh output modestly reduces
incidental exposure of branch names, PR URLs, and CI details
in shared terminal sessions.
