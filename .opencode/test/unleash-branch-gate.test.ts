import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolResult } from "../lib/uf-workflow-types.js"
import {
  createUnleashBranchGateTool,
  type FileExists,
  type GitExec,
  type ProgressState,
  type UnleashBranchGateData,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The gate's auto-checkpoint (D5) persists through readState/writeState,
// which hit node:fs directly. Mocking the four functions that path uses
// (the uf-finale.test.ts precedent) keeps every gate test off the real
// filesystem: state I/O is observed through the recorded calls instead of
// performed. existsSync is mocked so tests can prove the gate probes
// existence only through the injected FileExists dependency, never through
// the default existsSync-backed checker.
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

/** Invoke the gate tool (no user parameters) and parse its JSON output. */
async function invokeGate(
  exec: GitExec,
  cwd: string,
  fileExists: FileExists,
): Promise<ToolResult<UnleashBranchGateData>> {
  const gate = createUnleashBranchGateTool(exec, cwd, fileExists)
  const result = await (
    gate as {
      execute: (
        args: Record<string, never>,
        ctx: { sessionID: string },
      ) => Promise<{ output: string }>
    }
  ).execute({}, { sessionID: "test-session" })
  return JSON.parse(result.output) as ToolResult<UnleashBranchGateData>
}

/** Fake GitExec answering the gate's single branch read with a canned branch. */
function branchExec(branch: string): GitExec {
  return (args: string[]) => {
    if (args.join(" ") === "rev-parse --abbrev-ref HEAD") return branch
    throw new Error(`unexpected git command: ${args.join(" ")}`)
  }
}

/**
 * Fake FileExists keyed on repo-relative paths resolved against FAKE_CWD.
 * Records every probed path so tests can assert the tool never escapes the
 * injected cwd.
 */
function fakeFileExists(existing: readonly string[]): { fileExists: FileExists; calls: string[] } {
  const existingPaths = new Set(existing.map((rel) => resolve(FAKE_CWD, rel)))
  const calls: string[] = []
  const fileExists: FileExists = (path: string) => {
    calls.push(path)
    return existingPaths.has(path)
  }
  return { fileExists, calls }
}

/** Node-shaped ENOENT error so readState/writeState treat a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
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
// uf_unleash_branch_gate — OpenSpec success
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate success (OpenSpec tier)", () => {
  it("returns the openspec payload and records the branch-safety-gate checkpoint", async () => {
    const { fileExists, calls } = fakeFileExists([
      "openspec/changes/unleash-deterministic-tools/tasks.md",
    ])
    const result = await invokeGate(
      branchExec("opsx/unleash-deterministic-tools"),
      FAKE_CWD,
      fileExists,
    )

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        branch: "opsx/unleash-deterministic-tools",
        workflow_tier: "openspec",
        feature_dir: "openspec/changes/unleash-deterministic-tools/",
        change_name: "unleash-deterministic-tools",
      })
    }

    // The prerequisite probe targets tasks.md under the feature dir.
    expect(calls).toEqual([
      resolve(FAKE_CWD, "openspec/changes/unleash-deterministic-tools/tasks.md"),
    ])

    // D5: the gate auto-checkpoints through the writeState path —
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
    expect(state.current_step).toBe("branch-safety-gate")
    expect(state.completed_steps).toEqual(["branch-safety-gate"])
    expect(state.data).toEqual({
      workflow_tier: "openspec",
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
    })

    expect(mkdirSync).toHaveBeenCalledTimes(1)
    const [mkdirPathArg, mkdirOptions] = vi.mocked(mkdirSync).mock.calls[0]
    expect(mkdirPathArg).toBe(resolve(FAKE_CWD, ".uf/progress/opsx-unleash-deterministic-tools"))
    expect(mkdirOptions).toMatchObject({ recursive: true, mode: 0o700 })
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_branch_gate — Speckit success
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate success (Speckit tier)", () => {
  it("derives feature_dir from the raw branch, strips the change-name prefix, and checkpoints", async () => {
    const { fileExists, calls } = fakeFileExists(["specs/018-unleash-command/spec.md"])
    const result = await invokeGate(branchExec("018-unleash-command"), FAKE_CWD, fileExists)

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        branch: "018-unleash-command",
        workflow_tier: "speckit",
        // D3: feature_dir keeps the numeric prefix (raw branch, the
        // common.sh convention); change_name strips it (classifyBranch).
        feature_dir: "specs/018-unleash-command/",
        change_name: "unleash-command",
      })
    }

    expect(calls).toEqual([resolve(FAKE_CWD, "specs/018-unleash-command/spec.md")])

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [statePathArg, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    expect(statePathArg).toBe(
      resolve(FAKE_CWD, ".uf/progress/018-unleash-command/uf.unleash.json"),
    )
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.current_step).toBe("branch-safety-gate")
    expect(state.completed_steps).toEqual(["branch-safety-gate"])
    expect(state.data).toEqual({
      workflow_tier: "speckit",
      feature_dir: "specs/018-unleash-command/",
    })
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_branch_gate — Quick success
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate success (Quick tier)", () => {
  it("classifies quick/<name> with no feature dir, no prerequisite probes, and checkpoints", async () => {
    const { fileExists, calls } = fakeFileExists([])
    const result = await invokeGate(branchExec("quick/fix-typo"), FAKE_CWD, fileExists)

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        branch: "quick/fix-typo",
        workflow_tier: "quick",
        // Quick changes carry no spec artifacts (D2): no feature dir, no
        // prerequisite file. The branch name alone carries the intent.
        feature_dir: "",
        change_name: "fix-typo",
      })
    }

    // No prerequisite probe — the quick tier has nothing to verify before
    // the pipeline starts.
    expect(calls).toEqual([])

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [statePathArg, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    expect(statePathArg).toBe(resolve(FAKE_CWD, ".uf/progress/quick-fix-typo/uf.unleash.json"))
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.current_step).toBe("branch-safety-gate")
    expect(state.completed_steps).toEqual(["branch-safety-gate"])
    expect(state.data).toEqual({
      workflow_tier: "quick",
      feature_dir: "",
    })
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_branch_gate — rejection envelopes
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate rejection envelopes", () => {
  it("rejects main with ON_MAIN and the exact command routing message", async () => {
    const { fileExists, calls } = fakeFileExists([])
    const result = await invokeGate(branchExec("main"), FAKE_CWD, fileExists)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("ON_MAIN")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "On main. /uf.unleash tier routing applies: gather the change description, apply the tier-routing rubric, and call `uf_unleash_route_decision` to select and start a workflow.",
      )
    }
    // Rejected before any filesystem probe.
    expect(calls).toEqual([])
  })

  it("rejects master with ON_MAIN and the exact command routing message", async () => {
    const { fileExists, calls } = fakeFileExists([])
    const result = await invokeGate(branchExec("master"), FAKE_CWD, fileExists)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("ON_MAIN")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "On main. /uf.unleash tier routing applies: gather the change description, apply the tier-routing rubric, and call `uf_unleash_route_decision` to select and start a workflow.",
      )
    }
    expect(calls).toEqual([])
  })

  it("rejects an opsx change without tasks.md with NO_TASKS and the interpolated STOP message", async () => {
    const { fileExists, calls } = fakeFileExists([])
    const result = await invokeGate(
      branchExec("opsx/unleash-deterministic-tools"),
      FAKE_CWD,
      fileExists,
    )

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("NO_TASKS")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "No tasks.md found for change `unleash-deterministic-tools`. Run `/opsx-propose` first.",
      )
    }
    expect(calls).toEqual([
      resolve(FAKE_CWD, "openspec/changes/unleash-deterministic-tools/tasks.md"),
    ])
  })

  it("rejects a speckit branch without spec.md with NO_SPEC, probing the raw-branch specs dir", async () => {
    const { fileExists, calls } = fakeFileExists([])
    const result = await invokeGate(branchExec("018-unleash-command"), FAKE_CWD, fileExists)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("NO_SPEC")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "No spec.md found in the feature directory. Run `/speckit.specify` first.",
      )
    }
    // The speckit feature dir derives from the RAW branch even on the
    // failure path — never from the prefix-stripped change name.
    expect(calls).toEqual([resolve(FAKE_CWD, "specs/018-unleash-command/spec.md")])
  })

  it("rejects unrecognized branches with UNRECOGNIZED_BRANCH and the exact command routing message", async () => {
    const { fileExists, calls } = fakeFileExists([])
    const result = await invokeGate(branchExec("feature/foo"), FAKE_CWD, fileExists)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("UNRECOGNIZED_BRANCH")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "Unrecognized branch pattern. /uf.unleash tier routing applies: gather the change description, apply the tier-routing rubric, and call `uf_unleash_route_decision` to select and start a workflow.",
      )
    }
    expect(calls).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_branch_gate — checkpoint recording semantics
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate checkpoint recording", () => {
  it("records no checkpoint on any rejection path", async () => {
    const { fileExists } = fakeFileExists([])
    for (const branch of ["main", "master", "opsx/missing-tasks", "018-missing-spec", "feature/foo"]) {
      const result = await invokeGate(branchExec(branch), FAKE_CWD, fileExists)
      expect(result.status).toBe("error")
    }
    // No state read, directory create, or state write happened for any
    // rejection — the gate only checkpoints on success (D5).
    expect(lstatSync).not.toHaveBeenCalled()
    expect(readFileSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("appends branch-safety-gate idempotently to existing checkpoint state", async () => {
    // Simulate a re-run: prior state exists with branch-safety-gate already
    // recorded plus a later step, and stale feature_dir data.
    const existing: ProgressState = {
      command: "uf.unleash",
      branch: "opsx-unleash-deterministic-tools",
      key: "opsx-unleash-deterministic-tools",
      current_step: "resumability-detection",
      completed_steps: ["branch-safety-gate", "resumability-detection"],
      data: { feature_dir: "openspec/changes/stale-dir/" },
      created_at: "2026-10-14T00:00:00.000Z",
      updated_at: "2026-10-14T00:00:00.000Z",
    }
    vi.mocked(lstatSync).mockImplementation(
      () => ({ isSymbolicLink: () => false }) as unknown as ReturnType<typeof lstatSync>,
    )
    vi.mocked(readFileSync).mockImplementation(() => JSON.stringify(existing))

    const { fileExists } = fakeFileExists(["openspec/changes/unleash-deterministic-tools/tasks.md"])
    const result = await invokeGate(
      branchExec("opsx/unleash-deterministic-tools"),
      FAKE_CWD,
      fileExists,
    )
    expect(result.status).toBe("ok")

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    const state = JSON.parse(stateRaw as string) as ProgressState
    // No duplicate append (FR-001 idempotency)...
    expect(state.completed_steps).toEqual(["branch-safety-gate", "resumability-detection"])
    expect(state.current_step).toBe("branch-safety-gate")
    // ...shallow data merge refreshes the tier/feature-dir (D3)...
    expect(state.data).toEqual({
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
      workflow_tier: "openspec",
    })
    // ...and created_at survives while updated_at is refreshed.
    expect(state.created_at).toBe("2026-10-14T00:00:00.000Z")
    expect(state.updated_at).not.toBe("2026-10-14T00:00:00.000Z")
  })

  it("fails closed with BRANCH_GATE_ERROR when the checkpoint cannot be written", async () => {
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error("EACCES: permission denied writing state file")
    })
    const { fileExists } = fakeFileExists(["openspec/changes/unleash-deterministic-tools/tasks.md"])
    const result = await invokeGate(
      branchExec("opsx/unleash-deterministic-tools"),
      FAKE_CWD,
      fileExists,
    )

    // recordAutoCheckpoint throws on state I/O failure so the gate never
    // reports success without a durable checkpoint (fail closed, D5).
    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("BRANCH_GATE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("EACCES: permission denied writing state file")
    }
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_branch_gate — unexpected-failure envelope
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate error envelope", () => {
  it("wraps unexpected git failures as BRANCH_GATE_ERROR", async () => {
    const exec: GitExec = () => {
      throw new Error("git executable not found")
    }
    const result = await invokeGate(exec, FAKE_CWD, fakeFileExists([]).fileExists)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("BRANCH_GATE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("git executable not found")
    }
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_branch_gate — injected-dependency isolation
// ---------------------------------------------------------------------------

describe("uf_unleash_branch_gate injected-dependency isolation", () => {
  it("confines git, existence, and state probes to the injected fakes under the fake cwd", async () => {
    const execCalls: Array<{ args: string[]; cwd: string }> = []
    const exec: GitExec = (args: string[], cwd: string) => {
      execCalls.push({ args, cwd })
      return "opsx/isolated-change"
    }
    const { fileExists, calls } = fakeFileExists(["openspec/changes/isolated-change/tasks.md"])

    const result = await invokeGate(exec, FAKE_CWD, fileExists)
    expect(result.status).toBe("ok")

    // Exactly one git invocation — the branch read — against the injected
    // cwd; no real git subprocess ever runs.
    expect(execCalls).toEqual([{ args: ["rev-parse", "--abbrev-ref", "HEAD"], cwd: FAKE_CWD }])

    // The existence probe resolves under the fake cwd only.
    expect(calls).toEqual([resolve(FAKE_CWD, "openspec/changes/isolated-change/tasks.md")])

    // The default existsSync-backed checker is never consulted — the
    // injected FileExists is the only existence probe.
    expect(existsSync).not.toHaveBeenCalled()

    // State I/O runs through the mocked node:fs surface and targets only
    // the fake progress store — no real path is ever touched.
    const stateIoPaths: string[] = [
      ...vi.mocked(lstatSync).mock.calls.map((call) => String(call[0])),
      ...vi.mocked(readFileSync).mock.calls.map((call) => String(call[0])),
      ...vi.mocked(mkdirSync).mock.calls.map((call) => String(call[0])),
      ...vi.mocked(writeFileSync).mock.calls.map((call) => String(call[0])),
    ]
    expect(stateIoPaths.length).toBeGreaterThan(0)
    for (const probed of stateIoPaths) {
      expect(probed.startsWith(FAKE_CWD + "/")).toBe(true)
    }
  })
})
