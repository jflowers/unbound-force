---
tag: uf-workflow-testing
author: jay-flowers
category: pattern
created_at: 2026-10-15T20:18:43Z
identity: uf-workflow-testing-20261015T201843-jay-flowers
tier: draft
---

Testing uf-workflow plugin tools that auto-checkpoint (recordAutoCheckpoint → readState/writeState) without real filesystem access: vi.mock("node:fs", async (importOriginal) => ({ ...actual, existsSync: vi.fn(), lstatSync: vi.fn(), readFileSync: vi.fn(), mkdirSync: vi.fn(), writeFileSync: vi.fn() })) — the uf-finale.test.ts precedent (unleash-branch-gate.test.ts applies it). In beforeEach: vi.resetAllMocks() then default lstatSync to throw an Error with code: "ENOENT" (Object.assign(new Error(msg), { code: "ENOENT" })) so readState returns null (first-checkpoint create path) and writeState takes the create-directory branch. For the existing-state update path, mock lstatSync to return ({ isSymbolicLink: () => false }) and readFileSync to return the prior ProgressState JSON. Assert checkpoint recording through the recorded calls: writeFileSync called once with resolve(cwd, ".uf/progress/<sanitizeSlug(branch)>/uf.unleash.json"), mode 0o600, and parse the JSON string argument for the ProgressState shape; mkdirSync with recursive+0o700. A plain new Error("ENOENT") does NOT work — isEnoent checks err.code === "ENOENT" specifically. Fake FileExists should key on absolute paths (the tool passes resolve(cwd, ...) results) and record calls to prove cwd confinement. Injected GitExec receives (["rev-parse", "--abbrev-ref", "HEAD"], cwd) exactly once. Note for task 2.5 (unleash-delegate.test.ts): uf_delegate_command also imports readFile from node:fs/promises (separate specifier, unaffected by the node:fs mock — stub via its readText dependency instead) and needs executeAgentSession stubbed through the DelegateCommandDependencies surface rather than the module mock.
