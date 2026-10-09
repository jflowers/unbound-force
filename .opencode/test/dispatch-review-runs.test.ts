import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { afterEach, describe, expect, it } from "vitest"

import ReviewDispatchPlugin from "../plugins/review-dispatch/index.js"
import { _getSessionCorrelationMap, _getSubmissionStore } from "../plugins/review-dispatch/index.js"
import manifestFixture from "./fixtures/review-dispatch/manifest.json"
import matrixFixture from "./fixtures/review-dispatch/matrix.json"

// ── Test infrastructure ─────────────────────────────────────

type BunRuntime = { readonly YAML: { readonly parse: (text: string) => unknown } }

function withBun<T>(run: () => T | Promise<T>): Promise<T> {
  const runtime = globalThis as typeof globalThis & { Bun?: BunRuntime }
  const original = runtime.Bun
  runtime.Bun = { YAML: { parse: (text: string): unknown => JSON.parse(text) as unknown } }
  const finish = (): void => {
    runtime.Bun = original
  }
  try {
    return Promise.resolve(run()).finally(finish)
  } catch (error) {
    finish()
    throw error
  }
}

const scratchDirectories: string[] = []

afterEach(async () => {
  _getSessionCorrelationMap().clear()
  _getSubmissionStore().clear()
  await Promise.all(scratchDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

/** Create a scratch project with review-matrix, manifest, sibling-repos, and a diff file. */
async function scratchProject(): Promise<{ directory: string; diffPath: string }> {
  const directory = await mkdtemp(join(tmpdir(), "uf-dispatch-runs-"))
  scratchDirectories.push(directory)
  await mkdir(join(directory, ".uf"), { recursive: true })
  await writeFile(join(directory, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
  await writeFile(join(directory, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
  await writeFile(join(directory, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))
  const diffPath = join(directory, "test.diff")
  await writeFile(diffPath, "diff --git a/src/foo.ts b/src/foo.ts\n--- a/src/foo.ts\n+++ b/src/foo.ts\n@@ -1 +1 @@\n-old\n+new\n")
  return { directory, diffPath }
}

type Client = PluginInput["client"]

interface FakeClientOptions {
  /** Override the prompt handler. Receives the request and returns a response. */
  promptHandler?: (request: unknown, callIndex: number) => Promise<unknown>
  /** Track all prompt calls for assertions. */
  promptCalls?: unknown[]
}

/**
 * Minimal fake client for dispatch_review_runs tests.
 * Prompt response echoes the requested model so model-mismatch checks pass.
 * Optionally injects per-run cost via step-finish parts for budget testing.
 */
function fakeClient(options?: FakeClientOptions): Client {
  let promptCallIndex = 0
  const session = {
    create: async (): Promise<unknown> => ({
      data: { id: `child-session-${promptCallIndex}` },
      error: undefined,
    }),
    message: async (): Promise<unknown> => ({
      data: {
        info: { id: "m", sessionID: "s", role: "assistant", providerID: "p", modelID: "m", variant: "active" },
        parts: [],
      },
      error: undefined,
    }),
    prompt: async (request: unknown): Promise<unknown> => {
      const idx = promptCallIndex++
      options?.promptCalls?.push(request)
      if (options?.promptHandler) {
        return options.promptHandler(request, idx)
      }
      const req = request as { body?: { model?: { providerID: string; modelID: string } } }
      const providerID = req.body?.model?.providerID ?? "provider"
      const modelID = req.body?.model?.modelID ?? "standard"
      return {
        data: {
          info: { role: "assistant", providerID, modelID },
          parts: [
            { id: "t", sessionID: `child-session-${idx}`, messageID: "m", type: "text", text: "review output", ignored: false },
          ],
        },
        error: undefined,
      }
    },
    abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
  }
  return { session } as unknown as Client
}

/** Create a prompt response with cost data in step-finish parts. */
function promptResponseWithCost(costUsd: number, request: unknown): unknown {
  const req = request as { body?: { model?: { providerID: string; modelID: string } } }
  const providerID = req.body?.model?.providerID ?? "provider"
  const modelID = req.body?.model?.modelID ?? "standard"
  return {
    data: {
      info: { role: "assistant", providerID, modelID },
      parts: [
        { id: "t", sessionID: "child", messageID: "m", type: "text", text: "review output", ignored: false },
        { type: "step-finish", cost: costUsd, tokens: { input: 100, output: 50 } },
      ],
    },
    error: undefined,
  }
}

function toolContext(): ToolContext {
  return {
    sessionID: "parent-session",
    messageID: "message-parent",
    agent: "build",
    directory: "/workspace",
    worktree: "/workspace",
    abort: new AbortController().signal,
    metadata: () => undefined,
    ask: (() => {
      throw new Error("permission prompts are not used")
    }) as ToolContext["ask"],
  }
}

/** Valid SHA1 (40 hex chars) for test input_context. */
const VALID_SHA = "a".repeat(40)
const VALID_SHA2 = "b".repeat(40)

function makeSessionMetadata(): Record<string, unknown> {
  return {
    command: "review-council",
    mode: "code",
    full: false,
    input_context: {
      kind: "local",
      pr_number: null,
      base_ref: "main",
      base_sha: VALID_SHA,
      head_ref: "feature",
      head_sha: VALID_SHA2,
    },
    change_profile: {
      kind: "diff",
      lines: 100,
      files: 3,
      components: 1,
      security_sensitive: false,
      user_facing: false,
      categories: ["standard"],
      tier: "standard",
    },
    plan: [],
    coverage: { preflight_verdict: "NOT_RUN", checks_total: 0, checks_passed: 0 },
  }
}

function makePlanEntry(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    agent: "divisor-guard",
    decision: "include",
    reason_code: "advisor-run",
    reason: "test",
    source: "advisor",
    sequence: 1,
    read_only: true,
    tier: "standard",
    model: null,
    variant: null,
    validation_errors: [],
    ...overrides,
  }
}

function makeBaseInput(diffPath: string, planEntries: Record<string, unknown>[]): Record<string, unknown> {
  return {
    mode: "code",
    command: "review-council",
    diff_path: diffPath,
    changed_files: "src/foo.ts",
    input_context: "base: main, head: feature",
    plan_entries: planEntries,
    max_parallel_runs: 4,
    session_metadata: makeSessionMetadata(),
  }
}

// ── Tests ───────────────────────────────────────────────────

describe("dispatch_review_runs", () => {
  it("registers in the plugin with correct description", async () => {
    await withBun(async () => {
      const { directory } = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: fakeClient(),
        directory,
        worktree: directory,
      } as unknown as PluginInput)

      expect(Object.keys(hooks.tool)).toContain("dispatch_review_runs")
      const toolDef = hooks.tool.dispatch_review_runs
      expect(toolDef.description).toContain("Aggregate")
    })
  })

  describe("dispatches all included plan entries and returns compact summary", () => {
    it("dispatches 2 included entries and skips 1, reports correct counts", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", sequence: 2 }),
          makePlanEntry({ agent: "divisor-architect", decision: "skip", sequence: 3 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        expect(response.output).toContain("dispatch_review_runs")
        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("ok")
        expect(meta.runs_completed).toBe(2)
        expect(meta.runs_skipped).toBe(1)
        expect(meta.runs_failed).toBe(0)
      })
    })

    it("returns status ok with 0 completed when all entries are skipped", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", decision: "skip", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", decision: "skip", sequence: 2 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("ok")
        expect(meta.runs_completed).toBe(0)
        expect(meta.runs_skipped).toBe(2)
        const warnings = meta.warnings as string[]
        expect(warnings.some((w: string) => w.includes("no plan entries with decision 'include'"))).toBe(true)
      })
    })
  })

  describe("respects max_parallel_runs batch size", () => {
    it("dispatches all 5 entries in batches of 2 and all complete", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const promptCalls: unknown[] = []
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient({ promptCalls }),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", sequence: 2 }),
          makePlanEntry({ agent: "divisor-architect", sequence: 3 }),
          makePlanEntry({ agent: "divisor-sre", sequence: 4 }),
          makePlanEntry({ agent: "divisor-testing", sequence: 5 }),
        ])
        input.max_parallel_runs = 2

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("ok")
        // All 5 included entries should dispatch and complete.
        expect(meta.runs_completed).toBe(5)
        expect(meta.runs_failed).toBe(0)
        expect(meta.runs_skipped).toBe(0)
        // Verify the client was actually called 5 times (one prompt per entry).
        expect(promptCalls.length).toBe(5)
      })
    })
  })

  describe("isolates failures (one failed run does not cancel others)", () => {
    it("completes successful runs even when one fails", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        let callCount = 0
        const client = fakeClient({
          promptHandler: async (request) => {
            callCount++
            const req = request as { body?: { agent?: string; model?: { providerID: string; modelID: string } } }
            const providerID = req.body?.model?.providerID ?? "provider"
            const modelID = req.body?.model?.modelID ?? "standard"
            // Fail for the adversary agent to simulate one run failing.
            if (req.body?.agent === "divisor-adversary") {
              return {
                data: undefined,
                error: { message: "simulated child prompt failure" },
                response: { status: 500 },
              }
            }
            return {
              data: {
                info: { role: "assistant", providerID, modelID },
                parts: [
                  { id: "t", sessionID: "child", messageID: "m", type: "text", text: "review output", ignored: false },
                ],
              },
              error: undefined,
            }
          },
        })
        const hooks = await ReviewDispatchPlugin.server({
          client,
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", sequence: 2 }),
          makePlanEntry({ agent: "divisor-architect", sequence: 3 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        // Status should be "ok" because at least some runs completed.
        expect(meta.status).toBe("ok")
        expect(meta.runs_completed).toBe(2)
        expect(meta.runs_failed).toBe(1)
        // All 3 prompts were attempted (failure is isolated, not cancelling).
        expect(callCount).toBe(3)
      })
    })

    it("returns status error when ALL runs fail", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const client = fakeClient({
          promptHandler: async () => ({
            data: undefined,
            error: { message: "all fail" },
            response: { status: 500 },
          }),
        })
        const hooks = await ReviewDispatchPlugin.server({
          client,
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", sequence: 2 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("error")
        expect(meta.runs_completed).toBe(0)
        expect(meta.runs_failed).toBe(2)
      })
    })
  })

  describe("skips remaining runs when budget exceeded", () => {
    it("skips second batch after cumulative cost exceeds budget_usd", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const client = fakeClient({
          promptHandler: async (request) => promptResponseWithCost(0.50, request),
        })
        const hooks = await ReviewDispatchPlugin.server({
          client,
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        // 4 entries, max_parallel_runs = 2 → 2 batches of 2.
        // Each run costs $0.50 → batch 1 = $1.00 total.
        // Budget is $0.75, so after batch 1, budget is exceeded.
        // Batch 2 should be skipped.
        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", sequence: 2 }),
          makePlanEntry({ agent: "divisor-architect", sequence: 3 }),
          makePlanEntry({ agent: "divisor-sre", sequence: 4 }),
        ])
        input.max_parallel_runs = 2
        input.budget_usd = 0.75

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("ok")
        // First batch of 2 completes.
        expect(meta.runs_completed).toBe(2)
        // Second batch of 2 is skipped due to budget.
        expect(meta.runs_skipped).toBe(2)
        const warnings = meta.warnings as string[]
        expect(warnings.some((w: string) => w.includes("budget exceeded"))).toBe(true)
      })
    })
  })

  describe("passes session_metadata only on first internal call (FR-007)", () => {
    it("persists session metadata file from first run and correlation is shared", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const promptCalls: unknown[] = []
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient({ promptCalls }),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const sessionMeta = makeSessionMetadata()
        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
          makePlanEntry({ agent: "divisor-adversary", sequence: 2 }),
        ])
        input.session_metadata = sessionMeta

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("ok")
        expect(meta.runs_completed).toBe(2)

        // The session correlation map should have an entry for this session.
        const correlationMap = _getSessionCorrelationMap()
        // dispatchReviewRuns uses toolContext().sessionID which is "parent-session".
        const correlationId = correlationMap.get("parent-session")
        // correlation_id is set by the first dispatchAgentRun call.
        expect(correlationId).toBeDefined()
        expect(typeof correlationId).toBe("string")
      })
    })
  })

  describe("handles evidence acquisition failure gracefully (FR-010)", () => {
    it("proceeds with runs and adds warning when sibling repos YAML is invalid", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        // Overwrite sibling-repos.yaml with invalid content.
        await writeFile(join(directory, ".uf", "sibling-repos.yaml"), "not valid json at all {{{")
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        // Runs should still complete despite evidence acquisition failure.
        expect(meta.runs_completed).toBe(1)
        expect(meta.runs_failed).toBe(0)
        // A warning about evidence acquisition should be present.
        const warnings = meta.warnings as string[]
        expect(
          warnings.some((w: string) => w.includes("sibling evidence") || w.includes("evidence acquisition")),
        ).toBe(true)
      })
    })

    it("proceeds with runs when sibling-repos.yaml is missing entirely", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        // Remove sibling-repos.yaml to simulate missing file.
        await rm(join(directory, ".uf", "sibling-repos.yaml"), { force: true })
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        // Runs proceed despite missing evidence source.
        expect(meta.status).toBe("ok")
        expect(meta.runs_completed).toBe(1)
      })
    })
  })

  describe("returns error for invalid inputs", () => {
    it("returns error when plan_entries is empty", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [])
        // plan_entries.min(1) will fail
        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("error")
        expect(meta.runs_completed).toBe(0)
        expect(meta.runs_failed).toBe(0)
        expect(meta.runs_skipped).toBe(0)
        expect(typeof meta.message).toBe("string")
        expect((meta.message as string).toLowerCase()).toContain("validation")
        expect(meta.retryable).toBe(false)
      })
    })

    it("returns error when diff_path is empty", async () => {
      await withBun(async () => {
        const { directory } = await scratchProject()
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput("", [
          makePlanEntry({ agent: "divisor-guard", sequence: 1 }),
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("error")
        expect(meta.runs_completed).toBe(0)
        expect(typeof meta.message).toBe("string")
        expect((meta.message as string).toLowerCase()).toContain("validation")
      })
    })

    it("returns error when required fields are missing", async () => {
      await withBun(async () => {
        const { directory } = await scratchProject()
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        // Missing mode, command, session_metadata, etc.
        const input = { plan_entries: [makePlanEntry()] }

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("error")
        expect(meta.runs_completed).toBe(0)
        expect(meta.retryable).toBe(false)
      })
    })

    it("returns error when plan_entries contains invalid entry shape", async () => {
      await withBun(async () => {
        const { directory, diffPath } = await scratchProject()
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)

        const input = makeBaseInput(diffPath, [
          { agent: "not-a-divisor-agent", decision: "include" }, // Invalid: missing required fields
        ])

        const response = await hooks.tool.dispatch_review_runs.execute(input, toolContext())

        const meta = response.metadata as Record<string, unknown>
        expect(meta.status).toBe("error")
        expect(meta.runs_completed).toBe(0)
      })
    })
  })
})
