---
tier: draft
compiled_at: 2026-08-14T19:56:05Z
compiled_by: claude-opus-4-6
sources:
  - ci-1
topic: remote-llm-provider
---

# Remote LLM Provider Integration

## Current State (August 2026)

The remote LLM provider system enables pluggable synthesis backends (Vertex AI, Bedrock, Anthropic) for Dewey's compilation pipeline. 5 learnings capture architectural decisions and security patterns.

## Architecture

### Factory Pattern
`NewSynthesizer()` factory with config struct supporting:
- File YAML configuration
- Environment variable override
- Legacy fallback
- Returns `(*Synthesizer, error)` — unknown provider must return error (caught by spec review, 4/5 reviewers)

### Leaf-Dependency Constraint
The synthesizer package is constrained to stdlib + `charmbracelet/log` only. No external LLM SDK dependencies allowed — all provider communication via HTTP/REST.

## Security Patterns

### Credential Handling
- `maskKey()` shows only last 4 characters of API keys
- `Available()` semantics differ by provider type: credential-presence for remote, network connectivity for local (Decision D8)
- Response body size limits enforced (spec review finding)
- Error-path test coverage required (spec review finding)

### Constitutional Decision (D7)
Tension between "no data leaves the machine" principle and remote LLM needs. Resolution: synthesis is opt-in enhancement (user explicitly configures remote provider), embeddings remain core (local-only via Ollama granite-embedding:30m).

### Credential Acquisition
Prefer `gcloud` shell-out (`os/exec`, injectable `ExecCommandFunc`, `sync.RWMutex` double-check cache) over manual `DEWEY_VERTEX_ACCESS_TOKEN` environment variable. Tokens expire ~1hr, making env vars a UX anti-pattern for long-running `dewey serve` sessions.

## Spec Review Impact
6 HIGH issues caught before implementation:
1. Unknown-provider error handling (factory returns error)
2. Credential logging prevention
3. Response body size limits
4. `Available()` semantics clarification
5. Error-path test coverage
6. Constitutional interpretation for data sovereignty

## History
- remote-llm-provider (5 files): Factory pattern, security, constitutional tension, credential acquisition
