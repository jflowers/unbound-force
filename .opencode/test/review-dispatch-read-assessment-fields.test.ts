import { randomUUID } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  _getSessionCorrelationMap,
  createConsolidateDispatchTool,
  createFinalizationDependencies,
  createReadAssessmentFieldsTool,
  dispatchAgentRun,
  parseAssessmentFields,
  parseCoverageAttestation,
  type DispatchAgentRunDependencies,
} from "../plugins/review-dispatch/index.js"
import manifestFixture from "./fixtures/review-dispatch/manifest.json"
import matrixFixture from "./fixtures/review-dispatch/matrix.json"

type Client = PluginInput["client"]

/** Parent session ID the tool-level tests register their dispatch session under. */
const TOOL_SESSION_ID = "assessment-fields-session"

/** Build the structured response contract text a compliant child run persists. */
function contractText(overrides?: {
  verdict?: string
  category?: string
  objectivity?: string
  reasoning?: string
  splitRecommendation?: string
}): string {
  return [
    "**Model**: provider/model",
    "",
    `**verdict**: ${overrides?.verdict ?? "VALID"}`,
    `**category**: ${overrides?.category ?? "bug"}`,
    `**objectivity**: ${overrides?.objectivity ?? "objective"}`,
    `**reasoning**: ${overrides?.reasoning ?? "Evidence points to a reproducible defect."}`,
    `**split_recommendation**: ${overrides?.splitRecommendation ?? "null"}`,
  ].join("\n")
}

function noopContext(): ToolContext {
  return {
    sessionID: TOOL_SESSION_ID,
    messageID: "msg-assessment",
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

/** Build a PersistedRunData fixture for writing to a dispatch session directory. */
function runFixture(overrides: { agent: string; run_id?: string; text?: string }) {
  return {
    correlation_id: randomUUID(),
    run_id: overrides.run_id ?? randomUUID(),
    agent: overrides.agent,
    source: "explicit",
    sequence: 1,
    status: "success",
    started_at: "2026-10-19T10:00:00.000Z",
    finished_at: "2026-10-19T10:01:00.000Z",
    requested_model: "provider/standard",
    provider: "provider",
    model_id: "standard",
    variant: null,
    resolved_parent_model: null,
    resolved_parent_variant: null,
    reported_model: "provider/standard",
    model_mismatch: false,
    usage: null,
    error: null,
    workflow_verdict: "VALID",
    findings: [],
    proposals: [],
    text: overrides.text,
    read_only: true,
  }
}

const cleanupDirs: string[] = []

/** Persist runs to a fresh dispatch session directory bound to TOOL_SESSION_ID. */
async function setupDispatchSession(runs: ReadonlyArray<ReturnType<typeof runFixture>>): Promise<void> {
  const correlationId = randomUUID()
  const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
  await mkdir(dir, { recursive: true })
  cleanupDirs.push(dir)
  _getSessionCorrelationMap().set(TOOL_SESSION_ID, correlationId)
  for (const run of runs) {
    await writeFile(join(dir, `run-${run.agent}.json`), JSON.stringify(run, null, 2), "utf8")
  }
}

/**
 * Minimal fake client for dispatched runs: the prompt response echoes the
 * requested model identity (so model-mismatch checks pass) and returns
 * childText as the child session's final text.
 */
function dispatchClient(childText: string): Client {
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
            { id: "t", sessionID: "child-session", messageID: "m", type: "text", text: childText, ignored: false },
          ],
        },
        error: undefined,
      }
    },
    abort: async (): Promise<unknown> => ({ data: true, error: undefined }),
  }
  return { session } as unknown as Client
}

/** Dispatch dependencies resolving the review matrix and manifest from the test fixtures. */
function dispatchDeps(client: Client): DispatchAgentRunDependencies {
  return {
    plannerDependencies: {
      readText: async (path: string): Promise<string> => {
        if (path === ".uf/review-matrix.yaml") return JSON.stringify(matrixFixture)
        if (path === ".uf/reviewer-capabilities.yaml") return JSON.stringify(manifestFixture)
        if (path === ".uf/review-matrix.override.yaml") {
          const err = new Error("ENOENT") as NodeJS.ErrnoException
          err.code = "ENOENT"
          throw err
        }
        throw new Error(`unexpected read: ${path}`)
      },
      parseYaml: (text: string): unknown => JSON.parse(text) as unknown,
    },
    client,
    directory: "/workspace",
  }
}

/** Issue-shaped triage-issue session metadata whose plan entry matches the dispatched run. */
function triageSessionMetadata(agent: string) {
  return {
    command: "triage-issue" as const,
    mode: "triage" as const,
    full: false,
    input_context: {
      kind: "issue" as const,
      issue_number: 42,
      issue_url: "https://github.com/unbound-force/unbound-force/issues/42",
      content_sha256: "a".repeat(64),
    },
    change_profile: {
      kind: "issue" as const,
      text_bytes: 500,
      comment_count: 3,
      content_sha256: "a".repeat(64),
      matched_rules: [] as string[],
      security_sensitive: false,
      user_facing: true,
      categories: ["standard" as const],
      tier: "standard" as const,
    },
    plan: [
      {
        agent,
        decision: "include" as const,
        reason_code: "explicit",
        reason: "Explicitly included",
        source: "explicit" as const,
        sequence: 1,
        read_only: true,
        tier: "standard" as const,
        model: "provider/standard",
        variant: null,
        validation_errors: [] as string[],
      },
    ],
    coverage: { preflight_verdict: "PASS" as const, checks_total: 5, checks_passed: 5 },
  }
}

beforeEach(() => {
  _getSessionCorrelationMap().clear()
})

afterEach(async () => {
  _getSessionCorrelationMap().clear()
  await Promise.all(cleanupDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe("parseAssessmentFields", () => {
  it("returns all four validated fields for a compliant structured response", () => {
    expect(parseAssessmentFields(contractText())).toEqual({
      category: "bug",
      objectivity: "objective",
      reasoning: "Evidence points to a reproducible defect.",
      split_recommendations: [],
    })
  })

  describe("category bound (non-empty, at most 128 characters)", () => {
    it("accepts a category of exactly 128 characters", () => {
      const category = "a".repeat(128)
      expect(parseAssessmentFields(`**category**: ${category}`).category).toBe(category)
    })

    it("rejects a category of 129 characters as unavailable", () => {
      expect(parseAssessmentFields(`**category**: ${"a".repeat(129)}`).category).toBeNull()
    })

    it("rejects an empty category as unavailable without affecting other fields", () => {
      const parsed = parseAssessmentFields("**category**:\n**objectivity**: objective\n**reasoning**: evidence")
      expect(parsed.category).toBeNull()
      expect(parsed.objectivity).toBe("objective")
      expect(parsed.reasoning).toBe("evidence")
    })
  })

  describe("objectivity bound (at most 64 characters)", () => {
    it("accepts an objectivity of exactly 64 characters", () => {
      const objectivity = "o".repeat(64)
      expect(parseAssessmentFields(`**objectivity**: ${objectivity}`).objectivity).toBe(objectivity)
    })

    it("rejects an objectivity of 65 characters as unavailable", () => {
      expect(parseAssessmentFields(`**objectivity**: ${"o".repeat(65)}`).objectivity).toBeNull()
    })
  })

  describe("reasoning bound (at most 4096 characters)", () => {
    it("accepts a reasoning of exactly 4096 characters", () => {
      const reasoning = "r".repeat(4096)
      expect(parseAssessmentFields(`**reasoning**: ${reasoning}`).reasoning).toBe(reasoning)
    })

    it("rejects a reasoning of 4097 characters as unavailable", () => {
      expect(parseAssessmentFields(`**reasoning**: ${"r".repeat(4097)}`).reasoning).toBeNull()
    })
  })

  describe("split recommendation count bound (at most 16 entries)", () => {
    it("accepts an array of exactly 16 entries", () => {
      const entries = Array.from({ length: 16 }, (_, index) => `split ${index}`)
      const parsed = parseAssessmentFields(`**split_recommendation**: ${JSON.stringify(entries)}`)
      expect(parsed.split_recommendations).toEqual(entries)
    })

    it("rejects an array of 17 entries as unavailable", () => {
      const entries = Array.from({ length: 17 }, (_, index) => `split ${index}`)
      const parsed = parseAssessmentFields(`**split_recommendation**: ${JSON.stringify(entries)}`)
      expect(parsed.split_recommendations).toBeNull()
    })
  })

  describe("split recommendation entry bound (at most 512 characters each)", () => {
    it("accepts an entry of exactly 512 characters", () => {
      const entry = "s".repeat(512)
      const parsed = parseAssessmentFields(`**split_recommendation**: ${JSON.stringify([entry])}`)
      expect(parsed.split_recommendations).toEqual([entry])
    })

    it("rejects an entry of 513 characters as unavailable", () => {
      const parsed = parseAssessmentFields(`**split_recommendation**: ${JSON.stringify(["s".repeat(513)])}`)
      expect(parsed.split_recommendations).toBeNull()
    })
  })

  describe("split recommendation entry forms", () => {
    it("serializes {title, description} entries as 'title: description' strings", () => {
      const parsed = parseAssessmentFields(
        '**split_recommendation**: [{"title": "Fix login", "description": "Login fails on Safari"}]',
      )
      expect(parsed.split_recommendations).toEqual(["Fix login: Login fails on Safari"])
    })

    it("passes plain string entries through unchanged", () => {
      const parsed = parseAssessmentFields('**split_recommendation**: ["first", "second"]')
      expect(parsed.split_recommendations).toEqual(["first", "second"])
    })

    it("returns an empty array for a JSON null split recommendation", () => {
      const parsed = parseAssessmentFields("**split_recommendation**: null")
      expect(parsed.split_recommendations).toEqual([])
    })
  })

  describe("type mismatches against the contract shape", () => {
    it("skips a split recommendation whose value is a JSON string instead of an array, without affecting other fields", () => {
      const parsed = parseAssessmentFields(
        [
          "**category**: bug",
          "**objectivity**: objective",
          "**reasoning**: evidence",
          '**split_recommendation**: "not an array"',
        ].join("\n"),
      )
      expect(parsed.split_recommendations).toBeNull()
      expect(parsed.category).toBe("bug")
      expect(parsed.objectivity).toBe("objective")
      expect(parsed.reasoning).toBe("evidence")
    })

    it("skips a split recommendation whose value is a JSON object instead of an array", () => {
      const parsed = parseAssessmentFields(
        '**category**: bug\n**split_recommendation**: {"title": "t", "description": "d"}',
      )
      expect(parsed.split_recommendations).toBeNull()
      expect(parsed.category).toBe("bug")
    })

    it("skips split entries whose shapes do not match the contract", () => {
      const numberEntry = parseAssessmentFields("**split_recommendation**: [42]").split_recommendations
      const nestedArrayEntry = parseAssessmentFields('**split_recommendation**: [["nested"]]').split_recommendations
      const partialObjectEntry = parseAssessmentFields(
        '**split_recommendation**: [{"title": "missing description"}]',
      ).split_recommendations
      expect(numberEntry).toBeNull()
      expect(nestedArrayEntry).toBeNull()
      expect(partialObjectEntry).toBeNull()
    })

    it("skips a split recommendation whose value is not parseable JSON", () => {
      const parsed = parseAssessmentFields("**split_recommendation**: not json at all")
      expect(parsed.split_recommendations).toBeNull()
    })
  })

  describe("contract-shape validation", () => {
    it("tolerates backtick-wrapped values", () => {
      const parsed = parseAssessmentFields("**category**: `bug`\n**objectivity**: `objective`")
      expect(parsed.category).toBe("bug")
      expect(parsed.objectivity).toBe("objective")
    })

    it("tolerates bulleted labels", () => {
      const parsed = parseAssessmentFields("- **category**: bug\n- **objectivity**: subjective")
      expect(parsed.category).toBe("bug")
      expect(parsed.objectivity).toBe("subjective")
    })

    it("matches only the contract's lowercase labels", () => {
      expect(parseAssessmentFields("**Category**: bug").category).toBeNull()
    })

    it("ends each value region at the next labeled line", () => {
      const parsed = parseAssessmentFields(
        ["**reasoning**: line one", "line two", "", "**Model**: provider/model"].join("\n"),
      )
      expect(parsed.reasoning).toBe("line one\nline two")
    })
  })

  it("reports every field unavailable for empty text", () => {
    expect(parseAssessmentFields("")).toEqual({
      category: null,
      objectivity: null,
      reasoning: null,
      split_recommendations: null,
    })
  })

  it("reports every field unavailable for malformed structured text", () => {
    const parsed = parseAssessmentFields(
      ["The issue seems fine to me.", "No structured response here, just prose.", "**Model**: provider/model"].join("\n"),
    )
    expect(parsed).toEqual({
      category: null,
      objectivity: null,
      reasoning: null,
      split_recommendations: null,
    })
  })

  it("returns the valid fields while rejecting the over-length reasoning in the same text", () => {
    const parsed = parseAssessmentFields(contractText({ reasoning: "x".repeat(4097) }))
    expect(parsed.category).toBe("bug")
    expect(parsed.objectivity).toBe("objective")
    expect(parsed.reasoning).toBeNull()
    expect(parsed.split_recommendations).toEqual([])
  })
})

describe("parseCoverageAttestation (RD-FR-035)", () => {
  it("parses one repo-relative path per line after the marker", () => {
    const text = ["Review complete.", "", "**Files Reviewed**:", "src/foo.ts", "lib/bar.ts", "docs/README.md"].join("\n")
    expect(parseCoverageAttestation(text)).toEqual(["src/foo.ts", "lib/bar.ts", "docs/README.md"])
  })

  it("returns null when the marker is absent", () => {
    expect(parseCoverageAttestation("review output")).toBeNull()
    expect(parseCoverageAttestation("")).toBeNull()
  })

  it("returns an empty array when the marker is present but lists no files", () => {
    expect(parseCoverageAttestation("**Files Reviewed**:")).toEqual([])
    expect(parseCoverageAttestation(["**Files Reviewed**:", "", "   "].join("\n"))).toEqual([])
  })

  it("ends the path region at the next labeled-field line", () => {
    // The read_assessment_fields labeled-field termination keeps the
    // attestation from swallowing the following contract field — the
    // same boundary rule the assessment fields rely on.
    const text = ["**Files Reviewed**:", "src/foo.ts", "", "**Model**: provider/model"].join("\n")
    expect(parseCoverageAttestation(text)).toEqual(["src/foo.ts"])
  })

  it("accepts a same-line single path", () => {
    expect(parseCoverageAttestation("**Files Reviewed**: src/foo.ts")).toEqual(["src/foo.ts"])
  })
})

describe("read_assessment_fields tool", () => {
  it("returns validated fields from a persisted run's child text", async () => {
    const runId = randomUUID()
    await setupDispatchSession([
      runFixture({
        agent: "divisor-guard",
        run_id: runId,
        text: contractText({ splitRecommendation: '[{"title": "Fix login", "description": "Login fails"}]' }),
      }),
    ])

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runId] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: runId,
      agent: "divisor-guard",
      category: "bug",
      objectivity: "objective",
      reasoning: "Evidence points to a reproducible defect.",
      split_recommendations: ["Fix login: Login fails"],
      unavailable_reason: null,
    })
  })

  it("reports the run unavailable when persisted child text is missing", async () => {
    const runId = randomUUID()
    await setupDispatchSession([runFixture({ agent: "divisor-adversary", run_id: runId })])

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runId] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: runId,
      agent: "divisor-adversary",
      category: null,
      objectivity: null,
      reasoning: null,
      split_recommendations: null,
      unavailable_reason: "child text missing",
    })
  })

  it("reports the run unavailable when persisted child text is empty", async () => {
    const runId = randomUUID()
    await setupDispatchSession([runFixture({ agent: "divisor-sre", run_id: runId, text: "   " })])

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runId] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: runId,
      agent: "divisor-sre",
      category: null,
      objectivity: null,
      reasoning: null,
      split_recommendations: null,
      unavailable_reason: "child text empty",
    })
  })

  it("returns validation_error for an empty run_ids array", async () => {
    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("error")
    expect(data.code).toBe("validation_error")
  })

  it("returns not_found when no dispatch session exists for the session", async () => {
    const runId = randomUUID()

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runId] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("not_found")
    expect(data.correlation_id).toBeNull()
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: runId,
      agent: null,
      category: null,
      objectivity: null,
      reasoning: null,
      split_recommendations: null,
      unavailable_reason: "no dispatch session for this session",
    })
  })

  it("reports the run unavailable for an unknown run_id", async () => {
    const runId = randomUUID()
    await setupDispatchSession([
      runFixture({ agent: "divisor-guard", run_id: randomUUID(), text: contractText() }),
    ])

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runId] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: runId,
      agent: null,
      category: null,
      objectivity: null,
      reasoning: null,
      split_recommendations: null,
      unavailable_reason: "run not found in dispatch store",
    })
  })

  it("skips an unreadable run file and still returns the valid run", async () => {
    const runId = randomUUID()
    await setupDispatchSession([
      runFixture({ agent: "divisor-guard", run_id: runId, text: contractText() }),
    ])
    const correlationId = _getSessionCorrelationMap().get(TOOL_SESSION_ID)
    expect(correlationId).toBeDefined()
    const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
    await writeFile(join(dir, "run-divisor-corrupt.json"), "{ not valid json", "utf8")

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runId] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: runId,
      agent: "divisor-guard",
      category: "bug",
      objectivity: "objective",
      reasoning: "Evidence points to a reproducible defect.",
      split_recommendations: [],
      unavailable_reason: null,
    })
    expect(data.warnings).toEqual(["skipped unreadable run file: run-divisor-corrupt.json"])
  })

  it("maps multiple runs in the requested order", async () => {
    const runIdA = randomUUID()
    const runIdB = randomUUID()
    await setupDispatchSession([
      runFixture({ agent: "divisor-guard", run_id: runIdA, text: contractText() }),
      runFixture({ agent: "divisor-adversary", run_id: runIdB, text: contractText({ category: "enhancement" }) }),
    ])

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [runIdB, runIdA] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(2)
    expect(data.runs[0]).toMatchObject({ run_id: runIdB, agent: "divisor-adversary", category: "enhancement" })
    expect(data.runs[1]).toMatchObject({ run_id: runIdA, agent: "divisor-guard", category: "bug" })
    expect(data.warnings).toEqual([])
  })
})

describe("read_assessment_fields integration through a dispatched run", () => {
  it("returns validated fields for a structured response persisted by a dispatched run", async () => {
    const childText = contractText({
      splitRecommendation: '[{"title": "Split auth", "description": "Auth handling belongs in its own story"}]',
    })
    const deps = dispatchDeps(dispatchClient(childText))
    const dispatched = await dispatchAgentRun({ agent: "divisor-guard", prompt: "Triage this issue." }, noopContext(), deps)
    cleanupDirs.push(join(tmpdir(), "opencode", `dispatch-${dispatched.correlation_id}`))

    // The dispatched run persisted the child's structured response as its final text.
    expect(dispatched.status).toBe("success")
    expect(dispatched.text).toBe(childText)

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [dispatched.run_id] }, noopContext())
    const data = JSON.parse(result.output)
    expect(data.status).toBe("ok")
    expect(data.correlation_id).toBe(dispatched.correlation_id)
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: dispatched.run_id,
      agent: "divisor-guard",
      category: "bug",
      objectivity: "objective",
      reasoning: "Evidence points to a reproducible defect.",
      split_recommendations: ["Split auth: Auth handling belongs in its own story"],
      unavailable_reason: null,
    })
  })

  it("returns fields with no verdict when the child text verdict disagrees with the run-recorded workflow_verdict", async () => {
    // The child's prose claims INVALID while its run record (successful run,
    // no findings) votes VALID under the triage projection.
    const childText = contractText({ verdict: "INVALID" })
    const deps = dispatchDeps(dispatchClient(childText))
    const dispatched = await dispatchAgentRun(
      { agent: "divisor-guard", prompt: "Triage this issue.", session_metadata: triageSessionMetadata("divisor-guard") },
      noopContext(),
      deps,
    )
    cleanupDirs.push(join(tmpdir(), "opencode", `dispatch-${dispatched.correlation_id}`))

    expect(dispatched.status).toBe("success")
    expect(dispatched.text).toContain("**verdict**: INVALID")

    const result = await createReadAssessmentFieldsTool().execute({ run_ids: [dispatched.run_id] }, noopContext())
    const data = JSON.parse(result.output)

    // The assessment fields are returned for the disagreeing run...
    expect(data.status).toBe("ok")
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toEqual({
      run_id: dispatched.run_id,
      agent: "divisor-guard",
      category: "bug",
      objectivity: "objective",
      reasoning: "Evidence points to a reproducible defect.",
      split_recommendations: [],
      unavailable_reason: null,
    })

    // ...and the response carries no verdict field at any level: verdict
    // resolution stays on run-recorded workflow_verdict values, so the tool
    // cannot vote and the child text's INVALID statement is ignored.
    expect(data).not.toHaveProperty("verdict")
    expect(data.runs[0]).not.toHaveProperty("verdict")
    expect(data.runs[0]).not.toHaveProperty("workflow_verdict")
    expect(result.output).not.toContain("verdict")

    // Verdict resolution stays on the run-recorded value: consolidate_dispatch
    // derives the run's workflow_verdict from the run record (successful run,
    // no findings), not from the child text's verdict statement.
    const consolidate = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const consolidateResult = await consolidate.execute({}, noopContext())
    const consolidated = JSON.parse(consolidateResult.output) as {
      runs: Array<{ run_id: string; workflow_verdict: string | null }>
      workflow_result: { kind: string; value: string }
    }
    expect(consolidated.runs).toHaveLength(1)
    const runEntry = consolidated.runs.find((run) => run.run_id === dispatched.run_id)
    expect(runEntry).toBeDefined()
    expect(runEntry?.workflow_verdict).toBe("VALID")
    expect(consolidated.workflow_result).toEqual({ kind: "triage", value: "VALID" })
  })
})
