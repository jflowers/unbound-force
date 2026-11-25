import { readFile, readdir, rm } from "node:fs/promises"
import { join, resolve } from "node:path"

import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { afterEach, describe, expect, it } from "vitest"

import ReviewDispatchPlugin, {
  _getSessionCorrelationMap,
  _getSubmissionStore,
  createAcquireIntentContextTool,
  IntentSatisfactionStateSchema,
  renderIntentSatisfactionContext,
  truncateIntentSatisfactionState,
  type AcquireIntentContextDependencies,
  type AcquireIntentContextResult,
  type IntentSatisfactionState,
} from "../plugins/review-dispatch/index.js"
import { sanitizeSlug, type GitExec } from "../lib/uf-workflow-types.js"
import { createRecordHumanDecisionTool } from "../plugins/uf-workflow/index.js"
import { withBun } from "./helpers/bun-runtime.js"
import {
  dispatchDir,
  fakeClient,
  makePlanEntry,
  makeScratchProjectFactory,
  makeSessionMetadata,
  type DispatchPluginHooks,
} from "./helpers/aggregate-dispatch-fixtures.js"
import {
  createMockSpawn,
  patchBunSpawn,
  type MockSpawnFn,
  type MockSpawnResponses,
} from "./helpers/gh-spawn-mock.js"

// ---------------------------------------------------------------------------
// intent-satisfaction-check task 3.1 (RC-FR-010/011, designs D2/D3/D6). Pins
// the machine-readable intent-satisfaction field shapes and verifies the three
// DE-007 seam layers for the extended dispatch contract: the registration
// surface and input-schema parity for the session-metadata fields written at
// dispatch time; the documented output shape; and the write→read round-trip
// through the persisted dispatch artifact into the final-report provenance.
// Every test runs network-free (Principle IV): the acquisition tool runs on
// injected fakes, and dispatch_review_runs drives a scratch project with the
// model-echoing fake client.
// ---------------------------------------------------------------------------

const ACQUIRE_PROJECT_ROOT = "/repo"

/** Provenance commit matching makeSessionMetadata's frozen head_sha. */
const PROVENANCE_COMMIT = "b".repeat(40)

// ── Acquisition fixture (injected dependencies, no network) ──

type ToolInput = { pr_body?: string; repo?: string }

interface AcquireFixtureOptions {
  readonly branch?: string
  readonly files?: Readonly<Record<string, string>>
  readonly gh?: string | Error
}

interface AcquireFixture {
  readonly tool: ReturnType<typeof createAcquireIntentContextTool>
  readonly ghCalls: number[]
}

/** A label in the object form real `gh issue view --json labels` emits. */
interface GhObjectLabel {
  readonly name: string
  readonly color?: string
  readonly description?: string
}

function issueJson(overrides?: {
  number?: number
  title?: string
  body?: string | null
  labels?: ReadonlyArray<string | GhObjectLabel>
}): string {
  return JSON.stringify({
    number: overrides?.number ?? 42,
    title: overrides?.title ?? "Add auth endpoint",
    body:
      overrides?.body === undefined
        ? "## Acceptance Criteria\n- [ ] The API returns 201\n- [ ] Errors are typed"
        : overrides.body,
    labels: overrides?.labels ?? [],
  })
}

function acquireTool(options: AcquireFixtureOptions = {}): AcquireFixture {
  const ghCalls: number[] = []
  const files = new Map<string, string>(Object.entries(options.files ?? {}))
  const dependencies: AcquireIntentContextDependencies = {
    projectRoot: ACQUIRE_PROJECT_ROOT,
    currentBranch: async (): Promise<string> => {
      if (options.branch instanceof Error) throw options.branch
      return options.branch ?? "opsx/feature"
    },
    fetchIssue: async (issueNumber: number): Promise<string> => {
      ghCalls.push(issueNumber)
      if (options.gh instanceof Error) throw options.gh
      return options.gh ?? issueJson({ number: issueNumber })
    },
    readTextFile: async (path: string): Promise<string> => {
      const content = files.get(path)
      if (content === undefined) {
        throw new Error(`ENOENT: no such file ${path}`)
      }
      return content
    },
  }
  return { tool: createAcquireIntentContextTool(dependencies), ghCalls }
}

async function acquire(
  tool: AcquireFixture["tool"],
  args: ToolInput = {},
): Promise<AcquireIntentContextResult> {
  const result = await tool.execute(args)
  return JSON.parse(result.output) as AcquireIntentContextResult
}

function statePath(branch: string): string {
  return resolve(
    ACQUIRE_PROJECT_ROOT,
    `.uf/progress/${sanitizeSlug(branch)}/uf.unleash.json`,
  )
}

function checkpointState(issueNumber: unknown): string {
  return JSON.stringify({
    completed_steps: ["tier-routing"],
    data: { issue_number: issueNumber },
  })
}

// ── Dispatch harness (scratch project + fake client, no network) ──

const scratchDirectories: string[] = []
const dispatchSessionDirs: string[] = []

const scratchProject = makeScratchProjectFactory("uf-intent-satisfaction-", scratchDirectories)

afterEach(async () => {
  _getSessionCorrelationMap().clear()
  _getSubmissionStore().clear()
  await Promise.all(scratchDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
  await Promise.all(dispatchSessionDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

function toolContext(sessionID = "intent-parent-session"): ToolContext {
  return {
    sessionID,
    messageID: `msg-${sessionID}`,
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

/**
 * Plan entry in the shape the finalizer's plan-identity and model checks
 * accept (source/sequence identity recorded on the run files; explicit model
 * matching the fake client's echo), so provenance-carrying consolidation of
 * real dispatches finalizes cleanly.
 */
function planEntry(agent: string, sequence: number): Record<string, unknown> {
  return makePlanEntry({ agent, sequence, source: "explicit", model: "provider/standard" })
}

function codeModeInput(
  diffPath: string,
  planEntries: Record<string, unknown>[],
  intentSatisfaction: Record<string, unknown>,
): Record<string, unknown> {
  return {
    mode: "code",
    command: "review-council",
    diff_path: diffPath,
    changed_files: "src/foo.ts",
    input_context: "base: main, head: feature",
    plan_entries: planEntries,
    max_parallel_runs: 4,
    session_metadata: {
      ...makeSessionMetadata(),
      plan: planEntries,
      intent_satisfaction: intentSatisfaction,
    },
  }
}

interface DispatchOutcome {
  readonly hooks: DispatchPluginHooks
  readonly correlationId: string
  readonly metadata: Record<string, unknown>
}

async function dispatchWithState(
  intentSatisfaction: Record<string, unknown>,
  agents: readonly string[],
): Promise<DispatchOutcome> {
  const { directory, diffPath } = await scratchProject()
  const hooks = await ReviewDispatchPlugin.server({
    client: fakeClient(),
    directory,
    worktree: directory,
  } as unknown as PluginInput)
  const planEntries = agents.map((agent, index) => planEntry(agent, index + 1))
  const response = await hooks.tool.dispatch_review_runs.execute(
    codeModeInput(diffPath, planEntries, intentSatisfaction),
    toolContext(),
  )
  const metadata = response.metadata as Record<string, unknown>
  expect(metadata.status).toBe("ok")
  const correlationId = metadata.correlation_id as string
  expect(typeof correlationId).toBe("string")
  dispatchSessionDirs.push(dispatchDir(correlationId))
  return { hooks, correlationId, metadata }
}

async function readSessionMetadata(correlationId: string): Promise<Record<string, unknown>> {
  const raw = await readFile(join(dispatchDir(correlationId), "session-metadata.json"), "utf8")
  return JSON.parse(raw) as Record<string, unknown>
}

async function readPromptFiles(correlationId: string): Promise<string[]> {
  const promptsDir = join(dispatchDir(correlationId), "prompts")
  const entries = await readdir(promptsDir)
  const names = entries.filter((name) => name.endsWith(".md")).sort()
  return Promise.all(names.map((name) => readFile(join(promptsDir, name), "utf8")))
}

interface ConsolidationOutcome {
  readonly compact: Record<string, unknown>
  readonly artifact: Record<string, unknown>
}

async function consolidateWithProvenance(
  hooks: DispatchPluginHooks,
  correlationId: string,
): Promise<ConsolidationOutcome> {
  const result = await hooks.tool.consolidate_dispatch.execute(
    {
      correlation_id: correlationId,
      provenance: {
        branch: "opsx/intent-satisfaction-check",
        commit: PROVENANCE_COMMIT,
        workflow_id: "uf.review-council",
      },
    },
    toolContext("intent-consolidate-session"),
  )
  const compact = JSON.parse(result.output) as Record<string, unknown>
  expect(compact.status).toBe("success")
  const artifactPath = compact.artifact_path as string
  expect(artifactPath).toContain(".uf/artifacts/dispatch/")
  const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as Record<string, unknown>
  return { compact, artifact }
}

// ── Machine-readable state shapes (design D2) ──

describe("IntentSatisfactionStateSchema field shapes", () => {
  it("should accept every resolution source and grounding tier value", () => {
    const sources = ["pr-body", "tier-routing-checkpoint", "openspec-yaml"] as const
    for (const resolutionSource of sources) {
      const criteriaState = {
        issue_number: 42,
        resolution_source: resolutionSource,
        grounding_tier: "strict",
        criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      }
      expect(IntentSatisfactionStateSchema.safeParse(criteriaState).success).toBe(true)
    }
    for (const groundingTier of ["strict", "best-effort"] as const) {
      const generalIntentState = {
        issue_number: 42,
        resolution_source: "pr-body",
        grounding_tier: groundingTier,
        general_intent: { title: "Add auth endpoint", body_summary: "Make auth work." },
      }
      expect(IntentSatisfactionStateSchema.safeParse(generalIntentState).success).toBe(true)
    }
  })

  it("should accept per-criterion outcomes and the single general-intent outcome", () => {
    const perCriterion = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      outcomes: [
        { criterion_ref: "The API returns 201", result: "satisfied", note: "handler returns 201" },
        { criterion_ref: "Errors are typed", result: "unsatisfied" },
        { criterion_ref: "Errors are typed", result: "deviation", note: "criterion assumed an API that does not exist" },
      ],
    }
    expect(IntentSatisfactionStateSchema.safeParse(perCriterion).success).toBe(true)
    const generalIntent = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "best-effort",
      general_intent: { title: "Add auth endpoint", body_summary: "Make auth work." },
      outcomes: { result: "unevaluable", reason: "diff touches no auth surface" },
    }
    expect(IntentSatisfactionStateSchema.safeParse(generalIntent).success).toBe(true)
  })

  it("should accept reference_count alongside the resolution source", () => {
    const state = {
      issue_number: 42,
      resolution_source: "pr-body",
      reference_count: 2,
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
    }
    expect(IntentSatisfactionStateSchema.safeParse(state).success).toBe(true)
  })

  it("should accept recorded dispositions and the unavailable reason on resolved states only", () => {
    // RC-FR-014: the disposition read-back attaches to resolved states —
    // selected entries (bounded projections of recorded human decisions)
    // or why the branch record could not be read.
    const withDispositions = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      recorded_dispositions: [
        {
          decision_id: "123e4567-e89b-42d3-a456-426614174000",
          question: "Override the intent-deviation finding for issue #42?",
          answer: "Yes — amend the issue.",
          recorded_at: "2026-11-24T12:00:00.000Z",
        },
      ],
    }
    expect(IntentSatisfactionStateSchema.safeParse(withDispositions).success).toBe(true)
    const withUnavailableReason = {
      ...withDispositions,
      recorded_dispositions: [],
      dispositions_unavailable: ".uf/progress/opsx-feature/human-decisions.json is malformed",
    }
    expect(IntentSatisfactionStateSchema.safeParse(withUnavailableReason).success).toBe(true)

    // Skip/unavailable states never carry disposition fields — the
    // superRefine counts them among the resolved-issue fields.
    const skippedWithDispositions = {
      skip_unavailable: { state: "skipped", reason: "no source" },
      recorded_dispositions: withDispositions.recorded_dispositions,
    }
    expect(IntentSatisfactionStateSchema.safeParse(skippedWithDispositions).success).toBe(false)

    // Truncation keeps structurally valid over-bound dispositions (entry
    // cap plus per-text bounds) rather than rejecting them.
    const truncated = truncateIntentSatisfactionState({
      ...withDispositions,
      recorded_dispositions: [
        {
          decision_id: "123e4567-e89b-42d3-a456-426614174000",
          question: "q".repeat(3000),
          answer: "a".repeat(3000),
          recorded_at: "2026-11-24T12:00:00.000Z",
        },
      ],
    }) as { recorded_dispositions: Array<{ question: string; answer: string }> }
    expect(truncated.recorded_dispositions[0]!.question).toHaveLength(2000)
    expect(truncated.recorded_dispositions[0]!.answer).toHaveLength(2000)
  })

  it("should accept the skip and unavailable states with their reason", () => {
    expect(
      IntentSatisfactionStateSchema.safeParse({
        skip_unavailable: { state: "skipped", reason: "no originating issue resolved" },
      }).success,
    ).toBe(true)
    expect(
      IntentSatisfactionStateSchema.safeParse({
        skip_unavailable: { state: "unavailable", reason: "gh: command not found" },
      }).success,
    ).toBe(true)
  })

  it("should reject skip_unavailable combined with resolved-issue fields", () => {
    const check = IntentSatisfactionStateSchema.safeParse({
      skip_unavailable: { state: "skipped", reason: "no source" },
      issue_number: 42,
    })
    expect(check.success).toBe(false)
  })

  it("should reject a resolved state missing the required reference, source, tier, or criteria", () => {
    expect(IntentSatisfactionStateSchema.safeParse({ grounding_tier: "strict" }).success).toBe(false)
    expect(IntentSatisfactionStateSchema.safeParse({ issue_number: 42 }).success).toBe(false)
    expect(
      IntentSatisfactionStateSchema.safeParse({ issue_number: 42, resolution_source: "pr-body" }).success,
    ).toBe(false)
    expect(
      IntentSatisfactionStateSchema.safeParse({
        issue_number: 42,
        resolution_source: "pr-body",
        grounding_tier: "strict",
      }).success,
    ).toBe(false)
  })

  it("should reject criteria and general_intent together", () => {
    const check = IntentSatisfactionStateSchema.safeParse({
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      general_intent: { title: "Add auth endpoint", body_summary: "Make auth work." },
    })
    expect(check.success).toBe(false)
  })

  it("should reject criteria beyond the 2000-per-criterion and 8192-total bounds", () => {
    const overPerCriterion = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "a".repeat(2001), origin: "checkbox" }],
    }
    expect(IntentSatisfactionStateSchema.safeParse(overPerCriterion).success).toBe(false)
    const overTotal = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [
        { text: "a".repeat(2000), origin: "checkbox" },
        { text: "b".repeat(2000), origin: "checkbox" },
        { text: "c".repeat(2000), origin: "checkbox" },
        { text: "d".repeat(2000), origin: "checkbox" },
        { text: "e".repeat(193), origin: "checkbox" },
      ],
    }
    expect(IntentSatisfactionStateSchema.safeParse(overTotal).success).toBe(false)
  })

  it("should reject unknown enum values, unknown keys, and unevaluable without a reason", () => {
    expect(
      IntentSatisfactionStateSchema.safeParse({
        issue_number: 42,
        resolution_source: "carrier-pigeon",
        grounding_tier: "strict",
        criteria: [{ text: "x", origin: "checkbox" }],
      }).success,
    ).toBe(false)
    expect(
      IntentSatisfactionStateSchema.safeParse({
        issue_number: 42,
        resolution_source: "pr-body",
        grounding_tier: "telepathic",
        criteria: [{ text: "x", origin: "checkbox" }],
      }).success,
    ).toBe(false)
    expect(
      IntentSatisfactionStateSchema.safeParse({
        issue_number: 42,
        resolution_source: "pr-body",
        grounding_tier: "strict",
        criteria: [{ text: "x", origin: "checkbox" }],
        unexpected_field: true,
      }).success,
    ).toBe(false)
    expect(
      IntentSatisfactionStateSchema.safeParse({
        issue_number: 42,
        resolution_source: "pr-body",
        grounding_tier: "best-effort",
        general_intent: { title: "t", body_summary: "b" },
        outcomes: { result: "unevaluable" },
      }).success,
    ).toBe(false)
  })
})

// ── Bounds truncation ahead of schema validation (RC-FR-011) ──

describe("truncateIntentSatisfactionState bounds", () => {
  it("should cut each criterion at 2000 characters and the cumulative total at 8192", () => {
    const raw = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: Array.from({ length: 5 }, (_, index) => ({
        text: String.fromCharCode(97 + index).repeat(3000),
        origin: "checkbox",
      })),
    }
    const truncated = truncateIntentSatisfactionState(raw) as {
      criteria: Array<{ text: string }>
    }
    expect(truncated.criteria).toHaveLength(5)
    expect(truncated.criteria.slice(0, 4).every((criterion) => criterion.text.length === 2000)).toBe(true)
    expect(truncated.criteria[4]?.text.length).toBe(192)
    const total = truncated.criteria.reduce((sum, criterion) => sum + criterion.text.length, 0)
    expect(total).toBe(8192)
    expect(IntentSatisfactionStateSchema.safeParse(truncated).success).toBe(true)
    expect(IntentSatisfactionStateSchema.safeParse(raw).success).toBe(false)
  })

  it("should cut the general-intent title and body summary to their bounds", () => {
    const raw = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "best-effort",
      general_intent: { title: "t".repeat(600), body_summary: "b".repeat(9000) },
    }
    const truncated = truncateIntentSatisfactionState(raw) as {
      general_intent: { title: string; body_summary: string }
    }
    expect(truncated.general_intent.title.length).toBe(512)
    expect(truncated.general_intent.body_summary.length).toBe(8192)
    expect(IntentSatisfactionStateSchema.safeParse(truncated).success).toBe(true)
  })

  it("should cap recorded dispositions at the eight-entry schema maximum in recording order", () => {
    // Review finding 20 (iteration 2): the disposition branch's entry
    // cap. Spec literal pinned directly (mirrors the criteria bounds
    // tests) so raising INTENT_DISPOSITIONS_MAX cannot silently loosen
    // the guard.
    const raw = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      recorded_dispositions: Array.from({ length: 10 }, (_, index) => ({
        decision_id: `${String(index).padStart(8, "0")}-0000-4000-8000-00000000000${index}`,
        question: `intent-deviation decision ${index}`,
        answer: "Yes.",
        recorded_at: "2026-11-24T12:00:00.000Z",
      })),
    }
    const truncated = truncateIntentSatisfactionState(raw) as {
      recorded_dispositions: Array<{ decision_id: string }>
    }
    expect(truncated.recorded_dispositions).toHaveLength(8)
    expect(truncated.recorded_dispositions.map((disposition) => disposition.decision_id)).toEqual(
      raw.recorded_dispositions.slice(0, 8).map((disposition) => disposition.decision_id),
    )
    expect(IntentSatisfactionStateSchema.safeParse(truncated).success).toBe(true)
    expect(IntentSatisfactionStateSchema.safeParse(raw).success).toBe(false)
  })

  it("should cut the dispositions-unavailable reason to 2048 characters", () => {
    const raw = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      recorded_dispositions: [],
      dispositions_unavailable: "u".repeat(3000),
    }
    const truncated = truncateIntentSatisfactionState(raw) as { dispositions_unavailable: string }
    expect(truncated.dispositions_unavailable).toHaveLength(2048)
    expect(IntentSatisfactionStateSchema.safeParse(truncated).success).toBe(true)
    expect(IntentSatisfactionStateSchema.safeParse(raw).success).toBe(false)
  })

  it("should pass structurally invalid disposition arrays through untouched for the schema to fail closed on", () => {
    // Mixed validity: the first entry is shape-valid but over-bound,
    // the second is not an entry at all. The truncator requires every
    // entry to be shape-valid before it bounds anything, so the whole
    // array rides along by reference — no per-entry filtering, no
    // silent shrinking — and the schema rejects the state.
    const raw = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: "The API returns 201", origin: "checkbox" }],
      recorded_dispositions: [
        {
          decision_id: "123e4567-e89b-42d3-a456-426614174000",
          question: "q".repeat(3000),
          answer: "a".repeat(3000),
          recorded_at: "2026-11-24T12:00:00.000Z",
        },
        "not-an-object",
      ],
    }
    const truncated = truncateIntentSatisfactionState(raw) as { recorded_dispositions: unknown }
    expect(truncated.recorded_dispositions).toBe(raw.recorded_dispositions)
    expect(IntentSatisfactionStateSchema.safeParse(truncated).success).toBe(false)
  })

  it("should pass skip states and structurally invalid input through untouched", () => {
    const skip = { skip_unavailable: { state: "skipped", reason: "no source" } }
    expect(truncateIntentSatisfactionState(skip)).toBe(skip)
    const invalidCriteria = {
      issue_number: 42,
      resolution_source: "pr-body",
      grounding_tier: "strict",
      criteria: [{ text: 42 }, "not-an-object"],
    }
    expect(truncateIntentSatisfactionState(invalidCriteria)).toBe(invalidCriteria)
    expect(truncateIntentSatisfactionState("not-an-object")).toBe("not-an-object")
  })
})

// ── Rendered intent context (review_context channel projection, D2) ──

describe("renderIntentSatisfactionContext", () => {
  it("should render the reference, source, tier, criteria, and recorded bounds", () => {
    const state: IntentSatisfactionState = {
      issue_number: 42,
      resolution_source: "pr-body",
      reference_count: 2,
      grounding_tier: "strict",
      criteria: [
        { text: "The API returns 201", origin: "checkbox" },
        { text: "Errors are typed", origin: "acceptance-criteria" },
      ],
    }
    const rendered = renderIntentSatisfactionContext(state)
    expect(rendered).toContain("### Intent Satisfaction Context — Originating Issue #42")
    expect(rendered).toContain("- Originating issue: #42 (resolution source: pr-body, 2 in-scope references)")
    expect(rendered).toContain("- Grounding tier: strict")
    expect(rendered).toContain(
      "- Acceptance criteria: 2 extracted — each bounded to 2000 characters, total bounded to 8192 characters",
    )
    expect(rendered).toContain("Evaluate the change against each acceptance criterion")
    expect(rendered).toContain("1. [origin: checkbox] The API returns 201")
    expect(rendered).toContain("2. [origin: acceptance-criteria] Errors are typed")
  })

  it("should render general intent with the not-gated-criteria note", () => {
    const state: IntentSatisfactionState = {
      issue_number: 42,
      resolution_source: "openspec-yaml",
      grounding_tier: "best-effort",
      general_intent: { title: "Add auth endpoint", body_summary: "Make auth work." },
    }
    const rendered = renderIntentSatisfactionContext(state)
    expect(rendered).toContain("- Grounding tier: best-effort")
    expect(rendered).toContain(
      "- Structured acceptance criteria: none — evaluation runs against the issue's general intent, not gated criteria",
    )
    expect(rendered).toContain("**Issue title**: Add auth endpoint")
    expect(rendered).toContain("**Issue body summary** (bounded to 8192 characters):")
    expect(rendered).toContain("Make auth work.")
  })

  it("should render nothing for skip, unavailable, and undefined states", () => {
    expect(
      renderIntentSatisfactionContext({ skip_unavailable: { state: "skipped", reason: "no source" } }),
    ).toBe("")
    expect(
      renderIntentSatisfactionContext({ skip_unavailable: { state: "unavailable", reason: "gh missing" } }),
    ).toBe("")
    expect(renderIntentSatisfactionContext(undefined)).toBe("")
  })
})

// ── Acquisition: resolution priority and grounding tiers (RC-FR-010, D3) ──

describe("acquire_intent_context state forwarded to dispatch", () => {
  it("should resolve the three sources in priority order with the source recorded", async () => {
    const yamlPath = resolve(ACQUIRE_PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")
    const allSources = acquireTool({
      files: {
        [statePath("opsx/feature")]: checkpointState(7),
        [yamlPath]: "originating_issue: 563\n",
      },
    })
    const fromPrBody = await acquire(allSources.tool, { pr_body: "Fixes #42" })
    expect(fromPrBody.status).toBe("resolved")
    expect(fromPrBody.intent_satisfaction.resolution_source).toBe("pr-body")
    expect(fromPrBody.intent_satisfaction.issue_number).toBe(42)
    expect(allSources.ghCalls).toEqual([42])

    const fromCheckpoint = await acquire(
      acquireTool({ files: { [statePath("opsx/feature")]: checkpointState(7) } }).tool,
    )
    expect(fromCheckpoint.intent_satisfaction.resolution_source).toBe("tier-routing-checkpoint")
    expect(fromCheckpoint.intent_satisfaction.issue_number).toBe(7)

    const fromYaml = await acquire(acquireTool({ files: { [yamlPath]: "originating_issue: 563\n" } }).tool)
    expect(fromYaml.intent_satisfaction.resolution_source).toBe("openspec-yaml")
    expect(fromYaml.intent_satisfaction.issue_number).toBe(563)

    for (const result of [fromPrBody, fromCheckpoint, fromYaml]) {
      expect(IntentSatisfactionStateSchema.safeParse(result.intent_satisfaction).success).toBe(true)
      expect(renderIntentSatisfactionContext(result.intent_satisfaction)).toContain(
        `resolution source: ${result.intent_satisfaction.resolution_source}`,
      )
    }
  })

  it("should construct strict for both intake-kit provenance signals", async () => {
    const labeled = await acquire(
      acquireTool({
        gh: issueJson({
          labels: ["intake-kit"],
          body: "- [ ] The API returns 201\n- [ ] Errors are typed",
        }),
      }).tool,
      { pr_body: "Fixes #42" },
    )
    expect(labeled.intent_satisfaction.grounding_tier).toBe("strict")
    expect(labeled.intent_satisfaction.criteria?.map((criterion) => criterion.origin)).toEqual([
      "checkbox",
      "checkbox",
    ])

    const heading = await acquire(
      acquireTool({
        gh: issueJson({
          body: "## Acceptance Criteria [intake-kit]\nThe API returns 201\nErrors are typed",
        }),
      }).tool,
      { pr_body: "Fixes #42" },
    )
    expect(heading.intent_satisfaction.grounding_tier).toBe("strict")
    expect(heading.intent_satisfaction.criteria?.map((criterion) => criterion.origin)).toEqual([
      "intake-kit-criteria",
      "intake-kit-criteria",
    ])
  })

  it("should construct best-effort for Given/When/Then, free-form, and no-criteria issues without a signal", async () => {
    const givenWhenThen = await acquire(
      acquireTool({
        gh: issueJson({
          body: "- [ ] GIVEN the auth endpoint\n- [ ] WHEN a valid token is posted\n- [ ] THEN the API returns 201",
        }),
      }).tool,
      { pr_body: "Fixes #42" },
    )
    expect(givenWhenThen.intent_satisfaction.grounding_tier).toBe("best-effort")
    expect(givenWhenThen.intent_satisfaction.criteria).toHaveLength(3)

    const freeForm = await acquire(
      acquireTool({ gh: issueJson({ body: "We should really make auth work better." }) }).tool,
      { pr_body: "Fixes #42" },
    )
    expect(freeForm.intent_satisfaction.grounding_tier).toBe("best-effort")
    expect(freeForm.intent_satisfaction.general_intent?.title).toBe("Add auth endpoint")

    const noCriteria = await acquire(acquireTool({ gh: issueJson({ body: null }) }).tool, {
      pr_body: "Fixes #42",
    })
    expect(noCriteria.intent_satisfaction.grounding_tier).toBe("best-effort")
    expect(noCriteria.intent_satisfaction.general_intent).toBeDefined()
    expect(noCriteria.intent_satisfaction.criteria).toBeUndefined()
  })

  it("should construct strict and still evaluate general intent for an intake-kit-labeled free-form issue", async () => {
    const labeled = await acquire(
      acquireTool({
        gh: issueJson({ labels: ["needs-triage", "Intake-Kit"], body: "Make auth work." }),
      }).tool,
      { pr_body: "Fixes #42" },
    )
    expect(labeled.intent_satisfaction.grounding_tier).toBe("strict")
    expect(labeled.intent_satisfaction.general_intent).toBeDefined()
    expect(labeled.intent_satisfaction.criteria).toBeUndefined()
    const rendered = renderIntentSatisfactionContext(labeled.intent_satisfaction)
    expect(rendered).toContain("- Grounding tier: strict")
    expect(rendered).toContain(
      "evaluation runs against the issue's general intent, not gated criteria",
    )
  })
})

// ── Dispatch contract seams (DE-007) ──

describe("intent-satisfaction dispatch contract", () => {
  it("should register the extended contract surfaces and carry a resolved state from write to persisted artifact", async () => {
    await withBun(async () => {
      const acquired = await acquire(
        acquireTool({ gh: issueJson({ labels: ["intake-kit"] }) }).tool,
        { pr_body: "Fixes #42" },
      )
      expect(acquired.status).toBe("resolved")
      const state = acquired.intent_satisfaction

      const { hooks, correlationId, metadata } = await dispatchWithState(state as Record<string, unknown>, [
        "divisor-guard",
        "divisor-adversary",
      ])

      // Seam 1 — registration surface: the extended dispatch contract tools.
      expect(Object.keys(hooks.tool)).toContain("dispatch_review_runs")
      expect(Object.keys(hooks.tool)).toContain("consolidate_dispatch")
      expect(Object.keys(hooks.tool)).toContain("acquire_intent_context")
      expect(metadata.runs_completed).toBe(2)

      // Seam 1 — input-schema parity: the accepted session-metadata fields
      // are written verbatim at dispatch time.
      const persistedMetadata = await readSessionMetadata(correlationId)
      expect(persistedMetadata.intent_satisfaction).toEqual(state)

      // Seam 2 — documented output shape delivered to every reviewer prompt
      // through the shared review_context channel inside untrusted-evidence
      // delimiters, with the bounds recorded.
      const prompts = await readPromptFiles(correlationId)
      expect(prompts).toHaveLength(2)
      for (const prompt of prompts) {
        expect(prompt).toContain("### Review Context")
        expect(prompt).toContain("> **UNTRUSTED DATA**:")
        expect(prompt).toContain("<!-- BEGIN UNTRUSTED: review_context -->")
        expect(prompt).toContain("<!-- END UNTRUSTED: review_context -->")
        expect(prompt).toContain("### Intent Satisfaction Context — Originating Issue #42")
        expect(prompt).toContain("resolution source: pr-body")
        expect(prompt).toContain("- Grounding tier: strict")
        expect(prompt).toContain(
          "each bounded to 2000 characters, total bounded to 8192 characters",
        )
        expect(prompt).toContain("1. [origin: checkbox] The API returns 201")
        expect(prompt).toContain("2. [origin: checkbox] Errors are typed")
      }

      // Seam 3 — write→read round-trip into the final-report provenance.
      const { compact, artifact } = await consolidateWithProvenance(hooks, correlationId)
      expect(compact.operation_verdict).toBe("APPROVE")
      expect(compact.review_verdict).toBe("APPROVED")
      expect(compact.intent_satisfaction).toEqual(state)
      const artifactContext = artifact.context as Record<string, unknown>
      expect(artifactContext.correlation_id).toBe(correlationId)
      const artifactPayload = artifact.payload as Record<string, unknown>
      expect(artifactPayload.intent_satisfaction).toEqual(state)
    })
  })

  it("should record the tier-routing-checkpoint source and best-effort tier through the dispatch write", async () => {
    await withBun(async () => {
      const acquired = await acquire(
        acquireTool({
          files: { [statePath("opsx/feature")]: checkpointState(7) },
          gh: issueJson({
            number: 7,
            body: "- [ ] GIVEN the auth endpoint\n- [ ] WHEN a valid token is posted\n- [ ] THEN the API returns 201",
          }),
        }).tool,
      )
      expect(acquired.intent_satisfaction.resolution_source).toBe("tier-routing-checkpoint")

      const { correlationId } = await dispatchWithState(
        acquired.intent_satisfaction as Record<string, unknown>,
        ["divisor-guard"],
      )
      const persistedMetadata = await readSessionMetadata(correlationId)
      expect(persistedMetadata.intent_satisfaction).toEqual(acquired.intent_satisfaction)
      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).toContain("resolution source: tier-routing-checkpoint")
      expect(prompt).toContain("- Grounding tier: best-effort")
      expect(prompt).toContain("THEN the API returns 201")
    })
  })

  it("should record the openspec-yaml source and render general intent through the dispatch write", async () => {
    await withBun(async () => {
      const acquired = await acquire(
        acquireTool({
          files: {
            [resolve(ACQUIRE_PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")]:
              "originating_issue: 563\n",
          },
          gh: issueJson({ number: 563, body: "We should really make auth work better." }),
        }).tool,
      )
      expect(acquired.intent_satisfaction.resolution_source).toBe("openspec-yaml")

      const { correlationId } = await dispatchWithState(
        acquired.intent_satisfaction as Record<string, unknown>,
        ["divisor-guard"],
      )
      const persistedMetadata = await readSessionMetadata(correlationId)
      expect(persistedMetadata.intent_satisfaction).toEqual(acquired.intent_satisfaction)
      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).toContain("resolution source: openspec-yaml")
      expect(prompt).toContain(
        "evaluation runs against the issue's general intent, not gated criteria",
      )
      expect(prompt).toContain("**Issue title**: Add auth endpoint")
    })
  })

  it("should truncate over-bound criteria at dispatch time before the write and prompt render", async () => {
    await withBun(async () => {
      const overBound = {
        issue_number: 42,
        resolution_source: "pr-body",
        grounding_tier: "strict",
        criteria: Array.from({ length: 5 }, (_, index) => ({
          text: String.fromCharCode(97 + index).repeat(3000),
          origin: "checkbox",
        })),
      }
      const { correlationId } = await dispatchWithState(overBound, ["divisor-guard"])

      const persistedMetadata = await readSessionMetadata(correlationId)
      const persisted = persistedMetadata.intent_satisfaction as {
        criteria: Array<{ text: string }>
      }
      expect(persisted.criteria).toHaveLength(5)
      expect(persisted.criteria.slice(0, 4).every((criterion) => criterion.text.length === 2000)).toBe(true)
      expect(persisted.criteria[4]?.text.length).toBe(192)
      const total = persisted.criteria.reduce((sum, criterion) => sum + criterion.text.length, 0)
      expect(total).toBe(8192)

      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).toContain(
        "each bounded to 2000 characters, total bounded to 8192 characters",
      )
      expect(prompt).not.toContain("a".repeat(2001))
    })
  })

  it("should skip informationally when no source resolves, leaving the review unaffected", async () => {
    await withBun(async () => {
      const acquired = await acquire(acquireTool().tool)
      expect(acquired.status).toBe("skipped")
      const state = acquired.intent_satisfaction
      expect(state.skip_unavailable?.state).toBe("skipped")

      const { hooks, correlationId, metadata } = await dispatchWithState(
        state as Record<string, unknown>,
        ["divisor-guard"],
      )
      expect(metadata.runs_completed).toBe(1)
      expect(metadata.findings).toEqual([])

      const persistedMetadata = await readSessionMetadata(correlationId)
      expect(persistedMetadata.intent_satisfaction).toEqual(state)

      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).not.toContain("Intent Satisfaction Context")
      expect(prompt).not.toContain("<!-- BEGIN UNTRUSTED: review_context -->")

      const { compact, artifact } = await consolidateWithProvenance(hooks, correlationId)
      expect(compact.operation_verdict).toBe("APPROVE")
      expect(compact.intent_satisfaction).toEqual(state)
      const artifactPayload = artifact.payload as Record<string, unknown>
      expect(artifactPayload.intent_satisfaction).toEqual(state)
    })
  })

  it("should degrade to unavailable with the failure reason when the fetch fails, leaving the review unaffected", async () => {
    await withBun(async () => {
      const acquired = await acquire(
        acquireTool({
          files: { [statePath("opsx/feature")]: checkpointState(7) },
          gh: new Error("gh: command not found"),
        }).tool,
      )
      expect(acquired.status).toBe("unavailable")
      const state = acquired.intent_satisfaction
      expect(state.skip_unavailable?.state).toBe("unavailable")
      expect(state.skip_unavailable?.reason).toContain("gh: command not found")

      const { hooks, correlationId, metadata } = await dispatchWithState(
        state as Record<string, unknown>,
        ["divisor-guard"],
      )
      expect(metadata.runs_completed).toBe(1)
      expect(metadata.findings).toEqual([])

      const persistedMetadata = await readSessionMetadata(correlationId)
      expect(persistedMetadata.intent_satisfaction).toEqual(state)

      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).not.toContain("Intent Satisfaction Context")

      const { compact, artifact } = await consolidateWithProvenance(hooks, correlationId)
      expect(compact.operation_verdict).toBe("APPROVE")
      expect(compact.intent_satisfaction).toEqual(state)
      const artifactPayload = artifact.payload as Record<string, unknown>
      expect(artifactPayload.intent_satisfaction).toEqual(state)
    })
  })

  it("should reject session-metadata intent_satisfaction shapes the state schema fails closed on", async () => {
    await withBun(async () => {
      const { directory, diffPath } = await scratchProject()
      const hooks = await ReviewDispatchPlugin.server({
        client: fakeClient(),
        directory,
        worktree: directory,
      } as unknown as PluginInput)
      const planEntries = [planEntry("divisor-guard", 1)]

      const conflicting = await hooks.tool.dispatch_review_runs.execute(
        codeModeInput(diffPath, planEntries, {
          skip_unavailable: { state: "skipped", reason: "no source" },
          issue_number: 42,
        }),
        toolContext(),
      )
      expect(conflicting.output).toMatch(/^dispatch_review_runs: error \(correlation_id none\) — 0 completed, /)
      expect((conflicting.metadata as Record<string, unknown>).status).toBe("error")

      const unknownSource = await hooks.tool.dispatch_review_runs.execute(
        codeModeInput(diffPath, planEntries, {
          issue_number: 42,
          resolution_source: "carrier-pigeon",
          grounding_tier: "strict",
          criteria: [{ text: "The API returns 201", origin: "checkbox" }],
        }),
        toolContext(),
      )
      expect(unknownSource.output).toMatch(/^dispatch_review_runs: error \(correlation_id none\) — 0 completed, /)
      expect(unknownSource.output).toContain("carrier-pigeon")
    })
  })
})

// ── Internal acquisition and recorded dispositions (review findings F3/F4/F10/F14) ──

/** Branch the mocked `git rev-parse` resolves for internal-acquisition dispatches. */
const INTERNAL_ACQUISITION_BRANCH = "opsx/intent-internal"

/**
 * A human decision to seed the branch record with, recorded through the
 * actual record_human_decision writer (review finding 4, DE-007
 * writer/reader seam): the writer owns the full store discipline and
 * machine-stamps decision_id and recorded_at, so tests assert against
 * the values it returns rather than hand-built constants.
 */
interface DecisionToRecord {
  readonly question: string
  readonly answer: string
}

/**
 * Execute the actual record_human_decision writer implementation against a
 * scratch project root, returning the persisted entry exactly as the tool
 * confirmed it (machine-stamped decision_id and recorded_at included).
 */
async function recordDecision(directory: string, decision: DecisionToRecord): Promise<Record<string, unknown>> {
  const branchExec: GitExec = () => INTERNAL_ACQUISITION_BRANCH
  const writer = createRecordHumanDecisionTool(branchExec, directory)
  const result = await (
    writer as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string },
      ) => Promise<{ output: string }>
    }
  ).execute(
    { source: "question-tool", question: decision.question, answer: decision.answer },
    { sessionID: "intent-decision-seed" },
  )
  const envelope = JSON.parse(result.output) as { status: string; data?: Record<string, unknown> }
  expect(envelope.status).toBe("ok")
  return envelope.data as Record<string, unknown>
}

interface AcquiringDispatchOutcome {
  readonly hooks: DispatchPluginHooks
  readonly correlationId: string
  readonly metadata: Record<string, unknown>
  readonly spawn: MockSpawnFn
  /** Entries the record_human_decision writer persisted, in recording order. */
  readonly recordedDecisions: readonly Record<string, unknown>[]
}

/**
 * Dispatch a code-mode review-council run whose session metadata carries NO
 * intent_satisfaction, with Bun.spawn patched to the routed gh/git mock the
 * internal acquisition (review finding F3) spawns through: `git rev-parse`
 * resolves INTERNAL_ACQUISITION_BRANCH and `gh issue view` returns the
 * default issue fixture unless overridden. Optionally seeds the
 * branch-scoped human-decision record first (RC-FR-014 round-trip) by
 * executing the actual record_human_decision writer implementation — never
 * a hand-built JSON file — so the write surface the operator uses feeds
 * the read-back the dispatch performs.
 */
async function dispatchAcquiring(options: {
  readonly prBody?: string
  readonly agents?: readonly string[]
  readonly spawnOverrides?: MockSpawnResponses
  readonly decisions?: readonly DecisionToRecord[]
}): Promise<AcquiringDispatchOutcome> {
  const { directory, diffPath } = await scratchProject()
  const recordedDecisions: Record<string, unknown>[] = []
  for (const decision of options.decisions ?? []) {
    recordedDecisions.push(await recordDecision(directory, decision))
  }
  const spawn = createMockSpawn(
    {},
    {
      "git rev-parse": { stdout: `${INTERNAL_ACQUISITION_BRANCH}\n`, stderr: "", exitCode: 0 },
      "issue view": { stdout: issueJson(), stderr: "", exitCode: 0 },
      ...options.spawnOverrides,
    },
  )
  const restore = patchBunSpawn(spawn)
  try {
    const hooks = await ReviewDispatchPlugin.server({
      client: fakeClient(),
      directory,
      worktree: directory,
    } as unknown as PluginInput)
    const planEntries = (options.agents ?? ["divisor-guard"]).map((agent, index) =>
      planEntry(agent, index + 1),
    )
    const response = await hooks.tool.dispatch_review_runs.execute(
      {
        mode: "code",
        command: "review-council",
        diff_path: diffPath,
        changed_files: "src/foo.ts",
        input_context: "base: main, head: feature",
        plan_entries: planEntries,
        max_parallel_runs: 4,
        ...(options.prBody === undefined ? {} : { pr_body: options.prBody }),
        session_metadata: { ...makeSessionMetadata(), plan: planEntries },
      },
      toolContext(),
    )
    const metadata = response.metadata as Record<string, unknown>
    expect(metadata.status).toBe("ok")
    const correlationId = metadata.correlation_id as string
    expect(typeof correlationId).toBe("string")
    dispatchSessionDirs.push(dispatchDir(correlationId))
    return { hooks, correlationId, metadata, spawn, recordedDecisions }
  } finally {
    restore()
  }
}

describe("internal intent acquisition and recorded dispositions", () => {
  it("should acquire the intent context internally when session_metadata.intent_satisfaction is absent", async () => {
    await withBun(async () => {
      const { correlationId, metadata } = await dispatchAcquiring({ prBody: "Fixes #42" })

      // The review itself is unaffected — the acquisition filled the
      // absent field before the first run persisted the session metadata.
      expect(metadata.runs_completed).toBe(1)
      const persistedMetadata = await readSessionMetadata(correlationId)
      const acquired = persistedMetadata.intent_satisfaction as Record<string, unknown>
      expect(acquired.issue_number).toBe(42)
      expect(acquired.resolution_source).toBe("pr-body")
      expect(acquired.grounding_tier).toBe("best-effort")
      expect((acquired.criteria as unknown[]).map((criterion) => criterion)).toHaveLength(2)
      // The human-decision record is absent in the scratch project: the
      // read-back ran (branch resolved) and selected nothing.
      expect(acquired.recorded_dispositions).toEqual([])
      expect(acquired.dispositions_unavailable).toBeUndefined()

      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).toContain("### Intent Satisfaction Context — Originating Issue #42")
      expect(prompt).toContain("resolution source: pr-body")
      expect(prompt).toContain("1. [origin: checkbox] The API returns 201")
      // No dispositions and no unavailable reason render nothing.
      expect(prompt).not.toContain("## Recorded Human Decisions")
    })
  })

  it("should acquire strict grounding from object-form gh labels through the spawned gh fetch", async () => {
    await withBun(async () => {
      // Real `gh issue view --json labels` emits [{name, color,
      // description}] objects, not bare strings — seed that shape
      // through the spawn mock so the object-form branch (design D6) is
      // proven on the production fetch path, not only through the
      // injected-fake fixtures: an intake-kit label in object form must
      // still yield strict grounding end to end.
      const { correlationId } = await dispatchAcquiring({
        prBody: "Fixes #42",
        spawnOverrides: {
          "issue view": {
            stdout: issueJson({
              labels: [
                { name: "needs-triage", color: "d73a4a", description: "Awaiting triage" },
                { name: "intake-kit", color: "006b75", description: "Criteria seeded by the intake kit" },
              ],
            }),
            stderr: "",
            exitCode: 0,
          },
        },
      })
      const persistedMetadata = await readSessionMetadata(correlationId)
      const acquired = persistedMetadata.intent_satisfaction as Record<string, unknown>
      expect(acquired.issue_number).toBe(42)
      expect(acquired.grounding_tier).toBe("strict")
      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).toContain("### Intent Satisfaction Context — Originating Issue #42")
      expect(prompt).toContain("- Grounding tier: strict")
    })
  })

  it("should let an explicitly supplied intent_satisfaction win over the internal acquisition", async () => {
    await withBun(async () => {
      const { directory, diffPath } = await scratchProject()
      const spawn = createMockSpawn({}, {
        "git rev-parse": { stdout: `${INTERNAL_ACQUISITION_BRANCH}\n`, stderr: "", exitCode: 0 },
        "issue view": { stdout: issueJson(), stderr: "", exitCode: 0 },
      })
      const restore = patchBunSpawn(spawn)
      try {
        const hooks = await ReviewDispatchPlugin.server({
          client: fakeClient(),
          directory,
          worktree: directory,
        } as unknown as PluginInput)
        const explicit = {
          issue_number: 7,
          resolution_source: "tier-routing-checkpoint",
          grounding_tier: "strict",
          criteria: [{ text: "Criterion seven", origin: "checkbox" }],
          recorded_dispositions: [
            {
              decision_id: "123e4567-e89b-42d3-a456-426614174000",
              question: "Override the intent-deviation finding for issue #7?",
              answer: "Yes.",
              recorded_at: "2026-11-24T12:00:00.000Z",
            },
          ],
        }
        const planEntries = [planEntry("divisor-guard", 1)]
        const response = await hooks.tool.dispatch_review_runs.execute(
          codeModeInput(diffPath, planEntries, explicit),
          toolContext(),
        )
        const metadata = response.metadata as Record<string, unknown>
        expect(metadata.status).toBe("ok")
        const correlationId = metadata.correlation_id as string
        dispatchSessionDirs.push(dispatchDir(correlationId))

        // The explicit state is persisted verbatim — the internal
        // acquisition never ran, so no gh issue fetch was spawned.
        const persistedMetadata = await readSessionMetadata(correlationId)
        expect(persistedMetadata.intent_satisfaction).toEqual(explicit)
        expect(spawn.mock.calls.some((call) => call[0]?.[0] === "gh")).toBe(false)
        const [prompt] = await readPromptFiles(correlationId)
        expect(prompt).toContain("### Intent Satisfaction Context — Originating Issue #7")
        expect(prompt).toContain("Criterion seven")
      } finally {
        restore()
      }
    })
  })

  it("should degrade to the unavailable state when the internal acquisition's fetch fails, leaving the review unaffected", async () => {
    await withBun(async () => {
      const { correlationId, metadata } = await dispatchAcquiring({
        prBody: "Fixes #42",
        spawnOverrides: {
          "issue view": { stdout: "", stderr: "gh: Not Found (HTTP 404)", exitCode: 1 },
        },
      })

      expect(metadata.runs_completed).toBe(1)
      const persistedMetadata = await readSessionMetadata(correlationId)
      const acquired = persistedMetadata.intent_satisfaction as {
        skip_unavailable: { state: string; reason: string }
      }
      expect(acquired.skip_unavailable.state).toBe("unavailable")
      expect(acquired.skip_unavailable.reason).toContain("fetch failed")
      const [prompt] = await readPromptFiles(correlationId)
      expect(prompt).not.toContain("Intent Satisfaction Context")
    })
  })

  it("should round-trip recorded dispositions from the branch record into the trusted prompt section", async () => {
    await withBun(async () => {
      // RC-FR-014 round-trip driven through the actual
      // record_human_decision writer (review finding 4, DE-007
      // writer/reader seam): the entries the writer persisted — with
      // its machine-stamped decision_id and recorded_at — are what the
      // dispatch's internal acquisition must read back, select, and
      // render. The second decision names another issue's finding, so
      // only the first is in scope.
      const { correlationId, recordedDecisions } = await dispatchAcquiring({
        prBody: "Fixes #42",
        decisions: [
          {
            question: "Override the intent-deviation finding for issue #42, criterion 3?",
            answer: "Yes — the criterion is invalidated by the API change; amend the issue.",
          },
          {
            question: "Override the intent-deviation finding for issue #99?",
            answer: "No.",
          },
        ],
      })
      expect(recordedDecisions).toHaveLength(2)
      const selected = recordedDecisions[0] as { decision_id: string; recorded_at: string }

      // The read-back selected the resolved issue's disposition only —
      // the writer's stamped entry projected to the four
      // reviewer-facing fields.
      const persistedMetadata = await readSessionMetadata(correlationId)
      const acquired = persistedMetadata.intent_satisfaction as {
        recorded_dispositions: Array<Record<string, unknown>>
      }
      expect(acquired.recorded_dispositions).toEqual([
        {
          decision_id: selected.decision_id,
          question: "Override the intent-deviation finding for issue #42, criterion 3?",
          answer: "Yes — the criterion is invalidated by the API change; amend the issue.",
          recorded_at: selected.recorded_at,
        },
      ])

      // TRUSTED rendering (F10/F14): the dispositions render in their own
      // `## Recorded Human Decisions` section OUTSIDE the
      // untrusted-evidence delimiters, while the issue-derived intent
      // context stays inside them.
      const [prompt] = await readPromptFiles(correlationId)
      const beginIdx = prompt.indexOf("<!-- BEGIN UNTRUSTED: review_context -->")
      const endIdx = prompt.indexOf("<!-- END UNTRUSTED: review_context -->")
      const decisionsIdx = prompt.indexOf("## Recorded Human Decisions")
      expect(beginIdx).toBeGreaterThan(-1)
      expect(endIdx).toBeGreaterThan(beginIdx)
      expect(decisionsIdx).toBeGreaterThan(endIdx)
      const untrustedRegion = prompt.slice(beginIdx, endIdx)
      expect(untrustedRegion).toContain("The API returns 201")
      expect(untrustedRegion).not.toContain("Recorded Human Intent-Deviation Dispositions")
      expect(prompt).toContain("### Recorded Human Intent-Deviation Dispositions")
      expect(prompt).toContain(
        "- Q: Override the intent-deviation finding for issue #42, criterion 3?",
      )
      expect(prompt).toContain(
        "- A: Yes — the criterion is invalidated by the API change; amend the issue.",
      )
      expect(prompt).toContain(`**Decision ${selected.decision_id}**`)
    })
  })

  it("should surface typed intent-deviation findings and the rendered exit in the compact finalization", async () => {
    await withBun(async () => {
      // Seed the child session the fake client creates for this single
      // included run (child-session-0) with the typed finding
      // divisor-guard submits when a criterion is legitimately
      // invalidated (RC-FR-013).
      _getSubmissionStore().set("child-session-0", {
        findings: [
          {
            severity: "HIGH",
            category: "intent-deviation",
            description:
              'Issue #42 criterion "The API returns 201" assumed an API that does not exist',
            root_cause:
              "Amend the issue's acceptance criteria, or record a human override naming the finding",
            file: null,
            line: null,
          },
        ],
        proposals: [],
      })
      const { hooks, correlationId } = await dispatchAcquiring({
        prBody: "Fixes #42",
        decisions: [
          {
            question: "Override the intent-deviation finding for issue #42, criterion 3?",
            answer: "Yes — the criterion is invalidated by the API change; amend the issue.",
          },
        ],
      })

      const { compact, artifact } = await consolidateWithProvenance(hooks, correlationId)
      expect(compact.operation_verdict).toBe("REQUEST CHANGES")
      const deviations = compact.intent_deviation_findings as Array<Record<string, unknown>>
      expect(deviations).toHaveLength(1)
      expect(deviations[0]).toEqual({
        severity: "HIGH",
        description: 'Issue #42 criterion "The API returns 201" assumed an API that does not exist',
        root_cause:
          "Amend the issue's acceptance criteria, or record a human override naming the finding",
        file: null,
        line: null,
      })
      // The exit is the byte-identical /uf.unleash intent-deviation exit
      // text (RC-FR-013) rendered by renderIntentDeviationExitText.
      const exitText = compact.intent_deviation_exit as string
      expect(exitText).toContain("## /uf.unleash paused at: code review")
      expect(exitText).toContain(
        '- Issue #42 criterion "The API returns 201" assumed an API that does not exist',
      )
      expect(exitText).toContain(
        "**Governance recommendation**: Amend the issue's acceptance criteria, or record a human override naming the finding",
      )
      expect(exitText).toContain(
        "record a human override naming the finding through `record_human_decision`",
      )
      // The persisted artifact keeps the complete typed finding with run
      // provenance alongside the disposition-carrying intent state.
      const artifactPayload = artifact.payload as {
        findings: Array<Record<string, unknown>>
        intent_satisfaction: { recorded_dispositions: unknown[] }
      }
      expect(artifactPayload.findings).toHaveLength(1)
      expect(artifactPayload.findings[0]).toMatchObject({ category: "intent-deviation" })
      expect(artifactPayload.findings[0]!.run_ids).toBeDefined()
      expect(artifactPayload.intent_satisfaction.recorded_dispositions).toHaveLength(1)
    })
  })
})
