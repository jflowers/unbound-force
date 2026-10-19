import { Buffer } from "node:buffer"
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { sanitizeSlug, type ToolResult } from "../lib/uf-workflow-types.js"
import {
  createWriteUnleashSummaryTool,
  type GitExec,
  type UnleashSummary,
  type WriteUnleashSummaryData,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// write_unleash_summary persists through real node:fs calls (lstat, mkdir,
// writeFileSync — no injected write deps, D7). Mocking the three functions
// that path uses (the unleash-branch-gate.test.ts recipe) keeps every test
// off the real filesystem: the write is observed through the recorded
// calls instead of performed. existsSync and readFileSync are mocked so
// tests can prove the writer never probes existence or reads anything —
// lstat is its only pre-write check.
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

/** Artifact directory the tool owns, resolved against the fake root. */
const SUMMARY_ROOT = resolve(FAKE_CWD, ".uf/artifacts/unleash-summary")

/** The demo payload — the same values format_unleash_demo renders (D6/D7). */
const DEMO_INPUT = {
  change_name: "some-change",
  tier: "openspec",
  feature_dir: "openspec/changes/some-change/",
  review_verdicts: {
    spec_review: { verdict: "APPROVE", iterations: 1 },
    code_review: { verdict: "APPROVE WITH ADVISORIES", iterations: 2 },
  },
  learnings_stored: [
    ".uf/dewey/learnings/artifact-contracts-20261015T123100-jay-flowers.md",
    ".uf/dewey/learnings/uf-workflow-testing-20261015T213217-jay-flowers.md",
  ],
  // The em dashes make the payload multibyte, so the bytes assertion
  // exercises UTF-8 byte counting rather than string length.
  whatWasBuilt:
    "Seven deterministic /uf.unleash tools — branch gate, resume detection, clarification mechanics, " +
    "delegation, exit and demo renderers, and the summary writer — replace the command's LLM-judgment mechanics.",
  howToVerify: "cd .opencode && npx vitest run, then make check from the repository root.",
  testResults: "make plugin-test green: every vitest suite passing, 0 failed.",
}

/** The artifact the tool must write for DEMO_INPUT (timestamp aside). */
const EXPECTED_ARTIFACT = {
  changeName: DEMO_INPUT.change_name,
  tier: DEMO_INPUT.tier,
  featureDir: DEMO_INPUT.feature_dir,
  reviewVerdicts: {
    specReview: DEMO_INPUT.review_verdicts.spec_review,
    codeReview: DEMO_INPUT.review_verdicts.code_review,
  },
  learningsStored: DEMO_INPUT.learnings_stored,
  whatWasBuilt: DEMO_INPUT.whatWasBuilt,
  howToVerify: DEMO_INPUT.howToVerify,
  testResults: DEMO_INPUT.testResults,
  // Provenance block pinned by the persist-unleash-summary FR-002 scenario.
  artifact_type: "unleash-summary",
  schema_version: 1,
  branch: "opsx/some-change",
}

/** Recording GitExec answering the branch read with a canned branch. */
function recordingExec(
  branch = "opsx/some-change",
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
 * The exact read-side path derivation uf_finale_pr_context applies
 * (uf-finale/index.ts, "Unleash summary artifact" block): sanitizeSlug of
 * the branch under the artifact directory. Asserting against this proves
 * the writer and the reader cannot disagree about the location.
 */
function consumerPath(branch: string): string {
  return resolve(FAKE_CWD, `.uf/artifacts/unleash-summary/${sanitizeSlug(branch)}.json`)
}

/** Node-shaped ENOENT error so the symlink guards treat a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

/** lstat stats reporting a symlink — the shape the refusals key on. */
function symlinkStats(): ReturnType<typeof lstatSync> {
  return { isSymbolicLink: () => true } as unknown as ReturnType<typeof lstatSync>
}

/** lstat stats reporting an existing regular file or directory. */
function regularStats(): ReturnType<typeof lstatSync> {
  return { isSymbolicLink: () => false } as unknown as ReturnType<typeof lstatSync>
}

/** DEMO_INPUT minus one key, for missing-required-field validation. */
function withoutKey(key: string): Record<string, unknown> {
  const args: Record<string, unknown> = { ...DEMO_INPUT }
  delete args[key]
  return args
}

/** Invoke the summary tool with a full parent-session context and parse its JSON output. */
async function invokeSummary(
  exec: GitExec,
  args: Record<string, unknown>,
): Promise<ToolResult<WriteUnleashSummaryData>> {
  const summaryTool = createWriteUnleashSummaryTool(exec, FAKE_CWD)
  const result = await (
    summaryTool as {
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
  return JSON.parse(result.output) as ToolResult<WriteUnleashSummaryData>
}

/** The single writeFileSync call the tool performed (path, contents, options). */
function writtenSummary(): { path: string; raw: string; options: unknown } {
  expect(writeFileSync).toHaveBeenCalledTimes(1)
  const [pathArg, rawArg, optionsArg] = vi.mocked(writeFileSync).mock.calls[0]
  return { path: String(pathArg), raw: rawArg as string, options: optionsArg }
}

beforeEach(() => {
  vi.resetAllMocks()
  // Default filesystem simulation: no existing artifact file or artifact
  // directory, so every test starts from a first write. The thrown error
  // must carry code "ENOENT" — a plain Error fails the isEnoent check.
  vi.mocked(lstatSync).mockImplementation(() => {
    throw enoent("lstat summary path")
  })
})

// ---------------------------------------------------------------------------
// write_unleash_summary — success and artifact shape
// ---------------------------------------------------------------------------

describe("write_unleash_summary success and artifact shape", () => {
  it("writes the artifact at the slug-sanitized branch path uf_finale_pr_context reads, returning path and bytes", async () => {
    const { exec, calls: execCalls } = recordingExec("opsx/some-change")
    const result = await invokeSummary(exec, DEMO_INPUT)

    expect(result.status).toBe("ok")

    // Exactly one git invocation — the branch read the file name derives
    // from — against the injected cwd; no real git subprocess ever runs.
    expect(execCalls).toEqual([{ args: ["rev-parse", "--abbrev-ref", "HEAD"], cwd: FAKE_CWD }])

    const { path, raw } = writtenSummary()
    expect(path).toBe(resolve(SUMMARY_ROOT, "opsx-some-change.json"))
    expect(path).toBe(consumerPath("opsx/some-change"))

    if (result.status === "ok") {
      // bytes is the UTF-8 byte length of exactly what hit the disk,
      // trailing newline included (the payload is multibyte, so this is
      // byte counting, not string length); branch echoes the raw branch
      // name the artifact was keyed by (persist-unleash-summary FR-005).
      expect(result.data).toStrictEqual({
        path: consumerPath("opsx/some-change"),
        bytes: Buffer.byteLength(raw, "utf-8"),
        branch: "opsx/some-change",
      })
    }

    // The writer's only filesystem surface is lstat + mkdir + write — no
    // existence probe, no read.
    expect(existsSync).not.toHaveBeenCalled()
    expect(readFileSync).not.toHaveBeenCalled()
  })

  it("writes the camelCase artifact shape uf_finale_pr_context consumes, mapping snake_case inputs and stamping timestamp server-side", async () => {
    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)
    expect(result.status).toBe("ok")

    const { raw } = writtenSummary()
    const artifact = JSON.parse(raw) as Record<string, unknown>

    // The exact top-level key set: camelCase workflow metadata and the
    // three finale contract fields, closed out by the snake_case
    // provenance block the persist-unleash-summary FR-002 scenario pins.
    expect(Object.keys(artifact)).toEqual([
      "changeName",
      "tier",
      "featureDir",
      "reviewVerdicts",
      "learningsStored",
      "whatWasBuilt",
      "howToVerify",
      "testResults",
      "artifact_type",
      "schema_version",
      "branch",
      "timestamp",
    ])

    // timestamp is stamped at write time (server-side ISO 8601) — the
    // strict input schema leaves no caller-supplied timestamp to leak.
    const { timestamp, ...artifactFields } = artifact
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

    // Snake_case parameters map to the camelCase artifact fields, and the
    // nested verdicts rename to specReview/codeReview without leaking
    // their input keys.
    expect(artifactFields).toStrictEqual(EXPECTED_ARTIFACT)

    // The three consumer fields are byte-equal to the tool inputs — the
    // rendered demo and the persisted artifact cannot drift (D6/D7).
    expect(artifact.whatWasBuilt).toBe(DEMO_INPUT.whatWasBuilt)
    expect(artifact.howToVerify).toBe(DEMO_INPUT.howToVerify)
    expect(artifact.testResults).toBe(DEMO_INPUT.testResults)

    // Pretty-printed JSON (2-space indent) with a trailing newline — the
    // round-trip through the parsed artifact pins the exact format.
    expect(raw).toBe(JSON.stringify(artifact, null, 2) + "\n")
  })

  it("records empty learnings and omitted review gates as empty collections", async () => {
    const result = await invokeSummary(recordingExec("018-unleash-command").exec, {
      ...DEMO_INPUT,
      change_name: "unleash-command",
      tier: "speckit",
      feature_dir: "specs/018-unleash-command/",
      review_verdicts: {},
      learnings_stored: [],
    })
    expect(result.status).toBe("ok")

    const { path, raw } = writtenSummary()
    // A speckit branch slug lands the artifact under the same derivation.
    expect(path).toBe(consumerPath("018-unleash-command"))

    const artifact = JSON.parse(raw) as UnleashSummary
    expect(artifact.tier).toBe("speckit")
    // A gate the pipeline did not reach is omitted; learnings may
    // legitimately be empty when the retrospective stored none.
    expect(artifact.reviewVerdicts).toStrictEqual({})
    expect(artifact.learningsStored).toStrictEqual([])
  })
})

// ---------------------------------------------------------------------------
// write_unleash_summary — write hygiene
// ---------------------------------------------------------------------------

describe("write_unleash_summary write hygiene", () => {
  it("creates the artifact directory 0o700 recursive and the file 0o600, replacing an existing regular artifact", async () => {
    // An existing regular artifact and directory at the target: a resumed
    // demo rewrites the artifact rather than refusing (D7).
    vi.mocked(lstatSync).mockImplementation(() => regularStats())

    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)
    expect(result.status).toBe("ok")

    expect(mkdirSync).toHaveBeenCalledTimes(1)
    const [mkdirPathArg, mkdirOptions] = vi.mocked(mkdirSync).mock.calls[0]
    expect(mkdirPathArg).toBe(SUMMARY_ROOT)
    expect(mkdirOptions).toStrictEqual({ recursive: true, mode: 0o700 })

    const { path, options } = writtenSummary()
    expect(path).toBe(consumerPath("opsx/some-change"))
    expect(options).toStrictEqual({ mode: 0o600 })
  })
})

// ---------------------------------------------------------------------------
// write_unleash_summary — symlink refusal
// ---------------------------------------------------------------------------

describe("write_unleash_summary symlink refusal", () => {
  it("refuses a symlinked artifact path with SUMMARY_PATH_IS_SYMLINK, writing nothing", async () => {
    const target = consumerPath("opsx/some-change")
    vi.mocked(lstatSync).mockImplementation((pathArg: unknown) => {
      if (String(pathArg) === target) return symlinkStats()
      throw new Error(`unexpected lstat target: ${String(pathArg)}`)
    })

    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("SUMMARY_PATH_IS_SYMLINK")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(`Refusing to write unleash summary through symlinked path: ${target}`)
    }
    // Refused before any directory creation or write — writeFileSync
    // would follow the symlink and write outside the artifact directory.
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("refuses a symlinked artifact directory with SUMMARY_DIR_IS_SYMLINK, writing nothing", async () => {
    vi.mocked(lstatSync).mockImplementation((pathArg: unknown) => {
      if (String(pathArg) === SUMMARY_ROOT) return symlinkStats()
      throw enoent(`lstat ${String(pathArg)}`)
    })

    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("SUMMARY_DIR_IS_SYMLINK")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("Refusing to write into symlinked directory: .uf/artifacts/unleash-summary/")
    }
    // Refused before the recursive mkdir could create or follow anything.
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// write_unleash_summary — path confinement
// ---------------------------------------------------------------------------

// Deviation note (traversal coverage): the SUMMARY_PATH_TRAVERSAL return
// is unreachable through the tool's public surface. The file name is
// always sanitizeSlug(branch), whose alphabet [a-zA-Z0-9._-] cannot
// express a path separator or a `..` segment (dot runs collapse), so
// resolving the relative name under summaryRoot can never escape the
// prefix — the guard is defense in depth behind the sanitizer. The tests
// below cover the guard's reachable behavior: hostile branch names
// neutralize into slugs that stay inside the artifact directory.
describe("write_unleash_summary path confinement", () => {
  it("neutralizes traversal-shaped branch names into slugs confined under the artifact directory", async () => {
    const result = await invokeSummary(recordingExec("../../../outside/secrets").exec, DEMO_INPUT)

    expect(result.status).toBe("ok")
    const { path } = writtenSummary()
    // `../../../outside/secrets` sanitizes to `.-.-.-outside-secrets` —
    // no separators, no dot-dot — and the write passes the prefix check.
    expect(path).toBe(resolve(SUMMARY_ROOT, ".-.-.-outside-secrets.json"))
    expect(path.startsWith(SUMMARY_ROOT + "/")).toBe(true)
  })

  it("truncates branch names beyond the 100-character slug limit", async () => {
    const longBranch = "opsx/" + "a".repeat(120)
    const result = await invokeSummary(recordingExec(longBranch).exec, DEMO_INPUT)

    expect(result.status).toBe("ok")
    const { path } = writtenSummary()
    expect(path).toBe(resolve(SUMMARY_ROOT, "opsx-" + "a".repeat(95) + ".json"))
  })
})

// ---------------------------------------------------------------------------
// write_unleash_summary — input validation
// ---------------------------------------------------------------------------

describe("write_unleash_summary input validation", () => {
  // The three demo-content parameters follow the persist-unleash-summary
  // FR-004 contract: missing, empty, and whitespace-only values all fail
  // with INVALID_UNLEASH_SUMMARY before any side effect, so /uf.finale
  // keeps its no-artifact fallback rather than preferring an empty
  // artifact.
  it.each([
    ["an empty whatWasBuilt", { ...DEMO_INPUT, whatWasBuilt: "" }, "whatWasBuilt"],
    ["a whitespace-only howToVerify", { ...DEMO_INPUT, howToVerify: "   \n\t " }, "howToVerify"],
    ["a missing testResults", withoutKey("testResults"), "testResults"],
  ])("rejects %s with INVALID_UNLEASH_SUMMARY before any git or filesystem activity", async (_description, args, messagePart) => {
    const { exec, calls: execCalls } = recordingExec()
    const result = await invokeSummary(exec, args)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_UNLEASH_SUMMARY")
      expect(result.retryable).toBe(false)
      expect(result.message).toContain(messagePart)
      expect(result.message).toContain("non-empty")
    }
    // Rejected before any git or filesystem activity.
    expect(execCalls).toEqual([])
    expect(lstatSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  // Structural parameters keep the plugin-wide zod INVALID_INPUT code.
  it.each([
    ["a missing required field", withoutKey("change_name"), "change_name"],
    ["an invalid tier", { ...DEMO_INPUT, tier: "tactical" }, "tier"],
    ["an unknown extra key", { ...DEMO_INPUT, surprise: "nope" }, "surprise"],
  ])("rejects %s with INVALID_INPUT before any git or filesystem activity", async (_description, args, messagePart) => {
    const { exec, calls: execCalls } = recordingExec()
    const result = await invokeSummary(exec, args)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_INPUT")
      expect(result.retryable).toBe(false)
      // The zod issue details name the offending field.
      expect(result.message).toContain(messagePart)
    }
    // Rejected before any git or filesystem activity.
    expect(execCalls).toEqual([])
    expect(lstatSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  // Quick-tier summaries carry no feature directory (unleash-tier-routing
  // D7): the parameter is optional for that tier alone, mirroring the
  // detect_resume contract. The artifact records the empty string so the
  // camelCase schema stays uniform for the finale consumer.
  it("accepts a quick-tier summary without feature_dir and records an empty featureDir", async () => {
    const { exec } = recordingExec("quick/fix-typo")
    const { feature_dir: _omitted, ...quickInput } = DEMO_INPUT
    const result = await invokeSummary(exec, {
      ...quickInput,
      change_name: "fix-typo",
      tier: "quick",
      // Quick changes never run the spec review gate — code review only.
      review_verdicts: { code_review: { verdict: "APPROVE", iterations: 1 } },
    })

    expect(result.status).toBe("ok")
    const { path, raw } = writtenSummary()
    expect(path).toBe(consumerPath("quick/fix-typo"))

    const artifact = JSON.parse(raw) as UnleashSummary
    expect(artifact.tier).toBe("quick")
    expect(artifact.featureDir).toBe("")
    expect(artifact.reviewVerdicts).toStrictEqual({
      codeReview: { verdict: "APPROVE", iterations: 1 },
    })
  })

  // The speckit and openspec tiers must still name the directory the
  // pipeline ran against — omitting feature_dir fails the superRefine.
  it.each(["speckit", "openspec"])(
    "rejects a %s summary without feature_dir with INVALID_INPUT",
    async (tier) => {
      const { exec, calls: execCalls } = recordingExec()
      const { feature_dir: _omitted, ...args } = DEMO_INPUT
      const result = await invokeSummary(exec, { ...args, tier })

      expect(result.status).toBe("error")
      if (result.status === "error") {
        expect(result.code).toBe("INVALID_INPUT")
        expect(result.retryable).toBe(false)
        expect(result.message).toContain("feature_dir")
        expect(result.message).toContain("required for the speckit and openspec tiers")
      }
      // Rejected before any git or filesystem activity.
      expect(execCalls).toEqual([])
      expect(lstatSync).not.toHaveBeenCalled()
      expect(mkdirSync).not.toHaveBeenCalled()
      expect(writeFileSync).not.toHaveBeenCalled()
    },
  )
})

// ---------------------------------------------------------------------------
// write_unleash_summary — detached HEAD
// ---------------------------------------------------------------------------

describe("write_unleash_summary detached HEAD", () => {
  it("fails with DETACHED_HEAD when the branch read returns the literal HEAD", async () => {
    const result = await invokeSummary(recordingExec("HEAD").exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("DETACHED_HEAD")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe(
        "Detached HEAD — write_unleash_summary derives the artifact file name from the branch name",
      )
    }
    // No file name was derived, so nothing was probed or written.
    expect(lstatSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// write_unleash_summary — unexpected-failure envelope
// ---------------------------------------------------------------------------

describe("write_unleash_summary error envelope", () => {
  it("wraps non-ENOENT lstat failures on the artifact path as SUMMARY_WRITE_ERROR", async () => {
    vi.mocked(lstatSync).mockImplementation(() => {
      throw Object.assign(new Error("EACCES: permission denied lstat summary path"), { code: "EACCES" })
    })

    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("SUMMARY_WRITE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("EACCES: permission denied lstat summary path")
    }
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("wraps non-ENOENT lstat failures on the artifact directory as SUMMARY_WRITE_ERROR", async () => {
    vi.mocked(lstatSync).mockImplementation((pathArg: unknown) => {
      if (String(pathArg) === SUMMARY_ROOT) {
        throw Object.assign(new Error("EACCES: permission denied lstat artifact directory"), { code: "EACCES" })
      }
      throw enoent(`lstat ${String(pathArg)}`)
    })

    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("SUMMARY_WRITE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("EACCES: permission denied lstat artifact directory")
    }
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("wraps write failures as SUMMARY_WRITE_ERROR after the directory was created", async () => {
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error("EACCES: permission denied writing artifact")
    })

    const result = await invokeSummary(recordingExec().exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("SUMMARY_WRITE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe("EACCES: permission denied writing artifact")
    }
    // The directory creation preceded the failed write — the failure is
    // reported, never swallowed into a success envelope.
    expect(mkdirSync).toHaveBeenCalledTimes(1)
  })

  it("wraps a branch that sanitizes to an empty slug as SUMMARY_WRITE_ERROR", async () => {
    const result = await invokeSummary(recordingExec("???").exec, DEMO_INPUT)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("SUMMARY_WRITE_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toBe('Invalid input: "???" produces empty slug after sanitization')
    }
    // sanitizeSlug threw before any path was resolved or written.
    expect(lstatSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})
