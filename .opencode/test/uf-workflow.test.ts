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
  createGitCommitNoEditTool,
  createGitConflictFilesTool,
  createGitFetchTool,
  createGitMergeAbortTool,
  createGitMergeTool,
  createGitPushForceWithLeaseTool,
  createGitPushTool,
  createGitRebaseAbortTool,
  createGitRebaseTool,
  createGetProgressTool,
  createNormalizeModelNameTool,
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
      "git_commit_no_edit",
      "git_conflict_files",
      "git_fetch",
      "git_merge",
      "git_merge_abort",
      "git_push",
      "git_push_force_with_lease",
      "git_rebase",
      "git_rebase_abort",
      "normalize_model_name",
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
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
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
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
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
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd.includes("upstream/main")) throw new Error("not found")
      if (cmd.includes("origin/main")) throw new Error("not found")
      if (cmd.includes("main")) return "789012abc345"
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
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
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
    const mockExec: GitExec = (args: string[], cwd: string) => {
      capturedCwds.push(cwd)
      const cmd = args.join(" ")
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

  it("collapses dot runs", () => {
    expect(sanitizeSlug("a..b...c")).toBe("a.b.c")
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
    const exec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
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

// ---------------------------------------------------------------------------
// normalize_model_name tool tests
// ---------------------------------------------------------------------------

describe("normalize_model_name", () => {
  it("strips provider prefix and @-suffix and date suffix", async () => {
    const result = await invokeTool<{ normalized: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "google-vertex-anthropic/claude-sonnet-4-20250514@default" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("claude-sonnet-4")
    }
  })

  it("passes through already-normalized names", async () => {
    const result = await invokeTool<{ normalized: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "claude-sonnet-4" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("claude-sonnet-4")
    }
  })

  it("returns unknown-model with warning for empty input", async () => {
    const result = await invokeTool<{ normalized: string; warning: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("unknown-model")
      expect(result.data?.warning).toBeDefined()
    }
  })

  it("strips trailing single-digit version segments repeatedly", async () => {
    // `-1` is stripped because preceded by digit `4` (chained sub-version).
    // `-4` is preserved because preceded by `e` (part of model name).
    const result = await invokeTool<{ normalized: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "provider/model-name-4-1@v2" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("model-name-4")
    }
  })

  it("strips chained sub-version digits like -4-6", async () => {
    // claude-opus-4-6: `-6` stripped (preceded by `4`),
    // `-4` preserved (preceded by `s`)
    const result = await invokeTool<{ normalized: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "anthropic/claude-opus-4-6-20260101@default" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("claude-opus-4")
    }
  })

  it("handles name with only @-suffix and no provider", async () => {
    const result = await invokeTool<{ normalized: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "gpt-4o@latest" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("gpt-4o")
    }
  })

  it("returns unknown-model for whitespace-only input", async () => {
    const result = await invokeTool<{ normalized: string; warning: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "   " },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("unknown-model")
    }
  })

  it("returns unknown-model for input that normalizes to invalid chars", async () => {
    const result = await invokeTool<{ normalized: string; warning: string }>(
      createNormalizeModelNameTool(),
      { rawModelId: "provider/!!!@suffix" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.normalized).toBe("unknown-model")
      expect(result.data?.warning).toContain("Could not normalize")
    }
  })
})

// ---------------------------------------------------------------------------
// Git operation tool tests
// ---------------------------------------------------------------------------

describe("git_fetch", () => {
  it("executes git fetch with remote and branch", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitFetchTool(mockExec, "/fake"),
      { remote: "origin", branch: "main" },
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.success).toBe(true)
    }
    expect(commands[0]).toBe("fetch origin main")
  })

  it("executes git fetch with remote only when branch omitted", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitFetchTool(mockExec, "/fake"),
      { remote: "upstream" },
    )
    expect(result.status).toBe("ok")
    expect(commands[0]).toBe("fetch upstream")
  })

  it("returns failure on fetch error", async () => {
    const mockExec: GitExec = () => {
      throw new Error("fatal: could not read from remote")
    }
    const result = await invokeTool(
      createGitFetchTool(mockExec, "/fake"),
      { remote: "origin" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_FETCH_ERROR")
      expect(result.retryable).toBe(true)
    }
  })
})

describe("git_push", () => {
  it("executes plain git push when no options", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitPushTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    expect(commands[0]).toBe("push")
  })

  it("sets upstream when setUpstream and branch provided", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitPushTool(mockExec, "/fake"),
      { setUpstream: true, branch: "feat/my-branch" },
    )
    expect(result.status).toBe("ok")
    expect(commands[0]).toBe("push --set-upstream origin feat/my-branch")
  })

  it("returns failure on push error", async () => {
    const mockExec: GitExec = () => {
      throw new Error("rejected")
    }
    const result = await invokeTool(
      createGitPushTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_PUSH_ERROR")
    }
  })
})

describe("git_push_force_with_lease", () => {
  it("executes git push --force-with-lease", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitPushForceWithLeaseTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    expect(commands[0]).toBe("push --force-with-lease")
  })

  it("returns failure on force-push error", async () => {
    const mockExec: GitExec = () => {
      throw new Error("stale info")
    }
    const result = await invokeTool(
      createGitPushForceWithLeaseTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_PUSH_FORCE_ERROR")
    }
  })
})

describe("git_merge", () => {
  it("returns success with conflicted false on clean merge", async () => {
    const mockExec: GitExec = () => "Already up to date."
    const result = await invokeTool<{
      success: boolean
      conflicted: boolean
    }>(createGitMergeTool(mockExec, "/fake"), { ref: "main" })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.success).toBe(true)
      expect(result.data?.conflicted).toBe(false)
    }
  })

  it("detects conflicts and lists conflicting files", async () => {
    let callCount = 0
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      callCount++
      if (cmd.startsWith("merge")) {
        throw new Error("CONFLICT (content): Merge conflict in file.txt")
      }
      if (cmd.includes("--diff-filter=U")) {
        return "file.txt\nsrc/other.ts"
      }
      return ""
    }
    const result = await invokeTool<{
      success: boolean
      conflicted: boolean
      conflictingFiles: string[]
    }>(createGitMergeTool(mockExec, "/fake"), { ref: "feature" })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.success).toBe(false)
      expect(result.data?.conflicted).toBe(true)
      expect(result.data?.conflictingFiles).toStrictEqual([
        "file.txt",
        "src/other.ts",
      ])
    }
  })

  it("returns empty conflictingFiles when diff command also fails", async () => {
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd.startsWith("merge")) {
        throw new Error("CONFLICT in some file")
      }
      // Listing conflicts also fails
      throw new Error("not a git repository")
    }
    const result = await invokeTool<{
      success: boolean
      conflicted: boolean
      conflictingFiles: string[]
    }>(createGitMergeTool(mockExec, "/fake"), { ref: "feature" })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.conflicted).toBe(true)
      expect(result.data?.conflictingFiles).toStrictEqual([])
    }
  })

  it("returns failure for non-conflict errors", async () => {
    const mockExec: GitExec = () => {
      throw new Error("fatal: not a git repository")
    }
    const result = await invokeTool(
      createGitMergeTool(mockExec, "/fake"),
      { ref: "main" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_MERGE_ERROR")
    }
  })
})

describe("git_merge_abort", () => {
  it("executes git merge --abort", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitMergeAbortTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    expect(commands[0]).toBe("merge --abort")
  })

  it("returns failure when no merge in progress", async () => {
    const mockExec: GitExec = () => {
      throw new Error("fatal: There is no merge to abort")
    }
    const result = await invokeTool(
      createGitMergeAbortTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_MERGE_ABORT_ERROR")
    }
  })
})

describe("git_rebase", () => {
  it("returns success with conflicted false on clean rebase", async () => {
    const mockExec: GitExec = () => "Successfully rebased"
    const result = await invokeTool<{
      success: boolean
      conflicted: boolean
    }>(createGitRebaseTool(mockExec, "/fake"), { ref: "main" })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.success).toBe(true)
      expect(result.data?.conflicted).toBe(false)
    }
  })

  it("detects conflicts and lists conflicting files", async () => {
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd.startsWith("rebase")) {
        throw new Error("CONFLICT (content): Merge conflict in src/app.ts")
      }
      if (cmd.includes("--diff-filter=U")) {
        return "src/app.ts"
      }
      return ""
    }
    const result = await invokeTool<{
      success: boolean
      conflicted: boolean
      conflictingFiles: string[]
    }>(createGitRebaseTool(mockExec, "/fake"), { ref: "main" })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.success).toBe(false)
      expect(result.data?.conflicted).toBe(true)
      expect(result.data?.conflictingFiles).toStrictEqual(["src/app.ts"])
    }
  })

  it("returns empty conflictingFiles when diff command also fails", async () => {
    const mockExec: GitExec = () => {
      throw new Error("conflict detected")
    }
    const result = await invokeTool<{
      success: boolean
      conflicted: boolean
      conflictingFiles: string[]
    }>(createGitRebaseTool(mockExec, "/fake"), { ref: "main" })
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.conflicted).toBe(true)
      expect(result.data?.conflictingFiles).toStrictEqual([])
    }
  })

  it("returns failure for non-conflict errors", async () => {
    const mockExec: GitExec = () => {
      throw new Error("fatal: not a git repository")
    }
    const result = await invokeTool(
      createGitRebaseTool(mockExec, "/fake"),
      { ref: "main" },
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_REBASE_ERROR")
    }
  })
})

describe("git_rebase_abort", () => {
  it("executes git rebase --abort", async () => {
    const commands: string[] = []
    const mockExec: GitExec = (args: string[]) => {
      commands.push(args.join(" "))
      return ""
    }
    const result = await invokeTool<{ success: boolean }>(
      createGitRebaseAbortTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    expect(commands[0]).toBe("rebase --abort")
  })

  it("returns failure when no rebase in progress", async () => {
    const mockExec: GitExec = () => {
      throw new Error("fatal: No rebase in progress")
    }
    const result = await invokeTool(
      createGitRebaseAbortTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_REBASE_ABORT_ERROR")
    }
  })
})

describe("git_conflict_files", () => {
  it("lists conflicting files", async () => {
    const mockExec: GitExec = () => "file1.ts\nfile2.ts\n"
    const result = await invokeTool<{ files: string[] }>(
      createGitConflictFilesTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.files).toStrictEqual(["file1.ts", "file2.ts"])
    }
  })

  it("returns empty array when no conflicts", async () => {
    const mockExec: GitExec = () => ""
    const result = await invokeTool<{ files: string[] }>(
      createGitConflictFilesTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.files).toStrictEqual([])
    }
  })

  it("returns failure on error", async () => {
    const mockExec: GitExec = () => {
      throw new Error("not a git repo")
    }
    const result = await invokeTool(
      createGitConflictFilesTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_CONFLICT_FILES_ERROR")
    }
  })
})

describe("git_commit_no_edit", () => {
  it("commits and returns short SHA", async () => {
    const mockExec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd === "commit --no-edit") return "merge commit created"
      if (cmd.includes("rev-parse --short")) return "abc1234"
      return ""
    }
    const result = await invokeTool<{ success: boolean; sha: string }>(
      createGitCommitNoEditTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.success).toBe(true)
      expect(result.data?.sha).toBe("abc1234")
    }
  })

  it("returns failure when nothing to commit", async () => {
    const mockExec: GitExec = () => {
      throw new Error("nothing to commit")
    }
    const result = await invokeTool(
      createGitCommitNoEditTool(mockExec, "/fake"),
      {},
    )
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("GIT_COMMIT_NO_EDIT_ERROR")
    }
  })
})
