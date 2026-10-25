---
tier: validated
compiled_at: 2026-10-25T16:41:38Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: website-content
---

# Website Content

## Current State (October 2026)

30 learnings in the website repo (was 12 at the August compile)
cover documentation accuracy, pipeline efficiency, and
constitution governance. The site is a Hugo static site:
`config/_default/hugo.toml`, `layouts/`, `content/`, `go.mod`.

### Constitution Governance (corrected)

The website constitution (`.specify/memory/constitution.md`) is
now the scaffold-default org-style document (v1.0.0): Autonomous
Collaboration, Composability First, Observable Quality,
Testability, Security by Default. The org constitution v1.4.0
(2026-10-14) asserts hero constitutions extend it and prevails
on cross-cutting concerns — the old "does not apply" claim is
FALSE. Content Accuracy / Minimal Footprint / Visitor Clarity
survive only in historical spec artifacts. Root cause never
fixed: website `openspec/config.yaml` still references the
org constitution.

### Verify-Against-Source Discipline

| Claim | Correct Source | Common Mistake |
|-------|---------------|----------------|
| API key env var | `ANTHROPIC_API_KEY` | `ANTHROPIC_AUTH_TOKEN` |
| Gateway service name | `gateway` | `gateway-proxy` |
| Config precedence | CLI > env > repo > user > defaults (`internal/config/config.go:6`) | Inverted order |
| Bedrock credentials | `aws configure export-credentials` (`internal/gateway/refresh.go:72-78`) | Direct env-var reads |
| Homepage content | `content/_index.md` (frontmatter only) | Assuming body content |
| Stack table location | `content/docs/getting-started/quick-start.md` "## The Stack" | Homepage |

LIVE TECH-DEBT signal: the site currently contains the
`ANTHROPIC_AUTH_TOKEN` / `gateway-proxy` mistakes in 3 files —
`content/docs/getting-started/devenv-setup.md:184`,
`content/docs/reference/sandbox.md:287`,
`content/docs/reference/gateway.md:118`.

### Sandbox Credential Model (corrected)

Credential-mount framing removed. Gateway path forwards env
vars (`ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY=gateway`
placeholder, `internal/sandbox/config.go:87` — was :79); the
no-gateway fallback forwards provider keys via `-e` env vars
(`forwardedEnvVars`). No credential mounts in either path.

### Hugo Conventions

- Homepage: frontmatter-only `content/_index.md` rendered by
  `layouts/home.html`
- Section pages: `_index.md`; docs sections `weight: 10`,
  vision 5, roadmap 6, tutorials 100
- Sidebar ordering: `config/_default/menus/menus.en.toml`

### Content Pipeline Efficiency

- **Batch throughput**: 19 issues + 12 PRs in a single session
- **Skip full council for validated patterns** after 3+ blog
  post reviews confirm consistent findings
- **Grep ALL content/ first** before writing any spec — 12
  stale instances across 5 files missed initially

## History

- Aug 14 compile: "org constitution does not apply" — FALSE now
- website wrong-constitution (3 files): recurring critical
  mistake; `openspec/config.yaml` never updated
- website verify-against-source: 6 specific claim corrections
- website sandbox-docs-1: "two credential paths" framing —
  historical; credential mounts removed entirely
- website blog-gateway-credentials-1: batch throughput patterns
