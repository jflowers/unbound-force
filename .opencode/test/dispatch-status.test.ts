import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ReviewDispatchPlugin, _getSubmissionStore, _getSessionCorrelationMap, createConsolidateDispatchTool, createFinalizationDependencies } from "../plugins/review-dispatch/index.js"
import manifestFixture from "./fixtures/review-dispatch/manifest.json"
import matrixFixture from "./fixtures/review-dispatch/matrix.json"
import { withBun } from "./helpers/bun-runtime.js"
import {
  dispatchParentContext,
  fakeClient,
  makeAggregateDispatchRunner,
  makeBaseInput,
  makePlanEntry,
  makeScratchProjectFactory,
} from "./helpers/aggregate-dispatch-fixtures.js"

const scratchDirectories: string[] = []

async function scratchProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "uf-dispatch-status-"))
  scratchDirectories.push(directory)
  await mkdir(join(directory, ".opencode"), { recursive: true })
  await mkdir(join(directory, ".uf"), { recursive: true })
  await writeFile(join(directory, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
  await writeFile(join(directory, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
  await writeFile(join(directory, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))
  return directory
}

function noopContext(): ToolContext {
  return {
    sessionID: "status-session",
    messageID: "msg-status",
    agent: "build",
    directory: "/workspace",
    worktree: "/workspace",
    abort: new AbortController().signal,
    metadata: () => undefined,
    ask: (() => {
      throw new Error("not used")
    }) as ToolContext["ask"],
  }
}

function runFixture(
  agent: string,
  overrides?: {
    status?: string
    findings?: number
    proposals?: number
    usage?: { cost_usd: number | null; tokens: { input: number; output: number } | null } | null
  },
) {
  const findingsArr = Array.from({ length: overrides?.findings ?? 0 }, (_, i) => ({
    severity: "LOW",
    category: "test",
    description: `finding ${i}`,
    root_cause: `cause ${i}`,
    file: "a.ts",
    line: i + 1,
  }))
  const proposalsArr = Array.from({ length: overrides?.proposals ?? 0 }, (_, i) => ({
    information: `lesson ${i}`,
    tag: "test",
  }))

  return {
    run_id: randomUUID(),
    agent,
    source: "explicit",
    sequence: 1,
    status: overrides?.status ?? "success",
    started_at: "2026-10-08T10:00:00.000Z",
    finished_at: "2026-10-08T10:01:00.000Z",
    requested_model: "provider/standard",
    provider: "provider",
    model_id: "standard",
    variant: null,
    resolved_parent_model: null,
    resolved_parent_variant: null,
    reported_model: "provider/standard",
    model_mismatch: false,
    usage: overrides?.usage ?? null,
    error: null,
    workflow_verdict: null,
    findings: findingsArr,
    proposals: proposalsArr,
    text: "output",
    read_only: true,
  }
}

const cleanupDirs: string[] = []

afterEach(async () => {
  _getSubmissionStore().clear()
  _getSessionCorrelationMap().clear()
  await Promise.all(scratchDirectories.splice(0).map((d) => rm(d, { recursive: true, force: true })))
  for (const dir of cleanupDirs) {
    try {
      await rm(dir, { recursive: true, force: true })
    } catch {
      // best-effort
    }
  }
  cleanupDirs.length = 0
})

beforeEach(() => {
  _getSubmissionStore().clear()
  _getSessionCorrelationMap().clear()
})

async function setupDispatchSession(
  runs: ReturnType<typeof runFixture>[],
  options?: { registerSession?: boolean },
): Promise<string> {
  const correlationId = randomUUID()
  const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
  await mkdir(dir, { recursive: true })
  cleanupDirs.push(dir)
  // registerSession: false leaves the session map untouched, simulating a
  // fresh parent session (e.g. after a restart, issue #751) whose only path
  // to the dispatch is an explicit correlation_id (design D3).
  if (options?.registerSession !== false) {
    _getSessionCorrelationMap().set("status-session", correlationId)
  }

  for (const run of runs) {
    await writeFile(join(dir, `run-${run.agent}.json`), JSON.stringify(run, null, 2), "utf8")
  }

  return correlationId
}

/**
 * Minimal valid session metadata for the consolidate_dispatch fixture,
 * mirroring the shape dispatch_agent_run persists (design D5).
 */
function consolidationSessionMetadata(agents: string[]) {
  return {
    command: "review-council" as const,
    mode: "code" as const,
    full: false,
    input_context: {
      kind: "pr" as const,
      pr_number: 751,
      base_ref: "main",
      base_sha: "a".repeat(40),
      head_ref: "feature",
      head_sha: "b".repeat(40),
    },
    change_profile: {
      kind: "diff" as const,
      lines: 100,
      files: 5,
      components: 2,
      security_sensitive: false,
      user_facing: true,
      categories: ["standard" as const],
      tier: "standard" as const,
    },
    plan: agents.map((agent) => ({
      agent,
      decision: "include" as const,
      reason_code: "explicit",
      reason: "Explicitly included",
      source: "explicit" as const,
      sequence: 1,
      read_only: true,
      tier: "standard",
      model: "provider/standard",
      variant: null,
      validation_errors: [],
    })),
    coverage: { preflight_verdict: "PASS" as const, checks_total: 5, checks_passed: 5 },
  }
}

/**
 * Aggregate-dispatch fixtures shared with the sibling review-dispatch suites
 * (helpers/aggregate-dispatch-fixtures.ts, extracted per default.md CS-004):
 * the scratch project binds this suite's scratch-directory registry, the
 * dispatch runner binds this suite's cleanup registry, and the parent
 * context keeps this suite's session-map key.
 */
const dispatchScratchProject = makeScratchProjectFactory("uf-status-dispatch-", scratchDirectories)

/** Tool context for the shared parent session driving the aggregate dispatches. */
function aggregateParentContext(): ToolContext {
  return dispatchParentContext("status-aggregate-parent")
}

/** Run one aggregate dispatch from the shared parent session; returns its minted correlation. */
const aggregateDispatch = makeAggregateDispatchRunner(aggregateParentContext, cleanupDirs)

describe("dispatch_status", () => {
  it("returns not_found when no dispatch session exists", async () => {
    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute(
        {},
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("not_found")
      expect(data.runs).toEqual([])
    })
  })

  it("resolves an explicit correlation_id from a session with no session-map entry", async () => {
    // Post-restart standalone usability (design D3, Constitution II): the
    // dispatch session dir exists on disk, but this parent session has no
    // sessionCorrelationMap entry — only the explicit parameter finds it.
    const correlationId = await setupDispatchSession([runFixture("divisor-guard", { findings: 2 })], {
      registerSession: false,
    })

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      // Without the parameter this fresh session sees nothing (the
      // pre-D3 state that stranded issue #751's dispatch)...
      const before = JSON.parse((await hooks.tool.dispatch_status.execute({}, noopContext())).output)
      expect(before.status).toBe("not_found")
      expect(before.runs).toEqual([])

      // ...with the explicit correlation_id it recovers the dispatch.
      const result = await hooks.tool.dispatch_status.execute(
        { correlation_id: correlationId },
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.correlation_id).toBe(correlationId)
      expect(data.total_runs).toBe(1)
      expect(data.runs[0].agent).toBe("divisor-guard")
      expect(data.runs[0].findings).toBe(2)
    })
  })

  it("prefers an explicit correlation_id over the session-map entry", async () => {
    // Two dispatch sessions exist; the map points at one and the explicit
    // parameter names the other — the explicit value must win (design D3).
    await setupDispatchSession([runFixture("divisor-guard")])
    const explicitId = await setupDispatchSession([runFixture("divisor-adversary")], {
      registerSession: false,
    })

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute(
        { correlation_id: explicitId },
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.correlation_id).toBe(explicitId)
      expect(data.runs.map((r: { agent: string }) => r.agent)).toEqual(["divisor-adversary"])
    })
  })

  it("falls back to the session map when correlation_id is omitted", async () => {
    // Mirror of the precedence test with the parameter omitted: the
    // session-map entry resolves (pre-existing behavior preserved).
    const mappedId = await setupDispatchSession([runFixture("divisor-guard")])
    await setupDispatchSession([runFixture("divisor-adversary")], { registerSession: false })

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute({}, noopContext())

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.correlation_id).toBe(mappedId)
      expect(data.runs.map((r: { agent: string }) => r.agent)).toEqual(["divisor-guard"])
    })
  })

  it("rejects a malformed correlation_id", async () => {
    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute(
        { correlation_id: "not-a-uuid" },
        noopContext(),
      )

      expect(result.output).toContain("dispatch_status validation failed")
    })
  })

  it("returns not_found for a supplied correlation_id with no dispatch session directory", async () => {
    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const missingId = randomUUID()
      const result = await hooks.tool.dispatch_status.execute(
        { correlation_id: missingId },
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("not_found")
      expect(data.correlation_id).toBe(missingId)
      expect(data.runs).toEqual([])
      // Distinct from the no-session not_found: the resolved-id shape
      // echoes the correlation_id and carries no message field.
      expect(data.message).toBeUndefined()
    })
  })

  it("returns run summaries from persisted files", async () => {
    const correlationId = await setupDispatchSession([
      runFixture("divisor-guard", { findings: 3, proposals: 1 }),
      runFixture("divisor-adversary", { status: "failed", findings: 0 }),
    ])

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute(
        {},
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.total_runs).toBe(2)
      expect(data.runs).toHaveLength(2)

      const guard = data.runs.find((r: { agent: string }) => r.agent === "divisor-guard")
      expect(guard.status).toBe("success")
      expect(guard.findings).toBe(3)
      expect(guard.proposals).toBe(1)

      const adversary = data.runs.find((r: { agent: string }) => r.agent === "divisor-adversary")
      expect(adversary.status).toBe("failed")
      expect(adversary.findings).toBe(0)
    })
  })

  it("reports per-run token usage from persisted run files", async () => {
    // RD-FR-027 / design D6: usage is surfaced verbatim from the persisted
    // run record — including a failed child that burned ~365k input tokens
    // before its session aborted (the issue #751 context-exhaustion shape)
    // — and is strictly observational: the failed status is reported
    // unchanged, never recomputed from usage.
    await setupDispatchSession([
      runFixture("divisor-guard", {
        status: "failed",
        usage: { cost_usd: 12.34, tokens: { input: 365000, output: 2100 } },
      }),
      runFixture("divisor-adversary"),
    ])

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute({}, noopContext())

      const data = JSON.parse(result.output)
      const guard = data.runs.find((r: { agent: string }) => r.agent === "divisor-guard")
      expect(guard.status).toBe("failed")
      expect(guard.usage).toEqual({ cost_usd: 12.34, tokens: { input: 365000, output: 2100 } })

      const adversary = data.runs.find((r: { agent: string }) => r.agent === "divisor-adversary")
      expect(adversary.usage).toBeNull()
    })
  })

  it("handles unreadable run files gracefully", async () => {
    const correlationId = randomUUID()
    const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
    await mkdir(dir, { recursive: true })
    cleanupDirs.push(dir)
    _getSessionCorrelationMap().set("status-session", correlationId)
    await writeFile(join(dir, "run-divisor-broken.json"), "not valid json", "utf8")

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute(
        {},
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.runs).toHaveLength(1)
      expect(data.runs[0].agent).toBe("divisor-broken")
      expect(data.runs[0].status).toBe("unreadable")
      // The unreadable-file fallback reports no usage (RD-FR-027).
      expect(data.runs[0].usage).toBeNull()
    })
  })

  it("reports pending submissions from the in-process store", async () => {
    const correlationId = await setupDispatchSession([
      runFixture("divisor-guard"),
    ])

    // Simulate an in-flight submission that hasn't been harvested yet.
    const store = _getSubmissionStore()
    store.set("pending-child", {
      findings: [
        { severity: "LOW", category: "test", description: "d", root_cause: "r", file: null, line: null },
      ],
      proposals: [],
    })

    await withBun(async () => {
      const project = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: { session: {} },
        directory: project,
        worktree: project,
      } as unknown as PluginInput)

      const result = await hooks.tool.dispatch_status.execute(
        {},
        noopContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.pending_submissions).toBe(1)
    })
  })
})

describe("dispatch_status latest-dispatch resolution (RD-CR-001, issue #794)", () => {
  it("resolves the latest aggregate dispatch when no correlation_id is supplied", async () => {
    await withBun(async () => {
      const { directory, diffPath } = await dispatchScratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: fakeClient(),
        directory,
        worktree: directory,
      } as unknown as PluginInput)

      // Workflow A dispatches two reviewers under its minted correlation...
      const firstCorrelation = await aggregateDispatch(
        hooks,
        makeBaseInput(diffPath, [makePlanEntry({ agent: "divisor-guard", sequence: 1 }), makePlanEntry({ agent: "divisor-adversary", sequence: 2 })]),
      )
      // ...then workflow B dispatches a different panel from the SAME parent
      // session, minting a second, distinct dispatch session (issue #794).
      const secondCorrelation = await aggregateDispatch(
        hooks,
        makeBaseInput(diffPath, [makePlanEntry({ agent: "divisor-architect", sequence: 1 }), makePlanEntry({ agent: "divisor-testing", sequence: 2 })]),
      )
      expect(secondCorrelation).not.toBe(firstCorrelation)

      // No-parameter status resolves the LATEST dispatch session: the session
      // map was re-pointed by workflow B's invocation.
      const result = await hooks.tool.dispatch_status.execute({}, aggregateParentContext())

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.correlation_id).toBe(secondCorrelation)
      expect(data.total_runs).toBe(2)
      const agents = data.runs.map((r: { agent: string }) => r.agent).sort()
      expect(agents).toEqual(["divisor-architect", "divisor-testing"])
    })
  })

  it("resolves the earlier dispatch via explicit correlation_id", async () => {
    await withBun(async () => {
      const { directory, diffPath } = await dispatchScratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: fakeClient(),
        directory,
        worktree: directory,
      } as unknown as PluginInput)

      const firstCorrelation = await aggregateDispatch(
        hooks,
        makeBaseInput(diffPath, [makePlanEntry({ agent: "divisor-guard", sequence: 1 }), makePlanEntry({ agent: "divisor-adversary", sequence: 2 })]),
      )
      const secondCorrelation = await aggregateDispatch(
        hooks,
        makeBaseInput(diffPath, [makePlanEntry({ agent: "divisor-architect", sequence: 1 }), makePlanEntry({ agent: "divisor-testing", sequence: 2 })]),
      )
      expect(secondCorrelation).not.toBe(firstCorrelation)

      // Explicit C1 inspects workflow A's dispatch session: its run files
      // survived workflow B's invocation untouched.
      const result = await hooks.tool.dispatch_status.execute(
        { correlation_id: firstCorrelation },
        aggregateParentContext(),
      )

      const data = JSON.parse(result.output)
      expect(data.status).toBe("ok")
      expect(data.correlation_id).toBe(firstCorrelation)
      expect(data.total_runs).toBe(2)
      const agents = data.runs.map((r: { agent: string }) => r.agent).sort()
      expect(agents).toEqual(["divisor-adversary", "divisor-guard"])
    })
  })

  it("fails closed as not_found after a session-less all-skip invocation re-points the map", async () => {
    await withBun(async () => {
      const { directory, diffPath } = await dispatchScratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: fakeClient(),
        directory,
        worktree: directory,
      } as unknown as PluginInput)

      // A completed dispatch under C1...
      const firstCorrelation = await aggregateDispatch(
        hooks,
        makeBaseInput(diffPath, [makePlanEntry({ agent: "divisor-guard", sequence: 1 })]),
      )
      // ...then an all-skip invocation: it mints a fresh correlation and
      // re-points the map but returns before creating any dispatch session.
      const skipped = await hooks.tool.dispatch_review_runs.execute(
        makeBaseInput(diffPath, [makePlanEntry({ agent: "divisor-adversary", decision: "skip", sequence: 1 })]),
        aggregateParentContext(),
      )
      const skippedMeta = skipped.metadata as Record<string, unknown>
      expect(skippedMeta.status).toBe("ok")
      expect(skippedMeta.runs_skipped).toBe(1)
      const skippedCorrelation = skippedMeta.correlation_id as string
      expect(skippedCorrelation).not.toBe(firstCorrelation)

      // No-parameter status fails closed as not_found under the session-less
      // correlation — it must NOT report workflow A's runs.
      const notFound = JSON.parse((await hooks.tool.dispatch_status.execute({}, aggregateParentContext())).output)
      expect(notFound.status).toBe("not_found")
      expect(notFound.correlation_id).toBe(skippedCorrelation)
      expect(notFound.runs).toEqual([])
      expect(notFound.message).toBeUndefined()

      // The explicit correlation_id still resolves the earlier dispatch.
      const recovered = JSON.parse(
        (await hooks.tool.dispatch_status.execute({ correlation_id: firstCorrelation }, aggregateParentContext())).output,
      )
      expect(recovered.status).toBe("ok")
      expect(recovered.correlation_id).toBe(firstCorrelation)
      expect(recovered.runs.map((r: { agent: string }) => r.agent)).toEqual(["divisor-guard"])
    })
  })
})

describe("consolidate_dispatch correlation_id (design D3)", () => {
  it("consolidates a dispatch by explicit correlation_id from a fresh session", async () => {
    // The issue #751 recovery path (design D3): after a restart the new
    // parent session has no sessionCorrelationMap entry, so the explicit
    // correlation_id alone must resolve the on-disk dispatch session. The
    // sibling tool gained the same resolution as dispatch_status; its
    // semantics suite lives in consolidate-dispatch.test.ts (task 7.1).
    const correlationId = randomUUID()
    const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
    await mkdir(dir, { recursive: true })
    cleanupDirs.push(dir)
    const metadata = consolidationSessionMetadata(["divisor-guard"])
    await writeFile(join(dir, "session-metadata.json"), JSON.stringify(metadata, null, 2), "utf8")
    await writeFile(join(dir, "run-divisor-guard.json"), JSON.stringify(runFixture("divisor-guard"), null, 2), "utf8")

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({ correlation_id: correlationId }, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.correlation_id).toBe(correlationId)
    expect(payload.verdict).toBe("APPROVE")
    expect(payload.run_counts.success).toBe(1)
    // No exclusions: the warnings key is omitted when empty (PR #776).
    expect(payload.warnings).toBeUndefined()
  })
})
