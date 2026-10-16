import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import type { PluginInput } from "@opencode-ai/plugin"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolResult } from "../lib/uf-workflow-types.js"
import {
  createDelegateCommandTool,
  type DelegateCommandData,
  type DelegateCommandDependencies,
  type FileExists,
  type GitExec,
  type ProgressState,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The tool's auto-checkpoint (D5) persists through readState/writeState,
// which hit node:fs directly. Mocking the four functions that path uses (the
// unleash-branch-gate.test.ts recipe, per Dewey learning
// uf-workflow-testing-20261015T201843) keeps every delegate test off the real
// filesystem: state I/O is observed through the recorded calls instead of
// performed. existsSync is mocked so tests can prove artifact verification
// probes existence only through the injected FileExists dependency, never
// through the default existsSync-backed checker. The command-file reader is
// injected separately (readText), so node:fs/promises — a different specifier
// used only by the plugin registration — stays untouched.
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>()
  return {
    ...actual,
    existsSync: vi.fn(),
    lstatSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  }
})

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Fake repository root — never a real path on any filesystem. */
const FAKE_CWD = "/fake/project"

/** Host model identity the fake parent session reports. */
const HOST_MODEL = "host-provider/host-model"

type Client = PluginInput["client"]
type CreateOptions = Parameters<Client["session"]["create"]>[0]
type MessageOptions = Parameters<Client["session"]["message"]>[0]
type PromptOptions = Parameters<Client["session"]["prompt"]>[0]
type AbortOptions = Parameters<Client["session"]["abort"]>[0]
type CreateResponse = Awaited<ReturnType<Client["session"]["create"]>>
type MessageResponse = Awaited<ReturnType<Client["session"]["message"]>>
type PromptResponse = Awaited<ReturnType<Client["session"]["prompt"]>>
type AbortResponse = Awaited<ReturnType<Client["session"]["abort"]>>

interface FakeCalls {
  readonly creates: CreateOptions[]
  readonly messages: MessageOptions[]
  readonly prompts: PromptOptions[]
  readonly aborts: AbortOptions[]
}

interface FakeClientOptions {
  /** Variant reported by the parent assistant message (default "default"). */
  readonly hostVariant?: string
  /** Error payload returned by session.create (child_create_failed path). */
  readonly createError?: unknown
  /** Parts reported by the child prompt response (default one text part). */
  readonly parts?: readonly unknown[]
  /** Hang session.prompt on its abort signal (timeout/cancellation paths). */
  readonly hangPrompt?: boolean
  /** Hang session.message on its abort signal (host-resolution cancellation). */
  readonly hangMessage?: boolean
}

function fieldsResponse<T>(data: T): T {
  return data
}

/** Assistant message info carrying only the fields the executor reads. */
function assistantInfo(providerID: string, modelID: string): Record<string, unknown> {
  return {
    id: "message-child",
    sessionID: "child-session",
    role: "assistant",
    time: { created: 1, completed: 2 },
    parentID: "message-parent",
    providerID,
    modelID,
    mode: "primary",
    path: { cwd: FAKE_CWD, root: FAKE_CWD },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  }
}

function textPart(text: string): Record<string, unknown> {
  return {
    id: `text-${text}`,
    sessionID: "child-session",
    messageID: "message-child",
    type: "text",
    text,
  }
}

function finishPart(cost: number, input: number, output: number): Record<string, unknown> {
  return {
    id: `finish-${cost}-${input}-${output}`,
    sessionID: "child-session",
    messageID: "message-child",
    type: "step-finish",
    reason: "stop",
    cost,
    tokens: { input, output, reasoning: 0, cache: { read: 0, write: 0 } },
  }
}

/**
 * Fake OpenCode client (invoke-agent.test.ts precedent) driving the REAL
 * executeAgentSession executor. The child session lifecycle — host
 * introspection, create, prompt, abort cleanup — runs for real against
 * recorded fakes, so timeout and cancellation propagation is exercised
 * through the same code path production uses, not a stubbed result.
 */
function fakeClient(options: FakeClientOptions = {}): { readonly client: Client; readonly calls: FakeCalls } {
  const calls: FakeCalls = { creates: [], messages: [], prompts: [], aborts: [] }
  const session = {
    create: async (request: CreateOptions): Promise<CreateResponse> => {
      calls.creates.push(request)
      if (options.createError !== undefined) {
        return fieldsResponse({ data: undefined, error: options.createError } as unknown as CreateResponse)
      }
      return fieldsResponse({ data: { id: "child-session" }, error: undefined } as unknown as CreateResponse)
    },
    message: async (request: MessageOptions): Promise<MessageResponse> => {
      calls.messages.push(request)
      if (options.hangMessage === true) {
        return await new Promise<MessageResponse>((_resolve, reject) => {
          request.signal?.addEventListener("abort", () => reject(request.signal?.reason), { once: true })
        })
      }
      return fieldsResponse({
        data: {
          info: { ...assistantInfo("host-provider", "host-model"), variant: options.hostVariant ?? "default" },
          parts: [],
        },
        error: undefined,
      } as unknown as MessageResponse)
    },
    prompt: async (request: PromptOptions): Promise<PromptResponse> => {
      calls.prompts.push(request)
      if (options.hangPrompt === true) {
        return await new Promise<PromptResponse>((_resolve, reject) => {
          request.signal?.addEventListener("abort", () => reject(request.signal?.reason), { once: true })
        })
      }
      // The child reports the model it was asked to run, so successful
      // delegations never trip the executor's model-mismatch guard.
      const bodyModel = request.body?.model
      const info = assistantInfo(bodyModel?.providerID ?? "provider", bodyModel?.modelID ?? "model")
      return fieldsResponse({
        data: { info, parts: options.parts ?? [textPart("delegated output")] },
        error: undefined,
      } as unknown as PromptResponse)
    },
    abort: async (request: AbortOptions): Promise<AbortResponse> => {
      calls.aborts.push(request)
      return fieldsResponse({ data: true, error: undefined } as unknown as AbortResponse)
    },
  }
  return { client: { session } as unknown as Client, calls }
}

/**
 * Recording GitExec answering the auto-checkpoint key derivation with a
 * canned branch. The delegate tool runs git only when checkpoint_step is
 * supplied on a successful run, so tests assert on the recorded calls to
 * prove exactly that.
 */
function recordingExec(
  branch = "opsx/unleash-deterministic-tools",
): { exec: GitExec; calls: Array<{ args: string[]; cwd: string }> } {
  const calls: Array<{ args: string[]; cwd: string }> = []
  const exec: GitExec = (args, cwd) => {
    calls.push({ args, cwd })
    if (args.join(" ") === "rev-parse --abbrev-ref HEAD") return branch
    throw new Error(`unexpected git command: ${args.join(" ")}`)
  }
  return { exec, calls }
}

/**
 * Fake readText keyed on absolute paths (the tool resolves command_path
 * against the cwd before reading). Records every read so tests can assert
 * both repo-relative resolution and that the reviewer manifest is never
 * consulted through this dependency.
 */
function fakeReadText(files: Record<string, string>): {
  readText: DelegateCommandDependencies["readText"]
  calls: string[]
} {
  const calls: string[] = []
  const readText = async (path: string): Promise<string> => {
    calls.push(path)
    if (!(path in files)) {
      throw Object.assign(new Error(`ENOENT: no such file or directory, ${path}`), { code: "ENOENT" })
    }
    return files[path]
  }
  return { readText, calls }
}

/** Fake FileExists keyed on repo-relative paths resolved against FAKE_CWD. */
function fakeFileExists(existing: readonly string[]): { fileExists: FileExists; calls: string[] } {
  const existingPaths = new Set(existing.map((rel) => resolve(FAKE_CWD, rel)))
  const calls: string[] = []
  const fileExists: FileExists = (path: string) => {
    calls.push(path)
    return existingPaths.has(path)
  }
  return { fileExists, calls }
}

/** Prompt text delivered to the child session (exactly one text part). */
function deliveredPrompt(calls: FakeCalls): string {
  const parts = calls.prompts[0]?.body?.parts as unknown as Array<{ type: string; text: string }>
  if (parts === undefined || parts.length !== 1 || parts[0].type !== "text") {
    throw new Error(`expected exactly one text part, got ${JSON.stringify(parts)}`)
  }
  return parts[0].text
}

/** Node-shaped ENOENT error so readState/writeState treat a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

/** Invoke the delegate tool with a full parent-session context and parse its JSON output. */
async function invokeDelegate(
  exec: GitExec,
  deps: DelegateCommandDependencies,
  args: Record<string, unknown>,
  abort: AbortSignal = new AbortController().signal,
): Promise<ToolResult<DelegateCommandData>> {
  const delegate = createDelegateCommandTool(exec, FAKE_CWD, deps)
  const result = await (
    delegate as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string; messageID: string; directory: string; abort: AbortSignal },
      ) => Promise<{ output: string }>
    }
  ).execute(args, {
    sessionID: "parent-session",
    messageID: "message-parent",
    directory: FAKE_CWD,
    abort,
  })
  return JSON.parse(result.output) as ToolResult<DelegateCommandData>
}

beforeEach(() => {
  vi.resetAllMocks()
  // Default state-store simulation: no prior state file or directory, so
  // readState returns null (first checkpoint) and writeState takes the
  // create-directory branch.
  vi.mocked(lstatSync).mockImplementation(() => {
    throw enoent("lstat state path")
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — command-file read and prompt composition
// ---------------------------------------------------------------------------

describe("uf_delegate_command command-file read and prompt composition", () => {
  it("reads the command file repo-relative and composes command text, feature-dir context, then extra prompt", async () => {
    const commandAbs = resolve(FAKE_CWD, ".opencode/commands/speckit.plan.md")
    const fake = fakeClient()
    const reads = fakeReadText({ [commandAbs]: "Create the implementation plan." })
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      command_path: ".opencode/commands/speckit.plan.md",
      feature_dir: "specs/018-unleash-command/",
      prompt: "Focus on the parser.",
    })

    expect(result.status).toBe("ok")

    // The command file is resolved against the injected cwd before reading.
    expect(reads.calls).toEqual([commandAbs])

    // Host model resolution introspects the parent session's message.
    expect(fake.calls.messages).toHaveLength(1)
    expect(fake.calls.messages[0]).toMatchObject({
      path: { id: "parent-session", messageID: "message-parent" },
      query: { directory: FAKE_CWD },
    })

    // The child session is parented, titled with agent + resolved model, and
    // prompted with the default agent (cobalt-crush-dev).
    expect(fake.calls.creates[0]?.body).toMatchObject({
      parentID: "parent-session",
      title: `cobalt-crush-dev @ ${HOST_MODEL} (default)`,
    })
    expect(fake.calls.prompts[0]?.body).toMatchObject({
      agent: "cobalt-crush-dev",
      model: { providerID: "host-provider", modelID: "host-model" },
      variant: "default",
    })

    // Prompt composition order (D2): command text, then feature-dir
    // context, then extra instructions.
    expect(deliveredPrompt(fake.calls)).toBe(
      "Create the implementation plan.\n\nFeature directory: specs/018-unleash-command/\n\nFocus on the parser.",
    )
  })

  it("delegates prompt-only calls without command file or feature-dir sections", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Implement task 2.5 exactly.",
    })

    expect(result.status).toBe("ok")
    // Prompt-only delegation (per-task implement and code-fix calls) reads
    // no command file and prepends no feature-dir section.
    expect(reads.calls).toEqual([])
    expect(deliveredPrompt(fake.calls)).toBe("Implement task 2.5 exactly.")
  })

  it("accepts a command file at exactly the 1 MiB bound", async () => {
    const atBound = "x".repeat(1024 * 1024)
    const fake = fakeClient()
    const reads = fakeReadText({ [resolve(FAKE_CWD, "cmd.md")]: atBound })
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, { command_path: "cmd.md" })

    // The bound is inclusive: exactly 1 MiB passes through to the prompt.
    expect(result.status).toBe("ok")
    expect(fake.calls.prompts).toHaveLength(1)
    expect(deliveredPrompt(fake.calls)).toBe(atBound)
  })

  it("fails with COMMAND_FILE_READ_FAILED when the command file cannot be read", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({}) // nothing mapped — every read throws ENOENT
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      command_path: ".opencode/commands/missing.md",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("COMMAND_FILE_READ_FAILED")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        `Cannot read command file: ENOENT: no such file or directory, ${resolve(FAKE_CWD, ".opencode/commands/missing.md")}`,
      )
    }
    // Failed before any session activity.
    expect(fake.calls.messages).toHaveLength(0)
    expect(fake.calls.creates).toHaveLength(0)
    expect(fake.calls.prompts).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — input validation
// ---------------------------------------------------------------------------

describe("uf_delegate_command input validation", () => {
  it("rejects command files over 1 MiB with COMMAND_FILE_TOO_LARGE", async () => {
    const over = "x".repeat(1024 * 1024 + 1)
    const fake = fakeClient()
    const reads = fakeReadText({ [resolve(FAKE_CWD, "big.md")]: over })
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, { command_path: "big.md" })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("COMMAND_FILE_TOO_LARGE")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("Command file exceeds 1 MiB limit (1048577 bytes)")
    }
    // Rejected before any session activity.
    expect(fake.calls.creates).toHaveLength(0)
    expect(fake.calls.prompts).toHaveLength(0)
  })

  it("rejects divisor-* reviewer agents with INVALID_AGENT directing to invoke_agent", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      agent: "divisor-guard",
      prompt: "Review this change.",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_AGENT")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "reviewer agents (divisor-*) are dispatched via invoke_agent; uf_delegate_command is for content delegation",
      )
    }
    // The delegation/review boundary is structural (D2): no manifest read
    // and no session activity precede the rejection.
    expect(reads.calls).toEqual([])
    expect(fake.calls.messages).toHaveLength(0)
    expect(fake.calls.creates).toHaveLength(0)
  })

  it("rejects inputs with neither command_path nor prompt", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {})

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_INPUT")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("prompt: one of command_path or prompt is required")
    }
    expect(fake.calls.creates).toHaveLength(0)
  })

  it.each([0, 1.5, "3"])("rejects invalid phase %p with INVALID_INPUT before any child spawn", async (phase) => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }
    const { exec, calls: execCalls } = recordingExec()

    const result = await invokeDelegate(exec, deps, {
      prompt: "Implement task 5.2 of the change.",
      checkpoint_step: "implement",
      phase,
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_INPUT")
      expect(result.retryable).toBe(false)
      expect(result.message).toContain("phase")
    }
    // Rejected in zod validation before any child spawn or state I/O.
    expect(fake.calls.messages).toHaveLength(0)
    expect(fake.calls.creates).toHaveLength(0)
    expect(fake.calls.prompts).toHaveLength(0)
    expect(execCalls).toEqual([])
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — expected-artifact verification
// ---------------------------------------------------------------------------

describe("uf_delegate_command expected-artifact verification", () => {
  it("verifies the expected artifact after a successful run and returns the full success envelope", async () => {
    const fake = fakeClient({
      parts: [textPart("plan written"), finishPart(0.25, 11, 7)],
    })
    const reads = fakeReadText({})
    const artifact = fakeFileExists(["specs/018-unleash-command/plan.md"])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Write the plan.",
      expected_artifact: "specs/018-unleash-command/plan.md",
    })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        agent: "cobalt-crush-dev",
        status: "success",
        child_session_id: "child-session",
        artifact_created: true,
        checkpoint_recorded: false,
        usage: { cost_usd: 0.25, tokens: { input: 11, output: 7 } },
        provenance: {
          agent: "cobalt-crush-dev",
          requested_model: null,
          requested_variant: null,
          resolved_parent_model: HOST_MODEL,
          resolved_parent_variant: "default",
          reported_child_model: HOST_MODEL,
          model_mismatch: false,
          // Content delegation writes files, unlike review invocations.
          read_only: false,
        },
        text: "plan written",
      })
    }
    // Verification probes the artifact through the injected FileExists only.
    expect(artifact.calls).toEqual([resolve(FAKE_CWD, "specs/018-unleash-command/plan.md")])
    expect(existsSync).not.toHaveBeenCalled()
  })

  it("returns the exact plan.md STOP message and records no checkpoint when the artifact is missing", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }
    const { exec, calls: execCalls } = recordingExec()

    const result = await invokeDelegate(exec, deps, {
      prompt: "Write the plan.",
      expected_artifact: "specs/018-unleash-command/plan.md",
      checkpoint_step: "plan",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("EXPECTED_ARTIFACT_MISSING")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "Plan generation failed -- plan.md was not created. Check the agent output for errors.",
      )
    }
    // The child session ran; verification failed only after it finished.
    expect(fake.calls.creates).toHaveLength(1)
    expect(fake.calls.prompts).toHaveLength(1)
    // An unverified run never checkpoints (D5: success-only) and never
    // derives a state key.
    expect(execCalls).toEqual([])
    expect(lstatSync).not.toHaveBeenCalled()
    expect(readFileSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("returns the exact tasks.md STOP message when tasks.md is missing", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Generate the task list.",
      expected_artifact: "openspec/changes/unleash-deterministic-tools/tasks.md",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("EXPECTED_ARTIFACT_MISSING")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "Task generation failed -- tasks.md was not created. Check the agent output for errors.",
      )
    }
  })

  it("returns the generic artifact STOP message naming the missing path", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Write the design record.",
      expected_artifact: "specs/018-unleash-command/design.md",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("EXPECTED_ARTIFACT_MISSING")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "Artifact generation failed -- specs/018-unleash-command/design.md was not created. " +
          "Check the agent output for errors.",
      )
    }
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — child-session failure propagation
// ---------------------------------------------------------------------------

describe("uf_delegate_command child-session propagation", () => {
  it("propagates a timed-out child session as DELEGATE_FAILED with a retryable error", async () => {
    const fake = fakeClient({ hangPrompt: true })
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Run the delegation.",
      timeout: 5,
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("DELEGATE_FAILED")
      expect(result.retryable).toBe(true)
      expect(result.message).toBe("timeout: invoke_agent run timed out")
    }
    // The executor aborted the hanging child session.
    expect(fake.calls.aborts).toHaveLength(1)
  })

  it("propagates parent cancellation of the child session as DELEGATE_CANCELLED", async () => {
    const controller = new AbortController()
    const fake = fakeClient({ hangPrompt: true })
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const pending = invokeDelegate(recordingExec().exec, deps, { prompt: "Run the delegation." }, controller.signal)
    await new Promise((resolve) => setTimeout(resolve, 0))
    controller.abort(new Error("parent stopped"))
    const result = await pending

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("DELEGATE_CANCELLED")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("cancelled: invoke_agent run was cancelled")
    }
    // Cancellation reached the child session with an independent cleanup
    // signal (invoke-agent precedent).
    expect(fake.calls.aborts).toHaveLength(1)
    expect(fake.calls.aborts[0]?.path).toEqual({ id: "child-session" })
    expect(fake.calls.aborts[0]?.signal).not.toBe(controller.signal)
  })

  it("returns DELEGATE_CANCELLED before spawning when cancellation hits host resolution", async () => {
    const controller = new AbortController()
    const fake = fakeClient({ hangMessage: true })
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const pending = invokeDelegate(recordingExec().exec, deps, { prompt: "Run the delegation." }, controller.signal)
    await new Promise((resolve) => setTimeout(resolve, 0))
    controller.abort(new Error("parent stopped"))
    const result = await pending

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("DELEGATE_CANCELLED")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("uf_delegate_command run was cancelled")
    }
    // Cancelled before any child session existed.
    expect(fake.calls.messages).toHaveLength(1)
    expect(fake.calls.creates).toHaveLength(0)
    expect(fake.calls.prompts).toHaveLength(0)
    expect(fake.calls.aborts).toHaveLength(0)
  })

  it("propagates child creation failures as DELEGATE_FAILED with sanitized errors and no checkpoint", async () => {
    const fake = fakeClient({ createError: "credential=abc /home/alice/private" })
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }
    const { exec, calls: execCalls } = recordingExec()

    const result = await invokeDelegate(exec, deps, {
      prompt: "Run the delegation.",
      checkpoint_step: "plan",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("DELEGATE_FAILED")
      expect(result.retryable).toBe(true)
      expect(result.message).toContain("child_create_failed:")
      // The executor's sanitizer redacted the credential and home path.
      expect(result.message).not.toMatch(/abc|\/home\/alice/)
    }
    // Failed runs never checkpoint (D5) and never derive a state key.
    expect(execCalls).toEqual([])
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("fails with HOST_MODEL_UNAVAILABLE, retryable, when host introspection cannot resolve a model", async () => {
    const fake = fakeClient({ hostVariant: "not valid" })
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, { prompt: "Run the delegation." })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("HOST_MODEL_UNAVAILABLE")
      expect(result.retryable).toBe(true)
      expect(result.message).toBe("current assistant active variant is unavailable or invalid")
    }
    // No child session was spawned for an unresolvable host model.
    expect(fake.calls.creates).toHaveLength(0)
    expect(fake.calls.prompts).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — manifest isolation
// ---------------------------------------------------------------------------

describe("uf_delegate_command manifest isolation", () => {
  it("never consults .uf/reviewer-capabilities.yaml through any dependency or filesystem surface", async () => {
    const commandAbs = resolve(FAKE_CWD, ".opencode/commands/speckit.tasks.md")
    const fake = fakeClient()
    const reads = fakeReadText({ [commandAbs]: "Generate the task list." })
    const artifact = fakeFileExists(["openspec/changes/unleash-deterministic-tools/tasks.md"])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      command_path: ".opencode/commands/speckit.tasks.md",
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
      expected_artifact: "openspec/changes/unleash-deterministic-tools/tasks.md",
      checkpoint_step: "tasks",
    })

    expect(result.status).toBe("ok")

    // The only text read is the command file — the reviewer manifest is not
    // an input to content delegation (D2 boundary is agent validation).
    expect(reads.calls).toEqual([commandAbs])

    // No filesystem probe touches the manifest, and existence checks flow
    // exclusively through the injected FileExists.
    const probed = [
      ...vi.mocked(existsSync).mock.calls.map((call) => String(call[0])),
      ...vi.mocked(lstatSync).mock.calls.map((call) => String(call[0])),
      ...vi.mocked(readFileSync).mock.calls.map((call) => String(call[0])),
      ...vi.mocked(writeFileSync).mock.calls.map((call) => String(call[0])),
    ]
    expect(probed.length).toBeGreaterThan(0)
    for (const path of probed) {
      expect(path.includes("reviewer-capabilities")).toBe(false)
    }
    expect(existsSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — checkpoint recording semantics
// ---------------------------------------------------------------------------

describe("uf_delegate_command checkpoint recording", () => {
  it("auto-checkpoints checkpoint_step on verified success with the delegation facts as data", async () => {
    const commandAbs = resolve(FAKE_CWD, ".opencode/commands/speckit.plan.md")
    const fake = fakeClient()
    const reads = fakeReadText({ [commandAbs]: "Create the implementation plan." })
    const artifact = fakeFileExists(["specs/018-unleash-command/plan.md"])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }
    const { exec, calls: execCalls } = recordingExec("opsx/unleash-deterministic-tools")

    const result = await invokeDelegate(exec, deps, {
      command_path: ".opencode/commands/speckit.plan.md",
      feature_dir: "specs/018-unleash-command/",
      prompt: "Focus on the parser.",
      expected_artifact: "specs/018-unleash-command/plan.md",
      checkpoint_step: "plan",
    })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.checkpoint_recorded).toBe(true)
      expect(result.data?.artifact_created).toBe(true)
    }

    // Exactly one git invocation — the state-key branch read — against the
    // injected cwd.
    expect(execCalls).toEqual([{ args: ["rev-parse", "--abbrev-ref", "HEAD"], cwd: FAKE_CWD }])

    // D5: the checkpoint persists through the writeState path —
    // .uf/progress/<sanitized-branch>/uf.unleash.json with 0o600 file mode.
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [statePathArg, stateRaw, writeOptions] = vi.mocked(writeFileSync).mock.calls[0]
    expect(statePathArg).toBe(
      resolve(FAKE_CWD, ".uf/progress/opsx-unleash-deterministic-tools/uf.unleash.json"),
    )
    expect(writeOptions).toMatchObject({ mode: 0o600 })
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.command).toBe("uf.unleash")
    expect(state.branch).toBe("opsx-unleash-deterministic-tools")
    expect(state.key).toBe("opsx-unleash-deterministic-tools")
    expect(state.current_step).toBe("plan")
    expect(state.completed_steps).toEqual(["plan"])
    expect(state.data).toEqual({
      agent: "cobalt-crush-dev",
      command_path: ".opencode/commands/speckit.plan.md",
      feature_dir: "specs/018-unleash-command/",
      expected_artifact: "specs/018-unleash-command/plan.md",
    })

    expect(mkdirSync).toHaveBeenCalledTimes(1)
    const [mkdirPathArg, mkdirOptions] = vi.mocked(mkdirSync).mock.calls[0]
    expect(mkdirPathArg).toBe(resolve(FAKE_CWD, ".uf/progress/opsx-unleash-deterministic-tools"))
    expect(mkdirOptions).toMatchObject({ recursive: true, mode: 0o700 })
  })

  it("records implement checkpoint data with the phase for per-task delegation", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }
    const { exec, calls: execCalls } = recordingExec("opsx/unleash-deterministic-tools")

    // Per-task implement call shape (command Step 5): prompt-only, no
    // command_path or expected_artifact, with the 1-based phase number.
    const result = await invokeDelegate(exec, deps, {
      prompt: "Implement task 5.2 of the change.",
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
      checkpoint_step: "implement",
      phase: 3,
    })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.checkpoint_recorded).toBe(true)
    }
    expect(execCalls).toEqual([{ args: ["rev-parse", "--abbrev-ref", "HEAD"], cwd: FAKE_CWD }])

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.current_step).toBe("implement")
    expect(state.completed_steps).toEqual(["implement"])
    // D5: "implement" with phase data — the per-task call merges the
    // phase into the checkpoint data alongside the delegation facts.
    expect(state.data).toEqual({
      agent: "cobalt-crush-dev",
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
      phase: 3,
    })
  })

  it("records no phase key in checkpoint data when phase is omitted", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Implement task 5.2 of the change.",
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
      checkpoint_step: "implement",
    })

    expect(result.status).toBe("ok")
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    const state = JSON.parse(stateRaw as string) as ProgressState
    // Existing checkpoint shapes are preserved: absent phase adds no key.
    expect(state.data).toEqual({
      agent: "cobalt-crush-dev",
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
    })
    expect(state.data).not.toHaveProperty("phase")
  })

  it("appends checkpoint_step idempotently to existing checkpoint state", async () => {
    // Simulate a re-run: prior state exists with the branch gate recorded,
    // a later current step, and stale feature-dir data.
    const existing: ProgressState = {
      command: "uf.unleash",
      branch: "opsx-unleash-deterministic-tools",
      key: "opsx-unleash-deterministic-tools",
      current_step: "branch-safety-gate",
      completed_steps: ["branch-safety-gate"],
      data: { feature_dir: "specs/018-stale-dir/" },
      created_at: "2026-10-14T00:00:00.000Z",
      updated_at: "2026-10-14T00:00:00.000Z",
    }
    vi.mocked(lstatSync).mockImplementation(
      () => ({ isSymbolicLink: () => false }) as unknown as ReturnType<typeof lstatSync>,
    )
    vi.mocked(readFileSync).mockImplementation(() => JSON.stringify(existing))

    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Write the plan.",
      checkpoint_step: "plan",
    })

    expect(result.status).toBe("ok")

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    const state = JSON.parse(stateRaw as string) as ProgressState
    // The new step appends without duplicating earlier ones (FR-001)...
    expect(state.completed_steps).toEqual(["branch-safety-gate", "plan"])
    expect(state.current_step).toBe("plan")
    // ...shallow data merge adds this run's delegation facts while the stale
    // feature_dir survives (this run supplied none)...
    expect(state.data).toEqual({ feature_dir: "specs/018-stale-dir/", agent: "cobalt-crush-dev" })
    // ...and created_at survives while updated_at is refreshed.
    expect(state.created_at).toBe("2026-10-14T00:00:00.000Z")
    expect(state.updated_at).not.toBe("2026-10-14T00:00:00.000Z")
  })

  it("records no checkpoint when checkpoint_step is omitted", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }
    const { exec, calls: execCalls } = recordingExec()

    const result = await invokeDelegate(exec, deps, { prompt: "Run the delegation." })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.checkpoint_recorded).toBe(false)
    }
    // No state-key derivation and no state I/O happened.
    expect(execCalls).toEqual([])
    expect(lstatSync).not.toHaveBeenCalled()
    expect(readFileSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("fails closed with DELEGATE_ERROR when the checkpoint cannot be written", async () => {
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error("EACCES: permission denied writing state file")
    })
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Run the delegation.",
      checkpoint_step: "plan",
    })

    // recordAutoCheckpoint throws on state I/O failure so a delegation never
    // reports success without a durable checkpoint (fail closed, D5).
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("DELEGATE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("EACCES: permission denied writing state file")
    }
  })
})

// ---------------------------------------------------------------------------
// uf_delegate_command — path traversal
// ---------------------------------------------------------------------------

describe("uf_delegate_command path traversal", () => {
  it.each(["../secrets.md", "/etc/passwd"])(
    "rejects command_path %s escaping the repository root with COMMAND_PATH_TRAVERSAL",
    async (commandPath) => {
      const fake = fakeClient()
      const reads = fakeReadText({})
      const artifact = fakeFileExists([])
      const deps: DelegateCommandDependencies = {
        client: fake.client,
        readText: reads.readText,
        fileExists: artifact.fileExists,
      }

      const result = await invokeDelegate(recordingExec().exec, deps, { command_path: commandPath })

      expect(result.status).toBe("error")
      if (result.status === "error") {
        expect(result.code).toBe("COMMAND_PATH_TRAVERSAL")
        expect(result.retryable).toBe(false)
        expect(result.message).toBe(
          "Path traversal blocked: command_path resolves outside the repository root",
        )
      }
      // Rejected before any file read, existence probe, or session activity.
      expect(reads.calls).toEqual([])
      expect(artifact.calls).toEqual([])
      expect(fake.calls.messages).toHaveLength(0)
      expect(fake.calls.creates).toHaveLength(0)
    },
  )

  it("rejects expected_artifact escaping the repository root with EXPECTED_ARTIFACT_TRAVERSAL before spawning", async () => {
    const fake = fakeClient()
    const reads = fakeReadText({})
    const artifact = fakeFileExists([])
    const deps: DelegateCommandDependencies = {
      client: fake.client,
      readText: reads.readText,
      fileExists: artifact.fileExists,
    }

    const result = await invokeDelegate(recordingExec().exec, deps, {
      prompt: "Run the delegation.",
      expected_artifact: "../../outside/plan.md",
    })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("EXPECTED_ARTIFACT_TRAVERSAL")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "Path traversal blocked: expected_artifact resolves outside the repository root",
      )
    }
    // Pre-resolved before spawning: no host introspection, no child session,
    // no artifact existence probe.
    expect(fake.calls.messages).toHaveLength(0)
    expect(fake.calls.creates).toHaveLength(0)
    expect(fake.calls.prompts).toHaveLength(0)
    expect(artifact.calls).toEqual([])
  })
})
