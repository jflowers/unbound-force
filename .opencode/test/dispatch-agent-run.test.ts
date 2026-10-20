import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { readFile, readdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it, vi, afterEach } from "vitest"

import type { InvokeAgentResult } from "../lib/agent-executor.js"
import {
  createDispatchAgentRunTool,
  dispatchAgentRun,
  shouldReclassifyToSuccess,
  _getSessionCorrelationMap,
  _getSubmissionStore,
  type DispatchAgentRunDependencies,
  type PlannerDependencies,
} from "../plugins/review-dispatch/index.js"
import manifestFixture from "./fixtures/review-dispatch/manifest.json"
import matrixFixture from "./fixtures/review-dispatch/matrix.json"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

// Track dispatch session dirs created by dispatchAgentRun for cleanup.
const cleanupDirs: string[] = []

afterEach(async () => {
  _getSessionCorrelationMap().clear()
  // Submission-store entries are keyed by child session id; clear them so
  // tests that seed harvested submissions cannot leak into later tests.
  _getSubmissionStore().clear()
  for (const dir of cleanupDirs) {
    try {
      await rm(dir, { recursive: true, force: true })
    } catch {
      // best-effort
    }
  }
  cleanupDirs.length = 0
})

type Client = PluginInput["client"]

function jsonParser(text: string): unknown {
  return JSON.parse(text) as unknown
}

/**
 * Minimal fake client that succeeds for dispatch_agent_run calls.
 * Prompt response echoes the requested model identity so
 * model-mismatch checks pass.
 */
function fakeClient(): Client {
  const session = {
    create: async (): Promise<unknown> => ({
      data: { id: "child-session" },
      error: undefined,
    }),
    message: async (): Promise<unknown> => ({
      data: {
        info: {
          id: "m",
          sessionID: "s",
          role: "assistant",
          providerID: "p",
          modelID: "m",
          variant: "active",
        },
        parts: [],
      },
      error: undefined,
    }),
    prompt: async (request: unknown): Promise<unknown> => {
      // Echo the requested model so model-mismatch checks pass.
      const req = request as { body?: { model?: { providerID: string; modelID: string } } }
      const providerID = req.body?.model?.providerID ?? "provider"
      const modelID = req.body?.model?.modelID ?? "standard"
      return {
        data: {
          info: { role: "assistant", providerID, modelID },
          parts: [
            { id: "t", sessionID: "child-session", messageID: "m", type: "text", text: "review output", ignored: false },
          ],
        },
        error: undefined,
      }
    },
    abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
  }
  return { session } as unknown as Client
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

/** Dispatch session directory on disk for a correlation id. */
function dispatchDir(correlationId: string): string {
  return join(tmpdir(), "opencode", `dispatch-${correlationId}`)
}

/** Track a dispatch result for temp dir cleanup. */
function trackForCleanup(correlationId: string): void {
  cleanupDirs.push(dispatchDir(correlationId))
}

function makeDeps(overrides?: {
  readText?: (path: string) => Promise<string>
  client?: Client
  directory?: string
}): DispatchAgentRunDependencies {
  const readText =
    overrides?.readText ??
    vi.fn(async (path: string): Promise<string> => {
      if (path === ".uf/review-matrix.yaml") return JSON.stringify(matrixFixture)
      if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
      if (path === ".uf/review-matrix.override.yaml") {
        const err = new Error("ENOENT") as NodeJS.ErrnoException
        err.code = "ENOENT"
        throw err
      }
      throw new Error(`unexpected read: ${path}`)
    })

  return {
    plannerDependencies: {
      readText,
      parseYaml: jsonParser,
    },
    client: overrides?.client ?? fakeClient(),
    directory: overrides?.directory ?? "/workspace",
  }
}

// ── RD-FR-026 reclassification / D5 persistence fixtures ────

/** Valid SHAs for session metadata input_context. */
const VALID_SHA = "a".repeat(40)
const VALID_SHA2 = "b".repeat(40)

/** A finding that satisfies RunFindingSchema, as submitted before an abort. */
const SUBMITTED_FINDING = {
  severity: "MEDIUM",
  category: "standard",
  description: "Example finding submitted before the session abort.",
  root_cause: "Example root cause for the submitted finding.",
  file: "src/example.ts",
  line: 42,
} as const

/** A lesson proposal as submitted before an abort. */
const SUBMITTED_PROPOSAL = {
  information: "Example lesson submitted before the session abort.",
  tag: "review-dispatch",
} as const

/** Partial final-response text captured from an aborted child message. */
const PARTIAL_TEXT = "partial final review text"

/** Provenance for predicate fixtures; overrides flip one criterion at a time. */
function predicateProvenance(overrides?: Partial<InvokeAgentResult["provenance"]>): InvokeAgentResult["provenance"] {
  return {
    agent: "divisor-guard",
    requested_model: "provider/standard",
    requested_variant: "high",
    resolved_parent_model: null,
    resolved_parent_variant: null,
    reported_child_model: "provider/standard",
    model_mismatch: false,
    read_only: true,
    ...overrides,
  }
}

/**
 * Build an InvokeAgentResult shaped like the issue #751 post-submission
 * abort: failed / child_message_error with partial final-response text and
 * clean provenance. Each predicate test overrides exactly one criterion.
 */
function makeAbortResult(overrides?: Partial<InvokeAgentResult>): InvokeAgentResult {
  return {
    status: "failed",
    text: PARTIAL_TEXT,
    usage: null,
    error: { code: "child_message_error", message: "session aborted mid-message", retryable: false },
    provenance: predicateProvenance(),
    ...overrides,
  }
}

/**
 * Fake client whose child prompt response carries info.error — the
 * executor's child_message_error signature — while preserving the partial
 * final-response text. reportedModel forces a provider substitution so a
 * run can report a model mismatch alongside the mid-message abort.
 */
function abortingClient(options?: { reportedModel?: { providerID: string; modelID: string } }): Client {
  const session = {
    create: async (): Promise<unknown> => ({
      data: { id: "child-session" },
      error: undefined,
    }),
    message: async (): Promise<unknown> => ({
      data: {
        info: {
          id: "m",
          sessionID: "s",
          role: "assistant",
          providerID: "p",
          modelID: "m",
          variant: "active",
        },
        parts: [],
      },
      error: undefined,
    }),
    prompt: async (request: unknown): Promise<unknown> => {
      // Echo the requested model unless a substitution is forced, so
      // model-mismatch checks pass (or deliberately fail) per test.
      const req = request as { body?: { model?: { providerID: string; modelID: string } } }
      const providerID = options?.reportedModel?.providerID ?? req.body?.model?.providerID ?? "provider"
      const modelID = options?.reportedModel?.modelID ?? req.body?.model?.modelID ?? "standard"
      return {
        data: {
          info: {
            role: "assistant",
            providerID,
            modelID,
            error: { name: "MessageAbortedError", data: {} },
          },
          parts: [
            { id: "t", sessionID: "child-session", messageID: "m", type: "text", text: PARTIAL_TEXT, ignored: false },
          ],
        },
        error: undefined,
      }
    },
    abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
  }
  return { session } as unknown as Client
}

/**
 * Fake client whose child prompt call fails outright — a plain executor
 * failure (child_prompt_failed) that still writes a run record.
 */
function promptFailureClient(): Client {
  const session = {
    create: async (): Promise<unknown> => ({
      data: { id: "child-session" },
      error: undefined,
    }),
    message: async (): Promise<unknown> => ({
      data: {
        info: {
          id: "m",
          sessionID: "s",
          role: "assistant",
          providerID: "p",
          modelID: "m",
          variant: "active",
        },
        parts: [],
      },
      error: undefined,
    }),
    prompt: async (): Promise<unknown> => ({ data: undefined, error: { message: "child prompt failed" } }),
    abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
  }
  return { session } as unknown as Client
}

/** Read and parse the persisted run file for one agent in a dispatch session. */
async function readRunFile(correlationId: string, agent: string): Promise<Record<string, unknown>> {
  const raw = await readFile(join(dispatchDir(correlationId), `run-${agent}.json`), "utf8")
  return JSON.parse(raw) as Record<string, unknown>
}

/** Read and parse the persisted session-metadata.json for a dispatch session. */
async function readSessionMetadataFile(correlationId: string): Promise<Record<string, unknown>> {
  const raw = await readFile(join(dispatchDir(correlationId), "session-metadata.json"), "utf8")
  return JSON.parse(raw) as Record<string, unknown>
}

/** Names of run-*.json files in a dispatch session dir ([] when absent). */
async function listRunFiles(correlationId: string): Promise<string[]> {
  try {
    const entries = await readdir(dispatchDir(correlationId))
    return entries.filter((name) => name.startsWith("run-"))
  } catch {
    // The directory is never created when nothing was persisted for the session.
    return []
  }
}

/** Session metadata payload matching SessionMetadataSchema for D5 tests. */
function makeSessionMetadata(overrides?: { mode?: "code" | "specs"; headRef?: string }): Record<string, unknown> {
  return {
    command: "review-council",
    mode: overrides?.mode ?? "code",
    full: false,
    input_context: {
      kind: "local",
      pr_number: null,
      base_ref: "main",
      base_sha: VALID_SHA,
      head_ref: overrides?.headRef ?? "feature",
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

describe("dispatch_agent_run", () => {
  describe("tier-based model resolution", () => {
    it("resolves model from review matrix for 'standard' tier", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "standard" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.text).toBe("review output")
      // Auto-generated correlation_id and run_id are valid UUIDs.
      expect(result.correlation_id).toMatch(UUID_RE)
      expect(result.run_id).toMatch(UUID_RE)
      // The matrix fixture has standard profile with model "provider/standard".
      expect(result.provenance.requested_model).toBe("provider/standard")
      expect(result.provenance.requested_variant).toBe("high")
      expect(result.provenance.agent).toBe("divisor-guard")
    })

    it("resolves model from review matrix for 'lightweight' tier", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "lightweight" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      // The matrix fixture has lightweight profile with model "provider/light".
      expect(result.provenance.requested_model).toBe("provider/light")
      expect(result.provenance.requested_variant).toBe("fast")
    })
  })

  describe("explicit model bypass", () => {
    it("uses model parameter directly without loading matrix for resolution", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", model: "custom-provider/custom-model@v2" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.provenance.requested_model).toBe("custom-provider/custom-model@v2")
      expect(result.provenance.agent).toBe("divisor-guard")
    })

    it("preserves variant when model is provided directly", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        {
          agent: "divisor-guard",
          prompt: "Review this change.",
          model: "custom-provider/custom-model",
          variant: "deep",
        },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.provenance.requested_model).toBe("custom-provider/custom-model")
      expect(result.provenance.requested_variant).toBe("deep")
    })
  })

  describe("default tier fallback", () => {
    it("defaults to 'standard' tier when neither tier nor model is provided", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.correlation_id).toMatch(UUID_RE)
      expect(result.run_id).toMatch(UUID_RE)
      // Should resolve via the "standard" profile: model "provider/standard".
      expect(result.provenance.requested_model).toBe("provider/standard")
      expect(result.provenance.requested_variant).toBe("high")
    })
  })

  describe("mutual exclusivity validation", () => {
    it("rejects when both tier and model are provided", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "standard", model: "provider/model" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("invalid_input")
      expect(result.error?.message).toContain("tier and model are mutually exclusive")
    })

    it("rejects when both prompt and promptFile are provided", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "inline text", promptFile: "/tmp/prompt.txt" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("invalid_input")
      expect(result.error?.message).toContain("prompt and promptFile are mutually exclusive")
    })

    it("rejects when neither prompt nor promptFile is provided", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", tier: "standard" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("invalid_input")
      expect(result.error?.message).toContain("one of prompt or promptFile is required")
    })
  })

  describe("unknown agent rejection", () => {
    it("returns failed result for an agent not in the manifest", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-nonexistent", prompt: "Review this change." },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("unknown_agent")
      expect(result.error?.message).toContain("divisor-nonexistent")
      expect(result.error?.message).toContain("absent from the reviewer manifest")
    })
  })

  describe("missing review matrix", () => {
    it("returns a failed result when loadPolicies throws", async () => {
      const readText = vi.fn(async (_path: string): Promise<string> => {
        throw new Error("ENOENT: no such file /Users/alice/.uf/review-matrix.yaml")
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("policy_load_failed")
      expect(result.error?.retryable).toBe(true)
      // Verify path sanitization — /Users/alice should be redacted.
      expect(result.error?.message).not.toContain("/Users/alice")
      expect(result.error?.message).toContain("[REDACTED]")
    })
  })

  describe("tier with no model configured", () => {
    it("returns tier_model_unavailable when the profile has no model", async () => {
      const emptyProfileMatrix = {
        ...matrixFixture,
        profiles: { ...matrixFixture.profiles, standard: {} },
      }
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(emptyProfileMatrix)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "standard" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("tier_model_unavailable")
      expect(result.error?.message).toContain("standard")
      expect(result.error?.message).toContain("no model configured")
      expect(result.error?.retryable).toBe(false)
    })
  })

  describe("invalid timeout", () => {
    it("rejects a timeout exceeding the schema maximum", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", timeout: 2_000_000 },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("invalid_input")
      expect(result.error?.retryable).toBe(false)
    })
  })

  describe("provenance metadata", () => {
    it("reflects tier-resolved model in requested_model", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "heavy" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.provenance).toMatchObject({
        agent: "divisor-guard",
        requested_model: "provider/heavy",
        resolved_parent_model: null,
        resolved_parent_variant: null,
        read_only: true,
        model_mismatch: false,
      })
      // Heavy profile has no variant configured, so requested_variant should be null.
      expect(result.provenance.requested_variant).toBeNull()
    })

    it("reflects direct model in requested_model", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        {
          agent: "divisor-adversary",
          prompt: "Review this change.",
          model: "google-vertex/claude-opus-4@default",
          variant: "fast",
          read_only: false,
        },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.provenance).toMatchObject({
        agent: "divisor-adversary",
        requested_model: "google-vertex/claude-opus-4@default",
        requested_variant: "fast",
        resolved_parent_model: null,
        resolved_parent_variant: null,
        read_only: false,
      })
    })

    it("sets read_only to true by default", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.provenance.read_only).toBe(true)
    })
  })

  describe("promptFile support", () => {
    it("reads prompt text from promptFile and executes successfully", async () => {
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === "/tmp/prompt.txt") return "File-based prompt content."
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(matrixFixture)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", promptFile: "/tmp/prompt.txt" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.text).toBe("review output")
      expect(readText).toHaveBeenCalledWith("/tmp/prompt.txt")
    })

    it("returns a failed result when promptFile read fails", async () => {
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === "/tmp/missing.txt") throw new Error("ENOENT: no such file /Users/alice/secret/prompt.txt")
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(matrixFixture)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", promptFile: "/tmp/missing.txt" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("prompt_file_read_failed")
      expect(result.error?.retryable).toBe(false)
      // Verify path sanitization.
      expect(result.error?.message).not.toContain("/Users/alice")
      expect(result.error?.message).toContain("[REDACTED]")
    })

    it("rejects promptFile content exceeding 4 MiB", async () => {
      const oversizedContent = "x".repeat(4 * 1024 * 1024 + 1)
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === "/tmp/big-prompt.txt") return oversizedContent
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(matrixFixture)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", promptFile: "/tmp/big-prompt.txt" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("invalid_input")
      expect(result.error?.message).toContain("promptFile content exceeds 4 MiB")
    })
  })

  describe("session-based correlation", () => {
    it("reuses the same correlation_id for multiple calls in the same session", async () => {
      const deps = makeDeps()
      const ctx = toolContext()
      const result1 = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "First review." },
        ctx,
        deps,
      )
      trackForCleanup(result1.correlation_id)
      const result2 = await dispatchAgentRun(
        { agent: "divisor-adversary", prompt: "Second review." },
        ctx,
        deps,
      )

      expect(result1.correlation_id).toMatch(UUID_RE)
      expect(result2.correlation_id).toBe(result1.correlation_id)
      expect(result1.run_id).not.toBe(result2.run_id)
    })
  })

  describe("advisor host-model fallback", () => {
    it("inherits parent session model when advisor profile has no model", async () => {
      const emptyProfileMatrix = {
        ...matrixFixture,
        profiles: { ...matrixFixture.profiles, standard: {} },
      }
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(emptyProfileMatrix)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "standard", source: "advisor" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      expect(result.provenance).toMatchObject({
        agent: "divisor-guard",
        requested_model: null,
        resolved_parent_model: "p/m",
        resolved_parent_variant: "active",
        read_only: true,
      })
      expect(result.provenance.requested_variant).toBeNull()
    })

    it("returns host_model_unavailable when host resolution fails", async () => {
      const emptyProfileMatrix = {
        ...matrixFixture,
        profiles: { ...matrixFixture.profiles, standard: {} },
      }
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(emptyProfileMatrix)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const failingClient = {
        session: {
          create: async (): Promise<unknown> => ({
            data: { id: "child-session" },
            error: undefined,
          }),
          message: async (): Promise<unknown> => ({
            data: undefined,
            error: { message: "session lookup failed" },
          }),
          prompt: async (): Promise<unknown> => ({ data: undefined, error: undefined }),
          abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
        },
      } as unknown as Client
      const deps = makeDeps({ readText, client: failingClient })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "standard", source: "advisor" },
        toolContext(),
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("host_model_unavailable")
      expect(result.error?.retryable).toBe(true)
    })

    it("returns cancelled when abort signal fires during host resolution", async () => {
      const emptyProfileMatrix = {
        ...matrixFixture,
        profiles: { ...matrixFixture.profiles, standard: {} },
      }
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(emptyProfileMatrix)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const abortController = new AbortController()
      const hangingClient = {
        session: {
          create: async (): Promise<unknown> => ({
            data: { id: "child-session" },
            error: undefined,
          }),
          message: async (): Promise<unknown> => {
            abortController.abort()
            return { data: undefined, error: { message: "aborted" } }
          },
          prompt: async (): Promise<unknown> => ({ data: undefined, error: undefined }),
          abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
        },
      } as unknown as Client
      const deps = makeDeps({ readText, client: hangingClient })
      const ctx = {
        ...toolContext(),
        abort: abortController.signal,
      }
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", tier: "standard", source: "advisor" },
        ctx,
        deps,
      )

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("cancelled")
      expect(result.error?.retryable).toBe(false)
    })
  })

  describe("shouldReclassifyToSuccess predicate", () => {
    it("returns true for a post-submission child_message_error abort with findings", () => {
      // The issue #751 shape: submissions accepted, final response begun,
      // session aborted mid-message, no model substitution.
      expect(shouldReclassifyToSuccess(makeAbortResult(), [SUBMITTED_FINDING], [])).toBe(true)
    })

    it("returns true when only lesson proposals were submitted", () => {
      expect(shouldReclassifyToSuccess(makeAbortResult(), [], [SUBMITTED_PROPOSAL])).toBe(true)
    })

    it("returns false when the run did not fail (cancelled status)", () => {
      expect(shouldReclassifyToSuccess(makeAbortResult({ status: "cancelled" }), [SUBMITTED_FINDING], [])).toBe(false)
    })

    it("returns false when the error code is a timeout, not a message abort", () => {
      const timedOut = makeAbortResult({
        error: { code: "timeout", message: "invoke_agent run timed out", retryable: true },
      })
      expect(shouldReclassifyToSuccess(timedOut, [SUBMITTED_FINDING], [])).toBe(false)
    })

    it("returns false when nothing was submitted before the abort", () => {
      expect(shouldReclassifyToSuccess(makeAbortResult(), [], [])).toBe(false)
    })

    it("returns false when the final-response text is empty", () => {
      expect(shouldReclassifyToSuccess(makeAbortResult({ text: "" }), [SUBMITTED_FINDING], [])).toBe(false)
    })

    it("returns false on a model-mismatched child despite submissions and text", () => {
      // The executor captures reported-model provenance BEFORE the
      // child_message_error return, so a provider-substituted child can
      // carry both signals. Such a run must stay failed: validateRunModel
      // rejects any success run with a model mismatch, so reclassifying it
      // would brick the finalization payload.
      const substituted = makeAbortResult({
        provenance: predicateProvenance({
          reported_child_model: "provider/substituted",
          model_mismatch: true,
        }),
      })
      expect(shouldReclassifyToSuccess(substituted, [SUBMITTED_FINDING], [])).toBe(false)
    })
  })

  describe("post-submission reclassification (RD-FR-026)", () => {
    it("records a reclassified run as success with an abort audit while the caller sees the raw failure", async () => {
      _getSubmissionStore().set("child-session", { findings: [SUBMITTED_FINDING], proposals: [] })
      const deps = makeDeps({ client: abortingClient() })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      // Caller-visible contract is unchanged: the raw executor failure.
      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("child_message_error")
      expect(result.text).toBe(PARTIAL_TEXT)
      expect(result.provenance.model_mismatch).toBe(false)

      // The persisted run file is the source of truth for consolidation.
      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.status).toBe("success")
      expect(runFile.error).toBeNull()
      expect(runFile.text).toBe(PARTIAL_TEXT)
      expect(runFile.findings).toEqual([SUBMITTED_FINDING])
      expect(runFile.post_submission_abort).toEqual({
        original_status: "failed",
        error_code: "child_message_error",
        error_message: expect.stringContaining("MessageAbortedError"),
        note: expect.stringContaining("RD-FR-026"),
      })
    })

    it("keeps a model-mismatched child_message_error run failed", async () => {
      _getSubmissionStore().set("child-session", { findings: [SUBMITTED_FINDING], proposals: [] })
      const deps = makeDeps({
        client: abortingClient({ reportedModel: { providerID: "provider", modelID: "substituted" } }),
      })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      // The abort carries both child_message_error and model_mismatch: the
      // executor reports substituted provenance before the abort return.
      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("child_message_error")
      expect(result.provenance.model_mismatch).toBe(true)

      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.status).toBe("failed")
      expect(runFile.model_mismatch).toBe(true)
      expect(runFile.error).toMatchObject({ code: "child_message_error" })
      expect("post_submission_abort" in runFile).toBe(false)
    })

    it("keeps a child_message_error run failed when nothing was submitted", async () => {
      const deps = makeDeps({ client: abortingClient() })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("child_message_error")

      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.status).toBe("failed")
      expect(runFile.findings).toEqual([])
      expect(runFile.proposals).toEqual([])
      expect(runFile.error).toMatchObject({ code: "child_message_error" })
      expect("post_submission_abort" in runFile).toBe(false)
    })
  })

  describe("post_submission_abort audit field", () => {
    it("is absent from a plain successful run file", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.status).toBe("success")
      expect(runFile.error).toBeNull()
      expect("post_submission_abort" in runFile).toBe(false)
    })

    it("is absent from a plain failed run file", async () => {
      const deps = makeDeps({ client: promptFailureClient() })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("child_prompt_failed")
      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.status).toBe("failed")
      expect(runFile.error).toMatchObject({ code: "child_prompt_failed" })
      expect("post_submission_abort" in runFile).toBe(false)
    })
  })

  describe("prompt persistence", () => {
    it("persists the inline prompt verbatim in the run record", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change line by line." },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.prompt).toBe("Review this change line by line.")
    })

    it("persists the promptFile contents verbatim in the run record", async () => {
      const readText = vi.fn(async (path: string): Promise<string> => {
        if (path === "/tmp/prompt.txt") return "File-based prompt content."
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(matrixFixture)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      })
      const deps = makeDeps({ readText })
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", promptFile: "/tmp/prompt.txt" },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("success")
      const runFile = await readRunFile(result.correlation_id, "divisor-guard")
      expect(runFile.prompt).toBe("File-based prompt content.")
    })

    it("writes no run record when a pre-execution early exit fires", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        {
          agent: "divisor-guard",
          promptFile: "/tmp/missing.txt",
          session_metadata: makeSessionMetadata(),
        },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      expect(result.status).toBe("failed")
      expect(result.error?.code).toBe("prompt_file_read_failed")
      // Session metadata was still persisted, but no run record exists —
      // the early exit fired before executeDispatchRun could write one.
      expect(await listRunFiles(result.correlation_id)).toEqual([])
      expect((await readSessionMetadataFile(result.correlation_id)).mode).toBe("code")
    })
  })

  describe("session metadata refresh", () => {
    it("writes session-metadata.json on the first call that supplies it", async () => {
      const deps = makeDeps()
      const result = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", session_metadata: makeSessionMetadata() },
        toolContext(),
        deps,
      )
      trackForCleanup(result.correlation_id)

      const metadata = await readSessionMetadataFile(result.correlation_id)
      expect(metadata.mode).toBe("code")
      expect(metadata.input_context).toMatchObject({ kind: "local", head_ref: "feature" })
    })

    it("replaces the file when a subsequent call supplies fresh metadata", async () => {
      const deps = makeDeps()
      const ctx = toolContext()
      const first = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", session_metadata: makeSessionMetadata() },
        ctx,
        deps,
      )
      trackForCleanup(first.correlation_id)
      const second = await dispatchAgentRun(
        {
          agent: "divisor-guard",
          prompt: "Review this change again.",
          session_metadata: makeSessionMetadata({ mode: "specs", headRef: "fix-loop" }),
        },
        ctx,
        deps,
      )

      // Same parent session resolves to the same dispatch session dir.
      expect(second.correlation_id).toBe(first.correlation_id)
      const metadata = await readSessionMetadataFile(second.correlation_id)
      expect(metadata.mode).toBe("specs")
      expect(metadata.input_context).toMatchObject({ head_ref: "fix-loop" })
    })

    it("leaves the file untouched when a subsequent call omits session_metadata", async () => {
      const deps = makeDeps()
      const ctx = toolContext()
      const first = await dispatchAgentRun(
        { agent: "divisor-guard", prompt: "Review this change.", session_metadata: makeSessionMetadata() },
        ctx,
        deps,
      )
      trackForCleanup(first.correlation_id)
      await dispatchAgentRun(
        { agent: "divisor-adversary", prompt: "Review this change again." },
        ctx,
        deps,
      )

      const metadata = await readSessionMetadataFile(first.correlation_id)
      expect(metadata.mode).toBe("code")
      expect(metadata.input_context).toMatchObject({ head_ref: "feature" })
    })
  })

  describe("createDispatchAgentRunTool factory", () => {
    it("creates a tool with description and expected args", () => {
      const deps = makeDeps()
      const dispatchTool = createDispatchAgentRunTool(deps)

      expect(dispatchTool.description).toContain("Divisor review-agent run")
      expect(Object.keys(dispatchTool.args).sort()).toEqual([
        "agent",
        "model",
        "prompt",
        "promptFile",
        "read_only",
        "sequence",
        "session_metadata",
        "source",
        "tier",
        "timeout",
        "variant",
      ])
    })
  })
})
