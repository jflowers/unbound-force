/**
 * Shared fixtures for the review-dispatch aggregate-dispatch test suites
 * (dispatch-review-runs, dispatch-agent-run, consolidate-dispatch, and
 * dispatch-status). Extracted from per-suite copies per default.md CS-004
 * [MUST]: identical or nearly identical logic in more than two locations
 * must live in one shared module. These fixtures encode the
 * DispatchPlanEntrySchema and session-metadata input contracts, so future
 * schema evolution edits this module instead of four suites in lockstep.
 *
 * Registry-parameterized factories: every suite owns its cleanup registry
 * (drained in its afterEach), so the factories take the registry as a
 * parameter rather than owning module-global state.
 */

import { mkdir, mkdtemp, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { expect } from "vitest"

import type { ReviewDispatchPlugin } from "../../plugins/review-dispatch/index.js"
import manifestFixture from "../fixtures/review-dispatch/manifest.json"
import matrixFixture from "../fixtures/review-dispatch/matrix.json"

/** Hooks object returned by ReviewDispatchPlugin.server(). */
export type DispatchPluginHooks = Awaited<ReturnType<typeof ReviewDispatchPlugin.server>>

/** A scratch review project on disk: its directory and diff file path. */
export type ScratchProject = { directory: string; diffPath: string }

/** UUID shape matching randomUUID output and the plugin's UUIDSchema. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** Dispatch session directory on disk for a correlation id (mirrors dispatchSessionDir). */
export function dispatchDir(correlationId: string): string {
  return join(tmpdir(), "opencode", `dispatch-${correlationId}`)
}

/**
 * Create a per-suite dispatch-session-dir tracker bound to the suite's
 * cleanup registry, so minted session directories are removed in afterEach.
 */
export function makeDispatchDirTracker(cleanupRegistry: string[]): (correlationId: string) => void {
  return (correlationId: string): void => {
    cleanupRegistry.push(dispatchDir(correlationId))
  }
}

/** Check whether a path exists on disk (file or directory). */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Scratch-project factory parameterized by mkdtemp prefix and cleanup
 * registry. Creates the .uf review config fixtures (matrix, manifest,
 * sibling repos) and a diff file so real dispatch_review_runs invocations
 * complete without network or live providers.
 */
export function makeScratchProjectFactory(
  prefix: string,
  cleanupRegistry: string[],
): () => Promise<ScratchProject> {
  return async (): Promise<ScratchProject> => {
    const directory = await mkdtemp(join(tmpdir(), prefix))
    cleanupRegistry.push(directory)
    await mkdir(join(directory, ".uf"), { recursive: true })
    await writeFile(join(directory, ".uf", "review-matrix.yaml"), JSON.stringify(matrixFixture))
    await writeFile(join(directory, ".uf", "reviewer-capabilities.yaml"), JSON.stringify(manifestFixture))
    await writeFile(join(directory, ".uf", "sibling-repos.yaml"), JSON.stringify({ version: 1, siblings: [] }))
    const diffPath = join(directory, "test.diff")
    await writeFile(
      diffPath,
      "diff --git a/src/foo.ts b/src/foo.ts\n--- a/src/foo.ts\n+++ b/src/foo.ts\n@@ -1 +1 @@\n-old\n+new\n",
    )
    return { directory, diffPath }
  }
}

/** Options for the model-echoing fake client. */
export interface FakeClientOptions {
  /** Override the prompt handler. Receives the request and returns a response. */
  promptHandler?: (request: unknown, callIndex: number) => Promise<unknown>
  /** Track all prompt calls for assertions. */
  promptCalls?: unknown[]
}

/**
 * Minimal model-echoing fake client for driving real dispatch_review_runs
 * invocations without network or live providers. Prompt responses echo the
 * requested model so model-mismatch checks pass, and each prompt call
 * references a distinct indexed child session.
 */
export function fakeClient(options?: FakeClientOptions): PluginInput["client"] {
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
  return { session } as unknown as PluginInput["client"]
}

/** Tool context for a parent session driving the aggregate dispatch tools. */
export function dispatchParentContext(sessionID: string): ToolContext {
  return {
    sessionID,
    messageID: `msg-${sessionID}`,
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

/** A plan entry matching DispatchPlanEntrySchema for aggregate dispatch input. */
export function makePlanEntry(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
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

/**
 * Session metadata matching SessionMetadataSchema for aggregate dispatch
 * inputs, persisted by the dispatch's first internal run call. The headRef
 * parameter differentiates workflows so payloads assert against their OWN
 * session's metadata, not the latest one on disk.
 */
export function makeSessionMetadata(overrides?: {
  mode?: "code" | "specs"
  headRef?: string
}): Record<string, unknown> {
  return {
    command: "review-council",
    mode: overrides?.mode ?? "code",
    full: false,
    input_context: {
      kind: "local",
      pr_number: null,
      base_ref: "main",
      base_sha: "a".repeat(40),
      head_ref: overrides?.headRef ?? "feature",
      head_sha: "b".repeat(40),
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

/** Valid dispatch_review_runs input for code mode with the given plan entries. */
export function makeBaseInput(
  diffPath: string,
  planEntries: Record<string, unknown>[],
  headRef?: string,
): Record<string, unknown> {
  return {
    mode: "code",
    command: "review-council",
    diff_path: diffPath,
    changed_files: "src/foo.ts",
    input_context: "base: main, head: feature",
    plan_entries: planEntries,
    max_parallel_runs: 4,
    session_metadata: makeSessionMetadata({ headRef }),
  }
}

/**
 * Create a per-suite aggregate-dispatch runner bound to the parent-session
 * context and cleanup registry. Runs one dispatch_review_runs invocation
 * from the shared parent session and returns its minted correlation id,
 * tracking the dispatch session directory for afterEach cleanup.
 */
export function makeAggregateDispatchRunner(
  parentContext: () => ToolContext,
  cleanupRegistry: string[],
): (hooks: DispatchPluginHooks, input: Record<string, unknown>) => Promise<string> {
  return async (hooks, input): Promise<string> => {
    const response = await hooks.tool.dispatch_review_runs.execute(input, parentContext())
    const meta = response.metadata as Record<string, unknown>
    expect(meta.status).toBe("ok")
    const correlationId = meta.correlation_id as string
    expect(typeof correlationId).toBe("string")
    // Track the dispatch session directory for afterEach cleanup.
    cleanupRegistry.push(dispatchDir(correlationId))
    return correlationId
  }
}
