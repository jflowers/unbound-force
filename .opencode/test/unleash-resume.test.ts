import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolFailure, ToolResult } from "../lib/uf-workflow-types.js"
import {
  createGetProgressTool,
  createUnleashDetectResumeTool,
  type DetectResumeDependencies,
  type GitExec,
  type ProgressState,
  type UnleashDetectResumeData,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The tool's reconciliation read and auto-checkpoint (D4/D5) persist through
// readState/writeState, which hit node:fs directly. Mocking the functions
// that path uses (the unleash-branch-gate.test.ts recipe, per Dewey learning
// uf-workflow-testing-20261015T201843) keeps every resume test off the real
// filesystem: state I/O is observed through the recorded calls instead of
// performed. existsSync is mocked so tests can prove the feature-dir probes
// run only through the injected FileExists dependency, never through the
// default existsSync-backed checker. The feature-dir readers and dispatch
// store are injected separately (readText/fileExists/readDir), so
// node:fs/promises — a different specifier used only by the plugin
// registration — stays untouched.
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

/** OpenSpec branch and derived feature dir (the branch-gate payload shape). */
const BRANCH = "opsx/unleash-deterministic-tools"
const STATE_KEY = "opsx-unleash-deterministic-tools"
const FEATURE_DIR = "openspec/changes/unleash-deterministic-tools/"

/** Speckit branch and derived feature dir (raw-branch specs/ convention). */
const SPECKIT_BRANCH = "018-unleash-command"
const SPECKIT_FEATURE_DIR = "specs/018-unleash-command/"

/** Head SHAs: current HEAD, an ancestor commit, a stale pre-fix head, diverged. */
const HEAD_SHA = "cccccccccccccccccccccccccccccccccccccccc"
const ANCESTOR_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
const STALE_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
const DIVERGED_SHA = "dddddddddddddddddddddddddddddddddddddddd"

/** A branch the workflow never ran on (foreign-branch artifact filter). */
const FOREIGN_BRANCH = "opsx/unrelated-change"

/** Flat repo-global dispatch artifact store, resolved against the fake cwd. */
const STORE_DIR = resolve(FAKE_CWD, ".uf/artifacts/dispatch")

/** Distinct envelope write times for most-recent selection (epoch ms order). */
const EARLIER_TIMESTAMP = "2026-10-15T09:00:00.000Z"
const LATER_TIMESTAMP = "2026-10-15T10:00:00.000Z"

/** Feature-dir spec.md fixtures for the speckit clarify probe. */
const SPEC_WITH_CLARIFICATIONS = [
  "# Spec: example-change",
  "",
  "## Overview",
  "",
  "An overview paragraph.",
  "",
  "## Clarifications",
  "",
  "- Q: Which schema? -> A: JSON Schema (Dewey-resolved).",
].join("\n")

const SPEC_WITH_MARKER = [
  "# Spec: example-change",
  "",
  "## Overview",
  "",
  "- [NEEDS CLARIFICATION: which schema?](See the overview context.)",
  "",
  "## Clarifications",
  "",
  "- Q: Prior question -> A: Prior answer.",
].join("\n")

const SPEC_WITHOUT_CLARIFICATIONS = [
  "# Spec: example-change",
  "",
  "## Overview",
  "",
  "An overview paragraph.",
].join("\n")

/** Feature-dir tasks.md fixtures for the implement probe. */
const TASKS_WITH_OPEN_WORK = [
  "# Tasks: example-change",
  "",
  "## 1. Phase one",
  "",
  "- [x] 1.1 Completed task",
  "- [ ] 1.2 Open task",
  "  - [ ] 1.2.1 Indented open task",
  "- [x] 1.3 Completed task",
  "",
  "## 2. Phase two",
  "",
  "- [x] 2.1 Completed task",
].join("\n")

const TASKS_COMPLETE = [
  "# Tasks: example-change",
  "",
  "## 1. Phase one",
  "",
  "- [x] 1.1 Completed task",
  "- [x] 1.2 Completed task",
  "",
  "## 2. Phase two",
  "",
  "- [x] 2.1 Completed task",
].join("\n")

/** `git status --porcelain` fixtures for the spec-artifact dirty check. */
const PORCELAIN_TASKS_ONLY = `M  ${FEATURE_DIR}tasks.md`
const PORCELAIN_DESIGN_DIRTY = `M  ${FEATURE_DIR}design.md`
const PORCELAIN_RENAME_TO_TASKS = `R  ${FEATURE_DIR}tasks-old.md -> ${FEATURE_DIR}tasks.md`
const PORCELAIN_UNTRACKED_DIR = `?? ${FEATURE_DIR}scratch/`

// Git quotes non-ASCII paths and octal-escapes their bytes C-style; the
// decoder must recover the real path before the tasks.md exclusion match
// (otherwise the spec review reruns on a false-positive dirty check).
const NON_ASCII_FEATURE_DIR = "openspec/changes/caf\u00e9-change/"
const PORCELAIN_QUOTED_NON_ASCII_TASKS = 'M  "openspec/changes/caf\\303\\251-change/tasks.md"'
const PORCELAIN_QUOTED_RENAME_TO_TASKS = 'R  "openspec/changes/caf\\303\\251-change/tasks-old.md" -> "openspec/changes/caf\\303\\251-change/tasks.md"'

/** Node-shaped ENOENT error so state/deps readers treat a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

/** Invoke the detect tool with a session context and parse its JSON output. */
async function invokeDetectResume(
  exec: GitExec,
  deps: DetectResumeDependencies,
  args: Record<string, unknown>,
): Promise<ToolResult<UnleashDetectResumeData>> {
  const detect = createUnleashDetectResumeTool(exec, FAKE_CWD, deps)
  const result = await (
    detect as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string; messageID: string; directory: string; abort: AbortSignal },
      ) => Promise<{ output: string }>
    }
  ).execute(args, {
    sessionID: "test-session",
    messageID: "message-test",
    directory: FAKE_CWD,
    abort: new AbortController().signal,
  })
  return JSON.parse(result.output) as ToolResult<UnleashDetectResumeData>
}

/** Invoke get_progress for command uf.unleash (state-shape round-trip). */
async function invokeGetProgress(exec: GitExec): Promise<ToolResult<ProgressState>> {
  const progress = createGetProgressTool(exec, FAKE_CWD)
  const result = await (
    progress as {
      execute: (args: Record<string, unknown>, ctx: { sessionID: string }) => Promise<{ output: string }>
    }
  ).execute({ command: "uf.unleash" }, { sessionID: "test-session" })
  return JSON.parse(result.output) as ToolResult<ProgressState>
}

/** Assert an ok envelope and return its data payload (narrowing helper). */
function okData(result: ToolResult<UnleashDetectResumeData>): UnleashDetectResumeData {
  expect(result.status).toBe("ok")
  if (result.status !== "ok") {
    throw new Error(`expected ok envelope, received ${JSON.stringify(result)}`)
  }
  return result.data as UnleashDetectResumeData
}

/** Assert an error envelope and return it (narrowing helper). */
function errorEnvelope(result: ToolResult<UnleashDetectResumeData>): ToolFailure {
  expect(result.status).toBe("error")
  if (result.status !== "error") {
    throw new Error(`expected error envelope, received ${JSON.stringify(result)}`)
  }
  return result
}

interface FakeGitOptions {
  /** Branch reported by rev-parse --abbrev-ref HEAD (default BRANCH). */
  readonly branch?: string
  /** Head SHA reported by rev-parse HEAD (default HEAD_SHA). */
  readonly head?: string
  /** SHAs merge-base answers "diverged" for (thrown error with .status 1). */
  readonly divergedShas?: readonly string[]
  /** SHAs whose merge-base check fails with a genuine (status-less) error. */
  readonly failingShas?: readonly string[]
  /** `git status --porcelain` output for the feature-dir pathspec. */
  readonly porcelain?: string
}

/**
 * Fake GitExec covering every command the tool issues: the branch read
 * (rev-parse --abbrev-ref HEAD, called twice — branch filter and resolveKey),
 * the HEAD read, specs-mode ancestry (merge-base --is-ancestor: return value
 * = exit 0 ancestor-or-equal, thrown {status: 1} = diverged, plain thrown
 * Error = genuine git failure), and the spec-artifact dirty check
 * (status --porcelain). Every call is recorded.
 */
function fakeGit(options: FakeGitOptions = {}): {
  exec: GitExec
  calls: Array<{ args: string[]; cwd: string }>
} {
  const branch = options.branch ?? BRANCH
  const head = options.head ?? HEAD_SHA
  const diverged = new Set(options.divergedShas ?? [])
  const failing = new Set(options.failingShas ?? [])
  const calls: Array<{ args: string[]; cwd: string }> = []
  const exec: GitExec = (args: string[], cwd: string) => {
    calls.push({ args, cwd })
    const joined = args.join(" ")
    if (joined === "rev-parse --abbrev-ref HEAD") return branch
    if (joined === "rev-parse HEAD") return head
    if (args[0] === "merge-base" && args[1] === "--is-ancestor") {
      const sha = args[2] ?? ""
      if (failing.has(sha)) {
        throw new Error(`simulated git failure checking ancestry of ${sha}`)
      }
      if (diverged.has(sha)) {
        throw Object.assign(new Error(`merge-base: ${sha} is not an ancestor of ${head}`), { status: 1 })
      }
      return ""
    }
    if (args[0] === "status" && args[1] === "--porcelain") return options.porcelain ?? ""
    throw new Error(`unexpected git command: ${joined}`)
  }
  return { exec, calls }
}

/** Flatten recorded git calls to joined command strings. */
function gitCommands(calls: ReadonlyArray<{ args: string[] }>): string[] {
  return calls.map((call) => call.args.join(" "))
}

interface ArtifactOptions {
  /** Review mode: "specs" (spec review) or "code" (code review). */
  readonly mode: "specs" | "code"
  /** Branch the dispatch ran against (default BRANCH). */
  readonly branch?: string
  /** Head SHA the dispatch reviewed (payload.input_context.head_sha). */
  readonly headSha: string
  /** Recorded council verdict (payload.verdict). */
  readonly verdict: string
  /** Envelope write time; omitted when absent (sorts oldest). */
  readonly timestamp?: string
  /** Envelope artifact_type override (malformed-artifact fixtures). */
  readonly artifactType?: string
}

/** Render one review-dispatch artifact envelope with the decision fields. */
function artifactJson(options: ArtifactOptions): string {
  return JSON.stringify({
    artifact_type: options.artifactType ?? "review-dispatch",
    ...(options.timestamp !== undefined ? { timestamp: options.timestamp } : {}),
    context: { branch: options.branch ?? BRANCH },
    payload: {
      mode: options.mode,
      verdict: options.verdict,
      input_context: { head_sha: options.headSha },
    },
  })
}

interface FakeDepsOptions {
  /** Feature directory repo-relative (trailing slash optional). */
  readonly featureDir: string
  /** spec.md content; omit for absent. */
  readonly spec?: string
  /** plan.md existence (speckit tier probes it via fileExists). */
  readonly plan?: boolean
  /** tasks.md content; omit for absent. */
  readonly tasks?: string
  /**
   * Dispatch artifact store contents (file name → raw JSON). Omit for a
   * missing store (readDir rejects ENOENT — the first-run state); a null
   * value marks a file that is listed but unreadable (readText rejects).
   */
  readonly artifacts?: Record<string, string | null>
}

/**
 * Fake DetectResumeDependencies keyed on paths resolved against FAKE_CWD.
 * readText serves spec.md, tasks.md, and the dispatch store; fileExists
 * answers plan.md/tasks.md presence; readDir lists the flat store. Every
 * probe is recorded so tests can assert the tool never escapes the
 * injected cwd.
 */
function fakeDeps(options: FakeDepsOptions): {
  deps: DetectResumeDependencies
  readTextCalls: string[]
  fileExistsCalls: string[]
  readDirCalls: string[]
} {
  const featureDirAbs = resolve(FAKE_CWD, options.featureDir)
  const specPath = resolve(featureDirAbs, "spec.md")
  const planPath = resolve(featureDirAbs, "plan.md")
  const tasksPath = resolve(featureDirAbs, "tasks.md")
  const readTextCalls: string[] = []
  const fileExistsCalls: string[] = []
  const readDirCalls: string[] = []

  const deps: DetectResumeDependencies = {
    readText: async (path: string) => {
      readTextCalls.push(path)
      if (path === specPath && options.spec !== undefined) return options.spec
      if (path === tasksPath && options.tasks !== undefined) return options.tasks
      if (path.startsWith(STORE_DIR + "/")) {
        const name = path.slice(STORE_DIR.length + 1)
        const raw = options.artifacts?.[name]
        if (typeof raw !== "string") throw enoent(`read dispatch artifact ${name}`)
        return raw
      }
      throw enoent(`read ${path}`)
    },
    fileExists: (path: string) => {
      fileExistsCalls.push(path)
      if (path === planPath) return options.plan === true
      if (path === tasksPath) return options.tasks !== undefined
      return false
    },
    readDir: async (path: string) => {
      readDirCalls.push(path)
      if (path !== STORE_DIR || options.artifacts === undefined) {
        throw enoent(`read directory ${path}`)
      }
      return Object.keys(options.artifacts)
    },
  }
  return { deps, readTextCalls, fileExistsCalls, readDirCalls }
}

/** Progress-state file path for a command key (slug-sanitized branch). */
function stateFilePath(key: string = STATE_KEY): string {
  return resolve(FAKE_CWD, ".uf/progress", key, "uf.unleash.json")
}

/** Serve an existing state file through the mocked node:fs surface. */
function simulateExistingState(state: ProgressState, key: string = STATE_KEY): void {
  const fp = stateFilePath(key)
  vi.mocked(lstatSync).mockImplementation((pathArg: unknown) => {
    if (String(pathArg) === fp) {
      return { isSymbolicLink: () => false } as unknown as ReturnType<typeof lstatSync>
    }
    throw enoent(`lstat ${String(pathArg)}`)
  })
  vi.mocked(readFileSync).mockImplementation(() => JSON.stringify(state))
}

/** Prior uf.unleash state whose completed_steps claim the given reviews. */
function claimedReviewState(claimedSteps: readonly string[]): ProgressState {
  return {
    command: "uf.unleash",
    branch: STATE_KEY,
    key: STATE_KEY,
    current_step: claimedSteps[claimedSteps.length - 1] ?? "spec-review",
    completed_steps: ["branch-safety-gate", ...claimedSteps],
    data: {},
    created_at: "2026-10-14T00:00:00.000Z",
    updated_at: "2026-10-14T00:00:00.000Z",
  }
}

/** Every ProgressState written through the mocked writeFileSync surface. */
function writtenStates(): ProgressState[] {
  return vi.mocked(writeFileSync).mock.calls.map((call) => JSON.parse(String(call[1])) as ProgressState)
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
// uf_unleash_detect_resume — first-run over propose artifacts
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume first-run over propose artifacts", () => {
  it("forces steps 1-3 done for openspec and resumes at spec review when no reviews have run", async () => {
    const { exec, calls } = fakeGit()
    const { deps, readTextCalls, fileExistsCalls, readDirCalls } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_WITH_OPEN_WORK,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses).toStrictEqual({
      clarify: true,
      plan: true,
      tasks: true,
      spec_review: false,
      implement: false,
      code_review: false,
    })
    expect(data.resume_from).toBe("spec_review")
    expect(data.all_complete).toBe(false)
    expect(data.unchecked_count).toBe(1)
    expect(data.checkpoint_claims).toStrictEqual({ spec_review: false, code_review: false })

    // No dispatch store exists yet — the probe still ran and fail-opened to
    // an empty candidate list.
    expect(readDirCalls).toEqual([STORE_DIR])

    // OpenSpec forces checks 1-3: plan/tasks existence is never probed and
    // spec.md is never read (only tasks.md, for the implement probe).
    expect(fileExistsCalls).toEqual([])
    expect(readTextCalls).toEqual([resolve(FAKE_CWD, FEATURE_DIR, "tasks.md")])

    // Laziness (D4): without an approving artifact there is no ancestry or
    // dirtiness probe — only the two branch reads (branch filter +
    // resolveKey) and the HEAD read.
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "rev-parse HEAD",
      "rev-parse --abbrev-ref HEAD",
    ])

    // D5: the successful detection auto-checkpoints (shape asserted fully
    // in the checkpoint-state describe).
    const states = writtenStates()
    expect(states).toHaveLength(1)
    expect(states[0]?.current_step).toBe("resumability-detection")
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — all-complete routing
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume all-complete routing", () => {
  it("routes to retrospective when every task is checked and both review modes have fresh approving artifacts", async () => {
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        // Specs freshness accepts an ancestor head SHA (implementation
        // commits advanced HEAD past the reviewed spec state).
        "specs-approve.json": artifactJson({
          mode: "specs",
          headSha: ANCESTOR_SHA,
          verdict: "APPROVE",
          timestamp: LATER_TIMESTAMP,
        }),
        // Code freshness requires the exact current head; APPROVE WITH
        // ADVISORIES counts as approving (D4).
        "code-approve.json": artifactJson({
          mode: "code",
          headSha: HEAD_SHA,
          verdict: "APPROVE WITH ADVISORIES",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses).toStrictEqual({
      clarify: true,
      plan: true,
      tasks: true,
      spec_review: true,
      implement: true,
      code_review: true,
    })
    expect(data.all_complete).toBe(true)
    expect(data.resume_from).toBe(null)
    expect(data.unchecked_count).toBe(0)

    // The specs rule consulted merge-base and the dirty check; code mode is
    // a pure head-SHA string compare; resolveKey re-reads the branch for
    // the checkpoint key.
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "rev-parse HEAD",
      `merge-base --is-ancestor ${ANCESTOR_SHA} ${HEAD_SHA}`,
      `status --porcelain -- ${FEATURE_DIR}`,
      "rev-parse --abbrev-ref HEAD",
    ])
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — cleared-checkpoint artifact state
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume cleared-checkpoint artifact state", () => {
  it("derives the same artifact-based statuses with no state file and with a state file claiming both reviews", async () => {
    const runScenario = async (): Promise<UnleashDetectResumeData> => {
      const { exec } = fakeGit()
      const { deps } = fakeDeps({
        featureDir: FEATURE_DIR,
        tasks: TASKS_COMPLETE,
        artifacts: {
          "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
          "code-approve.json": artifactJson({ mode: "code", headSha: HEAD_SHA, verdict: "APPROVE" }),
        },
      })
      const result = await invokeDetectResume(exec, deps, {
        feature_dir: FEATURE_DIR,
        workflow_tier: "openspec",
      })
      return okData(result)
    }

    // Run A: no state file at all (a cleared checkpoint store).
    const cleared = await runScenario()
    expect(cleared.all_complete).toBe(true)
    expect(cleared.resume_from).toBe(null)
    expect(cleared.checkpoint_claims).toStrictEqual({ spec_review: false, code_review: false })

    // Run B: a state file claims both review steps complete. The
    // artifact-derived statuses are identical — artifacts are authoritative
    // whether or not checkpoint state exists (D4).
    simulateExistingState(claimedReviewState(["spec-review", "code-review"]))
    const claimed = await runScenario()
    expect(claimed.step_statuses).toStrictEqual(cleared.step_statuses)
    expect(claimed.all_complete).toBe(true)
    expect(claimed.resume_from).toBe(null)
    expect(claimed.checkpoint_claims).toStrictEqual({ spec_review: true, code_review: true })

    // The claims survive the run: the auto-checkpoint appends
    // resumability-detection after the claimed steps without dropping them.
    const states = writtenStates()
    expect(states.at(-1)?.completed_steps).toEqual([
      "branch-safety-gate",
      "spec-review",
      "code-review",
      "resumability-detection",
    ])
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — spec_review ancestor acceptance
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume spec_review ancestor acceptance", () => {
  it("accepts an approving specs artifact at an ancestor head SHA when the spec artifacts are clean", async () => {
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.spec_review).toBe(true)
    const mergeBaseCalls = calls.filter((call) => call.args[0] === "merge-base")
    expect(mergeBaseCalls).toEqual([
      { args: ["merge-base", "--is-ancestor", ANCESTOR_SHA, HEAD_SHA], cwd: FAKE_CWD },
    ])
    const statusCalls = calls.filter((call) => call.args[0] === "status")
    expect(statusCalls).toEqual([{ args: ["status", "--porcelain", "--", FEATURE_DIR], cwd: FAKE_CWD }])
  })

  it("accepts an approving specs artifact whose head SHA equals HEAD without consulting merge-base", async () => {
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.spec_review).toBe(true)
    // sha === head short-circuits the subprocess: equality is
    // ancestor-or-equal by definition.
    expect(gitCommands(calls)).not.toContain(`merge-base --is-ancestor ${HEAD_SHA} ${HEAD_SHA}`)
  })

  it("excludes feature-dir tasks.md checkbox edits from the spec-artifact dirty check", async () => {
    const { exec } = fakeGit({ porcelain: PORCELAIN_TASKS_ONLY })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // Implementation bookkeeping (checkbox edits) is not a spec change (D4).
    expect(okData(result).step_statuses.spec_review).toBe(true)
  })

  it("excludes a rename whose tree path is the feature tasks.md (porcelain new-path parsing)", async () => {
    const { exec } = fakeGit({ porcelain: PORCELAIN_RENAME_TO_TASKS })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // Porcelain renames report "XY <old> -> <new>"; the new path is the one
    // in the tree, and here it is the excluded tasks.md.
    expect(okData(result).step_statuses.spec_review).toBe(true)
  })

  it("decodes octal-escaped quoted porcelain paths before the tasks.md exclusion match", async () => {
    const { exec } = fakeGit({ porcelain: PORCELAIN_QUOTED_NON_ASCII_TASKS })
    const { deps } = fakeDeps({
      featureDir: NON_ASCII_FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: NON_ASCII_FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // Git quotes non-ASCII paths with C-style octal byte escapes; without
    // decoding, the exclusion match fails and the spec review reruns on a
    // checkbox edit (false-positive dirty).
    expect(okData(result).step_statuses.spec_review).toBe(true)
  })

  it("decodes quoted rename new-paths with escaped characters", async () => {
    const { exec } = fakeGit({ porcelain: PORCELAIN_QUOTED_RENAME_TO_TASKS })
    const { deps } = fakeDeps({
      featureDir: NON_ASCII_FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: NON_ASCII_FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // A rename whose quoted new-path decodes to the feature tasks.md is an
    // excluded checkbox edit, not a spec-artifact change.
    expect(okData(result).step_statuses.spec_review).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — spec_review rerun triggers (artifacts
// authoritative over checkpoint claims)
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume spec_review rerun triggers", () => {
  it("reruns when no specs artifact exists for the branch, even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["spec-review"]))
    const { exec } = fakeGit()
    // A code-mode artifact cannot satisfy the spec review (mode filter).
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-approve.json": artifactJson({ mode: "code", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.spec_review).toBe(false)
    expect(data.step_statuses.code_review).toBe(true)
    expect(data.checkpoint_claims.spec_review).toBe(true)
  })

  it("reruns on a non-approving verdict without consulting ancestry or dirtiness", async () => {
    simulateExistingState(claimedReviewState(["spec-review"]))
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-reject.json": artifactJson({
          mode: "specs",
          headSha: ANCESTOR_SHA,
          verdict: "REQUEST CHANGES",
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.spec_review).toBe(false)
    expect(data.checkpoint_claims.spec_review).toBe(true)
    // Laziness (D4): the verdict gate runs before any ancestry or dirty
    // probe, so a rejection costs no extra git calls.
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "rev-parse HEAD",
      "rev-parse --abbrev-ref HEAD",
    ])
  })

  it("reruns on a foreign-branch artifact even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["spec-review"]))
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-foreign.json": artifactJson({
          mode: "specs",
          branch: FOREIGN_BRANCH,
          headSha: ANCESTOR_SHA,
          verdict: "APPROVE",
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.spec_review).toBe(false)
    expect(data.checkpoint_claims.spec_review).toBe(true)
    // Foreign-branch artifacts are filtered before recency; with no
    // current-branch candidate the ancestry probe never runs.
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "rev-parse HEAD",
      "rev-parse --abbrev-ref HEAD",
    ])
  })

  it("reruns on uncommitted spec-artifact modifications even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["spec-review"]))
    const { exec, calls } = fakeGit({ porcelain: PORCELAIN_DESIGN_DIRTY })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.spec_review).toBe(false)
    expect(data.checkpoint_claims.spec_review).toBe(true)
    // The dirty check ran against the feature-dir pathspec.
    expect(gitCommands(calls)).toContain(`status --porcelain -- ${FEATURE_DIR}`)
  })

  it("reruns when an untracked directory appears under the feature dir", async () => {
    simulateExistingState(claimedReviewState(["spec-review"]))
    const { exec } = fakeGit({ porcelain: PORCELAIN_UNTRACKED_DIR })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // Untracked dirs collapse to "?? dir/" and count as dirty.
    expect(okData(result).step_statuses.spec_review).toBe(false)
  })

  it("reruns on a diverged head SHA (merge-base exit 1) even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["spec-review"]))
    const { exec, calls } = fakeGit({ divergedShas: [DIVERGED_SHA] })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: DIVERGED_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.spec_review).toBe(false)
    expect(data.checkpoint_claims.spec_review).toBe(true)
    // Exit 1 is git's "no" answer, not a failure: the artifact is ignored
    // and the && chain short-circuits before the dirty check.
    expect(gitCommands(calls)).toContain(`merge-base --is-ancestor ${DIVERGED_SHA} ${HEAD_SHA}`)
    expect(gitCommands(calls)).not.toContain(`status --porcelain -- ${FEATURE_DIR}`)
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — code_review derivation
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume code_review derivation", () => {
  it("accepts an approving code artifact whose head SHA equals the current HEAD via string comparison", async () => {
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-approve.json": artifactJson({ mode: "code", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.code_review).toBe(true)
    // Code-mode freshness is a pure string compare — no merge-base, ever.
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "rev-parse HEAD",
      "rev-parse --abbrev-ref HEAD",
    ])
  })

  it("ignores spec-artifact dirtiness for code-mode freshness", async () => {
    const { exec, calls } = fakeGit({ porcelain: PORCELAIN_DESIGN_DIRTY })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-approve.json": artifactJson({ mode: "code", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.code_review).toBe(true)
    // The dirty check belongs to the specs rule only; code mode never
    // consults porcelain.
    expect(gitCommands(calls)).not.toContain(`status --porcelain -- ${FEATURE_DIR}`)
  })

  it("reruns when no code artifact exists for the branch, even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["code-review"]))
    const { exec } = fakeGit()
    // A specs-mode artifact cannot satisfy the code review (mode filter).
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.code_review).toBe(false)
    expect(data.step_statuses.spec_review).toBe(true)
    expect(data.checkpoint_claims.code_review).toBe(true)
  })

  it("reruns on a non-approving code verdict even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["code-review"]))
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-reject.json": artifactJson({ mode: "code", headSha: HEAD_SHA, verdict: "REQUEST CHANGES" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.code_review).toBe(false)
    expect(data.checkpoint_claims.code_review).toBe(true)
  })

  it("reruns on a foreign-branch code artifact even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["code-review"]))
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-foreign.json": artifactJson({
          mode: "code",
          branch: FOREIGN_BRANCH,
          headSha: HEAD_SHA,
          verdict: "APPROVE",
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.code_review).toBe(false)
    expect(data.checkpoint_claims.code_review).toBe(true)
  })

  it("reruns on a head SHA mismatch even though the checkpoint claims completion", async () => {
    simulateExistingState(claimedReviewState(["code-review"]))
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        // The review covered an earlier head; the code under review is not
        // the code being merged.
        "code-stale.json": artifactJson({ mode: "code", headSha: STALE_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.code_review).toBe(false)
    expect(data.checkpoint_claims.code_review).toBe(true)
    // Even a mismatch is a string compare — merge-base is never consulted
    // for code mode.
    expect(gitCommands(calls)).not.toContain(`merge-base --is-ancestor ${STALE_SHA} ${HEAD_SHA}`)
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — most-recent artifact selection
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume most-recent artifact selection", () => {
  it("lets a newer REQUEST CHANGES specs artifact shadow an older approval (rerun)", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-older-approve.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "APPROVE",
          timestamp: EARLIER_TIMESTAMP,
        }),
        "specs-newer-reject.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.spec_review).toBe(false)
  })

  it("lets a newer approving specs artifact shadow an older REQUEST CHANGES (done)", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-older-reject.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: EARLIER_TIMESTAMP,
        }),
        "specs-newer-approve.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "APPROVE",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.spec_review).toBe(true)
  })

  it("applies the same shadowing to code artifacts (newer rejection wins)", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-older-approve.json": artifactJson({
          mode: "code",
          headSha: HEAD_SHA,
          verdict: "APPROVE",
          timestamp: EARLIER_TIMESTAMP,
        }),
        "code-newer-reject.json": artifactJson({
          mode: "code",
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.code_review).toBe(false)
  })

  it("applies the same shadowing to code artifacts (newer approval wins)", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "code-older-reject.json": artifactJson({
          mode: "code",
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: EARLIER_TIMESTAMP,
        }),
        "code-newer-approve.json": artifactJson({
          mode: "code",
          headSha: HEAD_SHA,
          verdict: "APPROVE",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.code_review).toBe(true)
  })

  it("breaks timestamp ties by file name", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        // Same write time: the greater file name wins deterministically
        // regardless of directory order.
        "a-shadow.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: LATER_TIMESTAMP,
        }),
        "b-winner.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "APPROVE",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.spec_review).toBe(true)
  })

  it("sorts an artifact with a missing timestamp oldest", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        // A missing timestamp falls back to epoch 0 — still a valid
        // candidate, but never the most recent one.
        "specs-untimestamped.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
        "specs-timestamped.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    expect(okData(result).step_statuses.spec_review).toBe(false)
  })

  it("ignores foreign-branch artifacts when selecting the most recent (branch filtered before recency)", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-current-approve.json": artifactJson({
          mode: "specs",
          headSha: HEAD_SHA,
          verdict: "APPROVE",
          timestamp: EARLIER_TIMESTAMP,
        }),
        "specs-foreign-reject.json": artifactJson({
          mode: "specs",
          branch: FOREIGN_BRANCH,
          headSha: HEAD_SHA,
          verdict: "REQUEST CHANGES",
          timestamp: LATER_TIMESTAMP,
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // A newer foreign-branch rejection cannot shadow an older
    // current-branch approval.
    expect(okData(result).step_statuses.spec_review).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — unchecked-box counting
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume unchecked-box counting", () => {
  it("counts only top-level unchecked boxes and blocks implement", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_WITH_OPEN_WORK,
      artifacts: {
        // Spec review done so the first incomplete step is implement.
        "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.implement).toBe(false)
    // Only the top-level `- [ ] 1.2` line counts: the indented 1.2.1 box is
    // continuation detail under the same shared grammar parse_tasks uses.
    expect(data.unchecked_count).toBe(1)
    expect(data.resume_from).toBe("implement")
    expect(data.all_complete).toBe(false)
  })

  it("marks implement done at zero unchecked boxes", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.implement).toBe(true)
    expect(data.unchecked_count).toBe(0)
    // The code review has not run yet — routing lands there next.
    expect(data.resume_from).toBe("code_review")
  })

  it("counts unchecked boxes in CRLF tasks.md the same as LF", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      // CRLF lines must survive the trailing-\r strip: without it every
      // checkbox line fails the task pattern and the count silently
      // reports zero open tasks (implement reported complete).
      tasks: TASKS_WITH_OPEN_WORK.split("\n").join("\r\n"),
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.implement).toBe(false)
    expect(data.unchecked_count).toBe(1)
    expect(data.resume_from).toBe("implement")
  })

  it("marks implement done at zero unchecked boxes in CRLF tasks.md", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE.split("\n").join("\r\n"),
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: HEAD_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.implement).toBe(true)
    expect(data.unchecked_count).toBe(0)
    expect(data.resume_from).toBe("code_review")
  })

  it("reports implement not done with a null count when tasks.md is missing", async () => {
    const { exec } = fakeGit()
    const { deps, readTextCalls } = fakeDeps({ featureDir: FEATURE_DIR })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.implement).toBe(false)
    expect(data.unchecked_count).toBe(null)
    expect(data.resume_from).toBe("spec_review")
    // The tasks.md read was attempted (and fail-opened).
    expect(readTextCalls).toContain(resolve(FAKE_CWD, FEATURE_DIR, "tasks.md"))
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — OpenSpec forced-done
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume OpenSpec forced-done", () => {
  it("forces clarify, plan, and tasks done without probing the feature directory", async () => {
    const { exec } = fakeGit()
    // No spec.md, no plan.md — /opsx-propose artifacts are presumed present
    // by construction, so the probes must not run at all.
    const { deps, readTextCalls, fileExistsCalls, readDirCalls } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_WITH_OPEN_WORK,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.clarify).toBe(true)
    expect(data.step_statuses.plan).toBe(true)
    expect(data.step_statuses.tasks).toBe(true)
    // plan.md/tasks.md existence is never probed and spec.md is never
    // read; the only feature-dir read is tasks.md (implement probe).
    expect(fileExistsCalls).toEqual([])
    expect(readTextCalls).toEqual([resolve(FAKE_CWD, FEATURE_DIR, "tasks.md")])
    expect(readDirCalls).toEqual([STORE_DIR])
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — Speckit clarify/plan/tasks semantics
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume Speckit clarify/plan/tasks semantics", () => {
  it("reports clarify not done when a NEEDS CLARIFICATION marker is present even with a Clarifications section and plan.md", async () => {
    const { exec } = fakeGit({ branch: SPECKIT_BRANCH })
    const { deps } = fakeDeps({
      featureDir: SPECKIT_FEATURE_DIR,
      spec: SPEC_WITH_MARKER,
      plan: true,
      tasks: TASKS_COMPLETE,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: SPECKIT_FEATURE_DIR,
      workflow_tier: "speckit",
    })

    const data = okData(result)
    expect(data.step_statuses.clarify).toBe(false)
    expect(data.step_statuses.plan).toBe(true)
    expect(data.step_statuses.tasks).toBe(true)
    expect(data.resume_from).toBe("clarify")
  })

  it("accepts a ## Clarifications section as clarification evidence without plan.md", async () => {
    const { exec } = fakeGit({ branch: SPECKIT_BRANCH })
    const { deps } = fakeDeps({
      featureDir: SPECKIT_FEATURE_DIR,
      spec: SPEC_WITH_CLARIFICATIONS,
      plan: false,
      tasks: TASKS_COMPLETE,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: SPECKIT_FEATURE_DIR,
      workflow_tier: "speckit",
    })

    const data = okData(result)
    expect(data.step_statuses.clarify).toBe(true)
    expect(data.step_statuses.plan).toBe(false)
    expect(data.step_statuses.tasks).toBe(true)
    expect(data.step_statuses.implement).toBe(true)
    expect(data.resume_from).toBe("plan")
  })

  it("accepts plan.md presence as clarification evidence without a Clarifications section", async () => {
    const { exec } = fakeGit({ branch: SPECKIT_BRANCH })
    const { deps } = fakeDeps({
      featureDir: SPECKIT_FEATURE_DIR,
      spec: SPEC_WITHOUT_CLARIFICATIONS,
      plan: true,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: SPECKIT_FEATURE_DIR,
      workflow_tier: "speckit",
    })

    const data = okData(result)
    expect(data.step_statuses.clarify).toBe(true)
    expect(data.step_statuses.plan).toBe(true)
    // tasks.md is absent: the tasks step is the first incomplete one.
    expect(data.step_statuses.tasks).toBe(false)
    expect(data.unchecked_count).toBe(null)
    expect(data.resume_from).toBe("tasks")
  })

  it("reports clarify not done with no marker, no Clarifications section, and no plan.md", async () => {
    const { exec } = fakeGit({ branch: SPECKIT_BRANCH })
    const { deps } = fakeDeps({
      featureDir: SPECKIT_FEATURE_DIR,
      spec: SPEC_WITHOUT_CLARIFICATIONS,
      plan: false,
      tasks: TASKS_COMPLETE,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: SPECKIT_FEATURE_DIR,
      workflow_tier: "speckit",
    })

    const data = okData(result)
    expect(data.step_statuses.clarify).toBe(false)
    expect(data.resume_from).toBe("clarify")
  })

  it("reports clarify not done when spec.md is missing", async () => {
    const { exec } = fakeGit({ branch: SPECKIT_BRANCH })
    const { deps, readTextCalls } = fakeDeps({
      featureDir: SPECKIT_FEATURE_DIR,
      plan: true,
      tasks: TASKS_COMPLETE,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: SPECKIT_FEATURE_DIR,
      workflow_tier: "speckit",
    })

    const data = okData(result)
    expect(data.step_statuses.clarify).toBe(false)
    expect(data.step_statuses.plan).toBe(true)
    expect(data.resume_from).toBe("clarify")
    // The spec.md read was attempted (and fail-opened to not-done).
    expect(readTextCalls).toContain(resolve(FAKE_CWD, SPECKIT_FEATURE_DIR, "spec.md"))
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — checkpoint state compatibility with get_progress
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume checkpoint state compatibility", () => {
  it("auto-checkpoints resumability-detection as a ProgressState that get_progress round-trips", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_WITH_OPEN_WORK,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })
    expect(okData(result).resume_from).toBe("spec_review")

    // D5: the checkpoint lands at .uf/progress/<branch-slug>/uf.unleash.json
    // with a restrictive 0o600 file mode inside a 0o700 directory.
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [statePathArg, stateRaw, writeOptions] = vi.mocked(writeFileSync).mock.calls[0]
    expect(statePathArg).toBe(stateFilePath())
    expect(writeOptions).toMatchObject({ mode: 0o600 })
    expect(mkdirSync).toHaveBeenCalledTimes(1)
    const [mkdirPathArg, mkdirOptions] = vi.mocked(mkdirSync).mock.calls[0]
    expect(mkdirPathArg).toBe(resolve(FAKE_CWD, ".uf/progress", STATE_KEY))
    expect(mkdirOptions).toMatchObject({ recursive: true, mode: 0o700 })

    const written = JSON.parse(String(stateRaw)) as ProgressState
    expect(written).toStrictEqual({
      command: "uf.unleash",
      branch: STATE_KEY,
      key: STATE_KEY,
      current_step: "resumability-detection",
      completed_steps: ["resumability-detection"],
      data: {
        workflow_tier: "openspec",
        feature_dir: FEATURE_DIR,
        resume_from: "spec_review",
        all_complete: false,
      },
      created_at: expect.any(String),
      updated_at: expect.any(String),
    })

    // State-shape compatibility: serve the written file back through the
    // mocked node:fs surface and read it with the real get_progress tool —
    // the same readState path the command's resume probe uses.
    simulateExistingState(written)
    const progressResult = await invokeGetProgress(exec)
    expect(progressResult.status).toBe("ok")
    if (progressResult.status === "ok") {
      expect(progressResult.data).toStrictEqual(written)
    }
  })

  it("appends resumability-detection idempotently to existing state and refreshes stale data", async () => {
    const existing: ProgressState = {
      command: "uf.unleash",
      branch: STATE_KEY,
      key: STATE_KEY,
      current_step: "spec-review",
      completed_steps: ["branch-safety-gate", "spec-review"],
      data: { feature_dir: "openspec/changes/stale-dir/" },
      created_at: "2026-10-14T00:00:00.000Z",
      updated_at: "2026-10-14T00:00:00.000Z",
    }
    simulateExistingState(existing)

    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_WITH_OPEN_WORK,
    })
    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })
    expect(okData(result).checkpoint_claims.spec_review).toBe(true)

    const states = writtenStates()
    expect(states).toHaveLength(1)
    const state = states[0]
    // No duplicate append (FR-001 idempotency)...
    expect(state.completed_steps).toEqual(["branch-safety-gate", "spec-review", "resumability-detection"])
    expect(state.current_step).toBe("resumability-detection")
    // ...the shallow data merge refreshes the feature dir (D3)...
    expect(state.data).toStrictEqual({
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
      resume_from: "spec_review",
      all_complete: false,
    })
    // ...and created_at survives while updated_at is refreshed.
    expect(state.created_at).toBe("2026-10-14T00:00:00.000Z")
    expect(state.updated_at).not.toBe("2026-10-14T00:00:00.000Z")
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — malformed dispatch artifacts
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume malformed dispatch artifacts", () => {
  it("skips malformed, wrong-type, incomplete, and unreadable artifacts — fail-open to not-done", async () => {
    const { exec } = fakeGit()
    const { deps, readTextCalls } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        // Invalid JSON — the parse guard rejects it.
        "not-json.json": "{{{ not json",
        // A foreign artifact type in the same store.
        "wrong-type.json": JSON.stringify({
          artifact_type: "unleash-summary",
          context: { branch: BRANCH },
          payload: {},
        }),
        // review-dispatch shape without payload.input_context.
        "missing-fields.json": JSON.stringify({
          artifact_type: "review-dispatch",
          context: { branch: BRANCH },
          payload: { mode: "specs", verdict: "APPROVE" },
        }),
        // Listed but unreadable — the I/O guard skips it.
        "unreadable.json": null,
        // Non-JSON file names are filtered before any read is attempted.
        "notes.txt": "not a dispatch artifact",
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const data = okData(result)
    expect(data.step_statuses.spec_review).toBe(false)
    expect(data.step_statuses.code_review).toBe(false)
    // The non-.json entry was never read.
    expect(readTextCalls).not.toContain(resolve(STORE_DIR, "notes.txt"))
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — input validation
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume input validation", () => {
  it("rejects feature_dir escaping the repo root with FEATURE_DIR_TRAVERSAL before any probe", async () => {
    const { exec, calls } = fakeGit()
    const { deps, readTextCalls, fileExistsCalls, readDirCalls } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
    })

    for (const featureDir of ["../outside", "/etc/passwd"]) {
      const result = await invokeDetectResume(exec, deps, {
        feature_dir: featureDir,
        workflow_tier: "openspec",
      })
      const envelope = errorEnvelope(result)
      expect(envelope.code).toBe("FEATURE_DIR_TRAVERSAL")
      expect(envelope.retryable).toBe(false)
      expect(envelope.message).toBe(
        "Path traversal blocked: feature_dir resolves outside the repository root",
      )
    }

    // Rejected before any git call, dependency probe, or state I/O.
    expect(calls).toEqual([])
    expect(readTextCalls).toEqual([])
    expect(fileExistsCalls).toEqual([])
    expect(readDirCalls).toEqual([])
    expect(lstatSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("rejects an unknown workflow_tier with INVALID_INPUT", async () => {
    const { exec, calls } = fakeGit()
    const { deps } = fakeDeps({ featureDir: FEATURE_DIR, tasks: TASKS_COMPLETE })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "enterprise",
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("INVALID_INPUT")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toContain("workflow_tier")
    expect(calls).toEqual([])
  })

  it("rejects an empty feature_dir with INVALID_INPUT", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({ featureDir: FEATURE_DIR, tasks: TASKS_COMPLETE })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: "",
      workflow_tier: "openspec",
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("INVALID_INPUT")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toContain("feature_dir")
  })

  it("rejects unknown input keys with INVALID_INPUT (strict schema)", async () => {
    const { exec } = fakeGit()
    const { deps } = fakeDeps({ featureDir: FEATURE_DIR, tasks: TASKS_COMPLETE })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
      extra: "not part of the contract",
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("INVALID_INPUT")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toContain("extra")
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — fail-closed error envelope
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume fail-closed error envelope", () => {
  it("wraps a genuine merge-base failure as RESUME_DETECT_ERROR", async () => {
    // A plain thrown Error (no exit status) is a real git failure, not
    // git's exit-1 "no" answer — the tool must fail closed.
    const { exec } = fakeGit({ failingShas: [ANCESTOR_SHA] })
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({ mode: "specs", headSha: ANCESTOR_SHA, verdict: "APPROVE" }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("RESUME_DETECT_ERROR")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toContain("simulated git failure checking ancestry")
  })

  it("wraps a non-ENOENT dispatch-store listing failure as RESUME_DETECT_ERROR", async () => {
    const { exec } = fakeGit()
    const deps: DetectResumeDependencies = {
      readText: () => Promise.reject(enoent("read feature file")),
      fileExists: () => false,
      readDir: () =>
        Promise.reject(
          Object.assign(new Error("EACCES: permission denied reading dispatch store"), { code: "EACCES" }),
        ),
    }

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("RESUME_DETECT_ERROR")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toBe("EACCES: permission denied reading dispatch store")
  })

  it("fails closed with RESUME_DETECT_ERROR when the auto-checkpoint cannot be written", async () => {
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error("EACCES: permission denied writing state file")
    })
    const { exec } = fakeGit()
    const { deps } = fakeDeps({
      featureDir: FEATURE_DIR,
      tasks: TASKS_COMPLETE,
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: FEATURE_DIR,
      workflow_tier: "openspec",
    })

    // recordAutoCheckpoint throws on state I/O failure so the tool never
    // reports a successful detection without a durable checkpoint (D5).
    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("RESUME_DETECT_ERROR")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toBe("EACCES: permission denied writing state file")
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume — injected-dependency isolation
// ---------------------------------------------------------------------------

describe("uf_unleash_detect_resume injected-dependency isolation", () => {
  it("confines git, filesystem, and state probes to the injected fakes under the fake cwd", async () => {
    const { exec, calls } = fakeGit({ branch: SPECKIT_BRANCH })
    const featureDirAbs = resolve(FAKE_CWD, SPECKIT_FEATURE_DIR)
    const { deps, readTextCalls, fileExistsCalls, readDirCalls } = fakeDeps({
      featureDir: SPECKIT_FEATURE_DIR,
      spec: SPEC_WITHOUT_CLARIFICATIONS,
      plan: true,
      tasks: TASKS_COMPLETE,
      artifacts: {
        "specs-approve.json": artifactJson({
          mode: "specs",
          branch: SPECKIT_BRANCH,
          headSha: ANCESTOR_SHA,
          verdict: "APPROVE",
        }),
        "code-approve.json": artifactJson({
          mode: "code",
          branch: SPECKIT_BRANCH,
          headSha: HEAD_SHA,
          verdict: "APPROVE",
        }),
      },
    })

    const result = await invokeDetectResume(exec, deps, {
      feature_dir: SPECKIT_FEATURE_DIR,
      workflow_tier: "speckit",
    })

    // A fully-complete speckit pipeline — every probe family fires.
    const data = okData(result)
    expect(data.all_complete).toBe(true)

    // Every git invocation ran against the injected cwd; no real git
    // subprocess ever runs.
    for (const call of calls) {
      expect(call.cwd).toBe(FAKE_CWD)
    }

    // Feature-dir and dispatch-store probes resolve under the fake cwd only.
    for (const probed of [...readTextCalls, ...fileExistsCalls, ...readDirCalls]) {
      expect(probed.startsWith(FAKE_CWD + "/")).toBe(true)
    }
    expect(fileExistsCalls).toEqual([
      resolve(featureDirAbs, "plan.md"),
      resolve(featureDirAbs, "tasks.md"),
    ])
    expect(readDirCalls).toEqual([STORE_DIR])

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
