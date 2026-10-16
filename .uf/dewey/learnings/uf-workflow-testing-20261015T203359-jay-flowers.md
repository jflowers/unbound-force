---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-15T20:33:59Z
identity: uf-workflow-testing-20261015T203359-jay-flowers
tier: draft
---

Behavioral testing of uf-workflow delegation tools that spawn child sessions (uf_delegate_command, unleash-delegate.test.ts): drive the REAL executeAgentSession through the injected client dependency rather than stubbing results — the fakeClient pattern from invoke-agent.test.ts (session.create/message/prompt/abort recording fakes, responses cast `as unknown as X` via an identity fieldsResponse helper) composes directly with DelegateCommandDependencies {client, readText, fileExists}. Key mechanics: the parent-message fake must report role "assistant" plus a VariantSchema-valid variant (default "default") or host resolution fails; the child prompt fake should echo request.body.model into its response info so model_mismatch never trips; hangPrompt:true (prompt promise rejects on request.signal abort) plus args timeout:5 exercises real timeout propagation (DELEGATE_FAILED "timeout: invoke_agent run timed out", retryable true, one session.abort call); hangMessage:true plus controller.abort() after a setTimeout(0) macrotask tick exercises host-resolution cancellation (DELEGATE_CANCELLED "uf_delegate_command run was cancelled" before any create). Prompt composition is asserted by reading calls.prompts[0].body.parts[0].text (SDK types body.parts as TextPartInput[]). The tool's exec dependency runs ONLY when checkpoint_step is supplied on a verified-success run (resolveKey), so a recording GitExec proves no-checkpoint-on-failure/omission by its empty calls array. Invocation context needs all four fields the tool reads (sessionID, messageID, directory, abort) — cast the tool() return to {execute: (args, ctx) => Promise<{output}>} and pass a real AbortController signal for cancellation tests.
