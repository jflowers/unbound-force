---
tier: validated
compiled_at: 2026-10-25T16:38:54Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - gateway-2
  - gateway-3
  - gateway-4
  - gateway-5
  - auth-1
topic: gateway
---

# Gateway

## Current State (October 2026)

### Architecture & CLI

`internal/gateway/` is a reverse proxy fronting Vertex AI, Bedrock, and Anthropic 
(constructors at provider.go:115-120); the core proxy is an `httputil.ReverseProxy` 
(gateway.go:192). CLI: `unbound-force gateway` (cmd/unbound-force/gateway.go:17), `stop` 
(125), `status` (164). Defaults: port 53147, model claude-sonnet-4-20250514 
(provider.go:622).

### Region Handling

Vertex region resolves from env in priority order ANTHROPIC_VERTEX_REGION > VERTEX_LOCATION 
> CLOUD_ML_REGION, defaulting to us-east5 only when nothing is set (provider.go:213-215). A 
"global" region is rejected with an explicit constructor-time error (203-212): 
rawPredict/streamRawPredict require regional endpoints (e.g., 
us-east5-aiplatform.googleapis.com), though Google Cloud admins commonly set 
VERTEX_LOCATION=global for Gemini and embedding workloads. Bedrock region comes from the 
AWS_REGION env var (provider.go:431-434).

### Token Lifecycle

Token cache guarded by a sync.RWMutex (`tokenMu`). Tokens live ~1 hour; a background loop 
refreshes on a 55-minute cadence (refresh.go:20-23; the `refreshMinute` var allows test 
override). Proactive refresh in PrepareRequest deduplicates via sync.Mutex.TryLock() with a 
5s goroutine/channel timeout (`proactiveRefreshTimeout`, provider.go:366, 377-408) so a 
hung credential subprocess cannot block HTTP requests. Failure behavior is deliberately 
asymmetric: a failed background refresh clears the token and expiry atomically under the 
tokenMu write lock (250-253), preventing ACCESS_TOKEN_TYPE_UNSUPPORTED 401s and yielding a 
clear "Re-authenticate: gcloud auth application-default login" error; proactive refresh 
preserves the token, which may remain valid until real expiry.

### Credential Acquisition

Vertex tokens come from shelling out to `gcloud auth application-default 
print-access-token` (refresh.go:54-55); Bedrock credentials from `aws configure 
export-credentials` (refresh.go:78-79). The exec dependency is injectable as an unnamed 
func type `func(string, ...string) ([]byte, error)` (provider.go:181) — a named 
ExecCommandFunc type never existed.

### Logging

Detached mode (`gateway start --detach`, or auto-start by `uf sandbox start`) re-execs the 
child with `Setsid: true`. Child stdout/stderr redirect to `.uf/gateway.log` with 0600 
permissions (gateway.go:570-571) since the log carries auth diagnostics; the parent closes 
its handle after ExecStart — the child inherits the fd independently. `gateway status` 
shows the log path when present.

### Testing Notes

Adding fields like `tokenExpiry`/`credExpiry` to provider structs requires updating every 
test constructing the struct directly: zero-value time.Time is in the past, and the expiry 
check fires before the empty-token check. Exactly 8 struct-literal sites set future times 
in gateway_test.go (505, 570, 591, 612, 634, 660, 802, 2867). Spec reviews should demand an 
explicit list of test functions to update, not "where applicable" phrasing.

## History

**Region fix (79dc563, April 2026).** The original newVertexProvider silently fell back to 
us-east5 on a "global" region, misrouting requests and surfacing confusing 401 
UNAUTHENTICATED errors when credentials or model access did not cover the fallback region. 
The fix returned an explicit constructor-time error, mirroring the fail-fast behavior of 
VertexProvider.Start() for token acquisition. Durable lesson: silent fallbacks for 
configuration values that feed URL construction are dangerous — error explicitly when the 
value cannot be used as-is.

**Token-refresh fix (3f1bf3b, April 2026).** When background refresh failed (e.g., expired 
gcloud ADC credentials), the proxy kept forwarding the stale token and Vertex answered with 
cryptic ACCESS_TOKEN_TYPE_UNSUPPORTED 401s. The fix cleared the token and tokenExpiry 
atomically under the tokenMu write lock so PrepareRequest fails with an actionable re-auth 
message — the same fail-explicitly principle as the region fix — and introduced the TryLock 
+ 5s-timeout proactive refresh. The same April 2026 window also fixed detached logging (nil 
stdout/stderr had discarded all diagnostics) and the 8 test struct-literal updates for the 
new expiry fields, caught proactively by the Divisor Testing agent (task 6.15).

**auth-1 blast-radius lesson (May 2026).** The ollama-proxy change proposed extracting only 
RefreshVertexToken and RefreshLoop. All 5 spec reviewers independently flagged the 
incomplete scope: BedrockProvider also used RefreshLoop, and the proactive-refresh and 
atomic-invalidation patterns would need reimplementation. The recorded resolution was a 
full TokenManager encapsulating the entire lifecycle. Durable lesson: when extracting 
shared infrastructure, trace ALL callers across the codebase, not just the caller that 
motivated the extraction — the Bedrock dependency was invisible from the Vertex-focused 
perspective.
