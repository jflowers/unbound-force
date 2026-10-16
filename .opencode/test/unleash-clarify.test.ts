import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolFailure, ToolResult } from "../lib/uf-workflow-types.js"
import {
  createResolveClarificationTool,
  createScanClarificationsTool,
  type ResolveClarificationData,
  type ResolveClarificationDependencies,
  type ScanClarificationsData,
  type ScanClarificationsDependencies,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Scope (task 4.7, OpenSpec change unleash-deterministic-tools)
// ---------------------------------------------------------------------------

// The clarify tools are the mechanics half of /uf.unleash Step 1 (D8): scan
// extracts [NEEDS CLARIFICATION: <question>] markers, resolve applies one
// answer. Whether Dewey is AVAILABLE — and therefore whether a question
// auto-resolves or exits for the human — is command-prose judgment, not tool
// behavior, so nothing here asserts it. The bare `[NEEDS CLARIFICATION]`
// form (no colon) is pinned only as not-extracted: it must stay in the file
// so uf_unleash_detect_resume's prefix probe keeps reporting clarify
// incomplete (fail-safe; that probe is the resume suite's concern).

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The clarify tools take all I/O through injected readText/writeText
// dependencies (no git, no checkpoint, no direct node:fs). Mocking the
// node:fs surface anyway (the sibling unleash-* recipe) makes that an
// executable guarantee: expectNoRealFilesystem() fails these tests the
// moment a regression reaches past the injected fakes — including a
// checkpoint write, which clarify completion deliberately never performs.
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

/** OpenSpec feature dir (the branch-gate payload shape) and its spec.md. */
const FEATURE_DIR = "openspec/changes/unleash-deterministic-tools/"
const SPEC_PATH = resolve(FAKE_CWD, FEATURE_DIR, "spec.md")

/** Speckit feature dir (raw-branch specs/ convention) and its spec.md. */
const SPECKIT_FEATURE_DIR = "specs/018-unleash-command/"
const SPECKIT_SPEC_PATH = resolve(FAKE_CWD, SPECKIT_FEATURE_DIR, "spec.md")

/** Valid resolve_clarification input applied across the resolution tests. */
const RESOLVE_ARGS = {
  feature_dir: FEATURE_DIR,
  question: "What is the default timeout?",
  answer: "The default is 30 seconds.",
  source: "specs/018-unleash-command/spec.md",
}

/**
 * Marker density fixture: one marker near the file top (line 2 — only one
 * line of leading context exists), one mid-file mid-line (line 9 — the full
 * five-line window), one near the bottom (line 16 — the last line, so the
 * window loses its trailing pair). Line comments carry 1-based numbers;
 * scan's line field and context window must agree with them.
 */
const SPEC_MARKERS_AT_DENSITY_EDGES = [
  "Intro line one.", // 1
  "[NEEDS CLARIFICATION: Which storage backend?]", // 2
  "Intro line three.", // 3
  "", // 4
  "## Overview", // 5
  "", // 6
  "The engine persists envelopes locally.", // 7
  "Data is flushed periodically.", // 8
  "Mid-line [NEEDS CLARIFICATION: How often is flush?] with trailing text.", // 9
  "Flushes are batched.", // 10
  "", // 11
  "## Failure modes", // 12
  "", // 13
  "Crash recovery replays the log.", // 14
  "", // 15
  "Final [NEEDS CLARIFICATION: What about partial writes?].", // 16
].join("\n")

/**
 * Whitespace runs inside the marker: the runs flanking the question are
 * marker syntax (trimmed from the extraction); internal runs are content
 * (preserved). Resolve's exact-match test reuses this fixture.
 */
const SPEC_PADDED_MARKER = [
  "# Spec: padded marker",
  "",
  "Settings read [NEEDS CLARIFICATION:     Which   provider   backs auth?    ] with padding kept out.",
].join("\n")

/** Two markers sharing one line — per-line matchAll yields both. */
const SPEC_TWO_MARKERS_ONE_LINE = [
  "# Spec: compact form",
  "Both [NEEDS CLARIFICATION: First question?] and [NEEDS CLARIFICATION: Second question?] share a line.",
].join("\n")

/** A bare marker (no colon) next to a full one — only the full one extracts. */
const SPEC_BARE_PLUS_FULL_MARKER = [
  "# Spec: mixed markers",
  "",
  "Bare [NEEDS CLARIFICATION] and full [NEEDS CLARIFICATION: Real question?] markers.",
].join("\n")

/** Only the bare form — nothing the clarify tools can act on. */
const SPEC_BARE_MARKER_ONLY = [
  "# Spec: bare marker",
  "",
  "A bare [NEEDS CLARIFICATION] marker without a colon.",
].join("\n")

/** Marker-free spec served under the speckit dir shape. */
const SPEC_NO_MARKERS = [
  "# Spec: unleash command",
  "",
  "## Overview",
  "",
  "Every requirement is unambiguous.",
].join("\n")

/**
 * Resolution fixture without a ## Clarifications section: the first marker
 * is mid-line (slice surgery must keep both sides), the second survives the
 * first resolution (remaining decrements from 1 to 0 across two calls).
 */
const SPEC_SECTION_ABSENT = [
  "# Spec: gateway timeouts", // 1
  "", // 2
  "The gateway enforces a timeout. [NEEDS CLARIFICATION: What is the default timeout?] Retries are off by default.", // 3
  "", // 4
  "Failures return 504. [NEEDS CLARIFICATION: Should 504s retry?]", // 5
  "", // 6
  "## Behavior", // 7
  "", // 8
  "Timeouts are configurable.", // 9
].join("\n")

/** Existing section followed by another heading — entry must land before it. */
const SPEC_SECTION_BEFORE_ANOTHER_HEADING = [
  "# Spec: gateway timeouts",
  "",
  "The gateway [NEEDS CLARIFICATION: What timeout applies?] enforces limits.",
  "",
  "## Clarifications",
  "",
  "- Q: Prior question -> A: Prior answer (Dewey-resolved from old-page).",
  "",
  "## References",
  "",
  "- specs/018-unleash-command/spec.md",
].join("\n")

/** Existing section as the file's last content, ending on a trailing blank. */
const SPEC_SECTION_LAST = [
  "# Spec: gateway timeouts",
  "",
  "[NEEDS CLARIFICATION: Which retry policy?]",
  "",
  "## Clarifications",
  "",
  "- Q: Prior question -> A: Prior answer (Dewey-resolved from old-page).",
  "",
].join("\n")

/** Section heading present but empty, bounded below by the next heading. */
const SPEC_EMPTY_SECTION = [
  "# Spec: gateway timeouts",
  "",
  "[NEEDS CLARIFICATION: Which retry policy?]",
  "",
  "## Clarifications",
  "",
  "## References",
  "",
  "- one reference",
].join("\n")

/** Node-shaped ENOENT error so the injected reader treats a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

interface FakeSpecDepsOptions {
  /** Files keyed by absolute path (spec.md fixtures). */
  readonly files?: Record<string, string>
  /** When set, every read rejects with this error (non-ENOENT read failure). */
  readonly readError?: Error
  /** When true, writeText records the attempt then rejects (write failure). */
  readonly failWrite?: boolean
}

/**
 * Fake clarify dependencies over an in-memory file store keyed on absolute
 * paths: readText serves (or ENOENTs) from the store, writeText persists
 * back into it. The round-trip matters — a second tool call observes the
 * file exactly as the first call wrote it, which is how double-resolve
 * idempotency is exercised without touching a real filesystem. Every read
 * and write is recorded for path-resolution assertions.
 */
function fakeSpecDeps(options: FakeSpecDepsOptions = {}): {
  deps: ResolveClarificationDependencies
  readTextCalls: string[]
  writes: Array<{ path: string; contents: string }>
} {
  const files: Record<string, string> = { ...(options.files ?? {}) }
  const readTextCalls: string[] = []
  const writes: Array<{ path: string; contents: string }> = []
  const deps: ResolveClarificationDependencies = {
    readText: async (path: string): Promise<string> => {
      readTextCalls.push(path)
      if (options.readError !== undefined) throw options.readError
      if (!(path in files)) throw enoent(`read ${path}`)
      return files[path]
    },
    writeText: async (path: string, contents: string): Promise<void> => {
      writes.push({ path, contents })
      if (options.failWrite === true) {
        throw new Error("EACCES: permission denied writing spec.md")
      }
      files[path] = contents
    },
  }
  return { deps, readTextCalls, writes }
}

/**
 * Invoke scan_clarifications with a full parent-session context (the
 * unleash-delegate.test.ts direct-factory pattern) and parse its JSON output.
 */
async function invokeScan(
  deps: ScanClarificationsDependencies,
  args: Record<string, unknown>,
): Promise<ToolResult<ScanClarificationsData>> {
  const scan = createScanClarificationsTool(FAKE_CWD, deps)
  const result = await (
    scan as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string; messageID: string; directory: string; abort: AbortSignal },
      ) => Promise<{ output: string }>
    }
  ).execute(args, {
    sessionID: "parent-session",
    messageID: "message-parent",
    directory: FAKE_CWD,
    abort: new AbortController().signal,
  })
  return JSON.parse(result.output) as ToolResult<ScanClarificationsData>
}

/** Invoke resolve_clarification the same way and parse its JSON output. */
async function invokeResolve(
  deps: ResolveClarificationDependencies,
  args: Record<string, unknown>,
): Promise<ToolResult<ResolveClarificationData>> {
  const resolveTool = createResolveClarificationTool(FAKE_CWD, deps)
  const result = await (
    resolveTool as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string; messageID: string; directory: string; abort: AbortSignal },
      ) => Promise<{ output: string }>
    }
  ).execute(args, {
    sessionID: "parent-session",
    messageID: "message-parent",
    directory: FAKE_CWD,
    abort: new AbortController().signal,
  })
  return JSON.parse(result.output) as ToolResult<ResolveClarificationData>
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
// scan_clarifications — marker extraction
// ---------------------------------------------------------------------------

describe("scan_clarifications marker extraction", () => {
  it("extracts every marker in document order with its question, 1-based line, and count", async () => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_MARKERS_AT_DENSITY_EDGES } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(3)
    expect(
      data.questions.map((question) => ({ question: question.question, line: question.line })),
    ).toStrictEqual([
      { question: "Which storage backend?", line: 2 },
      { question: "How often is flush?", line: 9 },
      { question: "What about partial writes?", line: 16 },
    ])

    // spec.md resolved repo-relative and read exactly once through the
    // injected reader; the real-filesystem surface stayed untouched.
    expect(readTextCalls).toEqual([SPEC_PATH])
    expectNoRealFilesystem()
  })

  it("builds each context as the marker line plus two on each side, truncating at the file edges", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_MARKERS_AT_DENSITY_EDGES } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.questions.map((question) => question.context)).toStrictEqual([
      // Line 2: only one line exists above the marker, so the window opens
      // at line 1 but still takes two below (lines 1-4).
      ["Intro line one.", "[NEEDS CLARIFICATION: Which storage backend?]", "Intro line three.", ""].join("\n"),
      // Line 9: the full five-line window (lines 7-11), marker mid-line.
      [
        "The engine persists envelopes locally.",
        "Data is flushed periodically.",
        "Mid-line [NEEDS CLARIFICATION: How often is flush?] with trailing text.",
        "Flushes are batched.",
        "",
      ].join("\n"),
      // Line 16: the file's last line, so the window closes at line 16
      // (lines 14-16).
      ["Crash recovery replays the log.", "", "Final [NEEDS CLARIFICATION: What about partial writes?]."].join("\n"),
    ])
  })

  it("trims leading and trailing whitespace inside the marker from the extracted question", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_PADDED_MARKER } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(1)
    // Edge runs are stripped; the internal runs survive as question text.
    expect(data.questions[0]?.question).toBe("Which   provider   backs auth?")
  })

  it("extracts two markers sharing one line, both reporting that line and the same context", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_TWO_MARKERS_ONE_LINE } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(2)
    expect(data.questions.map((question) => question.question)).toStrictEqual([
      "First question?",
      "Second question?",
    ])
    expect(data.questions.map((question) => question.line)).toStrictEqual([2, 2])
    expect(data.questions[1]?.context).toBe(data.questions[0]?.context)
  })

  it("ignores a bare [NEEDS CLARIFICATION] marker without a colon", async () => {
    const mixed = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_PLUS_FULL_MARKER } })
    const bareOnly = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_MARKER_ONLY } })

    const mixedResult = await invokeScan(mixed.deps, { feature_dir: FEATURE_DIR })
    const bareOnlyResult = await invokeScan(bareOnly.deps, { feature_dir: FEATURE_DIR })

    // Only the colon form is a question the tools can act on; the bare form
    // stays in the text for detect_resume's prefix probe (fail-safe).
    const mixedData = okData(mixedResult)
    expect(mixedData.count).toBe(1)
    expect(mixedData.questions[0]?.question).toBe("Real question?")

    const bareOnlyData = okData(bareOnlyResult)
    expect(bareOnlyData.questions).toStrictEqual([])
    expect(bareOnlyData.count).toBe(0)
  })

  it("returns an empty questions array and count 0 for a spec without markers", async () => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPECKIT_SPEC_PATH]: SPEC_NO_MARKERS } })

    const result = await invokeScan(deps, { feature_dir: SPECKIT_FEATURE_DIR })

    const data = okData(result)
    expect(data.questions).toStrictEqual([])
    expect(data.count).toBe(0)
    // The speckit dir shape resolves the same way — spec.md read once,
    // repo-relative, through the injected reader.
    expect(readTextCalls).toEqual([SPECKIT_SPEC_PATH])
  })
})

// ---------------------------------------------------------------------------
// resolve_clarification — resolution application
// ---------------------------------------------------------------------------

describe("resolve_clarification resolution application", () => {
  it("replaces the first matching marker with the answer inline and creates ## Clarifications at the bottom when absent", async () => {
    const { deps, readTextCalls, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const result = await invokeResolve(deps, RESOLVE_ARGS)

    const data = okData(result)
    expect(data).toStrictEqual({
      feature_dir: FEATURE_DIR,
      question: "What is the default timeout?",
      remaining: 1,
    })

    // Mid-line surgery: the marker's line keeps the text on both sides; the
    // second marker survives (remaining 1); the absent section appears at
    // the bottom separated by one blank line and the file gains a trailing
    // newline.
    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents:
          [
            "# Spec: gateway timeouts",
            "",
            "The gateway enforces a timeout. The default is 30 seconds. Retries are off by default.",
            "",
            "Failures return 504. [NEEDS CLARIFICATION: Should 504s retry?]",
            "",
            "## Behavior",
            "",
            "Timeouts are configurable.",
            "",
            "## Clarifications",
            "",
            "- Q: What is the default timeout? -> A: The default is 30 seconds. (Dewey-resolved from specs/018-unleash-command/spec.md)",
          ].join("\n") + "\n",
      },
    ])
    expect(readTextCalls).toEqual([SPEC_PATH])
    expectNoRealFilesystem()
  })

  it("appends the entry to an existing ## Clarifications section before the next heading", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_BEFORE_ANOTHER_HEADING } })

    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "What timeout applies?",
      answer: "60 seconds",
      source: "gateway-page",
    })

    const data = okData(result)
    expect(data).toStrictEqual({ feature_dir: FEATURE_DIR, question: "What timeout applies?", remaining: 0 })

    // The entry lands after the section's existing content, ahead of the
    // blank run that separates it from ## References.
    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents: [
          "# Spec: gateway timeouts",
          "",
          "The gateway 60 seconds enforces limits.",
          "",
          "## Clarifications",
          "",
          "- Q: Prior question -> A: Prior answer (Dewey-resolved from old-page).",
          "- Q: What timeout applies? -> A: 60 seconds (Dewey-resolved from gateway-page)",
          "",
          "## References",
          "",
          "- specs/018-unleash-command/spec.md",
        ].join("\n"),
      },
    ])
    expectNoRealFilesystem()
  })

  it("appends the entry after the section's last content line when the section is last, keeping the trailing blank", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_LAST } })

    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "Which retry policy?",
      answer: "Use exponential backoff.",
      source: "retry-page",
    })

    const data = okData(result)
    expect(data).toStrictEqual({ feature_dir: FEATURE_DIR, question: "Which retry policy?", remaining: 0 })

    // No heading bounds the section, so the entry follows the last content
    // line and the file's trailing blank stays last.
    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents: [
          "# Spec: gateway timeouts",
          "",
          "Use exponential backoff.",
          "",
          "## Clarifications",
          "",
          "- Q: Prior question -> A: Prior answer (Dewey-resolved from old-page).",
          "- Q: Which retry policy? -> A: Use exponential backoff. (Dewey-resolved from retry-page)",
          "",
        ].join("\n"),
      },
    ])
    expectNoRealFilesystem()
  })

  it("fills an empty ## Clarifications section with the entry directly after its heading", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_EMPTY_SECTION } })

    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "Which retry policy?",
      answer: "Use exponential backoff.",
      source: "retry-page",
    })

    const data = okData(result)
    expect(data).toStrictEqual({ feature_dir: FEATURE_DIR, question: "Which retry policy?", remaining: 0 })

    // Empty section: heading, one blank line, the entry, then the blank run
    // before ## References is re-established.
    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents: [
          "# Spec: gateway timeouts",
          "",
          "Use exponential backoff.",
          "",
          "## Clarifications",
          "",
          "- Q: Which retry policy? -> A: Use exponential backoff. (Dewey-resolved from retry-page)",
          "",
          "## References",
          "",
          "- one reference",
        ].join("\n"),
      },
    ])
    expectNoRealFilesystem()
  })

  it("decrements remaining per resolution until zero, leaving no markers for a follow-up scan", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const first = await invokeResolve(deps, RESOLVE_ARGS)
    const second = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "Should 504s retry?",
      answer: "No; 504s fail fast.",
      source: "gateway-page",
    })
    const scan = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    expect(okData(first).remaining).toBe(1)
    expect(okData(second).remaining).toBe(0)
    const scanned = okData(scan)
    expect(scanned.questions).toStrictEqual([])
    expect(scanned.count).toBe(0)

    // The second resolution read the file the first one wrote (the fake
    // store round-trips writes), so both entries accumulate in one section.
    expect(writes).toHaveLength(2)
    expect(writes[1]?.contents).toBe(
      [
        "# Spec: gateway timeouts",
        "",
        "The gateway enforces a timeout. The default is 30 seconds. Retries are off by default.",
        "",
        "Failures return 504. No; 504s fail fast.",
        "",
        "## Behavior",
        "",
        "Timeouts are configurable.",
        "",
        "## Clarifications",
        "",
        "- Q: What is the default timeout? -> A: The default is 30 seconds. (Dewey-resolved from specs/018-unleash-command/spec.md)",
        "- Q: Should 504s retry? -> A: No; 504s fail fast. (Dewey-resolved from gateway-page)",
        "",
      ].join("\n"),
    )
    expectNoRealFilesystem()
  })

  it("fails MARKER_NOT_FOUND when resolving the same question twice — the marker is gone", async () => {
    const { deps, writes, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const first = await invokeResolve(deps, RESOLVE_ARGS)
    expect(okData(first).remaining).toBe(1)

    const second = await invokeResolve(deps, RESOLVE_ARGS)
    const failureEnvelope = errorEnvelope(second)
    expect(failureEnvelope.code).toBe("MARKER_NOT_FOUND")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe(
      "No [NEEDS CLARIFICATION: What is the default timeout?] marker found in spec.md — it may have been resolved already",
    )

    // The second call re-read the post-resolution file (the marker really is
    // gone) and never issued a second write.
    expect(readTextCalls).toEqual([SPEC_PATH, SPEC_PATH])
    expect(writes).toHaveLength(1)
  })

  it("fails MARKER_NOT_FOUND for a question no marker carries, writing nothing", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const result = await invokeResolve(deps, { ...RESOLVE_ARGS, question: "Never asked?" })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("MARKER_NOT_FOUND")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe(
      "No [NEEDS CLARIFICATION: Never asked?] marker found in spec.md — it may have been resolved already",
    )
    expect(writes).toEqual([])
  })

  it("matches the question exactly as extracted — padded or respaced variants are not found", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_PADDED_MARKER } })

    // The raw in-marker text with its whitespace runs is not the extraction.
    const padded = await invokeResolve(deps, {
      ...RESOLVE_ARGS,
      question: "     Which   provider   backs auth?    ",
    })
    expect(errorEnvelope(padded).code).toBe("MARKER_NOT_FOUND")

    // Internal runs are significant — a respaced variant does not match.
    const respaced = await invokeResolve(deps, { ...RESOLVE_ARGS, question: "Which provider backs auth?" })
    expect(errorEnvelope(respaced).code).toBe("MARKER_NOT_FOUND")

    // The extracted form (edges trimmed, internal runs preserved) does.
    const exact = await invokeResolve(deps, { ...RESOLVE_ARGS, question: "Which   provider   backs auth?" })
    expect(okData(exact).remaining).toBe(0)
    expect(writes).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// clarify tools — failure paths
// ---------------------------------------------------------------------------

describe("clarify tools failure paths", () => {
  it("scan fails NO_SPEC with the branch gate's exact message when spec.md is missing", async () => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: {} })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("NO_SPEC")
    expect(failureEnvelope.retryable).toBe(false)
    // Message parity with the branch gate's speckit NO_SPEC STOP text: the
    // same failure reads identically wherever it surfaces.
    expect(failureEnvelope.message).toBe("No spec.md found in the feature directory. Run `/speckit.specify` first.")
    expect(readTextCalls).toEqual([SPEC_PATH])
  })

  it("resolve fails NO_SPEC with the branch gate's exact message when spec.md is missing", async () => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: {} })

    const result = await invokeResolve(deps, RESOLVE_ARGS)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("NO_SPEC")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe("No spec.md found in the feature directory. Run `/speckit.specify` first.")
    expect(readTextCalls).toEqual([SPEC_PATH])
  })

  it("scan fails SPEC_READ_FAILED on a non-ENOENT read error", async () => {
    const readError = Object.assign(new Error("EACCES: permission denied reading spec.md"), { code: "EACCES" })
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT }, readError })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("SPEC_READ_FAILED")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe("Cannot read spec.md: EACCES: permission denied reading spec.md")
    expect(readTextCalls).toEqual([SPEC_PATH])
  })

  it("resolve fails SPEC_READ_FAILED on a non-ENOENT read error", async () => {
    const readError = Object.assign(new Error("EACCES: permission denied reading spec.md"), { code: "EACCES" })
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT }, readError })

    const result = await invokeResolve(deps, RESOLVE_ARGS)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("SPEC_READ_FAILED")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe("Cannot read spec.md: EACCES: permission denied reading spec.md")
    expect(readTextCalls).toEqual([SPEC_PATH])
  })

  it("resolve fails SPEC_WRITE_FAILED when the write rejects, after composing the full updated spec", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT }, failWrite: true })

    const result = await invokeResolve(deps, RESOLVE_ARGS)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("SPEC_WRITE_FAILED")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBe("Cannot write spec.md: EACCES: permission denied writing spec.md")

    // One write was attempted with the fully composed spec — inline answer
    // and Clarifications entry — before the rejection surfaced.
    expect(writes).toHaveLength(1)
    expect(writes[0]?.path).toBe(SPEC_PATH)
    expect(writes[0]?.contents).toContain(
      "The gateway enforces a timeout. The default is 30 seconds. Retries are off by default.",
    )
    expect(writes[0]?.contents).toContain("## Clarifications")
  })

  it.each(["../secrets/", "/etc/"])(
    "rejects feature_dir %s escaping the repository root before any read",
    async (featureDir) => {
      const { deps, readTextCalls, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

      const scanResult = await invokeScan(deps, { feature_dir: featureDir })
      const resolveResult = await invokeResolve(deps, { ...RESOLVE_ARGS, feature_dir: featureDir })

      const scanFailure = errorEnvelope(scanResult)
      expect(scanFailure.code).toBe("FEATURE_DIR_TRAVERSAL")
      expect(scanFailure.retryable).toBe(false)
      expect(scanFailure.message).toBe("Path traversal blocked: feature_dir resolves outside the repository root")

      const resolveFailure = errorEnvelope(resolveResult)
      expect(resolveFailure.code).toBe("FEATURE_DIR_TRAVERSAL")
      expect(resolveFailure.retryable).toBe(false)
      expect(resolveFailure.message).toBe("Path traversal blocked: feature_dir resolves outside the repository root")

      // Rejected before any file read or write.
      expect(readTextCalls).toEqual([])
      expect(writes).toEqual([])
    },
  )

  it.each([
    ["an extra key", { feature_dir: FEATURE_DIR, unexpected: "value" }, "unexpected"],
    ["an empty feature_dir", { feature_dir: "" }, "feature_dir"],
    ["a missing feature_dir", {}, "feature_dir"],
  ])("scan rejects %s with INVALID_INPUT before any read", async (_description, args, messagePart) => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const result = await invokeScan(deps, args)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    // The zod issue details name the offending field.
    expect(failureEnvelope.message).toContain(messagePart)
    expect(readTextCalls).toEqual([])
  })

  it.each([
    ["an extra key", { ...RESOLVE_ARGS, unexpected: "value" }, "unexpected"],
    ["an empty question", { ...RESOLVE_ARGS, question: "" }, "question"],
    ["an empty answer", { ...RESOLVE_ARGS, answer: "" }, "answer"],
    ["an empty source", { ...RESOLVE_ARGS, source: "" }, "source"],
    ["a missing question", { feature_dir: FEATURE_DIR }, "question"],
  ])("resolve rejects %s with INVALID_INPUT before any read", async (_description, args, messagePart) => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const result = await invokeResolve(deps, args)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toContain(messagePart)
    expect(readTextCalls).toEqual([])
  })
})
