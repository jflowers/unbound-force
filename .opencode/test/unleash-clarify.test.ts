import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

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
// Scope (tasks 4.7 unleash-deterministic-tools and 3.1
// clarification-marker-superset)
// ---------------------------------------------------------------------------

// The clarify tools are the mechanics half of /uf.unleash Step 1 (D8): scan
// extracts clarification markers, resolve applies one answer. Whether Dewey
// is AVAILABLE — and therefore whether a question auto-resolves or exits
// for the human — is command-prose judgment, not tool behavior, so nothing
// here asserts it. Markers take three grammar forms, single-sourced in one
// shared pattern: the colon form `[NEEDS CLARIFICATION: <question>]`, the
// bare-with-text form, and the completely bare form. The bare forms extract
// as unscoped questions — the bare form's question is its own raw marker
// text — so every marker that holds clarify open surfaces in scan output
// with a resolution path. Marker-like text outside the grammar (pluralized
// or unterminated) extracts nothing and cannot block; the grammar-derived
// detect_resume probe is the resume suite's concern.

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The clarify tools take all I/O through injected readText/writeText
// dependencies (no git, no checkpoint, no direct node:fs). Mocking the
// node:fs surface anyway (the sibling unleash-* recipe) makes that an
// executable guarantee: expectNoRealFilesystem() fails these tests the
// moment a regression reaches past the injected fakes — including a
// checkpoint write, which clarify completion deliberately never performs.
// The source-scan case at the bottom of this file is the one deliberate
// exception: it bypasses the mock (vi.importActual) to read the plugin
// source itself, never a spec.md fixture.
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

/**
 * Real uf-workflow plugin source for the single-sourcing source-scan case —
 * resolved from this test file's own URL so the suite never depends on the
 * working directory vitest was invoked from.
 */
const PLUGIN_SOURCE_PATH = fileURLToPath(new URL("../plugins/uf-workflow/index.ts", import.meta.url))

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

/**
 * A bare marker (no colon) next to a full one — both extract now: the bare
 * form as its own raw marker text, the colon form as its scoped question.
 */
const SPEC_BARE_AND_FULL_MARKERS = [
  "# Spec: mixed markers",
  "",
  "Bare [NEEDS CLARIFICATION] and full [NEEDS CLARIFICATION: Real question?] markers.",
].join("\n")

/** Only the bare form — its question is its own raw marker text. */
const SPEC_BARE_MARKER_ONLY = [
  "# Spec: bare marker",
  "",
  "A bare [NEEDS CLARIFICATION] marker without a colon.",
].join("\n")

/** Bare-with-text marker — the trailing text is an unscoped question. */
const SPEC_BARE_WITH_TEXT = [
  "# Spec: bare-with-text marker",
  "",
  "Retries [NEEDS CLARIFICATION retry count] are configurable.",
].join("\n")

/**
 * Spaced colon — a malformed colon form: the colon must hug the marker
 * phrase, so this degrades to the bare-with-text branch with the colon
 * retained in the question.
 */
const SPEC_SPACED_COLON = [
  "# Spec: spaced colon",
  "",
  "Quota [NEEDS CLARIFICATION : q] is unclear.",
].join("\n")

/**
 * Whitespace runs inside a bare-with-text marker: flanking runs are marker
 * syntax (trimmed), internal runs are content (preserved) — the padded
 * contract the colon form's fixture above pins.
 */
const SPEC_PADDED_BARE_WITH_TEXT = [
  "# Spec: padded bare-with-text marker",
  "",
  "Retries [NEEDS CLARIFICATION     how   many   attempts?    ] keep internal spacing.",
].join("\n")

/**
 * Colon form with an empty question — the raw-text fallback keeps the
 * scanned question non-empty so resolve_clarification accepts it.
 */
const SPEC_COLON_EMPTY = [
  "# Spec: empty colon question",
  "",
  "The team left [NEEDS CLARIFICATION: ] without text.",
].join("\n")

/**
 * Marker-like text outside the grammar: the pluralized form (the trailing
 * S defeats every branch) and an unterminated phrase (no closing bracket).
 * Neither extracts, so neither holds clarify open.
 */
const SPEC_MARKER_LIKE_TEXT = [
  "# Spec: marker-like text",
  "",
  "The pluralized [NEEDS CLARIFICATIONS] mentions many questions.",
  "The unterminated [NEEDS CLARIFICATION never closes its bracket.",
].join("\n")

/**
 * Well-formed marker text as mentions — one inside a fenced code block,
 * one inside a backtick span: the grammar matches per line over all lines
 * with no code-fence or backtick exclusion (design D4), so both extract
 * as questions like any other marker and keep a visible resolution path.
 */
const SPEC_FENCED_AND_BACKTICK_MENTIONS = [
  "# Spec: fenced and quoted mentions",
  "",
  "```",
  "[NEEDS CLARIFICATION: fenced example]",
  "```",
  "",
  "A backtick span `[NEEDS CLARIFICATION retry count]` quotes the marker inline.",
].join("\n")

/**
 * A colon-form question longer than the resolve schema's 4096-character
 * bound: extraction is length-unbounded, so scan surfaces the question
 * while resolve_clarification's input validation rejects it — the residual
 * wedge at the schema's upper bound, inherited from the colon form.
 */
const OVER_LONG_QUESTION = "a".repeat(5000)
const SPEC_OVER_LONG_MARKER = [
  "# Spec: over-long question",
  "",
  `A colon-form marker [NEEDS CLARIFICATION: ${OVER_LONG_QUESTION}] longer than the schema bound.`,
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

/** Count non-overlapping occurrences of `needle` in `haystack`. */
function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
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

  it("extracts a bare marker without a colon as its own raw marker text", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_MARKER_ONLY } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(1)
    // No colon and no trailing text: the question falls back to the raw
    // marker text, keeping the scanned question non-empty so the
    // resolution round-trip below has an exact string to match.
    expect(data.questions[0]?.question).toBe("[NEEDS CLARIFICATION]")
    expect(data.questions[0]?.line).toBe(3)
  })

  it("extracts bare and colon markers side by side, each as its own question", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_AND_FULL_MARKERS } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(2)
    // Document order preserved from one shared line: the bare form scans
    // as its raw text, the colon form as its scoped question.
    expect(
      data.questions.map((question) => ({ question: question.question, line: question.line })),
    ).toStrictEqual([
      { question: "[NEEDS CLARIFICATION]", line: 3 },
      { question: "Real question?", line: 3 },
    ])
  })

  it("extracts a bare-with-text marker as an unscoped question", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_WITH_TEXT } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(1)
    // The whitespace-separated trailing text is the question. The leading
    // whitespace requirement is what keeps suffix-glued text (the
    // pluralized form below) outside the grammar.
    expect(data.questions[0]?.question).toBe("retry count")
    expect(data.questions[0]?.line).toBe(3)
  })

  it("degrades a spaced colon to the unscoped branch, keeping the colon in the question", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SPACED_COLON } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(1)
    // The colon form requires the colon directly after the marker phrase;
    // the spaced variant falls through to bare-with-text with the colon
    // kept as question text rather than dropping the marker.
    expect(data.questions[0]?.question).toBe(": q")
  })

  it("trims flanking whitespace inside a bare-with-text marker, preserving internal runs", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_PADDED_BARE_WITH_TEXT } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(1)
    // The colon form's padded-marker contract, verbatim: edge runs are
    // marker syntax, internal runs are content.
    expect(data.questions[0]?.question).toBe("how   many   attempts?")
  })

  it("falls back to the raw marker text when the colon form's question is empty", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_COLON_EMPTY } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(1)
    // The empty colon form used to report an unresolvable empty question;
    // the fallback reuses the raw marker text so resolve accepts it.
    expect(data.questions[0]?.question).toBe("[NEEDS CLARIFICATION: ]")
  })

  it("does not extract pluralized or unterminated marker-like text", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_MARKER_LIKE_TEXT } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    // Outside the grammar there is no resolution path, so scan reports
    // nothing: the pluralized trailing S defeats every branch, and the
    // unterminated phrase never closes its bracket.
    expect(data.questions).toStrictEqual([])
    expect(data.count).toBe(0)
  })

  it("extracts marker text inside fenced code blocks and backtick spans as questions (no fence exclusion)", async () => {
    const { deps } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_FENCED_AND_BACKTICK_MENTIONS } })

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const data = okData(result)
    expect(data.count).toBe(2)
    // Documentation mentions extract like any grammar-matched marker: the
    // grammar has no code-fence or backtick exclusion (design D4), so the
    // fenced colon form and the backtick-quoted bare-with-text form both
    // surface with a visible resolution path.
    expect(
      data.questions.map((question) => ({ question: question.question, line: question.line })),
    ).toStrictEqual([
      { question: "fenced example", line: 4 },
      { question: "retry count", line: 7 },
    ])
    // The fence and the backtick span ride along in the context window,
    // confirming both extractions happened inside them.
    expect(data.questions[0]?.context).toContain("[NEEDS CLARIFICATION: fenced example]")
    expect(data.questions[1]?.context).toContain("`[NEEDS CLARIFICATION retry count]`")
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

  it("resolves a bare marker by its scanned raw-text question, splicing the answer inline", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_MARKER_ONLY } })

    // Round-trip, first half: the bare form scans as its own raw marker
    // text, and that exact string is what resolves it.
    const scan = await invokeScan(deps, { feature_dir: FEATURE_DIR })
    expect(okData(scan).questions.map((question) => question.question)).toStrictEqual([
      "[NEEDS CLARIFICATION]",
    ])

    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "[NEEDS CLARIFICATION]",
      answer: "The marker carried no question text; resolved from context.",
      source: "bare-marker-page",
    })

    expect(okData(result)).toStrictEqual({
      feature_dir: FEATURE_DIR,
      question: "[NEEDS CLARIFICATION]",
      // remaining counts the Clarifications entry's own mention of the raw
      // marker text — itself a grammar match under the accepted mention
      // trade-off (design D4) — not an unresolved original marker.
      remaining: 1,
    })

    // The marker is gone from its mid-line position, the answer is spliced
    // in with both sides kept, and the entry lands under the scanned
    // question text in a section created at the bottom.
    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents:
          [
            "# Spec: bare marker",
            "",
            "A bare The marker carried no question text; resolved from context. marker without a colon.",
            "",
            "## Clarifications",
            "",
            "- Q: [NEEDS CLARIFICATION] -> A: The marker carried no question text; resolved from context. (Dewey-resolved from bare-marker-page)",
          ].join("\n") + "\n",
      },
    ])

    // The follow-up scan surfaces the entry's mention as the one remaining
    // question — the visible resolution path the mention trade-off keeps
    // (a human resolves or removes it like any other marker).
    const rescan = await invokeScan(deps, { feature_dir: FEATURE_DIR })
    expect(okData(rescan).questions.map((question) => question.question)).toStrictEqual([
      "[NEEDS CLARIFICATION]",
    ])
    expectNoRealFilesystem()
  })

  it("resolves a colon-empty marker through its fallback question", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_COLON_EMPTY } })

    // The fallback question is the raw marker text; resolving passes it
    // back exactly as scanned, as with every other grammar form.
    const scan = await invokeScan(deps, { feature_dir: FEATURE_DIR })
    expect(okData(scan).questions.map((question) => question.question)).toStrictEqual([
      "[NEEDS CLARIFICATION: ]",
    ])

    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "[NEEDS CLARIFICATION: ]",
      answer: "Filled in after review.",
      source: "empty-question-page",
    })

    expect(okData(result)).toStrictEqual({
      feature_dir: FEATURE_DIR,
      question: "[NEEDS CLARIFICATION: ]",
      // Same mechanism as the bare round-trip: the entry's mention of the
      // raw marker text is the one remaining grammar match.
      remaining: 1,
    })

    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents:
          [
            "# Spec: empty colon question",
            "",
            "The team left Filled in after review. without text.",
            "",
            "## Clarifications",
            "",
            "- Q: [NEEDS CLARIFICATION: ] -> A: Filled in after review. (Dewey-resolved from empty-question-page)",
          ].join("\n") + "\n",
      },
    ])
  })

  it("resolves a bare-with-text marker by its extracted unscoped question", async () => {
    const { deps, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_WITH_TEXT } })

    const scan = await invokeScan(deps, { feature_dir: FEATURE_DIR })
    expect(okData(scan).questions.map((question) => question.question)).toStrictEqual([
      "retry count",
    ])

    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: "retry count",
      answer: "Three attempts with backoff.",
      source: "retry-page",
    })

    // The logged question is plain text — no marker syntax — so the entry
    // adds no mention match and remaining reaches zero.
    expect(okData(result)).toStrictEqual({
      feature_dir: FEATURE_DIR,
      question: "retry count",
      remaining: 0,
    })

    expect(writes).toEqual([
      {
        path: SPEC_PATH,
        contents:
          [
            "# Spec: bare-with-text marker",
            "",
            "Retries Three attempts with backoff. are configurable.",
            "",
            "## Clarifications",
            "",
            "- Q: retry count -> A: Three attempts with backoff. (Dewey-resolved from retry-page)",
          ].join("\n") + "\n",
      },
    ])
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

  it("fails MARKER_NOT_FOUND when the question matches no extracted marker — raw-text variants and marker-like text included", async () => {
    const bare = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_BARE_MARKER_ONLY } })
    const markerLike = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_MARKER_LIKE_TEXT } })

    // The bare marker's question is its full raw text, brackets included;
    // the bare phrase without them is a different string and does not match.
    const unbracketed = await invokeResolve(bare.deps, {
      ...RESOLVE_ARGS,
      question: "NEEDS CLARIFICATION",
    })
    const unbracketedFailure = errorEnvelope(unbracketed)
    expect(unbracketedFailure.code).toBe("MARKER_NOT_FOUND")
    expect(unbracketedFailure.retryable).toBe(false)
    expect(unbracketedFailure.message).toBe(
      "No [NEEDS CLARIFICATION: NEEDS CLARIFICATION] marker found in spec.md — it may have been resolved already",
    )
    expect(bare.writes).toEqual([])

    // Marker-like text outside the grammar never extracts, so no marker
    // carries its question either — there is no resolution path for it.
    const pluralized = await invokeResolve(markerLike.deps, {
      ...RESOLVE_ARGS,
      question: "[NEEDS CLARIFICATIONS]",
    })
    expect(errorEnvelope(pluralized).code).toBe("MARKER_NOT_FOUND")
    expect(markerLike.writes).toEqual([])
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
    ["a pathspec-magic feature_dir", { feature_dir: ":(glob)specs/*" }, "feature_dir"],
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
    ["a pathspec-magic feature_dir", { ...RESOLVE_ARGS, feature_dir: ":" }, "feature_dir"],
  ])("resolve rejects %s with INVALID_INPUT before any read", async (_description, args, messagePart) => {
    const { deps, readTextCalls } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_SECTION_ABSENT } })

    const result = await invokeResolve(deps, args)

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toContain(messagePart)
    expect(readTextCalls).toEqual([])
  })

  it("surfaces an over-long question in scan; resolution is rejected at the schema bound before MARKER_NOT_FOUND", async () => {
    const { deps, readTextCalls, writes } = fakeSpecDeps({ files: { [SPEC_PATH]: SPEC_OVER_LONG_MARKER } })

    // Scan surfaces the over-long question like any grammar match —
    // non-empty, with its line and context — so the blocked question stays
    // visible even though no tool can resolve it.
    const scan = await invokeScan(deps, { feature_dir: FEATURE_DIR })
    const scanned = okData(scan)
    expect(scanned.count).toBe(1)
    expect(scanned.questions[0]?.question).toBe(OVER_LONG_QUESTION)
    expect(scanned.questions[0]?.line).toBe(3)
    expect(scanned.questions[0]?.context).toContain(`[NEEDS CLARIFICATION: ${OVER_LONG_QUESTION}]`)

    // Resolution cannot take the question back: the schema bound (max 4096)
    // rejects the input before the tool executes. The failure is
    // INVALID_INPUT naming the question and its length bound — not
    // MARKER_NOT_FOUND — and the rejected call never read spec.md itself
    // (the scan's read is the only one) nor attempted a write.
    const result = await invokeResolve(deps, {
      feature_dir: FEATURE_DIR,
      question: OVER_LONG_QUESTION,
      answer: "Too long to resolve through the tool.",
      source: "over-long-page",
    })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("INVALID_INPUT")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toContain("question")
    expect(failureEnvelope.message).toContain("4096")
    expect(readTextCalls).toEqual([SPEC_PATH])
    expect(writes).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Catch-all fail-closed behavior (round-5 review advisory)
// ---------------------------------------------------------------------------

describe("clarify tools fail closed on unexpected runtime failures", () => {
  it("scan_clarifications wraps a contract-breaking reader as SCAN_CLARIFICATIONS_ERROR", async () => {
    // readSpecText converts a throwing reader to NO_SPEC / SPEC_READ_FAILED;
    // a reader that resolves a non-string breaks the contract past those
    // specific handlers, exercising the tool's catch-all envelope.
    const deps: ScanClarificationsDependencies = {
      readText: async () => 42 as unknown as string,
    }

    const result = await invokeScan(deps, { feature_dir: FEATURE_DIR })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("SCAN_CLARIFICATIONS_ERROR")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBeTruthy()
  })

  it("resolve_clarification wraps a contract-breaking reader as RESOLVE_CLARIFICATION_ERROR", async () => {
    const deps: ResolveClarificationDependencies = {
      readText: async () => 42 as unknown as string,
      writeText: async () => {},
    }

    const result = await invokeResolve(deps, { ...RESOLVE_ARGS })

    const failureEnvelope = errorEnvelope(result)
    expect(failureEnvelope.code).toBe("RESOLVE_CLARIFICATION_ERROR")
    expect(failureEnvelope.retryable).toBe(false)
    expect(failureEnvelope.message).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Plugin source — grammar single-sourcing (source-scan case)
// ---------------------------------------------------------------------------

describe("plugin source grammar single-sourcing", () => {
  it("keeps exactly one marker grammar — CLARIFICATION_MARKER_PREFIX is absent", async () => {
    // The suite's one deliberate real-file read (spec scenario
    // "Single-sourcing pinned by source scan"): the node:fs mock guards the
    // tools' injected-fake contract, and this test bypasses it through the
    // actual module to read the plugin's own source — never a spec.md
    // fixture — so expectNoRealFilesystem does not apply here.
    const realFs = await vi.importActual<typeof import("node:fs")>("node:fs")
    const source = realFs.readFileSync(PLUGIN_SOURCE_PATH, "utf8")

    // The prefix constant is deleted entirely — no consumer may fall back
    // to a prefix-substring grammar beside the shared pattern.
    expect(source).not.toContain("CLARIFICATION_MARKER_PREFIX")

    // Exactly one marker-grammar pattern exists: one regex literal carrying
    // the escaped opening bracket. A reintroduced second grammar — under
    // any constant name — would carry a second escaped literal and fail
    // this count.
    expect(countOccurrences(source, "\\[NEEDS CLARIFICATION")).toBe(1)

    // The escaped literal belongs to the shared constant — declared exactly
    // once as the single grammar definition the extractor paths reference.
    expect(countOccurrences(source, "const CLARIFICATION_MARKER_PATTERN")).toBe(1)
  })
})
