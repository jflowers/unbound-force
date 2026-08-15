---
tier: draft
compiled_at: 2026-08-14T19:58:52Z
compiled_by: claude-opus-4-6
sources:
  - ci-1
topic: website-content
---

# Website Content Patterns

## Current State (August 2026)

12 learnings from the website repo capture documentation accuracy, content pipeline efficiency, and a critical recurring mistake about constitution application.

## CRITICAL: Wrong Constitution (Recurring)

Every website change MUST be assessed against the website's own constitution (`.specify/memory/constitution.md`), which prioritizes:
- **Content Accuracy**: Technical claims match implementation
- **Minimal Footprint**: Hugo static site, no unnecessary complexity
- **Visitor Clarity**: First-time users can navigate without prior knowledge

The org-level constitution (unbound-force repo) does NOT apply. Root cause: OpenSpec `config.yaml` context block references the org constitution. This was identified and fixed proactively by the 3rd change but recurred because the config wasn't updated.

## Verify-Against-Source Discipline

Documentation claims MUST be verified against source code:

| Claim | Correct Source | Common Mistake |
|-------|---------------|----------------|
| API key env var | `ANTHROPIC_API_KEY` | `ANTHROPIC_AUTH_TOKEN` |
| Gateway service name | `gateway` | `gateway-proxy` |
| Config precedence | CLI > env > repo > user > defaults | Inverted order |
| Bedrock credentials | `aws configure export-credentials` | Direct env-var reads |
| Homepage content | `content/_index.md` (frontmatter only) | Assuming body content |
| Stack table location | `content/docs/getting-started/` | Homepage |

### Source Files Referenced
- `internal/sandbox/config.go:79`: Gateway placeholder
- `internal/config/config.go`: Config precedence
- `internal/gateway/refresh.go`: Bedrock credentials

## Hugo Conventions
- Section pages: `_index.md` with `weight: 10` convention
- Sidebar ordering: `config/_default/menus/menus.en.toml`
- Homepage: frontmatter-only `_index.md` rendered by `layouts/home.html`

## Content Pipeline Efficiency
- **Batch throughput**: 19 issues + 12 PRs achievable in a single session
- **Skip full council for validated patterns**: After 3+ blog post reviews confirm consistent findings, skip full review council for that content type
- **Grep ALL content/ first**: Before writing any spec, search all `content/` for stale patterns (12 instances across 5 files including blog were missed initially)

## Sandbox Documentation
Two distinct credential paths must not be conflated:
1. **Gateway path**: No credential mount, gateway handles auth
2. **Direct-mount fallback**: Credentials mounted into container

## History
- website wrong-constitution (3 files): Recurring critical mistake
- website verify-against-source: 6 specific claim corrections
- website sandbox-docs-1: Two credential paths
- website blog-gateway-credentials-1: Batch throughput patterns
