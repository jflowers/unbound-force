import { chmod, mkdtemp, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { PluginInput } from "@opencode-ai/plugin"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ReviewDispatchPlugin, { _getSessionCorrelationMap, parseReviewerManifest } from "../plugins/review-dispatch/index.js"
import manifestFixture from "./fixtures/review-dispatch/manifest.json"
import matrixFixture from "./fixtures/review-dispatch/matrix.json"

// ── Types ────────────────────────────────────────────────────

/** Mimics the subset of Bun.spawn result used by fetchPrReviewContext. */
interface MockSpawnProcess {
  readonly stdout: ReadableStream<Uint8Array>
  readonly stderr: ReadableStream<Uint8Array>
  readonly exited: Promise<number>
}

/** Map from a command key to its mock response. */
interface MockResponse {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
}

// ── Fixtures ─────────────────────────────────────────────────

const MOCK_PR_META = {
  number: 42,
  title: "Add feature X",
  body: "This PR adds feature X",
  baseRefName: "main",
  baseRefOid: "abc123def456abc123def456abc123def456abc1",
  headRefName: "feature/x",
  headRefOid: "def456abc123def456abc123def456abc123def4",
  files: [
    { path: "src/index.ts", additions: 10, deletions: 5 },
    { path: "test/index.test.ts", additions: 20, deletions: 0 },
  ],
}

const MOCK_CI_CHECKS = [
  { name: "CI / build", state: "completed", conclusion: "success" },
  { name: "CI / test", state: "completed", conclusion: "success" },
]

const MOCK_REPO = { nameWithOwner: "unbound-force/unbound-force" }

const MOCK_REVIEWS = [
  { user: { login: "reviewer1" }, state: "APPROVED", body: "LGTM", submitted_at: "2026-01-01T00:00:00Z" },
]

const MOCK_COMMENTS = [
  { user: { login: "reviewer1" }, path: "src/index.ts", line: 5, body: "nit: rename this" },
]

const MOCK_DIFF = "diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,8 @@\n+import { foo } from 'bar'\n"

const DIFF_THRESHOLD = 1500

// ── Mock helpers ─────────────────────────────────────────────

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
}

function mockProcess(response: MockResponse): MockSpawnProcess {
  return {
    stdout: textStream(response.stdout),
    stderr: textStream(response.stderr),
    exited: Promise.resolve(response.exitCode),
  }
}

/**
 * Builds a Bun.spawn mock that routes based on the command args.
 * The `which` check uses args[0]="which", gh commands use args[0]="gh".
 */
function createMockSpawn(overrides: Partial<Record<string, MockResponse>> = {}) {
  const defaults: Record<string, MockResponse> = {
    which: { stdout: "/usr/local/bin/gh\n", stderr: "", exitCode: 0 },
    "auth status": { stdout: "Logged in\n", stderr: "", exitCode: 0 },
    "pr view": { stdout: JSON.stringify(MOCK_PR_META), stderr: "", exitCode: 0 },
    "pr checks": { stdout: JSON.stringify(MOCK_CI_CHECKS), stderr: "", exitCode: 0 },
    "pr diff": { stdout: MOCK_DIFF, stderr: "", exitCode: 0 },
    "repo view": { stdout: JSON.stringify(MOCK_REPO), stderr: "", exitCode: 0 },
    "api reviews": { stdout: JSON.stringify(MOCK_REVIEWS), stderr: "", exitCode: 0 },
    "api comments": { stdout: JSON.stringify(MOCK_COMMENTS), stderr: "", exitCode: 0 },
  }

  const responses = { ...defaults, ...overrides }

  return vi.fn((args: string[], _options?: unknown): MockSpawnProcess => {
    // which gh
    if (args[0] === "which") {
      return mockProcess(responses.which!)
    }

    // gh commands — first two args after "gh" determine the route
    const sub = args.slice(1, 3).join(" ")

    if (sub === "auth status") return mockProcess(responses["auth status"]!)
    if (sub === "pr view") return mockProcess(responses["pr view"]!)
    if (sub === "pr checks") return mockProcess(responses["pr checks"]!)
    if (sub === "pr diff") return mockProcess(responses["pr diff"]!)
    if (sub === "repo view") return mockProcess(responses["repo view"]!)

    // API calls for reviews and comments
    if (args[1] === "api") {
      const endpoint = args[2] ?? ""
      if (endpoint.endsWith("/reviews")) return mockProcess(responses["api reviews"]!)
      if (endpoint.endsWith("/comments")) return mockProcess(responses["api comments"]!)
    }

    // Fallback — unknown command
    return mockProcess({ stdout: "", stderr: "unknown command", exitCode: 1 })
  })
}

// ── Test infrastructure ──────────────────────────────────────

type BunRuntime = {
  readonly YAML: { readonly parse: (text: string) => unknown }
  spawn: typeof Bun.spawn
}

const scratchDirectories: string[] = []
let originalBunSpawn: typeof Bun.spawn

/**
 * Sets up the plugin hooks with Bun.spawn mocked.
 * Returns a function to invoke the fetch_pr_review_context tool.
 */
async function setupTool(spawnOverrides: Partial<Record<string, MockResponse>> = {}) {
  const tmpDir = await mkdtemp(join(tmpdir(), "uf-fetch-ctx-"))
  scratchDirectories.push(tmpDir)

  // Write policy files needed by ReviewDispatchPlugin.server()
  const { mkdir, writeFile } = await import("node:fs/promises")
  await mkdir(join(tmpDir, ".uf"), { recursive: true })
  await writeFile(join(tmpDir, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
  await writeFile(join(tmpDir, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
  await writeFile(join(tmpDir, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))

  const mockSpawn = createMockSpawn(spawnOverrides)
  const runtime = globalThis as typeof globalThis & { Bun?: BunRuntime }
  const originalBun = runtime.Bun

  // Patch Bun.spawn while preserving Bun.YAML
  runtime.Bun = {
    ...originalBun,
    YAML: originalBun?.YAML ?? { parse: (text: string): unknown => JSON.parse(text) as unknown },
    spawn: mockSpawn as unknown as typeof Bun.spawn,
  } as unknown as BunRuntime

  const hooks = await ReviewDispatchPlugin.server({
    client: { session: {} },
    directory: tmpDir,
    worktree: tmpDir,
  } as unknown as PluginInput)

  const tool = hooks.tool.fetch_pr_review_context

  return {
    tool,
    mockSpawn,
    tmpDir,
    restore: () => {
      runtime.Bun = originalBun as unknown as BunRuntime
    },
  }
}

async function callTool(
  overrides: Partial<Record<string, MockResponse>> = {},
  prNumber = 42,
): Promise<{ parsed: Record<string, unknown>; mockSpawn: ReturnType<typeof createMockSpawn>; tmpDir: string; restore: () => void }> {
  const { tool, mockSpawn, tmpDir, restore } = await setupTool(overrides)
  const result = await tool.execute({ pr_number: prNumber }, {} as never)
  const parsed = JSON.parse(result.output) as Record<string, unknown>
  return { parsed, mockSpawn, tmpDir, restore }
}

afterEach(async () => {
  await Promise.all(scratchDirectories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

// ── Tests ────────────────────────────────────────────────────

describe("fetch_pr_review_context", () => {
  describe("successful output", () => {
    it("returns structured output for a valid PR", async () => {
      const { parsed, restore } = await callTool()
      try {
        expect(parsed.error).toBeUndefined()
        expect(parsed.pr_number).toBe(42)
        expect(parsed.title).toBe("Add feature X")
        expect(parsed.body).toBe("This PR adds feature X")
        expect(parsed.base_ref).toBe("main")
        expect(parsed.base_sha).toBe("abc123def456abc123def456abc123def456abc1")
        expect(parsed.head_ref).toBe("feature/x")
        expect(parsed.head_sha).toBe("def456abc123def456abc123def456abc123def4")
        expect(parsed.files).toEqual([
          { path: "src/index.ts", additions: 10, deletions: 5 },
          { path: "test/index.test.ts", additions: 20, deletions: 0 },
        ])
        expect(typeof parsed.diff_path).toBe("string")
        expect(typeof parsed.diff_lines).toBe("number")
        expect(typeof parsed.diff_bytes).toBe("number")
        expect(typeof parsed.exceeds_threshold).toBe("boolean")
        expect(Array.isArray(parsed.ci_checks)).toBe(true)
        expect(typeof parsed.ci_pending).toBe("boolean")
        expect(typeof parsed.input_context).toBe("string")
        expect(typeof parsed.changed_files).toBe("string")
        expect(Array.isArray(parsed.warnings)).toBe(true)
      } finally {
        restore()
      }
    })

    it("saves diff to temp file at the expected path", async () => {
      const { parsed, restore } = await callTool()
      try {
        const diffPath = parsed.diff_path as string
        expect(diffPath).toContain("pr-42-diff.patch")
        expect(diffPath).toContain(join(tmpdir(), "opencode"))

        // Verify file actually exists and contains the diff
        const { readFile } = await import("node:fs/promises")
        const content = await readFile(diffPath, "utf8")
        expect(content).toBe(MOCK_DIFF)
      } finally {
        restore()
      }
    })

    it("creates diff file with 0o600 permissions", async () => {
      const { parsed, restore } = await callTool()
      try {
        const diffPath = parsed.diff_path as string
        const fileStats = await stat(diffPath)
        // Check owner-only read/write (0o600 = 0o100600 for regular file)
        const mode = fileStats.mode & 0o777
        expect(mode).toBe(0o600)
      } finally {
        restore()
      }
    })

    it("pre-computes input_context with correct fields", async () => {
      const { parsed, restore } = await callTool()
      try {
        const inputContext = parsed.input_context as string
        expect(inputContext).toContain("kind: pr")
        expect(inputContext).toContain("pr_number: 42")
        expect(inputContext).toContain("base_ref: main")
        expect(inputContext).toContain("base_sha: abc123def456abc123def456abc123def456abc1")
        expect(inputContext).toContain("head_ref: feature/x")
        expect(inputContext).toContain("head_sha: def456abc123def456abc123def456abc123def4")
      } finally {
        restore()
      }
    })

    it("pre-computes changed_files as formatted string", async () => {
      const { parsed, restore } = await callTool()
      try {
        const changedFiles = parsed.changed_files as string
        expect(changedFiles).toContain("src/index.ts (+10/-5)")
        expect(changedFiles).toContain("test/index.test.ts (+20/-0)")
      } finally {
        restore()
      }
    })

    it("pre-computes exceeds_threshold correctly when below threshold", async () => {
      const { parsed, restore } = await callTool()
      try {
        expect(parsed.exceeds_threshold).toBe(false)
        expect(parsed.diff_lines).toBeLessThanOrEqual(DIFF_THRESHOLD)
      } finally {
        restore()
      }
    })

    it("pre-computes exceeds_threshold correctly when above threshold", async () => {
      // Generate a diff with more than DIFF_THRESHOLD lines
      const largeDiff = Array.from({ length: DIFF_THRESHOLD + 10 }, (_, i) => `+line ${i}`).join("\n")
      const { parsed, restore } = await callTool({ "pr diff": { stdout: largeDiff, stderr: "", exitCode: 0 } })
      try {
        expect(parsed.exceeds_threshold).toBe(true)
        const warnings = parsed.warnings as string[]
        expect(warnings.some((w: string) => w.includes("exceeds size advisory threshold"))).toBe(true)
      } finally {
        restore()
      }
    })

    it("pre-computes ci_pending correctly when all checks completed", async () => {
      const { parsed, restore } = await callTool()
      try {
        expect(parsed.ci_pending).toBe(false)
      } finally {
        restore()
      }
    })

    it("pre-computes ci_pending correctly when checks are in progress", async () => {
      const pendingChecks = [
        { name: "CI / build", state: "in_progress", conclusion: null },
        { name: "CI / test", state: "completed", conclusion: "success" },
      ]
      const { parsed, restore } = await callTool({
        "pr checks": { stdout: JSON.stringify(pendingChecks), stderr: "", exitCode: 0 },
      })
      try {
        expect(parsed.ci_pending).toBe(true)
        const warnings = parsed.warnings as string[]
        expect(warnings.some((w: string) => w.includes("CI checks are still in progress"))).toBe(true)
      } finally {
        restore()
      }
    })

    it("includes existing reviews in output", async () => {
      const { parsed, restore } = await callTool()
      try {
        const reviews = parsed.existing_reviews as Array<Record<string, unknown>>
        expect(reviews).toHaveLength(1)
        expect(reviews[0].author).toBe("reviewer1")
        expect(reviews[0].state).toBe("APPROVED")
        expect(reviews[0].body).toBe("LGTM")
        expect(reviews[0].submitted_at).toBe("2026-01-01T00:00:00Z")
      } finally {
        restore()
      }
    })

    it("includes inline comments in output", async () => {
      const { parsed, restore } = await callTool()
      try {
        const comments = parsed.inline_comments as Array<Record<string, unknown>>
        expect(comments).toHaveLength(1)
        expect(comments[0].author).toBe("reviewer1")
        expect(comments[0].path).toBe("src/index.ts")
        expect(comments[0].line).toBe(5)
        expect(comments[0].body).toBe("nit: rename this")
      } finally {
        restore()
      }
    })
  })

  describe("warnings for ci_pending and exceeds_threshold (FR-010)", () => {
    it("populates no warnings when CI passes and diff is small", async () => {
      const { parsed, restore } = await callTool()
      try {
        const warnings = parsed.warnings as string[]
        expect(warnings).toHaveLength(0)
      } finally {
        restore()
      }
    })

    it("populates warning for ci_pending", async () => {
      const pendingChecks = [{ name: "CI / build", state: "queued", conclusion: null }]
      const { parsed, restore } = await callTool({
        "pr checks": { stdout: JSON.stringify(pendingChecks), stderr: "", exitCode: 0 },
      })
      try {
        const warnings = parsed.warnings as string[]
        expect(warnings).toContain("CI checks are still in progress")
      } finally {
        restore()
      }
    })

    it("populates warning for exceeds_threshold", async () => {
      const largeDiff = Array.from({ length: DIFF_THRESHOLD + 10 }, (_, i) => `+line ${i}`).join("\n")
      const { parsed, restore } = await callTool({ "pr diff": { stdout: largeDiff, stderr: "", exitCode: 0 } })
      try {
        const warnings = parsed.warnings as string[]
        expect(warnings.some((w: string) => w.includes(`${DIFF_THRESHOLD} lines`))).toBe(true)
      } finally {
        restore()
      }
    })

    it("populates both warnings when both conditions apply", async () => {
      const pendingChecks = [{ name: "CI / lint", state: "in_progress", conclusion: null }]
      const largeDiff = Array.from({ length: DIFF_THRESHOLD + 10 }, (_, i) => `+line ${i}`).join("\n")
      const { parsed, restore } = await callTool({
        "pr checks": { stdout: JSON.stringify(pendingChecks), stderr: "", exitCode: 0 },
        "pr diff": { stdout: largeDiff, stderr: "", exitCode: 0 },
      })
      try {
        const warnings = parsed.warnings as string[]
        expect(warnings).toHaveLength(2)
        expect(warnings.some((w: string) => w.includes("CI checks are still in progress"))).toBe(true)
        expect(warnings.some((w: string) => w.includes("exceeds size advisory threshold"))).toBe(true)
      } finally {
        restore()
      }
    })
  })

  describe("error handling", () => {
    it("returns gh_not_found error when gh CLI is not available", async () => {
      const { parsed, restore } = await callTool({
        which: { stdout: "", stderr: "which: no gh in PATH", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("gh_not_found")
        expect(parsed.retryable).toBe(false)
        expect(typeof parsed.message).toBe("string")
      } finally {
        restore()
      }
    })

    it("returns gh_auth_failed error when gh auth status fails", async () => {
      const { parsed, restore } = await callTool({
        "auth status": { stdout: "", stderr: "not logged in", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("gh_auth_failed")
        expect(parsed.retryable).toBe(false)
      } finally {
        restore()
      }
    })

    it("returns pr_not_found error when PR does not exist", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "Could not find pull request", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("pr_not_found")
        expect(parsed.retryable).toBe(false)
        expect((parsed.message as string)).toContain("not found")
      } finally {
        restore()
      }
    })

    it("returns api_error for general PR view failures", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "server error 500", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("returns api_error when diff fetch fails", async () => {
      const { parsed, restore } = await callTool({
        "pr diff": { stdout: "", stderr: "Internal server error", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("returns timeout error when gh CLI reports timeout", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "request timed out", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("timeout")
        expect(parsed.retryable).toBe(true)
      } finally {
        restore()
      }
    })

    it("returns rate_limited error when GitHub rate limits", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "API rate limit exceeded", exitCode: 4 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("rate_limited")
        expect(parsed.retryable).toBe(true)
      } finally {
        restore()
      }
    })

    it("returns api_error when repo view fails", async () => {
      const { parsed, restore } = await callTool({
        "repo view": { stdout: "", stderr: "fatal: not a git repository", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })
  })

  describe("non-fatal degradation", () => {
    it("degrades gracefully when CI checks fail with warning", async () => {
      const { parsed, restore } = await callTool({
        "pr checks": { stdout: "", stderr: "no checks configured", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBeUndefined()
        expect(parsed.ci_checks).toEqual([])
        const warnings = parsed.warnings as string[]
        expect(warnings.some((w: string) => w.includes("ci_checks degraded"))).toBe(true)
      } finally {
        restore()
      }
    })

    it("degrades gracefully when reviews fetch fails with warning", async () => {
      const { parsed, restore } = await callTool({
        "api reviews": { stdout: "", stderr: "forbidden", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBeUndefined()
        expect(parsed.existing_reviews).toEqual([])
        const warnings = parsed.warnings as string[]
        expect(warnings.some((w: string) => w.includes("existing_reviews degraded"))).toBe(true)
      } finally {
        restore()
      }
    })

    it("degrades gracefully when inline comments fetch fails with warning", async () => {
      const { parsed, restore } = await callTool({
        "api comments": { stdout: "", stderr: "not found", exitCode: 1 },
      })
      try {
        expect(parsed.error).toBeUndefined()
        expect(parsed.inline_comments).toEqual([])
        const warnings = parsed.warnings as string[]
        expect(warnings.some((w: string) => w.includes("inline_comments degraded"))).toBe(true)
      } finally {
        restore()
      }
    })
  })

  describe("error code completeness", () => {
    it("exercises gh_not_found error code", async () => {
      const { parsed, restore } = await callTool({
        which: { stdout: "", stderr: "", exitCode: 1 },
      })
      try {
        expect(parsed.code).toBe("gh_not_found")
      } finally {
        restore()
      }
    })

    it("exercises gh_auth_failed error code", async () => {
      const { parsed, restore } = await callTool({
        "auth status": { stdout: "", stderr: "auth failed", exitCode: 1 },
      })
      try {
        expect(parsed.code).toBe("gh_auth_failed")
      } finally {
        restore()
      }
    })

    it("exercises pr_not_found error code", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "no pull request found", exitCode: 1 },
      })
      try {
        expect(parsed.code).toBe("pr_not_found")
      } finally {
        restore()
      }
    })

    it("exercises api_error error code", async () => {
      const { parsed, restore } = await callTool({
        "pr diff": { stdout: "", stderr: "unexpected error", exitCode: 1 },
      })
      try {
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("exercises timeout error code", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "connection timed out", exitCode: 1 },
      })
      try {
        expect(parsed.code).toBe("timeout")
        expect(parsed.retryable).toBe(true)
      } finally {
        restore()
      }
    })

    it("exercises rate_limited error code", async () => {
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "", stderr: "rate limit exceeded", exitCode: 4 },
      })
      try {
        expect(parsed.code).toBe("rate_limited")
        expect(parsed.retryable).toBe(true)
      } finally {
        restore()
      }
    })

    it("exercises partial_failure via degraded ci_checks, reviews, and comments", async () => {
      const { parsed, restore } = await callTool({
        "pr checks": { stdout: "", stderr: "checks error", exitCode: 1 },
        "api reviews": { stdout: "", stderr: "reviews error", exitCode: 1 },
        "api comments": { stdout: "", stderr: "comments error", exitCode: 1 },
      })
      try {
        // partial_failure manifests as a successful result with degradation warnings
        expect(parsed.error).toBeUndefined()
        expect(parsed.ci_checks).toEqual([])
        expect(parsed.existing_reviews).toEqual([])
        expect(parsed.inline_comments).toEqual([])
        const warnings = parsed.warnings as string[]
        expect(warnings.length).toBeGreaterThanOrEqual(3)
        expect(warnings.some((w: string) => w.includes("ci_checks degraded"))).toBe(true)
        expect(warnings.some((w: string) => w.includes("existing_reviews degraded"))).toBe(true)
        expect(warnings.some((w: string) => w.includes("inline_comments degraded"))).toBe(true)
      } finally {
        restore()
      }
    })
  })

  describe("input validation / security", () => {
    it("rejects non-integer pr_number via schema validation", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: 3.14 } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
        expect((parsed.message as string).toLowerCase()).toContain("invalid")
      } finally {
        restore()
      }
    })

    it("rejects negative pr_number via schema validation", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: -1 } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("rejects zero pr_number via schema validation", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: 0 } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("rejects pr_number above 999999 via schema validation", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: 1_000_000 } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("rejects string pr_number (command-injection prevention)", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: "42; rm -rf /" } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("rejects object pr_number (prototype pollution prevention)", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: { __proto__: 42 } } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("rejects extra fields via .strict() schema", async () => {
      const { tool, restore } = await setupTool()
      try {
        const result = await tool.execute({ pr_number: 42, evil: "payload" } as never, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
      }
    })

    it("accepts valid edge-case pr_number=1", async () => {
      const { parsed, restore } = await callTool({}, 1)
      try {
        expect(parsed.error).toBeUndefined()
        expect(parsed.pr_number).toBe(42) // from MOCK_PR_META.number
      } finally {
        restore()
      }
    })

    it("accepts valid edge-case pr_number=999999", async () => {
      const { parsed, restore } = await callTool({}, 999_999)
      try {
        expect(parsed.error).toBeUndefined()
      } finally {
        restore()
      }
    })
  })

  describe("diff file write failure", () => {
    it("returns api_error when diff path is blocked by a directory", async () => {
      // Pre-create a directory at the diff path to force open("wx") to fail with EISDIR
      const { mkdir: mkdirFs, rm: rmFs } = await import("node:fs/promises")
      const diffDir = join(tmpdir(), "opencode")
      const diffPath = join(diffDir, "pr-99-diff.patch")
      await mkdirFs(diffPath, { recursive: true })

      const { parsed, restore } = await callTool({}, 99)
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
      } finally {
        restore()
        await rmFs(diffPath, { recursive: true, force: true }).catch(() => {})
      }
    })
  })

  describe("classifyError non-Error fallback branch", () => {
    it("returns api_error with fallback message when a non-Error is thrown", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "uf-fetch-ctx-"))
      scratchDirectories.push(tmpDir)

      const { mkdir: mkdirFs, writeFile: writeFileFs } = await import("node:fs/promises")
      await mkdirFs(join(tmpDir, ".uf"), { recursive: true })
      await writeFileFs(join(tmpDir, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
      await writeFileFs(join(tmpDir, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
      await writeFileFs(join(tmpDir, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))

      // Create a mock where the diff command returns a stream that errors with a non-Error value
      const nonErrorSpawn = vi.fn((args: string[], _options?: unknown): MockSpawnProcess => {
        if (args[0] === "which") {
          return mockProcess({ stdout: "/usr/local/bin/gh\n", stderr: "", exitCode: 0 })
        }
        const sub = args.slice(1, 3).join(" ")
        if (sub === "auth status") return mockProcess({ stdout: "ok", stderr: "", exitCode: 0 })
        if (sub === "pr view") return mockProcess({ stdout: JSON.stringify(MOCK_PR_META), stderr: "", exitCode: 0 })
        if (sub === "pr checks") return mockProcess({ stdout: JSON.stringify(MOCK_CI_CHECKS), stderr: "", exitCode: 0 })
        if (sub === "pr diff") {
          // Return a stream that errors with a non-Error value, which will be caught
          // by classifyError and hit the non-Error fallback branch (line 4149)
          return {
            stdout: new ReadableStream<Uint8Array>({
              start(controller) {
                controller.error("non-error-string-value")
              },
            }),
            stderr: textStream(""),
            exited: Promise.resolve(0),
          }
        }
        return mockProcess({ stdout: "", stderr: "", exitCode: 0 })
      })

      const runtime = globalThis as typeof globalThis & { Bun?: BunRuntime }
      const originalBun = runtime.Bun
      runtime.Bun = {
        ...originalBun,
        YAML: originalBun?.YAML ?? { parse: (text: string): unknown => JSON.parse(text) as unknown },
        spawn: nonErrorSpawn as unknown as typeof Bun.spawn,
      } as unknown as BunRuntime

      try {
        const hooks = await ReviewDispatchPlugin.server({
          client: { session: {} },
          directory: tmpDir,
          worktree: tmpDir,
        } as unknown as PluginInput)

        const result = await hooks.tool.fetch_pr_review_context.execute({ pr_number: 42 }, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>

        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
        expect(parsed.retryable).toBe(false)
      } finally {
        runtime.Bun = originalBun as unknown as BunRuntime
      }
    })
  })

  describe("classifyError DOMException/AbortError branch", () => {
    it("returns timeout for DOMException AbortError during diff fetch", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "uf-fetch-ctx-"))
      scratchDirectories.push(tmpDir)

      const { mkdir: mkdirFs, writeFile: writeFileFs } = await import("node:fs/promises")
      await mkdirFs(join(tmpDir, ".uf"), { recursive: true })
      await writeFileFs(join(tmpDir, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
      await writeFileFs(join(tmpDir, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
      await writeFileFs(join(tmpDir, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))

      // Create a mock where pr diff throws a DOMException AbortError
      const abortSpawn = vi.fn((args: string[], _options?: unknown): MockSpawnProcess => {
        if (args[0] === "which") {
          return mockProcess({ stdout: "/usr/local/bin/gh\n", stderr: "", exitCode: 0 })
        }
        const sub = args.slice(1, 3).join(" ")
        if (sub === "auth status") return mockProcess({ stdout: "ok", stderr: "", exitCode: 0 })
        if (sub === "pr view") return mockProcess({ stdout: JSON.stringify(MOCK_PR_META), stderr: "", exitCode: 0 })
        if (sub === "pr checks") return mockProcess({ stdout: JSON.stringify(MOCK_CI_CHECKS), stderr: "", exitCode: 0 })
        if (sub === "pr diff") {
          // Simulate AbortSignal timeout by throwing a DOMException
          throw new DOMException("The operation was aborted", "AbortError")
        }
        return mockProcess({ stdout: "", stderr: "", exitCode: 0 })
      })

      const runtime = globalThis as typeof globalThis & { Bun?: BunRuntime }
      const originalBun = runtime.Bun
      runtime.Bun = {
        ...originalBun,
        YAML: originalBun?.YAML ?? { parse: (text: string): unknown => JSON.parse(text) as unknown },
        spawn: abortSpawn as unknown as typeof Bun.spawn,
      } as unknown as BunRuntime

      try {
        const hooks = await ReviewDispatchPlugin.server({
          client: { session: {} },
          directory: tmpDir,
          worktree: tmpDir,
        } as unknown as PluginInput)

        const result = await hooks.tool.fetch_pr_review_context.execute({ pr_number: 42 }, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>

        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("timeout")
        expect(parsed.retryable).toBe(true)
      } finally {
        runtime.Bun = originalBun as unknown as BunRuntime
      }
    })
  })

  describe("edge case: Bun.spawn throws during which check", () => {
    it("returns gh_not_found when Bun.spawn throws (not exit code)", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "uf-fetch-ctx-"))
      scratchDirectories.push(tmpDir)

      const { mkdir: mkdirFs, writeFile: writeFileFs } = await import("node:fs/promises")
      await mkdirFs(join(tmpDir, ".uf"), { recursive: true })
      await writeFileFs(join(tmpDir, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
      await writeFileFs(join(tmpDir, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
      await writeFileFs(join(tmpDir, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))

      // Create a mock that THROWS when args[0] === "which"
      const throwingSpawn = vi.fn((args: string[], _options?: unknown): MockSpawnProcess => {
        if (args[0] === "which") {
          throw new Error("spawn ENOENT")
        }
        return mockProcess({ stdout: "", stderr: "", exitCode: 0 })
      })

      const runtime = globalThis as typeof globalThis & { Bun?: BunRuntime }
      const originalBun = runtime.Bun
      runtime.Bun = {
        ...originalBun,
        YAML: originalBun?.YAML ?? { parse: (text: string): unknown => JSON.parse(text) as unknown },
        spawn: throwingSpawn as unknown as typeof Bun.spawn,
      } as unknown as BunRuntime

      try {
        const hooks = await ReviewDispatchPlugin.server({
          client: { session: {} },
          directory: tmpDir,
          worktree: tmpDir,
        } as unknown as PluginInput)

        const result = await hooks.tool.fetch_pr_review_context.execute({ pr_number: 42 }, {} as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>

        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("gh_not_found")
        expect(parsed.retryable).toBe(false)
      } finally {
        runtime.Bun = originalBun as unknown as BunRuntime
      }
    })
  })

  describe("Bun.spawn call verification", () => {
    it("calls which gh as the first spawn", async () => {
      const { mockSpawn, restore } = await callTool()
      try {
        const firstCall = mockSpawn.mock.calls[0]
        expect(firstCall[0]).toEqual(["which", "gh"])
      } finally {
        restore()
      }
    })

    it("calls gh auth status before PR metadata", async () => {
      const { mockSpawn, restore } = await callTool()
      try {
        const calls = mockSpawn.mock.calls.map((c: unknown[]) => (c[0] as string[]).slice(0, 3).join(" "))
        const authIndex = calls.indexOf("gh auth status")
        const prViewIndex = calls.findIndex((c: string) => c.startsWith("gh pr view"))
        expect(authIndex).toBeGreaterThan(-1)
        expect(prViewIndex).toBeGreaterThan(authIndex)
      } finally {
        restore()
      }
    })

    it("passes pr_number as a discrete array element (no shell interpolation)", async () => {
      const { mockSpawn, restore } = await callTool({}, 42)
      try {
        // Find the pr view call and check that prNumber is a separate arg
        const prViewCall = mockSpawn.mock.calls.find(
          (c: unknown[]) => (c[0] as string[])[1] === "pr" && (c[0] as string[])[2] === "view",
        )
        expect(prViewCall).toBeDefined()
        const args = prViewCall![0] as string[]
        expect(args[3]).toBe("42") // discrete string, not embedded in another arg
      } finally {
        restore()
      }
    })
  })

  describe("classifyError ghCode undefined branch", () => {
    it("uses fallback code when error has no ghCode (e.g. JSON parse failure)", async () => {
      // Return invalid JSON from pr view — JSON.parse throws SyntaxError (no ghCode)
      // classifyError receives it, ghCode is undefined, falls back to fallbackCode
      const { parsed, restore } = await callTool({
        "pr view": { stdout: "not valid json {{{", stderr: "", exitCode: 0 },
      })
      try {
        expect(parsed.error).toBe(true)
        expect(parsed.code).toBe("api_error")
        expect(parsed.retryable).toBe(false)
      } finally {
        restore()
      }
    })
  })

  describe("reviewer manifest duplicate entry (coverage gap in lib/reviewer-manifest)", () => {
    it("rejects manifest with duplicate reviewer entries", () => {
      // Exercises the duplicate-reviewer detection branch (lines 141-144 of reviewer-manifest.ts)
      const duplicateManifest = structuredClone(manifestFixture) as { reviewers: Array<Record<string, unknown>> }
      // Duplicate the first reviewer entry
      duplicateManifest.reviewers.push({ ...duplicateManifest.reviewers[0] })
      const jsonParser = (text: string): unknown => JSON.parse(text) as unknown
      expect(() => parseReviewerManifest(JSON.stringify(duplicateManifest), jsonParser)).toThrow(/duplicate/)
    })

    it("rejects manifest with conflicting reviewer entries", () => {
      // Exercises the conflicting path where same agent has different capability/scopes
      const conflictManifest = structuredClone(manifestFixture) as { reviewers: Array<Record<string, unknown>> }
      const firstReviewer = { ...conflictManifest.reviewers[0] }
      // Change scopes to make it conflicting instead of duplicate
      firstReviewer.scopes = ["documentation"]
      conflictManifest.reviewers.push(firstReviewer)
      const jsonParser = (text: string): unknown => JSON.parse(text) as unknown
      expect(() => parseReviewerManifest(JSON.stringify(conflictManifest), jsonParser)).toThrow(/conflicting/)
    })
  })

  describe("dispatch_status readdir failure (coverage gap)", () => {
    it("returns not_found when dispatch session directory does not exist", async () => {
      const { tool: _tool, restore } = await setupTool()
      try {
        // Inject a correlation ID that maps to a non-existent directory
        const correlationMap = _getSessionCorrelationMap()
        const fakeSessionId = `test-session-${Date.now()}`
        const fakeCorrelationId = "00000000-0000-0000-0000-000000000000"
        correlationMap.set(fakeSessionId, fakeCorrelationId)

        const hooks = await ReviewDispatchPlugin.server({
          client: { session: {} },
          directory: "/tmp",
          worktree: "/tmp",
        } as unknown as PluginInput)

        const result = await hooks.tool.dispatch_status.execute({}, { sessionID: fakeSessionId } as never)
        const parsed = JSON.parse(result.output) as Record<string, unknown>

        expect(parsed.status).toBe("not_found")
        expect(parsed.correlation_id).toBe(fakeCorrelationId)
        expect(parsed.runs).toEqual([])

        // Clean up the map entry
        correlationMap.delete(fakeSessionId)
      } finally {
        restore()
      }
    })
  })
})
