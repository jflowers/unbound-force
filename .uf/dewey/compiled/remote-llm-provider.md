---
tier: validated
compiled_at: 2026-10-25T16:41:31Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: remote-llm-provider
---

# Remote LLM Provider

## Current State (October 2026)

The `llm` package is Dewey's pluggable synthesis layer for the
compile pipeline. Supported providers are **ollama + vertex only**
(`llm/provider.go`); Bedrock and Anthropic never shipped — the
August article's provider trio was wrong.

### Factory

`NewSynthesizerFromConfig(cfg ProviderConfig) (Synthesizer, error)`
(`llm/provider.go:33-52`) dispatches on `cfg.Provider`:
- `"ollama"` or empty — endpoint defaults to
  `embed.DefaultOllamaEndpoint`
- `"vertex"` — requires Project and Region
- anything else — error naming the supported set

### Configuration precedence

`ReadSynthesisConfig(deweyDir)` (`llm/config.go`), highest to lowest:
1. Per-vault `{deweyDir}/config.yaml` `synthesis:` section
2. Per-vault legacy `compile_model` field (implies ollama)
3. Global `~/.config/dewey/config.yaml` synthesis section
4. `DEWEY_GENERATION_MODEL` env var (implies ollama)
5. Zero config — no synthesizer; compile runs prompt-only

`DEWEY_GENERATION_MODEL` is the lowest-priority fallback and does
NOT override config files (unlike embedding env vars). Endpoint
resolution is separate: `DEWEY_SYNTHESIS_ENDPOINT` > `OLLAMA_HOST`.

### Dependency constraint

Leaf package: stdlib, `charmbracelet/log`, `golang.org/x/oauth2`,
`gopkg.in/yaml.v3`, plus the internal `embed` package. Still no LLM
SDK — all provider communication is direct HTTP/REST.

### Backends

- Ollama: POST `/api/generate` (stream=false), 120s timeout.
- Vertex: rawPredict with Anthropic Messages format (design D4;
  tested with claude-opus-4-6), 300s timeout, 16000 max tokens, up
  to 5 retries on HTTP 429 with backoff plus jitter.
- Vertex credentials via `google.FindDefaultCredentials` (ADC
  library, no gcloud shell-out, no CGO) with injectable `tokenFn`
  (`vertex.go:44,109-119`) for testability.

### Available() semantics (Decision D8)

- Remote (vertex): credential presence — a 5s-bounded `tokenFn`
  probe, cached 30s behind `sync.RWMutex` double-check.
- Local (ollama): GET `/api/tags` reachability plus model presence,
  cached 30s. `NoopSynthesizer` is the exported test double.

### Security

Response bodies capped at 50MB via `io.LimitReader` (`llm.go:170,245`,
`vertex.go:188`). Tokens go only into Authorization headers;
`maskKey()` never existed in any reachable branch (August phantom).

### Embeddings

Embeddings now also support a Vertex backend (`embed/provider.go:8`,
`NewEmbedderFromConfig`), with Ollama `granite-embedding:30m`
remaining the default. Synthesis is opt-in (Decision D7): nothing
leaves the machine unless a remote provider is explicitly
configured — relevant to long-running `dewey serve` sessions.

## History

- **D7/D8**: opt-in remote synthesis resolved the "no data leaves
  the machine" tension; Available() semantics split by provider type.
- **Spec review**: 6 HIGH findings — unknown-provider errors,
  credential-logging prevention, body size limits, Available()
  clarity, error-path tests, data-sovereignty ruling.
- **August 2026 compile drift**: claimed Vertex/Bedrock/Anthropic,
  `NewSynthesizer()`, env-var override, `maskKey()`, and gcloud
  shell-out credentials — corrected above per the October 2026
  audit (learnings-review-2026-10.md, F6).
