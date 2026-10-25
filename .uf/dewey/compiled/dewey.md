---
tier: validated
compiled_at: 2026-10-25T16:37:43Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - dewey-20260623T123108-yvonne-devlin
  - dewey-learning-pr-policy-20260930T021034-jay-flowers
  - dewey-learning-pr-policy-20260930T021037-jay-flowers
  - dewey-20261014T120910-jay-flowers
  - dewey-20261014T120914-jay-flowers
  - dewey-20261014T120918-jay-flowers
  - dewey-learnings-20261016T161248-jay-flowers
  - dewey-20261017T142212-jay-flowers
  - learning-systems-20261019T214834-jay-flowers
topic: dewey
---

# Dewey

## Current State (October 2026)

Dewey is the knowledge-graph MCP server (sibling repo
`unbound-force/dewey`) backing the `.uf/dewey/` workspace in each
hero repo. Architecture: an obsidian-style vault of markdown files
plus a persistent SQLite store (`graph.db`) that carries pages,
blocks, links, and embeddings. Learnings are stored twice — as
durable markdown under `.uf/dewey/learnings/` and as store rows
with `source_id: "learning"` — which protects them from source
reindex purges and makes the files a recoverable backup.

### Server topology

In devcontainer environments, `startup.sh` runs
`dewey serve --http :3333`, which acquires the exclusive SQLite
lock on `graph.db`. OpenCode's MCP config must therefore use
`"type": "remote"` (`http://localhost:3333/mcp/`); a `"local"`
spawn creates a second server that cannot open the persistent
store and silently falls back to in-memory mode (0 pages).
Since `opencode.json` is committed, apply this fix locally with
`git update-index --assume-unchanged`.

### Learning lifecycle

- **Storage**: `dewey_store_learning` writes the markdown file
  and the store row. Identity is `{tag}-{YYYYMMDDTHHMMSS}-{author}`.
- **Deduplication is identity-scoped**: two learnings with
  near-identical content but different topic tags both persist
  and fragment semantic search — neither supersedes the other.
  Before committing a same-session batch, scan for overlapping
  content regardless of tag; consolidate or explicitly
  differentiate scopes so a later compile can merge cleanly.
- **Filing path discipline**: every learning file must land under
  the canonical `.uf/dewey/learnings/` directory. A misspelled
  directory (`.uf/dewley/`) silently defeats the learning —
  orphan re-ingestion only scans the correct path, and learnings
  are exempt from the drift tests that guard other tool-owned
  assets. Mechanical check after staging:
  `git diff --name-only --diff-filter=A | grep '^\.uf/dew'`.
- **Deletion**: learning pages are read-only to
  `dewey_delete_page` (they are store-backed, not vault-backed).
  The correct path is to remove the markdown file and delete the
  store rows (`pages` cascades `blocks`, `links`, `embeddings`);
  a vault reload reconciles in-memory state, and learnings
  re-load from `graph.db` at server startup via
  `reIngestLearnings`, which also recovers learnings whose store
  rows are missing.

### Compile lifecycle

`dewey_compile` (full rebuild) lists all learnings from the
store, clusters them by tag, wipes `.uf/dewey/compiled/`
(`os.RemoveAll`) and the compiled source pages, then either
synthesizes (when an LLM synthesizer is configured via
`.uf/dewey/config.yaml`) or returns clusters with synthesis
prompts for agent-performed synthesis. `dewey_store_compiled`
writes each article: frontmatter (`tier: draft`, `compiled_at`,
`compiled_by`, `sources`, `topic`) plus the content verbatim.
Incremental compiles re-compile only affected tags.

### Promotion discipline

Compiled articles are always written at `tier: draft`. The
`validated` tier is reachable only via explicit `dewey promote`
after human review — and **promote updates `graph.db` without
rewriting the durable markdown**. The machine-local graph can
report `validated` while the committed file still self-describes
as `draft`. Rules that follow:

- Specs and proposals citing a Dewey artifact's trust tier must
  verify the tier in the artifact's committed frontmatter (the
  durable, cross-machine source of truth), not the live graph.
- Calling a draft-tier article `validated` inflates evidence
  provenance and violates content-pack FA-001 (factual claims
  verified against actual state).
- When a promote has genuinely occurred, update the markdown
  frontmatter in the same change so the artifact remains
  self-describing (Observable Quality principle).

### Integration with repo governance

- Retrospective learnings (`.uf/dewey/learnings/*.md`,
  `.uf/dewey/compiled/*.md`) satisfy the AGENTS.md documentation
  assessment gate — but not the issue-filing gate.
- Learnings produced during a change's workflow are directly
  related to that change and MUST be included in the feature PR
  (inline clarification in the Commit scope rule, issue #570).
- A change's self-authored learnings that document defects in
  that same change are open fix obligations, not completed
  knowledge capture: reviewers must treat them as finding
  evidence and reconcile each one against the change's artifacts
  before approving. Storing the learning neither files the
  required issue nor fixes the defect.

### Embeddings

`granite-embedding:30m` via Ollama (Apache 2.0), overridable in
`.uf/config.yaml` under `embedding.model`. `dewey lint --fix`
repairs embedding gaps; coverage should be 1.0.

## History

- **2026-06-23**: devcontainer double-server discovery (local vs
  remote MCP config, exclusive SQLite lock).
- **2026-09-30**: commit-scope clarification for learnings in
  feature PRs (issue #570, inline-clause pattern); scaffold
  drift discipline for uf.unleash.md mirrors.
- **2026-10-14**: the promote-does-not-rewrite-markdown gotcha
  (three same-session learnings) — tier verification must read
  committed frontmatter, and promotion must sync frontmatter.
- **2026-10-16/17**: identity-scoped dedup fragmentation; the
  `.uf/dewley/` misspelling that silently dropped a learning
  from the graph (77 committed, 1 orphaned).
- **2026-10-19**: self-authored learnings as open-fix
  obligations (fix-review-dispatch-recovery review).
- **Compile cycles**: 2026-08-14 (131 learnings across 6 repos,
  18 articles, claude-opus-4-6 synthesis, all promoted same
  day); 2026-10-14 mini-cycle (plugin-architecture,
  token-reduction); 2026-10-25 full rebuild (639 learnings, 205
  clusters, this article set).
