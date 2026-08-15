---
tier: validated
compiled_at: 2026-08-14T19:56:23Z
compiled_by: claude-opus-4-6
promoted_at: 2026-08-14T20:37:01Z
promoted_by: jay-flowers
sources:
  - ci-1
topic: mcp-transport
related: security-checklist, di-testability
---

# MCP Transport and Client Architecture

## Current State (August 2026)

The MCP (Model Context Protocol) client (`internal/mcpclient/`) provides Streamable HTTP transport for communicating with Dewey and other MCP servers. 5 learnings from the replicator repo capture the protocol patterns and shared architecture.

## Protocol: Streamable HTTP

### Handshake Sequence
1. Send `initialize` request with `protocolVersion: "2025-03-26"`
2. Set `Accept: application/json, text/event-stream`
3. Capture `Mcp-Session-Id` from response header
4. Include session ID in all subsequent requests
5. `tools/call` uses JSON-RPC envelope format

### Critical Gotcha
Plain HTTP GET returns 400/405 — MCP Streamable HTTP only accepts POST with JSON-RPC body. This was the root cause of issue #16 (`checkDewey` was using GET).

### Dual Response Parsing
Server may respond with either:
- `application/json`: Direct JSON-RPC response
- `text/event-stream`: SSE stream with JSON-RPC events

Client must handle both. Session recovery on 400/404 (re-initialize).

## Shared Architecture

### Package Design
`internal/mcpclient/` is shared by:
- `memory.Client` (Replicator's Dewey integration)
- `doctor.deweyHealthProbe()` (health checks)

Reusing the client reduced doctor health check code from 70 → 7 lines.

### Implementation Patterns
- `Config` struct for dependency injection
- Lazy session initialization (connect on first call)
- `sync.Mutex` for session state protection (4/5 spec reviewers flagged thread safety)
- `atomic.Int64` for request ID generation
- `io.LimitReader(10MB)` for response body limits
- `memory.UnavailableError` bridge via `wrapError()`

## Testing

### JSON-RPC Mock Servers
Test mocks MUST validate protocol conformance:
- POST method (not GET)
- `Content-Type: application/json`
- `jsonrpc: "2.0"` field present
- `method` field present

Canned responses without protocol validation create false confidence.

## History
- replicator mcp-transport: Full protocol pattern
- replicator mcpclient-architecture: Shared package design
- replicator doctor-dewey-health-check: GET vs POST root cause
- replicator testing-json-rpc-mocks: Protocol-conformant test patterns
