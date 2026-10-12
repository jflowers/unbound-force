import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { PluginInput } from "@opencode-ai/plugin"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  failure,
  success,
  type ToolFailure,
  type ToolResult,
  type ToolSuccess,
} from "../lib/uf-workflow-types.js"
import UfWorkflowPlugin from "../plugins/uf-workflow/index.js"
import {
  createCheckpointTool,
  createClearProgressTool,
  createGetProgressTool,
  createResolveBaseRefTool,
  type GitExec,
  type ProgressState,
  type ResolveBaseRefData,
  resolveKey,
  sanitizeSlug,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Envelope helper tests
// ---------------------------------------------------------------------------

describe("success()", () => {
  it("returns { status: 'ok' } without data", () => {
    const result: ToolSuccess = success()
    expect(result).toStrictEqual({ status: "ok" })
    expect(result.data).toBeUndefined()
  })

  it("includes data when provided", () => {
    const result: ToolSuccess<{ count: number }> = success({ count: 42 })
    expect(result).toStrictEqual({ status: "ok", data: { count: 42 } })
  })

  it("carries typed payload through ToolResult union", () => {
    const result: ToolResult<string> = success("hello")
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toBe("hello")
    }
  })
})

describe("failure()", () => {
  it("returns error envelope with retryable defaulting to false", () => {
    const result: ToolFailure = failure("something went wrong")
    expect(result).toStrictEqual({
      status: "error",
      message: "something went wrong",
      retryable: false,
    })
  })

  it("includes retryable and code when provided", () => {
    const result: ToolFailure = failure("timeout", {
      retryable: true,
      code: "ETIMEOUT",
    })
    expect(result).toStrictEqual({
      status: "error",
      message: "timeout",
      retryable: true,
      code: "ETIMEOUT",
    })
  })

  it("omits code when not provided", () => {
    const result = failure("oops", { retryable: true })
    expect(result.code).toBeUndefined()
    expect(result.retryable).toBe(true)
  })

  it("discriminates via status in ToolResult union", () => {
    const result: ToolResult = failure("bad")
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.message).toBe("bad")
      expect(result.retryable).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Plugin smoke test
// ---------------------------------------------------------------------------

describe("UfWorkflowPlugin", () => {
  it("exports a PluginModule with id and server", () => {
    expect(UfWorkflowPlugin.id).toBe("uf-workflow")
    expect(typeof UfWorkflowPlugin.server).toBe("function")
  })

  it("server resolves and registers resolve_base_ref tool", async () => {
    const fakeInput = {
      directory: "/tmp/fake",
      client: {} as PluginInput["client"],
    } as PluginInput

    const result = await UfWorkflowPlugin.server(fakeInput)
    expect(result).toBeDefined()
    expect(result.tool).toBeDefined()
    expect(Object.keys(result.tool).sort()).toEqual([
      "checkpoint",
      "clear_progress",
      "get_progress",
      "resolve_base_ref",
    ])
  })
})

// ---------------------------------------------------------------------------
// resolve_base_ref tool tests
// ---------------------------------------------------------------------------

/** Helper to invoke the tool and parse its JSON output. */
async function invokeResolveBaseRef(exec: GitExec): Promise<ToolResult<ResolveBaseRefData>> {
  const resolveBaseRefTool = createResolveBaseRefTool(exec, "/fake/project")
  // The tool() return type has an execute method; invoke it with
  // empty args and a minimal context.
  const result = await (resolveBaseRefTool as { execute: (args: Record<string, never>, ctx: { sessionID: string }) => Promise<{ output: string }> })
    .execute({}, { sessionID: "test-session" })
  return JSON.parse(result.output) as ToolResult<ResolveBaseRefData>
}

describe("resolve_base_ref", () => {
  it("returns upstream/main when it resolves", async () => {
    const mockExec: GitExec = (cmd: string) => {
      if (cmd.includes("upstream/main")) return "abc123def456"
      throw new Error("not found")
    }

    const result = await invokeResolveBaseRef(mockExec)
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        ref: "upstream/main",
        sha: "abc123def456",
        source: "upstream/main",
      })
    }
  })

  it("falls back to origin/main when upstream/main fails", async () => {
    const mockExec: GitExec = (cmd: string) => {
      if (cmd.includes("upstream/main")) throw new Error("not found")
      if (cmd.includes("origin/main")) return "def789abc012"
      throw new Error("not found")
    }

    const result = await invokeResolveBaseRef(mockExec)
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        ref: "origin/main",
        sha: "def789abc012",
        source: "origin/main",
      })
    }
  })

  it("falls back to main when remote-tracking refs fail", async () => {
    const mockExec: GitExec = (cmd: string) => {
      if (cmd.includes("upstream/main")) throw new Error("not found")
      if (cmd.includes("origin/main")) throw new Error("not found")
      if (cmd.endsWith("main")) return "789012abc345"
      throw new Error("not found")
    }

    const result = await invokeResolveBaseRef(mockExec)
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        ref: "main",
        sha: "789012abc345",
        source: "main",
      })
    }
  })

  it("returns failure when no ref resolves", async () => {
    const mockExec: GitExec = () => {
      throw new Error("not found")
    }

    const result = await invokeResolveBaseRef(mockExec)
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.retryable).toBe(false)
      expect(result.code).toBe("NO_BASE_REF")
      expect(result.message).toContain("No resolvable base ref found")
      expect(result.message).toContain("upstream/main")
      expect(result.message).toContain("origin/main")
      expect(result.message).toContain("main")
    }
  })

  it("skips candidates that return empty string", async () => {
    const mockExec: GitExec = (cmd: string) => {
      if (cmd.includes("upstream/main")) return ""
      if (cmd.includes("origin/main")) return "nonempty123"
      throw new Error("not found")
    }

    const result = await invokeResolveBaseRef(mockExec)
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.source).toBe("origin/main")
    }
  })

  it("passes cwd to the executor", async () => {
    const capturedCwds: string[] = []
    const mockExec: GitExec = (cmd: string, cwd: string) => {
      capturedCwds.push(cwd)
      if (cmd.includes("upstream/main")) return "sha123"
      throw new Error("not found")
    }

    const resolveBaseRefTool = createResolveBaseRefTool(mockExec, "/my/project")
    await (resolveBaseRefTool as { execute: (args: Record<string, never>, ctx: { sessionID: string }) => Promise<{ output: string }> })
      .execute({}, { sessionID: "test-session" })

    expect(capturedCwds.length).toBeGreaterThan(0)
    expect(capturedCwds[0]).toBe("/my/project")
  })
})

// ---------------------------------------------------------------------------
// sanitizeSlug tests (FR-004)
// ---------------------------------------------------------------------------

describe("sanitizeSlug()", () => {
  it("replaces / with -", () => {
    expect(sanitizeSlug("opsx/my-branch")).toBe("opsx-my-branch")
  })

  it("strips non-allowed characters", () => {
    expect(sanitizeSlug("feat/add @stuff!")).toBe("feat-addstuff")
  })

  it("preserves dots and underscores", () => {
    expect(sanitizeSlug("v1.2_beta")).toBe("v1.2_beta")
  })

  it("truncates to 100 characters", () => {
    const long = "a".repeat(150)
    expect(sanitizeSlug(long).length).toBe(100)
  })

  it("throws on empty result after sanitization", () => {
    expect(() => sanitizeSlug("@@@")).toThrow("empty slug")
  })
})

// ---------------------------------------------------------------------------
// resolveKey tests (FR-004)
// ---------------------------------------------------------------------------

describe("resolveKey()", () => {
  it("returns sanitized explicit key when provided", () => {
    const exec: GitExec = () => {
      throw new Error("should not be called")
    }
    expect(resolveKey(exec, "/tmp", "my/custom-key")).toBe("my-custom-key")
  })

  it("ignores empty string explicit key and auto-detects branch", () => {
    const exec: GitExec = () => "main"
    expect(resolveKey(exec, "/tmp", "")).toBe("main")
  })

  it("auto-detects branch from git when no explicit key", () => {
    const exec: GitExec = (cmd: string) => {
      if (cmd.includes("--abbrev-ref")) return "feature/my-branch"
      throw new Error("unexpected command")
    }
    expect(resolveKey(exec, "/tmp")).toBe("feature-my-branch")
  })

  it("throws on detached HEAD without explicit key", () => {
    const exec: GitExec = () => "HEAD"
    expect(() => resolveKey(exec, "/tmp")).toThrow("Detached HEAD")
  })
})

// ---------------------------------------------------------------------------
// Checkpoint tool helpers
// ---------------------------------------------------------------------------

/** Mock git exec that always returns a fixed branch name. */
const branchExec: GitExec = () => "opsx-test-branch"

/** Invoke a tool factory result with typed args and parse JSON output. */
async function invokeTool<T = unknown>(
  toolInstance: unknown,
  args: Record<string, unknown>,
): Promise<ToolResult<T>> {
  const result = await (
    toolInstance as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string },
      ) => Promise<{ output: string }>
    }
  ).execute(args, { sessionID: "test-session" })
  return JSON.parse(result.output) as ToolResult<T>
}

// ---------------------------------------------------------------------------
// checkpoint tool tests (FR-001)
// ---------------------------------------------------------------------------

describe("checkpoint tool (FR-001)", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "uf-checkpoint-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("creates new state on first call", async () => {
    const result = await invokeTool<ProgressState>(
      createCheckpointTool(branchExec, tmpDir),
      { command: "uf.unleash", step: "step-0" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      const s = result.data as ProgressState
      expect(s.command).toBe("uf.unleash")
      expect(s.current_step).toBe("step-0")
      expect(s.completed_steps).toEqual(["step-0"])
      expect(s.data).toEqual({})
      expect(s.created_at).toBeTruthy()
      expect(s.updated_at).toBeTruthy()
    }
  })

  it("appends steps on subsequent calls", async () => {
    const cp = createCheckpointTool(branchExec, tmpDir)
    await invokeTool(cp, { command: "uf.unleash", step: "step-0" })
    const result = await invokeTool<ProgressState>(cp, {
      command: "uf.unleash",
      step: "step-1",
    })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      const s = result.data as ProgressState
      expect(s.current_step).toBe("step-1")
      expect(s.completed_steps).toEqual(["step-0", "step-1"])
    }
  })

  it("duplicate step is idempotent (FR-001)", async () => {
    const cp = createCheckpointTool(branchExec, tmpDir)
    await invokeTool(cp, { command: "uf.unleash", step: "step-0" })
    const result = await invokeTool<ProgressState>(cp, {
      command: "uf.unleash",
      step: "step-0",
    })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect((result.data as ProgressState).completed_steps).toEqual([
        "step-0",
      ])
    }
  })

  it("shallow merges data via Object.assign (D3)", async () => {
    const cp = createCheckpointTool(branchExec, tmpDir)
    await invokeTool(cp, {
      command: "uf.unleash",
      step: "step-0",
      data: JSON.stringify({ a: 1 }),
    })
    const result = await invokeTool<ProgressState>(cp, {
      command: "uf.unleash",
      step: "step-1",
      data: JSON.stringify({ b: 2 }),
    })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect((result.data as ProgressState).data).toEqual({ a: 1, b: 2 })
    }
  })

  it("creates files with 0o600 permissions (FR-005)", async () => {
    await invokeTool(createCheckpointTool(branchExec, tmpDir), {
      command: "uf.unleash",
      step: "step-0",
    })
    const fp = join(
      tmpDir,
      ".uf",
      "progress",
      "opsx-test-branch",
      "uf.unleash.json",
    )
    const stats = statSync(fp)
    expect(stats.mode & 0o777).toBe(0o600)
  })

  it("creates directories with 0o700 permissions (FR-005)", async () => {
    await invokeTool(createCheckpointTool(branchExec, tmpDir), {
      command: "uf.unleash",
      step: "step-0",
    })
    const dir = join(tmpDir, ".uf", "progress", "opsx-test-branch")
    const stats = statSync(dir)
    expect(stats.mode & 0o777).toBe(0o700)
  })

  it("uses explicit key when provided", async () => {
    const result = await invokeTool<ProgressState>(
      createCheckpointTool(branchExec, tmpDir),
      { command: "uf.unleash", step: "step-0", key: "custom-key" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect((result.data as ProgressState).key).toBe("custom-key")
    }
  })

  it("returns failure on invalid JSON data", async () => {
    const result = await invokeTool(
      createCheckpointTool(branchExec, tmpDir),
      { command: "uf.unleash", step: "step-0", data: "not-json" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("CHECKPOINT_ERROR")
    }
  })
})

// ---------------------------------------------------------------------------
// get_progress tool tests (FR-002)
// ---------------------------------------------------------------------------

describe("get_progress tool (FR-002)", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "uf-getprogress-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns null when no state exists", async () => {
    const result = await invokeTool(
      createGetProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toBeNull()
    }
  })

  it("returns full state after checkpoint", async () => {
    await invokeTool(createCheckpointTool(branchExec, tmpDir), {
      command: "uf.unleash",
      step: "step-0",
    })
    const result = await invokeTool<ProgressState>(
      createGetProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      const s = result.data as ProgressState
      expect(s.command).toBe("uf.unleash")
      expect(s.completed_steps).toEqual(["step-0"])
    }
  })
})

// ---------------------------------------------------------------------------
// clear_progress tool tests (FR-003)
// ---------------------------------------------------------------------------

describe("clear_progress tool (FR-003)", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "uf-clearprogress-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("deletes existing state file", async () => {
    await invokeTool(createCheckpointTool(branchExec, tmpDir), {
      command: "uf.unleash",
      step: "step-0",
    })
    const clearResult = await invokeTool(
      createClearProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(clearResult.status).toBe("ok")
    // Verify file is gone by reading progress
    const getResult = await invokeTool(
      createGetProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(getResult.status).toBe("ok")
    if (getResult.status === "ok") {
      expect(getResult.data).toBeNull()
    }
  })

  it("is idempotent when no state file exists", async () => {
    const result = await invokeTool(
      createClearProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("ok")
  })

  it("returns failure on error during clear", async () => {
    // Use a failing exec to trigger error in resolveKey
    const failExec: GitExec = () => {
      throw new Error("git not found")
    }
    const result = await invokeTool(
      createClearProgressTool(failExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("CLEAR_PROGRESS_ERROR")
      expect(result.message).toContain("git not found")
    }
  })
})

// ---------------------------------------------------------------------------
// get_progress error path tests
// ---------------------------------------------------------------------------

describe("get_progress error paths", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "uf-getprogress-err-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns failure when resolveKey throws", async () => {
    const failExec: GitExec = () => {
      throw new Error("git not found")
    }
    const result = await invokeTool(
      createGetProgressTool(failExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GET_PROGRESS_ERROR")
      expect(result.message).toContain("git not found")
    }
  })
})

// ---------------------------------------------------------------------------
// Symlink defense tests (FR-005)
// ---------------------------------------------------------------------------

describe("symlink defense (FR-005)", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "uf-symlink-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("checkpoint refuses to write into symlinked directory", async () => {
    // Create a real target directory and a symlink to it
    const realDir = join(tmpDir, "real-progress")
    const symlinkDir = join(tmpDir, ".uf", "progress", "opsx-test-branch")
    mkdirSync(realDir, { recursive: true })
    mkdirSync(join(tmpDir, ".uf", "progress"), { recursive: true })
    symlinkSync(realDir, symlinkDir)

    const result = await invokeTool(
      createCheckpointTool(branchExec, tmpDir),
      { command: "uf.unleash", step: "step-0" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.message).toContain("symlinked directory")
    }
  })

  it("clear_progress refuses to delete symlinked state file", async () => {
    const progressDir = join(tmpDir, ".uf", "progress", "opsx-test-branch")
    mkdirSync(progressDir, { recursive: true, mode: 0o700 })
    const realFile = join(tmpDir, "real-state.json")
    writeFileSync(realFile, "{}")
    symlinkSync(realFile, join(progressDir, "uf.unleash.json"))

    const result = await invokeTool(
      createClearProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.message).toContain("symlinked state file")
    }
  })

  it("get_progress refuses to read symlinked state file", async () => {
    // First create a real state file
    const progressDir = join(tmpDir, ".uf", "progress", "opsx-test-branch")
    mkdirSync(progressDir, { recursive: true, mode: 0o700 })
    const realFile = join(tmpDir, "real-state.json")
    writeFileSync(
      realFile,
      JSON.stringify({
        command: "test",
        branch: "opsx-test-branch",
        key: "opsx-test-branch",
        current_step: "step-0",
        completed_steps: ["step-0"],
        data: {},
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    )
    // Create symlink where the state file would be
    symlinkSync(realFile, join(progressDir, "uf.unleash.json"))

    const result = await invokeTool(
      createGetProgressTool(branchExec, tmpDir),
      { command: "uf.unleash" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.message).toContain("symlinked state file")
    }
  })
})
