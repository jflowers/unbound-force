import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolFailure, ToolResult } from "../lib/uf-workflow-types.js"
import {
  createMarkTaskCompleteTool,
  createParseTasksTool,
  createScanConflictMarkersTool,
  type MarkTaskCompleteData,
  type MarkTaskCompleteDependencies,
  type ParseTasksData,
  type ParseTasksDependencies,
  type ScanConflictMarkersData,
  type ScanConflictMarkersDependencies,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Scope (task 5.3, OpenSpec change unleash-deterministic-tools)
// ---------------------------------------------------------------------------

// The tasks tools are the mechanics half of /uf.unleash Step 5 (D9):
// parse_tasks splits tasks.md into document-order phases whose tasks carry
// the sequential/[P] split and done state the command schedules from,
// mark_task_complete flips one checkbox byte idempotently, and
// scan_conflict_markers reads file bytes for cherry-pick residue that
// `git diff --diff-filter=U` cannot see once a merge completes — the tools
// have no git surface at all, so detection is content-based by
// construction. Phase iteration, batch-of-4 scheduling, failure-stop, and
// comms reservations stay in command prose, so nothing here asserts them.

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The tasks tools take all I/O through injected readText/writeText/readDir/
// isDirectory dependencies (no git, no checkpoint, no direct node:fs).
// Mocking the node:fs surface anyway (the sibling unleash-* recipe) makes
// that an executable guarantee: expectNoRealFilesystem() fails these tests
// the moment a regression reaches past the injected fakes.
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

/** OpenSpec feature dir (the branch-gate payload shape) and its tasks.md. */
const FEATURE_DIR = "openspec/changes/synthetic-change/"
const TASKS_PATH = resolve(FAKE_CWD, FEATURE_DIR, "tasks.md")

/** Repo-relative tasks.md path exactly as the command composes it. */
const TASKS_REL = `${FEATURE_DIR}tasks.md`

/** Scan roots for the conflict-marker directory-walking tests. */
const SRC_DIR = resolve(FAKE_CWD, "src")
const SRC_ALPHA_DIR = resolve(FAKE_CWD, "src/alpha")

/**
 * Primary tasks.md fixture, modeled on the real
 * openspec/changes/unleash-deterministic-tools/tasks.md shape (title,
 * [P] comment block, `## N.` phases, `N.N` task ids, indented continuation
 * detail) with synthetic content. Both sequential and [P] tasks appear in
 * one phase, done and open tasks interleave, and one phase is empty — the
 * full matrix the command's per-phase split and resume skip consume.
 */
const TASKS_MD = [
  "# Tasks: synthetic-change",
  "",
  "<!--",
  "  [P] marks tasks eligible for parallel execution.",
  "  Tasks without [P] run sequentially first, then [P]",
  "  tasks run in parallel.",
  "-->",
  "",
  "## 1. Foundation",
  "",
  "- [x] 1.1 Record the baseline",
  "- [ ] 1.2 Add the shared lib helpers",
  "- [ ] 1.3 [P] Add the branch gate",
  "- [ ] 1.4 [P] Add the delegate tool",
  "  - [ ] Continuation detail under 1.4 (indented, not a task)",
  "",
  "## 2. Verification",
  "",
  "- [ ] 2.1 Run the plugin suite",
  "- [x] 2.2 [P] Mirror the scaffold assets",
  "",
  "## 3. Empty phase",
  "",
  "## 4. Tail",
  "",
  "- [ ] 4.1 Close the change",
].join("\n")

/**
 * Edge shapes the parser documents: a stray task before the first heading
 * is continuation detail, an id-only task has an empty description, an
 * indented checkbox is not a task, an uppercase [X] counts as done, [P]
 * directly after the id is a parallel marker, [P] later in the description
 * is prose, and a ### sub-section heading starts no new phase.
 */
const TASKS_EDGE_SHAPES = [
  "- [ ] 0.1 Stray task before the first heading is continuation detail",
  "",
  "## 1. Edge shapes",
  "",
  "- [ ] 1.1",
  "  - [ ] Indented checkbox detail is not a task",
  "- [X] 1.2 Uppercase checkbox counts as done",
  "- [x] 1.3 [P] Marker with no other description",
  "- [ ] 1.4 A [P] appearing mid-description is prose, not parallelism",
  "",
  "### Sub-section heading",
  "",
  "- [ ] 1.5 Task after the sub-section still belongs to phase 1",
].join("\n")

/** Every checkbox checked — all_done true the non-vacuous way. */
const TASKS_ALL_DONE = [
  "# Tasks: synthetic-complete",
  "",
  "## 1. Finished",
  "",
  "- [x] 1.1 First complete",
  "- [x] 1.2 Second complete",
].join("\n")

/** A tasks.md whose phase holds prose only — zero tasks anywhere. */
const TASKS_NO_TASKS = [
  "# Tasks: not yet decomposed",
  "",
  "## 1. Placeholder",
  "",
  "Prose only — the tasks step has not run yet.",
].join("\n")

/** CRLF line endings — parsed text must shed the trailing carriage returns. */
const TASKS_CRLF = [
  "# Tasks: windows author",
  "",
  "## 1. CRLF tolerance",
  "",
  "- [x] 1.1 Done despite carriage returns",
  "- [ ] 1.2 [P] Open despite carriage returns",
].join("\r\n")

/**
 * Ids where one is a strict prefix of the other: marking 5.1 must flip the
 * 5.1 line only (exact-token equality), never 5.10.
 */
const TASKS_NUMERIC_IDS = [
  "# Tasks: numeric ids",
  "",
  "## 5. Increment 5",
  "",
  "- [ ] 5.1 First granular tool",
  "- [ ] 5.10 Tenth granular tool",
].join("\n")

/**
 * Duplicate task ids in the three shapes findTaskLine distinguishes:
 * unchecked duplicates (the first flips), all-checked duplicates
 * (already complete), and checked-then-unchecked (the search continues
 * past the checked occurrence to the unchecked one).
 */
const TASKS_DUPLICATE_IDS = [
  "# Tasks: duplicate ids",
  "",
  "## 9. Unchecked duplicates",
  "",
  "- [ ] 9.1 First occurrence",
  "- [ ] 9.1 Second occurrence",
  "",
  "## 10. Checked duplicates",
  "",
  "- [x] 10.1 First checked occurrence",
  "- [x] 10.1 Second checked occurrence",
  "",
  "## 11. Mixed duplicates",
  "",
  "- [x] 11.1 Checked first",
  "- [ ] 11.1 Unchecked second",
].join("\n")

/** Cherry-pick residue: a full marker triple at column 0, three markers in one file. */
const MERGE_RESIDUE = [
  "package main",
  "",
  "<<<<<<< HEAD",
  "const timeout = 30",
  "=======",
  "const timeout = 60",
  ">>>>>>> feature/slow-timeout",
  "",
  "func main() {}",
].join("\n")

/** Marker-free source: indented and mid-line marker text is not residue. */
const CLEAN_SOURCE = [
  "package main",
  "",
  "func main() {",
  "  // An indented marker is not residue:",
  "  // <<<<<<< HEAD",
  "  // =======",
  "  // >>>>>>> tail",
  "  // A mid-line literal like(\"<<<<<<<\") is not residue either.",
  "}",
].join("\n")

/**
 * Legacy setext markdown: a column-0 `=======` heading underline collides
 * with the marker grammar — the documented false positive this suite pins
 * so callers scanning such files expect the report.
 */
const LEGACY_SETEXT = [
  "Legacy Contract",
  "=======",
  "",
  "Structural markdown whose heading underline collides with the marker grammar.",
].join("\n")

/** Binary blob whose marker-looking text sits after a NUL byte — skipped, never scanned. */
const BINARY_WITH_MARKERS = "\u0000\u0001\u0002<<<<<<< HEAD\n=======\n"

/** Node-shaped ENOENT error so the injected reader treats a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

interface FakeTasksFsOptions {
  /** File contents keyed by absolute path. */
  readonly files?: Record<string, string>
  /** Directory entry name lists keyed by absolute path, in arbitrary order. */
  readonly dirs?: Record<string, readonly string[]>
  /** Absolute paths whose read rejects with this error (unreadable files). */
  readonly unreadable?: Record<string, Error>
  /** Absolute directories whose listing rejects with this error (unlistable dirs). */
  readonly unlistable?: Record<string, Error>
  /** Absolute paths whose read resolves with a non-string (catch-all coverage). */
  readonly corruptReads?: Record<string, unknown>
  /** When true, writeText records the attempt then rejects (write failure). */
  readonly failWrite?: boolean
}

/**
 * Fake filesystem for all three tasks tools over an in-memory store keyed
 * on absolute paths: readText serves (or ENOENTs) from files, writeText
 * persists back into it — the round-trip is what exercises double-mark
 * idempotency and parse-after-mark observation — and readDir/isDirectory
 * serve a separate directory table. isDirectory reports true only for
 * paths present in that table, mirroring the default lstat-backed
 * implementation: a symlinked directory (whose lstat describes the link,
 * not its target) reports false and is never descended into. Every call
 * is recorded for path-resolution assertions.
 */
function fakeTasksFs(options: FakeTasksFsOptions = {}): {
  deps: MarkTaskCompleteDependencies & ScanConflictMarkersDependencies
  files: Record<string, string>
  readTextCalls: string[]
  readDirCalls: string[]
  isDirectoryCalls: string[]
  writes: Array<{ path: string; contents: string }>
} {
  const files: Record<string, string> = { ...(options.files ?? {}) }
  const readTextCalls: string[] = []
  const readDirCalls: string[] = []
  const isDirectoryCalls: string[] = []
  const writes: Array<{ path: string; contents: string }> = []
  const deps: MarkTaskCompleteDependencies & ScanConflictMarkersDependencies = {
    readText: async (path: string): Promise<string> => {
      readTextCalls.push(path)
      const corrupt = options.corruptReads?.[path]
      if (corrupt !== undefined) return corrupt as string
      const unreadable = options.unreadable?.[path]
      if (unreadable !== undefined) throw unreadable
      if (!(path in files)) throw enoent(`read ${path}`)
      return files[path]
    },
    writeText: async (path: string, contents: string): Promise<void> => {
      writes.push({ path, contents })
      if (options.failWrite === true) {
        throw new Error("EACCES: permission denied writing tasks.md")
      }
      files[path] = contents
    },
    readDir: async (path: string): Promise<readonly string[]> => {
      readDirCalls.push(path)
      const unlistable = options.unlistable?.[path]
      if (unlistable !== undefined) throw unlistable
      const entries = options.dirs?.[path]
      if (entries === undefined) {
        throw Object.assign(new Error(`ENOTDIR: not a directory, ${path}`), { code: "ENOTDIR" })
      }
      return [...entries]
    },
    isDirectory: async (path: string): Promise<boolean> => {
      isDirectoryCalls.push(path)
      return options.dirs?.[path] !== undefined
    },
  }
  return { deps, files, readTextCalls, readDirCalls, isDirectoryCalls, writes }
}

/** Session context shape every uf-workflow tool execute accepts. */
interface ToolContext {
  readonly sessionID: string
  readonly messageID: string
  readonly directory: string
  readonly abort: AbortSignal
}

/**
 * Invoke a created uf-workflow tool with a full parent-session context
 * (the unleash-clarify.test.ts direct-factory pattern) and parse its JSON
 * output.
 */
async function invokeTool<T>(
  created: ReturnType<typeof createParseTasksTool>,
  args: Record<string, unknown>,
): Promise<ToolResult<T>> {
  const result = await (
    created as {
      execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<{ output: string }>
    }
  ).execute(args, {
    sessionID: "parent-session",
    messageID: "message-parent",
    directory: FAKE_CWD,
    abort: new AbortController().signal,
  })
  return JSON.parse(result.output) as ToolResult<T>
}

/** Invoke parse_tasks and parse its JSON output. */
async function invokeParse(
  deps: ParseTasksDependencies,
  args: Record<string, unknown>,
): Promise<ToolResult<ParseTasksData>> {
  return invokeTool<ParseTasksData>(createParseTasksTool(FAKE_CWD, deps), args)
}

/** Invoke mark_task_complete and parse its JSON output. */
async function invokeMark(
  deps: MarkTaskCompleteDependencies,
  args: Record<string, unknown>,
): Promise<ToolResult<MarkTaskCompleteData>> {
  return invokeTool<MarkTaskCompleteData>(createMarkTaskCompleteTool(FAKE_CWD, deps), args)
}

/** Invoke scan_conflict_markers and parse its JSON output. */
async function invokeScan(
  deps: ScanConflictMarkersDependencies,
  args: Record<string, unknown>,
): Promise<ToolResult<ScanConflictMarkersData>> {
  return invokeTool<ScanConflictMarkersData>(createScanConflictMarkersTool(FAKE_CWD, deps), args)
}

/** Assert an ok envelope and return its data payload (narrowing helper). */
function okData<T>(result: ToolResult<T>): T {
  expect(result.status).toBe("ok")
  if (result.status !== "ok") {
    throw new Error(`expected ok envelope, received ${JSON.stringify(result)}`)
  }
  return result.data as T
}

/** Assert an error envelope and return it (narrowing helper). */
function errorEnvelope<T>(result: ToolResult<T>): ToolFailure {
  expect(result.status).toBe("error")
  if (result.status !== "error") {
    throw new Error(`expected error envelope, received ${JSON.stringify(result)}`)
  }
  return result
}

/** The contents of the single recorded write, asserting exactly one write occurred. */
function soleWrite(writes: Array<{ path: string; contents: string }>): string {
  expect(writes).toHaveLength(1)
  const write = writes[0]
  if (write === undefined) {
    throw new Error(`expected exactly one write, received ${JSON.stringify(writes)}`)
  }
  return write.contents
}

/**
 * Assert the slice surgery changed exactly one byte: updated has the same
 * length as original, differs only at flipAt, and equals original with
 * that byte replaced by "x" (the space inside `- [ ]`).
 */
function expectSingleByteFlip(original: string, updated: string, flipAt: number): void {
  expect(updated.length).toBe(original.length)
  const diffIndices: number[] = []
  for (let index = 0; index < original.length; index++) {
    if (updated[index] !== original[index]) diffIndices.push(index)
  }
  expect(diffIndices).toEqual([flipAt])
  expect(updated).toBe(original.slice(0, flipAt) + "x" + original.slice(flipAt + 1))
}

/** Assert nothing flowed through the real node:fs surface during a test. */
function expectNoRealFilesystem(): void {
  expect(existsSync).not.toHaveBeenCalled()
  expect(lstatSync).not.toHaveBeenCalled()
  expect(readFileSync).not.toHaveBeenCalled()
  expect(mkdirSync).not.toHaveBeenCalled()
  expect(writeFileSync).not.toHaveBeenCalled()
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ---------------------------------------------------------------------------
// parse_tasks — phase parsing
// ---------------------------------------------------------------------------

describe("parse_tasks phase parsing", () => {
  it("splits sequential and [P] tasks per phase with done flags, keeping phases in document order", async () => {
    const { deps, readTextCalls } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const result = await invokeParse(deps, { tasks_path: TASKS_REL })

    const data = okData(result)
    // The command splits each phase's tasks on `parallel` (sequential first,
    // then [P]) and numbers phases 1-based in document order — both derive
    // from this array, so order and flags are load-bearing.
    expect(data.phases).toStrictEqual([
      {
        phase: "1. Foundation",
        tasks: [
          { id: "1.1", description: "Record the baseline", parallel: false, done: true },
          { id: "1.2", description: "Add the shared lib helpers", parallel: false, done: false },
          { id: "1.3", description: "Add the branch gate", parallel: true, done: false },
          { id: "1.4", description: "Add the delegate tool", parallel: true, done: false },
        ],
      },
      {
        phase: "2. Verification",
        tasks: [
          { id: "2.1", description: "Run the plugin suite", parallel: false, done: false },
          { id: "2.2", description: "Mirror the scaffold assets", parallel: true, done: true },
        ],
      },
      { phase: "3. Empty phase", tasks: [] },
      {
        phase: "4. Tail",
        tasks: [{ id: "4.1", description: "Close the change", parallel: false, done: false }],
      },
    ])
    expect(data.total_tasks).toBe(7)
    expect(data.done_count).toBe(2)
    expect(data.all_done).toBe(false)

    // tasks.md resolved repo-relative and read exactly once through the
    // injected reader; the real-filesystem surface stayed untouched.
    expect(readTextCalls).toEqual([TASKS_PATH])
    expectNoRealFilesystem()
  })

  it("applies the documented edge shapes — pre-heading, indented, uppercase, id-only, sub-section, mid-description [P]", async () => {
    const { deps } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_EDGE_SHAPES } })

    const result = await invokeParse(deps, { tasks_path: TASKS_REL })

    const data = okData(result)
    expect(data.phases).toStrictEqual([
      {
        phase: "1. Edge shapes",
        tasks: [
          { id: "1.1", description: "", parallel: false, done: false },
          { id: "1.2", description: "Uppercase checkbox counts as done", parallel: false, done: true },
          { id: "1.3", description: "Marker with no other description", parallel: true, done: true },
          {
            id: "1.4",
            description: "A [P] appearing mid-description is prose, not parallelism",
            parallel: false,
            done: false,
          },
          {
            id: "1.5",
            description: "Task after the sub-section still belongs to phase 1",
            parallel: false,
            done: false,
          },
        ],
      },
    ])
    expect(data.total_tasks).toBe(5)
    expect(data.done_count).toBe(2)
    expect(data.all_done).toBe(false)
  })

  it("reports all_done true when every task is checked", async () => {
    const { deps } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_ALL_DONE } })

    const result = await invokeParse(deps, { tasks_path: TASKS_REL })

    const data = okData(result)
    expect(data.total_tasks).toBe(2)
    expect(data.done_count).toBe(2)
    expect(data.all_done).toBe(true)
  })

  it("reports all_done vacuously true for a tasks.md with no tasks", async () => {
    const { deps } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_NO_TASKS } })

    const result = await invokeParse(deps, { tasks_path: TASKS_REL })

    // Pinned documented behavior: zero tasks means zero unchecked boxes,
    // so all_done is true (matching the detect_resume unchecked-box probe)
    // — the command treats such a tasks.md as complete, not as an error.
    const data = okData(result)
    expect(data.phases).toStrictEqual([{ phase: "1. Placeholder", tasks: [] }])
    expect(data.total_tasks).toBe(0)
    expect(data.done_count).toBe(0)
    expect(data.all_done).toBe(true)
  })

  it("tolerates CRLF line endings, stripping carriage returns from parsed text", async () => {
    const { deps } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_CRLF } })

    const result = await invokeParse(deps, { tasks_path: TASKS_REL })

    const data = okData(result)
    expect(data.phases).toStrictEqual([
      {
        phase: "1. CRLF tolerance",
        tasks: [
          { id: "1.1", description: "Done despite carriage returns", parallel: false, done: true },
          { id: "1.2", description: "Open despite carriage returns", parallel: true, done: false },
        ],
      },
    ])
    expect(data.total_tasks).toBe(2)
    expect(data.done_count).toBe(1)
    expect(data.all_done).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// mark_task_complete — checkbox flipping
// ---------------------------------------------------------------------------

describe("mark_task_complete checkbox flipping", () => {
  it("flips exactly one byte and is idempotent — the second call reports already_complete without writing", async () => {
    const { deps, readTextCalls, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const first = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "1.2" })

    expect(okData(first)).toStrictEqual({
      tasks_path: TASKS_REL,
      task_id: "1.2",
      already_complete: false,
    })
    // Single-byte slice surgery: the flip replaces the space inside the
    // 1.2 checkbox — offset 3 into its line — and nothing else.
    const flipAt = TASKS_MD.indexOf("- [ ] 1.2 Add the shared lib helpers") + 3
    expectSingleByteFlip(TASKS_MD, soleWrite(writes), flipAt)

    const second = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "1.2" })

    // The second call re-read the post-flip file (the fake store
    // round-trips the write) and detected completion without rewriting —
    // repeated calls never dirty the file's mtime.
    expect(okData(second)).toStrictEqual({
      tasks_path: TASKS_REL,
      task_id: "1.2",
      already_complete: true,
    })
    expect(readTextCalls).toEqual([TASKS_PATH, TASKS_PATH])
    expect(writes).toHaveLength(1)
    expectNoRealFilesystem()
  })

  it("round-trips through the fake store — a follow-up parse observes the flipped checkbox", async () => {
    const { deps } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const before = okData(await invokeParse(deps, { tasks_path: TASKS_REL }))
    expect(before.done_count).toBe(2)
    expect(before.all_done).toBe(false)

    okData(await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "1.2" }))

    const after = okData(await invokeParse(deps, { tasks_path: TASKS_REL }))
    const flipped = after.phases[0]?.tasks.find((task) => task.id === "1.2")
    expect(flipped?.done).toBe(true)
    expect(after.done_count).toBe(3)
    expect(after.all_done).toBe(false)
  })

  it("matches the task id exactly — 5.1 does not flip 5.10", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_NUMERIC_IDS } })

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "5.1" })

    expect(okData(result).already_complete).toBe(false)
    const updated = soleWrite(writes)
    const flipAt = TASKS_NUMERIC_IDS.indexOf("- [ ] 5.1 First granular tool") + 3
    expectSingleByteFlip(TASKS_NUMERIC_IDS, updated, flipAt)
    expect(updated).toContain("- [x] 5.1 First granular tool")
    // The 5.10 line shares the "5.1" prefix but is a different id token —
    // its checkbox is untouched.
    expect(updated).toContain("- [ ] 5.10 Tenth granular tool")
  })

  it("flips tasks in CRLF-authored files — normalized matching, byte-exact offsets", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_CRLF } })

    // A checked CRLF line is recognized — no TASK_NOT_FOUND, no write.
    const checked = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "1.1" })
    expect(okData(checked).already_complete).toBe(true)
    expect(writes).toEqual([])

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "1.2" })

    expect(okData(result).already_complete).toBe(false)
    const updated = soleWrite(writes)
    // The flip offset is computed over the RAW text (carriage returns
    // included) while the task-line match runs on the normalized line —
    // parse_tasks and mark_task_complete cannot disagree about what
    // counts as a task on a CRLF-authored tasks.md.
    const flipAt = TASKS_CRLF.indexOf("- [ ] 1.2 [P] Open despite carriage returns") + 3
    expectSingleByteFlip(TASKS_CRLF, updated, flipAt)
    expect(updated).toContain("- [x] 1.2 [P] Open despite carriage returns")
  })

  it("fails TASK_NOT_FOUND for a bare prefix like 5. that matches no id", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_NUMERIC_IDS } })

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "5." })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("TASK_NOT_FOUND")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe(
      'Task "5." not found in tasks.md — no checked or unchecked entry carries that id',
    )
    expect(writes).toEqual([])
  })

  it("fails TASK_NOT_FOUND for an id no checkbox line carries, writing nothing", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "9.9" })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("TASK_NOT_FOUND")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe(
      'Task "9.9" not found in tasks.md — no checked or unchecked entry carries that id',
    )
    expect(writes).toEqual([])
  })

  it("flips the first unchecked occurrence of a duplicate id, then the next, before reporting already_complete", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_DUPLICATE_IDS } })

    const first = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "9.1" })

    expect(okData(first).already_complete).toBe(false)
    const firstFlipAt = TASKS_DUPLICATE_IDS.indexOf("- [ ] 9.1 First occurrence") + 3
    const firstUpdated = soleWrite(writes)
    expectSingleByteFlip(TASKS_DUPLICATE_IDS, firstUpdated, firstFlipAt)
    expect(firstUpdated).toContain("- [x] 9.1 First occurrence")
    expect(firstUpdated).toContain("- [ ] 9.1 Second occurrence")

    // The duplicate is still unchecked, so a second call flips it — the
    // search always takes the first unchecked occurrence.
    const second = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "9.1" })
    expect(okData(second).already_complete).toBe(false)
    expect(writes).toHaveLength(2)
    const secondUpdated = writes[1]?.contents
    expect(secondUpdated).toContain("- [x] 9.1 First occurrence")
    expect(secondUpdated).toContain("- [x] 9.1 Second occurrence")

    // Only now, with every occurrence checked, does the idempotent path
    // engage.
    const third = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "9.1" })
    expect(okData(third).already_complete).toBe(true)
    expect(writes).toHaveLength(2)
  })

  it("reports already_complete without writing when every duplicate occurrence is checked", async () => {
    const { deps, writes, readTextCalls } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_DUPLICATE_IDS } })

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "10.1" })

    expect(okData(result)).toStrictEqual({
      tasks_path: TASKS_REL,
      task_id: "10.1",
      already_complete: true,
    })
    expect(readTextCalls).toEqual([TASKS_PATH])
    expect(writes).toEqual([])
  })

  it("flips the unchecked occurrence of a checked-then-unchecked duplicate", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_DUPLICATE_IDS } })

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "11.1" })

    // A checked duplicate earlier in the file does not end the search —
    // the first UNCHECKED occurrence is the flip target.
    expect(okData(result).already_complete).toBe(false)
    const flipAt = TASKS_DUPLICATE_IDS.indexOf("- [ ] 11.1 Unchecked second") + 3
    const updated = soleWrite(writes)
    expectSingleByteFlip(TASKS_DUPLICATE_IDS, updated, flipAt)
    expect(updated).toContain("- [x] 11.1 Checked first")
    expect(updated).toContain("- [x] 11.1 Unchecked second")
  })
})

// ---------------------------------------------------------------------------
// scan_conflict_markers — residue detection
// ---------------------------------------------------------------------------

describe("scan_conflict_markers residue detection", () => {
  it("reports cherry-pick residue in a fully merged file — content-based detection an empty git diff --diff-filter=U cannot see", async () => {
    const mergedFile = resolve(FAKE_CWD, "src/merged.txt")
    const { deps, readTextCalls, readDirCalls } = fakeTasksFs({ files: { [mergedFile]: MERGE_RESIDUE } })

    const result = await invokeScan(deps, { paths: ["src/merged.txt"] })

    // `git diff --diff-filter=U` lists unmerged index entries, so once a
    // cherry-pick merge completes (markers staged as ordinary content)
    // that listing is empty. The tool's injected dependencies are
    // readText/readDir/isDirectory — no git surface exists — so a file
    // carrying column-0 markers is reported regardless of index state.
    const data = okData(result)
    expect(data.conflicts).toStrictEqual([
      {
        path: "src/merged.txt",
        markers: [
          { line: 3, marker: "<<<<<<<" },
          { line: 5, marker: "=======" },
          { line: 7, marker: ">>>>>>>" },
        ],
      },
    ])
    expect(data.clean).toBe(false)
    expect(data.warnings).toStrictEqual([])
    // A file root is read directly — no directory walk, no readDir probe.
    expect(readTextCalls).toEqual([mergedFile])
    expect(readDirCalls).toEqual([])
    expectNoRealFilesystem()
  })

  it("reports clean true for a file whose markers sit indented or mid-line", async () => {
    const cleanFile = resolve(FAKE_CWD, "src/main.go")
    const { deps } = fakeTasksFs({ files: { [cleanFile]: CLEAN_SOURCE } })

    const result = await invokeScan(deps, { paths: ["src/main.go"] })

    // Only column-0 marker lines count — indented comments and mid-line
    // string literals are ordinary source text.
    const data = okData(result)
    expect(data.conflicts).toStrictEqual([])
    expect(data.clean).toBe(true)
    expect(data.warnings).toStrictEqual([])
  })

  it("detects a setext ======= underline at column 0 — the documented false positive", async () => {
    const legacyFile = resolve(FAKE_CWD, "docs/contract.md")
    const { deps } = fakeTasksFs({ files: { [legacyFile]: LEGACY_SETEXT } })

    const result = await invokeScan(deps, { paths: ["docs/contract.md"] })

    // Pinned so callers scanning legacy setext markdown expect the report:
    // a column-0 ======= is indistinguishable from a conflict separator.
    const data = okData(result)
    expect(data.conflicts).toStrictEqual([
      { path: "docs/contract.md", markers: [{ line: 2, marker: "=======" }] },
    ])
    expect(data.clean).toBe(false)
  })

  it("walks directories recursively in sorted order, reporting nested files and multiple markers per file", async () => {
    const aaaFile = resolve(SRC_ALPHA_DIR, "aaa.txt")
    const residueFile = resolve(SRC_ALPHA_DIR, "residue.txt")
    const midFile = resolve(SRC_DIR, "mid.go")
    const zetaFile = resolve(SRC_DIR, "zeta.go")
    const { deps, readTextCalls, readDirCalls, isDirectoryCalls } = fakeTasksFs({
      files: {
        [aaaFile]: CLEAN_SOURCE,
        [residueFile]: MERGE_RESIDUE,
        [midFile]: CLEAN_SOURCE,
        [zetaFile]: CLEAN_SOURCE,
      },
      // Entry lists are deliberately unsorted — the walk must sort them so
      // scan output is deterministic regardless of directory order.
      dirs: {
        [SRC_DIR]: ["zeta.go", "alpha", "mid.go"],
        [SRC_ALPHA_DIR]: ["residue.txt", "aaa.txt"],
      },
    })

    const result = await invokeScan(deps, { paths: ["src"] })

    const data = okData(result)
    expect(data.conflicts).toStrictEqual([
      {
        path: "src/alpha/residue.txt",
        markers: [
          { line: 3, marker: "<<<<<<<" },
          { line: 5, marker: "=======" },
          { line: 7, marker: ">>>>>>>" },
        ],
      },
    ])
    expect(data.clean).toBe(false)
    expect(data.warnings).toStrictEqual([])
    // Sorted recursive walk: alpha before mid.go before zeta.go, and
    // aaa.txt before residue.txt inside alpha.
    expect(readDirCalls).toEqual([SRC_DIR, SRC_ALPHA_DIR])
    expect(readTextCalls).toEqual([aaaFile, residueFile, midFile, zetaFile])
    expect(isDirectoryCalls).toEqual([
      SRC_DIR,
      SRC_ALPHA_DIR,
      aaaFile,
      residueFile,
      midFile,
      zetaFile,
    ])
  })

  it("scans each file once for overlapping inputs — a directory plus a file inside it", async () => {
    const aaaFile = resolve(SRC_ALPHA_DIR, "aaa.txt")
    const residueFile = resolve(SRC_ALPHA_DIR, "residue.txt")
    const midFile = resolve(SRC_DIR, "mid.go")
    const zetaFile = resolve(SRC_DIR, "zeta.go")
    const { deps, readTextCalls } = fakeTasksFs({
      files: {
        [aaaFile]: CLEAN_SOURCE,
        [residueFile]: MERGE_RESIDUE,
        [midFile]: CLEAN_SOURCE,
        [zetaFile]: CLEAN_SOURCE,
      },
      dirs: {
        [SRC_DIR]: ["zeta.go", "alpha", "mid.go"],
        [SRC_ALPHA_DIR]: ["residue.txt", "aaa.txt"],
      },
    })

    const result = await invokeScan(deps, { paths: ["src", "src/mid.go"] })

    // mid.go arrives both through the directory walk and as a direct
    // root; the seen-set deduplicates by resolved path, so every file is
    // read exactly once and conflicts carry no duplicate entries.
    const data = okData(result)
    expect(readTextCalls).toEqual([aaaFile, residueFile, midFile, zetaFile])
    expect(new Set(readTextCalls).size).toBe(readTextCalls.length)
    expect(data.conflicts).toStrictEqual([
      {
        path: "src/alpha/residue.txt",
        markers: [
          { line: 3, marker: "<<<<<<<" },
          { line: 5, marker: "=======" },
          { line: 7, marker: ">>>>>>>" },
        ],
      },
    ])
    expect(data.clean).toBe(false)
  })

  it("fails open per file — unreadable and binary files become warnings while the scan continues", async () => {
    const keepFile = resolve(SRC_DIR, "keep.txt")
    const blobFile = resolve(SRC_DIR, "blob.bin")
    const lockedFile = resolve(SRC_DIR, "locked.txt")
    const { deps } = fakeTasksFs({
      files: {
        [keepFile]: MERGE_RESIDUE,
        [blobFile]: BINARY_WITH_MARKERS,
      },
      dirs: { [SRC_DIR]: ["blob.bin", "keep.txt", "locked.txt"] },
      unreadable: {
        [lockedFile]: Object.assign(new Error("EACCES: permission denied reading locked.txt"), {
          code: "EACCES",
        }),
      },
    })

    const result = await invokeScan(deps, { paths: ["src"] })

    // Individual skips never fail the scan: the readable file's conflict
    // is still reported, and the skipped files surface as warnings — the
    // NUL-byte check runs before the marker scan, so even the blob's
    // marker-looking text stays unreported.
    const data = okData(result)
    expect(data.conflicts).toStrictEqual([
      {
        path: "src/keep.txt",
        markers: [
          { line: 3, marker: "<<<<<<<" },
          { line: 5, marker: "=======" },
          { line: 7, marker: ">>>>>>>" },
        ],
      },
    ])
    expect(data.clean).toBe(false)
    expect(data.warnings).toStrictEqual([
      "src/blob.bin: binary file skipped",
      "src/locked.txt: cannot read (EACCES: permission denied reading locked.txt)",
    ])
  })

  it("stays clean when every probed file is skipped with a warning", async () => {
    const blobFile = resolve(FAKE_CWD, "skips/blob.bin")
    const lockedFile = resolve(FAKE_CWD, "skips/locked.txt")
    const { deps } = fakeTasksFs({
      files: { [blobFile]: BINARY_WITH_MARKERS },
      dirs: { [resolve(FAKE_CWD, "skips")]: ["locked.txt", "blob.bin"] },
      unreadable: {
        [lockedFile]: Object.assign(new Error("EACCES: permission denied reading locked.txt"), {
          code: "EACCES",
        }),
      },
    })

    const result = await invokeScan(deps, { paths: ["skips"] })

    // No readable file carried markers, so clean holds true — fail-open
    // skips do not fabricate conflicts.
    const data = okData(result)
    expect(data.conflicts).toStrictEqual([])
    expect(data.clean).toBe(true)
    expect(data.warnings).toStrictEqual([
      "skips/blob.bin: binary file skipped",
      "skips/locked.txt: cannot read (EACCES: permission denied reading locked.txt)",
    ])
  })

  it("warns and continues past a directory that cannot be listed", async () => {
    const docsDir = resolve(FAKE_CWD, "docs")
    const noteFile = resolve(docsDir, "note.md")
    const { deps, readDirCalls } = fakeTasksFs({
      files: {
        [noteFile]: MERGE_RESIDUE,
        [resolve(SRC_DIR, "residue.txt")]: MERGE_RESIDUE,
      },
      dirs: {
        [SRC_DIR]: ["residue.txt"],
        [docsDir]: ["note.md"],
      },
      // src reports as a directory but its listing rejects — an EACCES on
      // the directory itself.
      unlistable: {
        [SRC_DIR]: Object.assign(new Error("EACCES: permission denied listing src"), { code: "EACCES" }),
      },
    })

    const result = await invokeScan(deps, { paths: ["src", "docs"] })

    const data = okData(result)
    // The unlistable root becomes a warning; the walk continues into the
    // remaining roots and still reports their conflicts.
    expect(readDirCalls).toEqual([SRC_DIR, docsDir])
    expect(data.warnings).toStrictEqual(["src: cannot list directory (EACCES: permission denied listing src)"])
    expect(data.conflicts).toStrictEqual([
      {
        path: "docs/note.md",
        markers: [
          { line: 3, marker: "<<<<<<<" },
          { line: 5, marker: "=======" },
          { line: 7, marker: ">>>>>>>" },
        ],
      },
    ])
    expect(data.clean).toBe(false)
  })

  it("does not descend into a symlinked directory — lstat-based isDirectory reports false", async () => {
    const worktreeDir = resolve(FAKE_CWD, "worktree")
    const innerFile = resolve(worktreeDir, "inner.txt")
    const worktreeLink = resolve(FAKE_CWD, "link-to-worktree")
    const { deps, readTextCalls, readDirCalls, isDirectoryCalls } = fakeTasksFs({
      files: { [innerFile]: CLEAN_SOURCE },
      // The link is deliberately absent from the directory table: the
      // default isDirectory uses lstat, which describes the link itself,
      // so a symlinked directory reports false.
      dirs: { [worktreeDir]: ["inner.txt"] },
      // Reading the link as a file fails the way readFile on a directory
      // does in reality.
      unreadable: {
        [worktreeLink]: Object.assign(
          new Error("EISDIR: illegal operation on a directory, read"),
          { code: "EISDIR" },
        ),
      },
    })

    const result = await invokeScan(deps, { paths: ["link-to-worktree", "worktree"] })

    const data = okData(result)
    // The link was never listed as a directory (no descent, no cycle) —
    // it was probed as a file, failed to read, and became a warning while
    // the real directory scanned normally.
    expect(readDirCalls).toEqual([worktreeDir])
    expect(readTextCalls).toEqual([worktreeLink, innerFile])
    expect(isDirectoryCalls).toEqual([worktreeLink, worktreeDir, innerFile])
    expect(data.conflicts).toStrictEqual([])
    expect(data.clean).toBe(true)
    expect(data.warnings).toStrictEqual([
      "link-to-worktree: cannot read (EISDIR: illegal operation on a directory, read)",
    ])
  })
})

// ---------------------------------------------------------------------------
// tasks tools — failure paths
// ---------------------------------------------------------------------------

describe("tasks tools failure paths", () => {
  it("parse and mark fail TASKS_FILE_NOT_FOUND when tasks.md is missing", async () => {
    const parse = fakeTasksFs({ files: {} })
    const mark = fakeTasksFs({ files: {} })

    const parseResult = await invokeParse(parse.deps, { tasks_path: TASKS_REL })
    const markResult = await invokeMark(mark.deps, { tasks_path: TASKS_REL, task_id: "1.2" })

    for (const failureEnvelope of [errorEnvelope(parseResult), errorEnvelope(markResult)]) {
      expect(failureEnvelope.code).toBe("TASKS_FILE_NOT_FOUND")
      expect(failureEnvelope.retryable).toBe(false)
      expect(failureEnvelope.message).toBe(
        "No tasks.md found at the given tasks_path. Generate it via the tasks step before parsing or marking.",
      )
    }
    // Both tools share the reader, so both probed the same absolute path.
    expect(parse.readTextCalls).toEqual([TASKS_PATH])
    expect(mark.readTextCalls).toEqual([TASKS_PATH])
    expect(mark.writes).toEqual([])
  })

  it("parse and mark fail TASKS_READ_FAILED on a non-ENOENT read error", async () => {
    const readError = Object.assign(new Error("EACCES: permission denied reading tasks.md"), {
      code: "EACCES",
    })
    const parse = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD }, unreadable: { [TASKS_PATH]: readError } })
    const mark = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD }, unreadable: { [TASKS_PATH]: readError } })

    const parseResult = await invokeParse(parse.deps, { tasks_path: TASKS_REL })
    const markResult = await invokeMark(mark.deps, { tasks_path: TASKS_REL, task_id: "1.2" })

    for (const failureEnvelope of [errorEnvelope(parseResult), errorEnvelope(markResult)]) {
      expect(failureEnvelope.code).toBe("TASKS_READ_FAILED")
      expect(failureEnvelope.retryable).toBe(false)
      expect(failureEnvelope.message).toBe("Cannot read tasks.md: EACCES: permission denied reading tasks.md")
    }
    expect(mark.writes).toEqual([])
  })

  it("mark fails TASKS_WRITE_FAILED when the write rejects, after composing the flipped file", async () => {
    const { deps, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD }, failWrite: true })

    const result = await invokeMark(deps, { tasks_path: TASKS_REL, task_id: "1.3" })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("TASKS_WRITE_FAILED")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe("Cannot write tasks.md: EACCES: permission denied writing tasks.md")
    // One write was attempted with the fully flipped file before the
    // rejection surfaced.
    const flipAt = TASKS_MD.indexOf("- [ ] 1.3 [P] Add the branch gate") + 3
    expectSingleByteFlip(TASKS_MD, soleWrite(writes), flipAt)
  })

  it.each(["../secrets/tasks.md", "/etc/passwd"])(
    "parse rejects tasks_path %s escaping the repository root before any read",
    async (tasksPath) => {
      const { deps, readTextCalls } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

      const result = await invokeParse(deps, { tasks_path: tasksPath })

      const failureEnvelope = errorEnvelope(result)
      expect(failureEnvelope.code).toBe("TASKS_PATH_TRAVERSAL")
      expect(failureEnvelope.retryable).toBe(false)
      expect(failureEnvelope.message).toBe(
        "Path traversal blocked: tasks_path resolves outside the repository root",
      )
      expect(readTextCalls).toEqual([])
    },
  )

  it.each(["../secrets/tasks.md", "/etc/passwd"])(
    "mark rejects tasks_path %s escaping the repository root before any read or write",
    async (tasksPath) => {
      const { deps, readTextCalls, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

      const result = await invokeMark(deps, { tasks_path: tasksPath, task_id: "1.2" })

      const failureEnvelope = errorEnvelope(result)
      expect(failureEnvelope.code).toBe("TASKS_PATH_TRAVERSAL")
      expect(failureEnvelope.retryable).toBe(false)
      expect(failureEnvelope.message).toBe(
        "Path traversal blocked: tasks_path resolves outside the repository root",
      )
      expect(readTextCalls).toEqual([])
      expect(writes).toEqual([])
    },
  )

  it.each([
    ["a single escaping path", ["../outside"], "../outside"],
    ["an absolute path outside the root", ["/etc"], "/etc"],
    ["an escaping path alongside a valid one", ["src", "../outside"], "../outside"],
  ])("scan rejects %s before any read or directory probe", async (_description, paths, offender) => {
    const { deps, readTextCalls, readDirCalls, isDirectoryCalls } = fakeTasksFs({
      files: { [resolve(FAKE_CWD, "src/merged.txt")]: MERGE_RESIDUE },
    })

    const result = await invokeScan(deps, { paths })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("PATHS_TRAVERSAL")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe(
      `Path traversal blocked: ${offender} resolves outside the repository root`,
    )
    // Fail-closed before any probe — even the valid sibling root is never
    // read, listed, or stat-ed.
    expect(readTextCalls).toEqual([])
    expect(readDirCalls).toEqual([])
    expect(isDirectoryCalls).toEqual([])
  })

  it.each([
    ["a missing tasks_path", {}, "tasks_path"],
    ["an empty tasks_path", { tasks_path: "" }, "tasks_path"],
    ["an extra key", { tasks_path: TASKS_REL, unexpected: "value" }, "unexpected"],
    ["a non-string tasks_path", { tasks_path: 5 }, "tasks_path"],
  ])("parse rejects %s with INVALID_INPUT before any read", async (_description, args, messagePart) => {
    const { deps, readTextCalls } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const result = await invokeParse(deps, args)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    // The zod issue details name the offending field.
    expect(failureEnvelope.message).toContain(messagePart)
    expect(readTextCalls).toEqual([])
  })

  it.each([
    ["a missing task_id", { tasks_path: TASKS_REL }, "task_id"],
    ["an empty task_id", { tasks_path: TASKS_REL, task_id: "" }, "task_id"],
    ["an extra key", { tasks_path: TASKS_REL, task_id: "1.2", unexpected: "value" }, "unexpected"],
    ["a non-string task_id", { tasks_path: TASKS_REL, task_id: 5 }, "task_id"],
    ["a non-string tasks_path", { tasks_path: true, task_id: "1.2" }, "tasks_path"],
  ])("mark rejects %s with INVALID_INPUT before any read", async (_description, args, messagePart) => {
    const { deps, readTextCalls, writes } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const result = await invokeMark(deps, args)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toContain(messagePart)
    expect(readTextCalls).toEqual([])
    expect(writes).toEqual([])
  })

  it.each([
    ["a missing paths array", {}, "paths"],
    ["an empty paths array", { paths: [] }, "paths"],
    ["an empty path member", { paths: [""] }, "paths.0"],
    ["an extra key", { paths: ["src"], unexpected: "value" }, "unexpected"],
    ["a non-array paths value", { paths: "src" }, "paths"],
  ])("scan rejects %s with INVALID_INPUT before any read", async (_description, args, messagePart) => {
    const { deps, readTextCalls } = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD } })

    const result = await invokeScan(deps, args)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toContain(messagePart)
    expect(readTextCalls).toEqual([])
  })

  it("surfaces unexpected read-shape failures through the per-tool catch-all codes", async () => {
    // A read resolving with a non-string blows up past the read guards
    // (ENOENT/EACCES never fired), exercising each tool's outer catch.
    const parse = fakeTasksFs({ corruptReads: { [TASKS_PATH]: 42 } })
    const parseResult = await invokeParse(parse.deps, { tasks_path: TASKS_REL })
    const parseFailure = errorEnvelope(parseResult)
    expect(parseFailure.code).toBe("PARSE_TASKS_ERROR")
    expect(parseFailure.retryable).toBe(false)
    expect(parseFailure.message).toContain("not a function")

    const mark = fakeTasksFs({ files: { [TASKS_PATH]: TASKS_MD }, corruptReads: { [TASKS_PATH]: 42 } })
    const markResult = await invokeMark(mark.deps, { tasks_path: TASKS_REL, task_id: "1.2" })
    const markFailure = errorEnvelope(markResult)
    expect(markFailure.code).toBe("MARK_TASK_COMPLETE_ERROR")
    expect(markFailure.retryable).toBe(false)
    expect(markFailure.message).toContain("not a function")
    expect(mark.writes).toEqual([])

    const scan = fakeTasksFs({ corruptReads: { [resolve(FAKE_CWD, "src/merged.txt")]: 42 } })
    const scanResult = await invokeScan(scan.deps, { paths: ["src/merged.txt"] })
    const scanFailure = errorEnvelope(scanResult)
    expect(scanFailure.code).toBe("SCAN_CONFLICT_MARKERS_ERROR")
    expect(scanFailure.retryable).toBe(false)
    expect(scanFailure.message).toContain("not a function")
  })
})
