---
tier: validated
compiled_at: 2026-10-25T16:35:49Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - security-20260512T201635-jay-flowers
  - ai-attribution-20260623T195627-jay-flowers
  - prompt-injection-defense-20261009T031654-jay-flowers
  - path-validation-nodejs-20261009T031700-jay-flowers
  - shell-injection-spec-patterns-20261010T140554-jay-flowers
  - temp-file-security-spec-20261010T140555-jay-flowers
  - temp-file-security-20261010T185927-jay-flowers
  - path-validation-allowlist-20261011T022007-jay-flowers
  - prompt-injection-defense-20261011T225608-jay-flowers
  - path-safety-defense-in-depth-20261012T160736-jay-flowers
  - shell-injection-prevention-20261012T235612-jay-flowers
  - shell-injection-prevention-20261013T021609-jay-flowers
  - symlink-defense-20261016T115034-jay-flowers
  - defense-in-depth-20261016T161246-jay-flowers
  - regex-security-20261019T153501-jay-flowers
  - regex-security-20261019T171716-jay-flowers
topic: security-checklist
---

# Security Checklist

## Current State (October 2026)

### Credential and Token Handling

- Credentials reach subprocesses via stdin, not argv (guidance).
- A failed token refresh clears the stale token atomically under `tokenMu`,
  so PrepareRequest errors clearly instead of silently forwarding an
  expired token (internal/gateway/provider.go:245-253).
- The gateway log `.uf/gateway.log` is opened 0600 since it may contain
  credential refresh output (gateway.go:570-571).
- Caution: `internal/gateway` has no request body-size limit on main — do
  not assume one exists when reviewing gateway changes.

### Injection Prevention

Git trailers:
- Model names are validated `[a-zA-Z0-9._-]+` before AI-attribution trailer
  insertion (blocks newline/colon/metacharacter injection); extraction is
  explicit — strip after the last `/`, then after the first `@` — with an
  `unknown-model` fallback (.opencode/lib/uf-workflow-types.ts:98-125).

Shell:
- Workflows pass secrets via `env:` bindings, never `${{ }}` interpolation
  (.github/workflows/release.yml:98-104 et al.).
- Plugins: git uses shell-free `execFileSync` behind an injectable `GitExec`
  type; remaining `execSync` (gh) calls must validate every interpolated value
  first — hardcoded string, bounded integer (PR 1-999999), or strict regex —
  before side effects. `uf_finale_create_pr` title escaping misses newlines/CR.
- Specs for shell-executing tools MUST require: only validated values reach
  commands; tool output is untrusted data; numeric inputs carry upper bounds.

Path traversal:
- Go: blocked via `resolveRepoRelative`.
- Node: `fs.realpath()`, not `path.resolve()` (lexical-only); on macOS `/var`
  -> `/private/var`, so canonicalize path and comparison root; on ENOENT
  return path_validation_failed.
- Broadening an allowlist: realpath the new directory, prefix-check with
  `path + "/"` (blocks `/tmp-evil` matching `/tmp`), plus exact-match
  (canonical: review-dispatch `validateDiffPath`).
- User-influenced path segments: allowlist sanitization plus post-resolution
  containment (`startsWith(root + "/")`), each layer independently testable
  (uf-workflow checkpoints).
- Temp files: symlink defense (O_NOFOLLOW or equivalent), atomic writes
  (O_CREAT|O_EXCL or temp-then-rename), realpath canonicalization; on macOS
  Node `open(path,'wx')` does NOT imply O_NOFOLLOW — use `mkdtemp()` parents.
  Writes to user-influenced paths lstatSync parent AND target
  (persist_unleash_summary); directory-only (writeState) is weaker.

### Sandbox Isolation

- Probes run `busybox:latest --entrypoint stat` (detect.go:76,89); containers
  run `--userns=keep-id:uid=1000,gid=1000` (config.go:204).
- `sanitizeRe = [^a-z0-9-]` (workspace.go:115). The projectName() regex is
  necessary but insufficient: devpod.go's startServerViaSSH concatenates
  shell commands (`"cd /workspaces/"+wsName`); relaxing the regex opens a
  command-injection vector (security-20260512).

### Untrusted-Content Handling in Dispatch

- Reviewer prompts embed untrusted content in delimited blocks with a
  defensive preamble; `escapeDelimiters()` escapes all delimiter patterns
  across all sections, since single-section escaping creates cross-section
  injection. `UNTRUSTED_SECTION_NAMES` (9 entries since `issue_content`) is
  the source of truth.
- Adding an untrusted field: extend `UNTRUSTED_SECTION_NAMES`, wrap via
  `wrapUntrusted()`, apply `MAX_STRING_BYTES`, enforce mode exclusivity.
- Sibling evidence is origin-verified; issue titles and bodies are untrusted
  data, never instructions (Constitution V).
- Regex changes: verify ReDoS resilience (lazy quantifiers in classes
  excluding the terminator have an unambiguous exit), state isolation
  (per-line matchAll cannot leak `lastIndex`), and round-trip integrity
  (shared `extractClarificationQuestion` derivation, raw-match fallback).
  SDK migrations adding zod must not weaken existing runtime guards.

### Live Checklist

- Trailer model validation + explicit extraction + `unknown-model` fallback
  (uf-workflow-types.ts:98-125).
- Credentials via stdin; atomic token clear on failed refresh
  (provider.go:245-253); log 0600 (gateway.go:570-571).
- `env:` bindings, no `${{ }}` (release.yml:98-104); shell-free execFileSync
  for git; validated inputs for execSync.
- resolveRepoRelative (Go) / realpath() with `"/"` prefix checks (Node);
  sandbox: busybox stat probe (detect.go:76,89), keep-id userns
  (config.go:204), sanitizeRe (workspace.go:115).
- Four-step dispatch list for new untrusted fields; ReDoS / state /
  round-trip review for regex changes.

## History

- **May 2026 — ollamaproxy-1 checklist origins.** The never-merged
  `opsx/ollama-proxy` branch proposed SSRF loopback-only validation,
  `redactToken()`, a proxy model charset check, a 10MB `io.LimitReader`
  body limit, extraction into `internal/pidfile/` + `internal/auth/`, and
  `maskKey()`. On main the logic remains in
  `internal/gateway/{pid,provider,refresh}.go` with no body limit — cite
  those items only as unmerged-proposal history. The durable May learning
  is the sandbox one (security-20260512): string-concatenation shell
  construction is fragile even with a sanitizing regex.
- **June 2026 — ai-attribution validation.** The review council fixed the
  two trailer requirements — allowlist validation and an explicit extraction
  algorithm (ai-attribution-20260623) — now in uf-workflow-types.ts.
- **October 2026 — plugin-security wave.** Delimiter escaping, realpath
  validation, shell-free subprocess patterns, temp-file/symlink defenses,
  and regex review criteria codified from council-review-action and plugin
  review cycles.
- **Never adopted.** The proposed "Adversary Security Checklist for new
  endpoints" convention-pack rule was never adopted; not a governing standard.
