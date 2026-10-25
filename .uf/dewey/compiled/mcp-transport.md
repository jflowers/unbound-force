---
tier: validated
compiled_at: 2026-10-25T16:41:15Z
compiled_by: rits/zai-org/glm-5-3
sources:
  - ci-1
topic: mcp-transport
---

# MCP Transport

## Current State (October 2026)

The MCP (Model Context Protocol) Streamable HTTP transport client lives
in the **replicator** repo at `internal/mcpclient/` (module
`github.com/unbound-force/replicator`). It is replicator-scoped: there
is no equivalent package in unbound-force's `internal/`. Four learnings
from the replicator repo capture the protocol patterns and shared
architecture.

## Protocol: Streamable HTTP

### Handshake Sequence (client.go)
1. Send `initialize` JSON-RPC request with
   `protocolVersion: "2025-03-26"` (client.go:135)
2. Set `Accept: application/json, text/event-stream` (client.go:154,214)
3. Capture `Mcp-Session-Id` from the response header (client.go:179)
4. Include the session ID on all subsequent requests (client.go:215-217)
5. `tools/call` uses the JSON-RPC 2.0 envelope with
   `params.name`/`params.arguments` (client.go:193-211)

### Critical Gotcha
MCP Streamable HTTP only accepts POST with a JSON-RPC body — both
`initialize` and `tools/call` are built with `http.MethodPost`
(client.go:149,209). Plain GET returns 400/405. This was the root
cause of replicator issue #16 (`checkDewey` was using GET).

### Dual Response Parsing
The server may respond with either format; the client handles both
(`parseResponse`, client.go:270-316):
- `application/json`: direct JSON-RPC response unmarshal
- `text/event-stream` (or empty Content-Type): line scan for `data:`
  prefixes, unmarshalling each event as JSON-RPC

Session recovery: on HTTP 400/404 the client resets state,
re-initializes, and retries once (client.go:94-113). The retry holds
the mutex across init + call (TOCTOU fix: no concurrent re-init).

## Shared Architecture

### Package Design
`internal/mcpclient/` (replicator) is shared by:
- `memory.Client` — Dewey proxy for hivemind_store/hivemind_find
  (memory/proxy.go:17-28); reusing the client cut doctor health check
  code from 70 to 7 lines
- `doctor.deweyHealthProbe()` — health checks (doctor/checks.go:102,124)

### Implementation Patterns
- `Config` struct for dependency injection (Name, Version, Timeout, Logger)
- Lazy session initialization (connect on first `Call`)
- `sync.Mutex` for session state protection (4/5 spec reviewers
  flagged thread safety)
- `atomic.Int64` for request ID generation
- `io.LimitReader` with `maxResponseBytes` 10MB (client.go:23)
- `mcpclient.UnavailableError` bridged to `memory.UnavailableError`
  via `wrapError()` for backward compatibility (memory/proxy.go:136-139)

## Testing

### JSON-RPC Mock Servers
Test mocks (`client_test.go`) currently validate:
- `Content-Type: application/json` request header
- `Accept` header containing both required types
- `method` request field (initialize vs tools/call routing)

They do NOT validate the POST method or the `jsonrpc: "2.0"` request
field — an earlier version of this article claimed otherwise (drift
flagged in the October 2026 audit). Canned responses without protocol
validation create false confidence; extending mock conformance checks
remains an open improvement.

## History
- replicator mcp-transport: Full protocol pattern
- replicator mcpclient-architecture: Shared package design
- replicator doctor-dewey-health-check: GET vs POST root cause (issue #16)
- replicator testing-json-rpc-mocks: Protocol-conformant test patterns
- 2026-10 audit: mock conformance corrected (Content-Type, Accept,
  method only); learnings count 5 -> 4; package location clarified
  as replicator-scoped
