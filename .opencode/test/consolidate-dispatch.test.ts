import type { PluginInput, ToolContext } from "@opencode-ai/plugin"
import { randomUUID } from "node:crypto"
import { mkdir, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it, afterEach } from "vitest"

import { ReviewDispatchPlugin, createConsolidateDispatchTool, createFinalizationDependencies, _getSessionCorrelationMap, finalizeReviewDispatch } from "../plugins/review-dispatch/index.js"

/** Build a valid PersistedRunData fixture for writing to disk. */
function runFixture(overrides: {
  agent: string
  run_id?: string
  status?: string
  error?: { code: string; message: string; retryable: boolean }
  findings?: Array<{
    severity: string
    category: string
    description: string
    root_cause: string
    file: string | null
    line: number | null
  }>
  proposals?: Array<{ information: string; tag: string; category?: string }>
}) {
  return {
    correlation_id: randomUUID(),
    run_id: overrides.run_id ?? randomUUID(),
    agent: overrides.agent,
    source: "explicit",
    sequence: 1,
    status: overrides.status ?? "success",
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
    usage: { cost_usd: 0.5, tokens: { input: 1000, output: 500 } },
    // Failed/cancelled fixtures need a non-null error for the finalizer's
    // validateRunState; success fixtures keep null.
    error: overrides.error ?? null,
    workflow_verdict: null,
    findings: overrides.findings ?? [],
    proposals: overrides.proposals ?? [],
    text: "review output",
    read_only: true,
  }
}

function noopContext(): ToolContext {
  return {
    sessionID: "consolidate-session",
    messageID: "msg-consolidate",
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

function validInputContext() {
  return {
    kind: "pr" as const,
    pr_number: 686,
    base_ref: "main",
    base_sha: "a".repeat(40),
    head_ref: "feature",
    head_sha: "b".repeat(40),
  }
}

function validChangeProfile() {
  return {
    kind: "diff" as const,
    lines: 100,
    files: 5,
    components: 2,
    security_sensitive: false,
    user_facing: true,
    categories: ["standard" as const],
    tier: "standard" as const,
  }
}

function validPlan() {
  return [
    {
      agent: "divisor-guard",
      decision: "include",
      reason_code: "advisor",
      reason: "Advisor selected",
      source: "advisor",
      sequence: 1,
      read_only: true,
      tier: "standard",
      model: "provider/standard",
      variant: null,
      validation_errors: [],
    },
  ]
}

function validCoverage() {
  return { preflight_verdict: "PASS" as const, checks_total: 5, checks_passed: 5 }
}

/** Default session metadata written to session-metadata.json for consolidation. */
function defaultSessionMetadata(overrides?: Record<string, unknown>) {
  return {
    command: "review-council" as const,
    mode: "code" as const,
    full: false,
    input_context: validInputContext(),
    change_profile: validChangeProfile(),
    plan: validPlan(),
    coverage: validCoverage(),
    ...overrides,
  }
}

/**
 * Plan entries matching runFixture runs (identity = agent + source +
 * sequence; every fixture run uses source "explicit" and sequence 1) so
 * the finalizer's plan-identity and model checks pass. Accepts multiple
 * agents for mixed success/failed sessions.
 */
function explicitRunPlan(...agents: string[]) {
  return agents.map((agent) => ({
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
  }))
}

/** Issue-shaped session metadata overrides for triage-issue dispatch sessions. */
function triageIssueMetadata() {
  return {
    command: "triage-issue" as const,
    mode: "triage" as const,
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
  }
}

// Track temp directories for cleanup.
const cleanupDirs: string[] = []

afterEach(async () => {
  _getSessionCorrelationMap().clear()
  for (const dir of cleanupDirs) {
    try {
      await rm(dir, { recursive: true, force: true })
    } catch {
      // best-effort
    }
  }
  cleanupDirs.length = 0
})

/** Write run fixture files + session metadata and return the correlation_id. */
async function setupDispatchSession(
  runs: ReturnType<typeof runFixture>[],
  metadata?: Record<string, unknown>,
): Promise<string> {
  const correlationId = randomUUID()
  const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
  await mkdir(dir, { recursive: true })
  cleanupDirs.push(dir)
  _getSessionCorrelationMap().set("consolidate-session", correlationId)

  await writeFile(join(dir, "session-metadata.json"), JSON.stringify(defaultSessionMetadata(metadata), null, 2), "utf8")

  for (const run of runs) {
    await writeFile(join(dir, `run-${run.agent}.json`), JSON.stringify(run, null, 2), "utf8")
  }

  return correlationId
}

describe("consolidate_dispatch", () => {
  it("consolidates successful runs with no findings into APPROVE", async () => {
    const correlationId = await setupDispatchSession([
      runFixture({ agent: "divisor-guard" }),
      runFixture({ agent: "divisor-adversary" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.verdict).toBe("APPROVE")
    expect(payload.verdict_reason).toBe("No findings requiring changes")
    expect(payload.findings).toHaveLength(0)
    expect(payload.advisories).toHaveLength(0)
    expect(payload.run_counts.total).toBe(2)
    expect(payload.run_counts.success).toBe(2)
    expect(payload.workflow_result).toEqual({ kind: "council", value: "APPROVE" })
    expect(payload.correlation_id).toBe(correlationId)
    expect(payload.proposals).toBeUndefined()
  })

  it("includes lesson proposals from child runs in output", async () => {
    await setupDispatchSession([
      runFixture({
        agent: "divisor-architect",
        proposals: [
          { information: "When extracting a shared lib, keep re-exports for backward compat.", tag: "shared-lib", category: "pattern" },
        ],
      }),
      runFixture({ agent: "divisor-guard" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.proposals).toHaveLength(1)
    expect(payload.proposals[0]).toEqual({
      agent: "divisor-architect",
      information: "When extracting a shared lib, keep re-exports for backward compat.",
      tag: "shared-lib",
      category: "pattern",
    })
  })

  it("escalates to REQUEST CHANGES when HIGH findings exist", async () => {
    const runId1 = randomUUID()
    const correlationId = await setupDispatchSession([
      runFixture({
        agent: "divisor-guard",
        run_id: runId1,
        findings: [
          { severity: "HIGH", category: "security", description: "Missing auth", root_cause: "No middleware", file: "api.ts", line: 10 },
        ],
      }),
      runFixture({ agent: "divisor-adversary" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.verdict).toBe("REQUEST CHANGES")
    expect(payload.verdict_reason).toContain("HIGH")
    expect(payload.findings).toHaveLength(1)
    expect(payload.findings[0].run_ids).toContain(runId1)
    expect(payload.advisories).toHaveLength(0)
  })

  it("maps MEDIUM findings to APPROVE WITH ADVISORIES", async () => {
    const correlationId = await setupDispatchSession([
      runFixture({
        agent: "divisor-guard",
        findings: [
          { severity: "MEDIUM", category: "style", description: "Missing docs", root_cause: "No jsdoc", file: "lib.ts", line: 5 },
        ],
      }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.verdict).toBe("APPROVE WITH ADVISORIES")
    expect(payload.advisories).toHaveLength(1)
    expect(payload.advisories[0].severity).toBe("MEDIUM")
  })

  it("maps LOW findings to APPROVE WITH ADVISORIES", async () => {
    const correlationId = await setupDispatchSession([
      runFixture({
        agent: "divisor-testing",
        findings: [
          { severity: "LOW", category: "style", description: "Naming convention", root_cause: "camelCase", file: "util.ts", line: 1 },
        ],
      }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.verdict).toBe("APPROVE WITH ADVISORIES")
    expect(payload.advisories).toHaveLength(1)
    expect(payload.advisories[0].severity).toBe("LOW")
  })

  it("deduplicates findings by normalized file + root_cause and keeps highest severity", async () => {
    const runId1 = randomUUID()
    const runId2 = randomUUID()
    const correlationId = await setupDispatchSession([
      runFixture({
        agent: "divisor-guard",
        run_id: runId1,
        findings: [
          { severity: "MEDIUM", category: "security", description: "Possible issue", root_cause: "Missing validation", file: "src/handler.ts", line: 10 },
        ],
      }),
      runFixture({
        agent: "divisor-adversary",
        run_id: runId2,
        findings: [
          // Same file (normalized) + same root_cause but higher severity.
          { severity: "HIGH", category: "security", description: "Definite issue", root_cause: "Missing validation", file: "SRC/HANDLER.TS", line: 10 },
        ],
      }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    // Deduplicated to one finding with highest severity.
    expect(payload.findings).toHaveLength(1)
    expect(payload.findings[0].severity).toBe("HIGH")
    expect(payload.findings[0].run_ids).toContain(runId1)
    expect(payload.findings[0].run_ids).toContain(runId2)
    expect(payload.verdict).toBe("REQUEST CHANGES")
  })

  it("counts run statuses correctly", async () => {
    const correlationId = await setupDispatchSession([
      runFixture({ agent: "divisor-guard", status: "success" }),
      runFixture({ agent: "divisor-adversary", status: "failed" }),
      runFixture({ agent: "divisor-testing", status: "cancelled" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.run_counts.total).toBe(3)
    expect(payload.run_counts.success).toBe(1)
    expect(payload.run_counts.failed).toBe(1)
    expect(payload.run_counts.cancelled).toBe(1)
    expect(payload.run_counts.skipped).toBe(0)
  })

  it("excludes failed-run findings and proposals from the payload while still counting the run", async () => {
    const guardRunId = randomUUID()
    const failedRunId = randomUUID()
    await setupDispatchSession([
      runFixture({
        agent: "divisor-guard",
        run_id: guardRunId,
        findings: [
          { severity: "MEDIUM", category: "security", description: "Kept finding", root_cause: "Missing check", file: "kept.ts", line: 3 },
        ],
        proposals: [{ information: "Kept lesson", tag: "kept" }],
      }),
      runFixture({
        agent: "divisor-adversary",
        run_id: failedRunId,
        status: "failed",
        error: { code: "child_message_error", message: "session aborted during final response generation", retryable: false },
        findings: [
          { severity: "HIGH", category: "security", description: "Orphaned finding 1", root_cause: "Orphan cause 1", file: "orphan1.ts", line: 7 },
          { severity: "LOW", category: "style", description: "Orphaned finding 2", root_cause: "Orphan cause 2", file: "orphan2.ts", line: 9 },
        ],
        proposals: [{ information: "Orphaned lesson", tag: "orphaned" }],
      }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    // RD-FR-025: only the successful run's submissions reach the payload.
    expect(payload.findings).toHaveLength(1)
    expect(payload.findings[0].description).toBe("Kept finding")
    expect(payload.findings[0].run_ids).toEqual([guardRunId])
    expect(payload.proposals).toHaveLength(1)
    expect(payload.proposals[0].agent).toBe("divisor-guard")
    expect(payload.proposals[0].information).toBe("Kept lesson")
    // Every plan run keeps its payload slot; the failed run's entry
    // carries an empty findings array rather than disappearing.
    const failedEntry = payload.runs.find((run) => run.run_id === failedRunId)
    expect(failedEntry.status).toBe("failed")
    expect(failedEntry.findings).toEqual([])
    // run_counts still derive from the full run list.
    expect(payload.run_counts.total).toBe(2)
    expect(payload.run_counts.success).toBe(1)
    expect(payload.run_counts.failed).toBe(1)
  })

  it("emits one orphaned_submissions_excluded warning per failed run with submissions", async () => {
    const guardRunId = randomUUID()
    await setupDispatchSession([
      runFixture({ agent: "divisor-architect" }),
      runFixture({
        agent: "divisor-guard",
        run_id: guardRunId,
        status: "failed",
        error: { code: "child_message_error", message: "session aborted during final response generation", retryable: false },
        findings: [
          { severity: "HIGH", category: "security", description: "Orphaned finding 1", root_cause: "Orphan cause 1", file: "orphan1.ts", line: 7 },
          { severity: "MEDIUM", category: "style", description: "Orphaned finding 2", root_cause: "Orphan cause 2", file: "orphan2.ts", line: 9 },
        ],
        proposals: [{ information: "Orphaned lesson", tag: "orphaned" }],
      }),
      // A failed run with no submissions emits no warning entry.
      runFixture({
        agent: "divisor-adversary",
        status: "failed",
        error: { code: "run_failed", message: "reviewer failed before submitting", retryable: true },
      }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    // Exactly one entry: the guard (2 findings + 1 proposal discarded);
    // the empty-submission adversary is absent from warnings.
    expect(payload.warnings).toHaveLength(1)
    expect(payload.warnings[0]).toEqual({
      type: "orphaned_submissions_excluded",
      agent: "divisor-guard",
      run_id: guardRunId,
      discarded_findings: 2,
      discarded_proposals: 1,
    })
    // The empty-submission failed run still occupies its payload slot.
    expect(payload.runs).toHaveLength(3)
  })

  it("fails closed as INCONCLUSIVE when every run failed", async () => {
    const projectRoot = join(tmpdir(), `consolidate-zero-success-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    const guardRunId = randomUUID()
    await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          run_id: guardRunId,
          status: "failed",
          error: { code: "child_message_error", message: "session aborted during final response generation", retryable: false },
          findings: [
            { severity: "HIGH", category: "security", description: "Orphaned finding", root_cause: "Orphan cause", file: "orphan.ts", line: 7 },
          ],
          proposals: [{ information: "Orphaned lesson", tag: "orphaned" }],
        }),
        runFixture({
          agent: "divisor-adversary",
          status: "failed",
          error: { code: "run_failed", message: "reviewer failed before submitting", retryable: true },
        }),
      ],
      { plan: explicitRunPlan("divisor-guard", "divisor-adversary") },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/fix-review-dispatch-recovery",
          commit: "b".repeat(40), // Must match input_context.head_sha
          workflow_id: "uf.review-council",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // RD-FR-007: zero successful runs fail closed. Success scoping must
    // not manufacture an approving result from excluded submissions.
    expect(finalizationResult.status).toBe("failed")
    expect(finalizationResult.operation_verdict).toBe("INCONCLUSIVE")
    expect(finalizationResult.artifact_path).toBeNull()
    // The only errors are the no-success verdict mismatches — the
    // orphaned submissions were excluded from the payload, so no
    // run-state rejections (the pre-fix brick) ride along.
    expect(finalizationResult.errors).toHaveLength(2)
    expect(finalizationResult.errors.join("\n")).toContain("expected INCONCLUSIVE")
    expect(finalizationResult.errors.join("\n")).not.toContain("must not vote or emit findings")
    // Warnings ride alongside the fail-closed result: every orphaned
    // submission stays visible (RD-FR-025 zero-success scenario).
    expect(finalizationResult.warnings).toEqual([
      {
        type: "orphaned_submissions_excluded",
        agent: "divisor-guard",
        run_id: guardRunId,
        discarded_findings: 1,
        discarded_proposals: 1,
      },
    ])
    // No successful runs means no collected proposals at all.
    expect(finalizationResult.proposals).toBeUndefined()
  })

  it("omits the warnings key when every run succeeds", async () => {
    await setupDispatchSession([
      runFixture({
        agent: "divisor-guard",
        findings: [
          { severity: "MEDIUM", category: "style", description: "Docs gap", root_cause: "No jsdoc", file: "lib.ts", line: 5 },
        ],
      }),
      runFixture({ agent: "divisor-adversary" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    // RD-FR-025 all-success scenario: no exclusion warning for successful
    // runs, so the warnings key is omitted entirely — mirroring proposals
    // (PR #776).
    expect(payload.verdict).toBe("APPROVE WITH ADVISORIES")
    expect(payload.findings).toHaveLength(1)
    expect(payload.warnings).toBeUndefined()
  })

  it("finalizes a mixed session whose failed run carried accepted submissions (issue #751)", async () => {
    const projectRoot = join(tmpdir(), `consolidate-751-repro-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // Issue #751 shape: the guard child's findings and lesson proposal
    // were accepted, then its session aborted at the model context
    // ceiling during final-response generation. The run is recorded
    // failed while its harvested submissions persist; one other reviewer
    // succeeded.
    const guardRunId = randomUUID()
    const adversaryRunId = randomUUID()
    await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          run_id: guardRunId,
          status: "failed",
          error: { code: "child_message_error", message: "session aborted during final response generation", retryable: false },
          findings: [
            { severity: "HIGH", category: "security", description: "Orphaned finding 1", root_cause: "Orphan cause 1", file: "orphan1.ts", line: 7 },
            { severity: "MEDIUM", category: "security", description: "Orphaned finding 2", root_cause: "Orphan cause 2", file: "orphan2.ts", line: 9 },
          ],
          proposals: [{ information: "Orphaned lesson", tag: "orphaned" }],
        }),
        runFixture({
          agent: "divisor-adversary",
          run_id: adversaryRunId,
          findings: [
            { severity: "MEDIUM", category: "style", description: "Kept finding", root_cause: "Missing docs", file: "lib.ts", line: 5 },
          ],
          proposals: [{ information: "Kept lesson", tag: "kept" }],
        }),
      ],
      { plan: explicitRunPlan("divisor-guard", "divisor-adversary") },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/fix-review-dispatch-recovery",
          commit: "b".repeat(40), // Must match input_context.head_sha
          workflow_id: "uf.review-council",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // The regression: before RD-FR-025 the guard's harvested findings
    // flowed into the payload and the finalizer rejected it ("non-success
    // run must not vote or emit findings") with no recovery path — a
    // permanently unfinalizable dispatch. Success-scoped consolidation
    // keeps the dispatch finalizable.
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.errors).toHaveLength(0)
    expect(finalizationResult.operation_verdict).toBe("APPROVE WITH ADVISORIES")
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")

    // The persisted payload validates with the orphaned submissions
    // excluded: only the successful adversary contributes.
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.findings).toHaveLength(1)
    expect(persistedPayload.findings[0].run_ids).toEqual([adversaryRunId])
    const persistedGuard = persistedPayload.runs.find((run) => run.run_id === guardRunId)
    expect(persistedGuard.status).toBe("failed")
    expect(persistedGuard.findings).toEqual([])
    expect(persistedPayload.run_counts.total).toBe(2)
    expect(persistedPayload.run_counts.success).toBe(1)
    expect(persistedPayload.run_counts.failed).toBe(1)

    // The warning names the failed run with its discarded counts.
    expect(finalizationResult.warnings).toEqual([
      {
        type: "orphaned_submissions_excluded",
        agent: "divisor-guard",
        run_id: guardRunId,
        discarded_findings: 2,
        discarded_proposals: 1,
      },
    ])

    // Returned proposals come from the successful run only.
    expect(finalizationResult.proposals).toHaveLength(1)
    expect(finalizationResult.proposals[0].agent).toBe("divisor-adversary")
    expect(finalizationResult.proposals[0].information).toBe("Kept lesson")
  })

  it("maps triage-issue command to triage workflow result", async () => {
    const correlationId = await setupDispatchSession(
      [runFixture({ agent: "divisor-guard" })],
      {
        command: "triage-issue",
        mode: "triage",
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
          matched_rules: [],
          security_sensitive: false,
          user_facing: true,
          categories: ["standard" as const],
          tier: "standard" as const,
        },
      },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.workflow_result.kind).toBe("triage")
    expect(payload.workflow_result.value).toBe("VALID")
  })

  it("maps address-feedback APPROVE WITH ADVISORIES to AUTHOR-DECIDES", async () => {
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "MEDIUM", category: "style", description: "Needs improvement", root_cause: "Convention gap", file: "a.ts", line: 1 },
          ],
        }),
      ],
      { command: "address-feedback", mode: "feedback" },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.workflow_result.kind).toBe("feedback")
    expect(payload.workflow_result.value).toBe("AUTHOR-DECIDES")
  })

  it("maps address-feedback APPROVE (no findings) to ACCEPT", async () => {
    const correlationId = await setupDispatchSession(
      [runFixture({ agent: "divisor-guard" })],
      { command: "address-feedback", mode: "feedback" },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.workflow_result.kind).toBe("feedback")
    expect(payload.workflow_result.value).toBe("ACCEPT")
  })

  it("maps address-feedback REQUEST CHANGES to AUTHOR-DECIDES", async () => {
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "HIGH", category: "security", description: "Blocker", root_cause: "Missing auth", file: "a.ts", line: 1 },
          ],
        }),
      ],
      { command: "address-feedback", mode: "feedback" },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.workflow_result.kind).toBe("feedback")
    // REQUEST CHANGES escalates to the author under the feedback
    // projection: allowed feedback run verdicts are only
    // ACCEPT/AUTHOR-DECIDES (FR-001 totality).
    expect(payload.workflow_result.value).toBe("AUTHOR-DECIDES")
    expect(payload.runs[0].workflow_verdict).toBe("AUTHOR-DECIDES")
    // The top-level verdict is the lossless back-projection of the
    // native value (RD-FR-008), not the raw severity-derived verdict.
    expect(payload.verdict).toBe("APPROVE WITH ADVISORIES")
  })

  it("fails closed as not_found when no dispatch session exists for the session", async () => {
    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    // RD-FR-027: an unresolvable id fails closed with the same
    // not_found envelope dispatch_status emits for the condition
    // (PR #776), not a generic error string.
    const payload = JSON.parse(result.output)
    expect(payload.status).toBe("not_found")
    expect(payload.message).toBe("no dispatch session for this session")
    expect(payload.runs).toEqual([])
  })

  it("fails closed as not_found for a supplied correlation_id with no dispatch session directory", async () => {
    const correlationId = randomUUID()
    _getSessionCorrelationMap().set("consolidate-session", correlationId)

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    // Resolved-id shape mirrors dispatch_status: correlation_id echoed,
    // no message key (PR #776).
    const payload = JSON.parse(result.output)
    expect(payload.status).toBe("not_found")
    expect(payload.correlation_id).toBe(correlationId)
    expect(payload.runs).toEqual([])
  })

  it("returns error when dispatch directory exists but has no run files", async () => {
    const correlationId = randomUUID()
    const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
    await mkdir(dir, { recursive: true })
    cleanupDirs.push(dir)
    _getSessionCorrelationMap().set("consolidate-session", correlationId)
    await writeFile(join(dir, "session-metadata.json"), JSON.stringify(defaultSessionMetadata()), "utf8")

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    expect(result.output).toContain("no run files found")
  })

  it("returns error when a run file contains invalid JSON", async () => {
    const correlationId = randomUUID()
    const dir = join(tmpdir(), "opencode", `dispatch-${correlationId}`)
    await mkdir(dir, { recursive: true })
    cleanupDirs.push(dir)
    _getSessionCorrelationMap().set("consolidate-session", correlationId)
    await writeFile(join(dir, "session-metadata.json"), JSON.stringify(defaultSessionMetadata()), "utf8")
    await writeFile(join(dir, "run-divisor-guard.json"), "not valid json", "utf8")

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    expect(result.output).toContain("failed to read run-divisor-guard.json")
  })

  it("preserves plan_version: 1 in the output payload", async () => {
    const correlationId = await setupDispatchSession([
      runFixture({ agent: "divisor-guard" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    expect(payload.plan_version).toBe(1)
    expect(payload.plan).toEqual(validPlan())
  })

  it("finalizes internally when provenance is provided", async () => {
    const projectRoot = join(tmpdir(), `consolidate-provenance-test-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // The run's run_id is auto-generated by runFixture; capture it
    // so we can verify it appears in the finalization result.
    const guardRun = runFixture({
      agent: "divisor-guard",
      proposals: [{ information: "Test lesson from provenance path", tag: "test-tag" }],
    })
    // Provenance commit MUST match input_context.head_sha for semantic validation.
    const headSha = "b".repeat(40)
    const correlationId = await setupDispatchSession([guardRun], {
      plan: [
        {
          agent: "divisor-guard",
          decision: "include",
          reason_code: "explicit",
          reason: "Explicitly included",
          source: "explicit",
          sequence: 1,
          read_only: true,
          tier: "standard",
          model: "provider/standard",
          variant: null,
          validation_errors: [],
        },
      ],
    })

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/test-branch",
          commit: headSha, // Must match input_context.head_sha
          workflow_id: "uf.review-council",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // When provenance is provided, the result is a finalization result, not a raw payload.
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.operation_verdict).toBe("APPROVE")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    expect(finalizationResult.errors).toHaveLength(0)
    expect(finalizationResult.proposals).toHaveLength(1)
    expect(finalizationResult.proposals[0].agent).toBe("divisor-guard")
    expect(finalizationResult.proposals[0].information).toBe("Test lesson from provenance path")
  })

  it("internally finalizes a triage-issue dispatch with native NEEDS-CLARIFICATION run verdicts", async () => {
    const projectRoot = join(tmpdir(), `consolidate-triage-finalize-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // One successful run with LOW findings: runVerdict is APPROVE WITH
    // ADVISORIES, which the triage projection maps to NEEDS-CLARIFICATION.
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "LOW", category: "clarity", description: "Summary is ambiguous", root_cause: "No reproduction steps", file: null, line: null },
          ],
        }),
      ],
      { ...triageIssueMetadata(), plan: explicitRunPlan("divisor-guard") },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/dispatch-finalize-determinism",
          commit: "c".repeat(40),
          workflow_id: "uf.triage-issue",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    // FR-001: native run verdicts satisfy allowedRunVerdicts(), so the
    // finalizer no longer rejects the payload with "verdict outside triage".
    // The rejection text itself is pinned on the failure path by
    // finalize-error-boundaries.test.ts.
    expect(finalizationResult.errors).toHaveLength(0)
    // Top-level verdict stays generic; runs and workflow_result are triage-native.
    expect(finalizationResult.operation_verdict).toBe("APPROVE WITH ADVISORIES")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.runs).toHaveLength(1)
    expect(persistedPayload.runs[0].workflow_verdict).toBe("NEEDS-CLARIFICATION")
    expect(persistedPayload.workflow_result).toEqual({ kind: "triage", value: "NEEDS-CLARIFICATION" })
    // The native verdict flows through the persona projection unchanged.
    expect(finalizationResult.review_verdict.persona_verdicts[0].summary).toBe("Native verdict: NEEDS-CLARIFICATION")
  })

  it("internally finalizes a triage-issue dispatch with HIGH findings as INVALID", async () => {
    const projectRoot = join(tmpdir(), `consolidate-triage-blocking-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // HIGH findings make runVerdict REQUEST CHANGES; the triage projection
    // maps it to INVALID, whose back-projection is the generic REQUEST
    // CHANGES verdict. This is the load-bearing branch of FR-001 totality
    // for triage: without the mapping, run verdicts are rejected with
    // "verdict outside triage" (the production incident class).
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "HIGH", category: "security", description: "Blocker", root_cause: "Missing auth", file: null, line: null },
          ],
        }),
      ],
      { ...triageIssueMetadata(), plan: explicitRunPlan("divisor-guard") },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/dispatch-finalize-determinism",
          commit: "c".repeat(40),
          workflow_id: "uf.triage-issue",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.errors).toHaveLength(0)
    // INVALID back-projects to the generic REQUEST CHANGES verdict.
    expect(finalizationResult.operation_verdict).toBe("REQUEST CHANGES")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.runs).toHaveLength(1)
    expect(persistedPayload.runs[0].workflow_verdict).toBe("INVALID")
    expect(persistedPayload.workflow_result).toEqual({ kind: "triage", value: "INVALID" })
    expect(persistedPayload.verdict).toBe("REQUEST CHANGES")
    expect(persistedPayload.findings).toHaveLength(1)
    expect(persistedPayload.findings[0].severity).toBe("HIGH")
  })

  it("internally finalizes an address-feedback dispatch with native AUTHOR-DECIDES run verdicts", async () => {
    const projectRoot = join(tmpdir(), `consolidate-feedback-finalize-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // Same LOW-findings shape: APPROVE WITH ADVISORIES maps to
    // AUTHOR-DECIDES under the feedback projection.
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "LOW", category: "style", description: "Suggestion only", root_cause: "Reviewer preference", file: "a.ts", line: 1 },
          ],
        }),
      ],
      { command: "address-feedback" as const, mode: "feedback" as const, plan: explicitRunPlan("divisor-guard") },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/dispatch-finalize-determinism",
          // Provenance commit MUST match input_context.head_sha for non-issue kinds.
          commit: "b".repeat(40),
          workflow_id: "uf.address-feedback",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.errors).toHaveLength(0)
    expect(finalizationResult.operation_verdict).toBe("APPROVE WITH ADVISORIES")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.runs).toHaveLength(1)
    expect(persistedPayload.runs[0].workflow_verdict).toBe("AUTHOR-DECIDES")
    expect(persistedPayload.workflow_result).toEqual({ kind: "feedback", value: "AUTHOR-DECIDES" })
  })

  it("internally finalizes an address-feedback dispatch with HIGH findings as AUTHOR-DECIDES", async () => {
    const projectRoot = join(tmpdir(), `consolidate-feedback-blocking-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // HIGH findings make runVerdict REQUEST CHANGES; the feedback
    // projection must escalate to AUTHOR-DECIDES so run verdicts,
    // workflow_result, and allowedRunVerdicts() agree and internal
    // finalization succeeds for the blocking class (FR-001 totality).
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "HIGH", category: "security", description: "Blocker", root_cause: "Missing auth", file: "a.ts", line: 1 },
          ],
        }),
      ],
      { command: "address-feedback" as const, mode: "feedback" as const, plan: explicitRunPlan("divisor-guard") },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/dispatch-finalize-determinism",
          // Provenance commit MUST match input_context.head_sha for non-issue kinds.
          commit: "b".repeat(40),
          workflow_id: "uf.address-feedback",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.errors).toHaveLength(0)
    // The top-level generic verdict is the lossless back-projection of the
    // native AUTHOR-DECIDES value (RD-FR-008); the HIGH finding remains
    // recorded in the payload findings for the human gate.
    expect(finalizationResult.operation_verdict).toBe("APPROVE WITH ADVISORIES")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.runs).toHaveLength(1)
    expect(persistedPayload.runs[0].workflow_verdict).toBe("AUTHOR-DECIDES")
    expect(persistedPayload.workflow_result).toEqual({ kind: "feedback", value: "AUTHOR-DECIDES" })
    expect(persistedPayload.verdict).toBe("APPROVE WITH ADVISORIES")
    expect(persistedPayload.findings).toHaveLength(1)
    expect(persistedPayload.findings[0].severity).toBe("HIGH")
  })

  it("finalizes a split address-feedback panel via internal finalization and an unmodified payload", async () => {
    // Issue #764 regression shape (observed on PR #761): one reviewer
    // fully accepts (zero findings → run verdict ACCEPT) while another
    // documents a MEDIUM finding (run verdict AUTHOR-DECIDES). Before
    // fix-dispatch-verdict-derivation the emitter derived the top-level
    // value from the consolidated severity ladder (AUTHOR-DECIDES
    // whenever any finding exists) while the finalizer recomputed the
    // persona-vote value (ACCEPT whenever any successful run voted
    // ACCEPT) — a deterministic, retry-proof rejection. Emission and
    // validation now share calculatedWorkflowValue, so the panel
    // finalizes. Distinct personas keep the plan identities unique and
    // the two votes separate in successfulPersonaVotes.
    const splitPanelRuns = () => [
      runFixture({ agent: "divisor-guard" }),
      runFixture({
        agent: "divisor-adversary",
        findings: [
          {
            severity: "MEDIUM",
            category: "style",
            description: "Inconsistent error wrapping across finalization paths",
            root_cause: "Missing operation context in wrapped error",
            file: "lib/review-dispatch.ts",
            line: 42,
          },
        ],
      }),
    ]
    const splitPanelPlan = [...explicitRunPlan("divisor-guard"), ...explicitRunPlan("divisor-adversary")]

    // Phase 1: internal finalization with provenance.
    const projectRoot = join(tmpdir(), `consolidate-feedback-split-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    const finalizeCorrelationId = await setupDispatchSession(splitPanelRuns(), {
      command: "address-feedback" as const,
      mode: "feedback" as const,
      plan: splitPanelPlan,
    })

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/fix-dispatch-verdict-derivation",
          // Provenance commit MUST match input_context.head_sha for non-issue kinds.
          commit: "b".repeat(40),
          workflow_id: "uf.address-feedback",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // Errors asserted first so a regression fails with the finalizer's
    // rejection text (value mismatch), not just a status mismatch.
    expect(finalizationResult.errors).toEqual([])
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(finalizeCorrelationId)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    // Any successful ACCEPT vote decides a feedback panel; the value is
    // ACCEPT and its lossless back-projection is APPROVE (RD-FR-008).
    expect(finalizationResult.operation_verdict).toBe("APPROVE")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.workflow_result).toEqual({ kind: "feedback", value: "ACCEPT" })
    expect(persistedPayload.verdict).toBe("APPROVE")
    // The MEDIUM finding is retained as the author's decision input and
    // in the severity-derived verdict_reason, while advisories stay
    // empty because the projected verdict is APPROVE, not ADVISORIES
    // (design D3 fixed-point ordering).
    expect(persistedPayload.findings).toHaveLength(1)
    expect(persistedPayload.findings[0].severity).toBe("MEDIUM")
    expect(persistedPayload.advisories).toHaveLength(0)
    expect(persistedPayload.verdict_reason).toContain("MEDIUM")
    // The split survives in the kind-native run verdicts.
    expect(persistedPayload.runs).toHaveLength(2)
    const runVerdicts = new Map<string, string>()
    for (const run of persistedPayload.runs) {
      runVerdicts.set(run.agent, run.workflow_verdict)
    }
    expect(runVerdicts.get("divisor-guard")).toBe("ACCEPT")
    expect(runVerdicts.get("divisor-adversary")).toBe("AUTHOR-DECIDES")
    // The canonical decision records APPROVED with both native votes.
    expect(finalizationResult.review_verdict.council_decision).toBe("APPROVED")
    const personaSummaries = finalizationResult.review_verdict.persona_verdicts.map(
      (persona: { summary: string }) => persona.summary,
    )
    expect(personaSummaries).toContain("Native verdict: ACCEPT")
    expect(personaSummaries).toContain("Native verdict: AUTHOR-DECIDES")

    // Phase 2: without provenance the same session shape returns a raw
    // payload that finalizes unmodified (Composability First: no caller
    // transformation between consolidate and finalize).
    const payloadRoot = join(tmpdir(), `consolidate-feedback-split-payload-${randomUUID()}`)
    await mkdir(payloadRoot, { recursive: true })
    cleanupDirs.push(payloadRoot)

    const payloadCorrelationId = await setupDispatchSession(splitPanelRuns(), {
      command: "address-feedback" as const,
      mode: "feedback" as const,
      plan: splitPanelPlan,
    })

    const payloadTool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const payloadResult = await payloadTool.execute({}, noopContext())

    const returnedPayload = JSON.parse(payloadResult.output)
    expect(returnedPayload.correlation_id).toBe(payloadCorrelationId)
    expect(returnedPayload).not.toHaveProperty("status")
    expect(returnedPayload).not.toHaveProperty("artifact_path")
    expect(returnedPayload.workflow_result).toEqual({ kind: "feedback", value: "ACCEPT" })
    expect(returnedPayload.verdict).toBe("APPROVE")
    expect(returnedPayload.findings).toHaveLength(1)
    expect(returnedPayload.advisories).toHaveLength(0)

    // Submit the returned payload unmodified: structural (strict schema)
    // and semantic validation must both pass.
    const externalFinalization = await finalizeReviewDispatch(
      {
        payload: returnedPayload,
        provenance: {
          branch: "opsx/fix-dispatch-verdict-derivation",
          commit: "b".repeat(40),
          workflow_id: "uf.address-feedback",
        },
      },
      createFinalizationDependencies(payloadRoot),
    )

    expect(externalFinalization.errors).toEqual([])
    expect(externalFinalization.status).toBe("success")
    expect(externalFinalization.operation_verdict).toBe("APPROVE")
    expect(externalFinalization.artifact_path).toContain(".uf/artifacts/dispatch/")
    // The persisted runs are exactly the returned runs — no transformation.
    expect(externalFinalization.review_dispatch?.payload.runs).toEqual(returnedPayload.runs)
  })

  it("finalizes a split-majority triage panel via internal finalization and an unmodified payload", async () => {
    // Issue #764 triage shape: a split-majority panel where two
    // reviewers vote VALID (zero findings) while one documents a HIGH
    // finding (run verdict INVALID). Before fix-dispatch-verdict-
    // derivation the emitter derived the top-level value from the
    // consolidated severity ladder (INVALID whenever any HIGH finding
    // exists) while the finalizer recomputed the persona majority
    // (triageMajority: two VALID votes beat one INVALID) — a
    // deterministic, retry-proof rejection. Emission and validation
    // now share calculatedWorkflowValue, so the majority decides and
    // the panel finalizes. Distinct personas keep the plan identities
    // unique and the three votes separate in successfulPersonaVotes.
    const splitPanelRuns = () => [
      runFixture({ agent: "divisor-guard" }),
      runFixture({
        agent: "divisor-adversary",
        findings: [
          {
            severity: "HIGH",
            category: "clarity",
            description: "Issue lacks acceptance criteria for the reported regression",
            root_cause: "No reproduction steps or expected-behavior section",
            file: null,
            line: null,
          },
        ],
      }),
      runFixture({ agent: "divisor-architect" }),
    ]
    const splitPanelPlan = [
      ...explicitRunPlan("divisor-guard"),
      ...explicitRunPlan("divisor-adversary"),
      ...explicitRunPlan("divisor-architect"),
    ]

    // Phase 1: internal finalization with provenance.
    const projectRoot = join(tmpdir(), `consolidate-triage-split-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    const finalizeCorrelationId = await setupDispatchSession(splitPanelRuns(), {
      ...triageIssueMetadata(),
      plan: splitPanelPlan,
    })

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/fix-dispatch-verdict-derivation",
          // Issue-kind contexts carry no head_sha, so the commit
          // equality rule does not apply; keep the pattern anyway.
          commit: "b".repeat(40),
          workflow_id: "uf.triage-issue",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // Errors asserted first so a regression fails with the finalizer's
    // rejection text (value mismatch), not just a status mismatch.
    expect(finalizationResult.errors).toEqual([])
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(finalizeCorrelationId)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    // The persona majority decides a triage panel: two VALID votes
    // beat one INVALID, so the value is VALID and its lossless
    // back-projection is APPROVE (RD-FR-008).
    expect(finalizationResult.operation_verdict).toBe("APPROVE")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.workflow_result).toEqual({ kind: "triage", value: "VALID" })
    expect(persistedPayload.verdict).toBe("APPROVE")
    // The HIGH finding is retained as the triage decision input and in
    // the severity-derived verdict_reason, while advisories stay empty
    // because the projected verdict is APPROVE, not ADVISORIES (design
    // D3 fixed-point ordering).
    expect(persistedPayload.findings).toHaveLength(1)
    expect(persistedPayload.findings[0].severity).toBe("HIGH")
    expect(persistedPayload.advisories).toHaveLength(0)
    expect(persistedPayload.verdict_reason).toContain("HIGH")
    // The split survives in the kind-native run verdicts.
    expect(persistedPayload.runs).toHaveLength(3)
    const runVerdicts = new Map<string, string>()
    for (const run of persistedPayload.runs) {
      runVerdicts.set(run.agent, run.workflow_verdict)
    }
    expect(runVerdicts.get("divisor-guard")).toBe("VALID")
    expect(runVerdicts.get("divisor-adversary")).toBe("INVALID")
    expect(runVerdicts.get("divisor-architect")).toBe("VALID")
    // The canonical decision records the triage majority.
    expect(finalizationResult.review_verdict.council_decision).toBe("APPROVED")
    const personaSummaries = finalizationResult.review_verdict.persona_verdicts.map(
      (persona: { summary: string }) => persona.summary,
    )
    expect(personaSummaries).toContain("Native verdict: VALID")
    expect(personaSummaries).toContain("Native verdict: INVALID")

    // Phase 2: without provenance the same session shape returns a raw
    // payload that finalizes unmodified (Composability First: no caller
    // transformation between consolidate and finalize).
    const payloadRoot = join(tmpdir(), `consolidate-triage-split-payload-${randomUUID()}`)
    await mkdir(payloadRoot, { recursive: true })
    cleanupDirs.push(payloadRoot)

    const payloadCorrelationId = await setupDispatchSession(splitPanelRuns(), {
      ...triageIssueMetadata(),
      plan: splitPanelPlan,
    })

    const payloadTool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const payloadResult = await payloadTool.execute({}, noopContext())

    const returnedPayload = JSON.parse(payloadResult.output)
    expect(returnedPayload.correlation_id).toBe(payloadCorrelationId)
    expect(returnedPayload).not.toHaveProperty("status")
    expect(returnedPayload).not.toHaveProperty("artifact_path")
    expect(returnedPayload.workflow_result).toEqual({ kind: "triage", value: "VALID" })
    expect(returnedPayload.verdict).toBe("APPROVE")
    expect(returnedPayload.findings).toHaveLength(1)
    expect(returnedPayload.advisories).toHaveLength(0)

    // Submit the returned payload unmodified: structural (strict schema)
    // and semantic validation must both pass.
    const externalFinalization = await finalizeReviewDispatch(
      {
        payload: returnedPayload,
        provenance: {
          branch: "opsx/fix-dispatch-verdict-derivation",
          commit: "b".repeat(40),
          workflow_id: "uf.triage-issue",
        },
      },
      createFinalizationDependencies(payloadRoot),
    )

    expect(externalFinalization.errors).toEqual([])
    expect(externalFinalization.status).toBe("success")
    expect(externalFinalization.operation_verdict).toBe("APPROVE")
    expect(externalFinalization.artifact_path).toContain(".uf/artifacts/dispatch/")
    // The persisted runs are exactly the returned runs — no transformation.
    expect(externalFinalization.review_dispatch?.payload.runs).toEqual(returnedPayload.runs)
  })

  it("keeps council mixed-severity panel output identical to the severity-derived behavior", async () => {
    // FR-011 non-regression guard (fix-dispatch-verdict-derivation): a
    // council panel where one reviewer documents a HIGH finding (run
    // verdict REQUEST CHANGES) while another submits none (run verdict
    // APPROVE). Council kind is immune to the split-panel defect: the
    // strictest persona vote equals the severity ladder over the union
    // of successful runs' findings, because per-run votes are
    // themselves severity-derived and the ladder is monotone under
    // union. The derivation fix therefore MUST NOT alter this output —
    // the panel keeps the severity-derived REQUEST CHANGES verdict,
    // findings, advisories, and verdict_reason; the TC-001 dual-run
    // against the pre-fix plugin proves the output byte-identical.
    // Distinct personas keep the plan identities unique and the two
    // votes separate in successfulPersonaVotes.
    const projectRoot = join(tmpdir(), `consolidate-council-mixed-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // Default session metadata is the council shape (review-council/code);
    // only the two-entry explicit plan overrides it.
    const guardRunId = randomUUID()
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          run_id: guardRunId,
          findings: [
            {
              severity: "HIGH",
              category: "security",
              description: "Artifact persisted without provenance validation",
              root_cause: "Missing commit equality check before persistence",
              file: "lib/review-dispatch.ts",
              line: 42,
            },
          ],
        }),
        runFixture({ agent: "divisor-adversary" }),
      ],
      { plan: [...explicitRunPlan("divisor-guard"), ...explicitRunPlan("divisor-adversary")] },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/fix-dispatch-verdict-derivation",
          // Provenance commit MUST match input_context.head_sha for non-issue kinds.
          commit: "b".repeat(40),
          workflow_id: "uf.review-council",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // Errors asserted first so a regression surfaces the finalizer's
    // rejection text rather than a bare status mismatch.
    expect(finalizationResult.errors).toEqual([])
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    // The severity-derived verdict is REQUEST CHANGES, unchanged by the
    // vote-based derivation: the strictest persona vote (the
    // HIGH-findings run) equals the severity ladder over the union.
    expect(finalizationResult.operation_verdict).toBe("REQUEST CHANGES")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.workflow_result).toEqual({ kind: "council", value: "REQUEST CHANGES" })
    expect(persistedPayload.verdict).toBe("REQUEST CHANGES")
    // The HIGH finding is consolidated with its contributing run, the
    // verdict_reason stays severity-derived (FR-012), and advisories
    // stay empty because the verdict is REQUEST CHANGES, not
    // APPROVE WITH ADVISORIES.
    expect(persistedPayload.findings).toHaveLength(1)
    expect(persistedPayload.findings[0].severity).toBe("HIGH")
    expect(persistedPayload.findings[0].run_ids).toContain(guardRunId)
    expect(persistedPayload.verdict_reason).toContain("HIGH")
    expect(persistedPayload.advisories).toHaveLength(0)
    // The split survives in the kind-native run verdicts.
    expect(persistedPayload.runs).toHaveLength(2)
    const runVerdicts = new Map<string, string>()
    for (const run of persistedPayload.runs) {
      runVerdicts.set(run.agent, run.workflow_verdict)
    }
    expect(runVerdicts.get("divisor-guard")).toBe("REQUEST CHANGES")
    expect(runVerdicts.get("divisor-adversary")).toBe("APPROVE")
    // The canonical decision records the blocking outcome with both votes.
    expect(finalizationResult.review_verdict.council_decision).toBe("CHANGES_REQUESTED")
    const personaSummaries = finalizationResult.review_verdict.persona_verdicts.map(
      (persona: { summary: string }) => persona.summary,
    )
    expect(personaSummaries).toContain("Native verdict: REQUEST CHANGES")
    expect(personaSummaries).toContain("Native verdict: APPROVE")
  })

  it("finalizes a zero-successful-runs panel as INCONCLUSIVE instead of a value-mismatch rejection", async () => {
    // Task 3.4 regression shape (fix-dispatch-verdict-derivation):
    // every panel run failed before voting — no findings, null run
    // verdicts, plain non-availability error codes. Before the fix the
    // emitter derived the top-level value from the consolidated
    // severity ladder (APPROVE over empty findings) while the finalizer
    // recomputed the zero-success outcome via noSuccessResult
    // (INCONCLUSIVE) — a deterministic, retry-proof value-mismatch
    // rejection. Emission and validation now share
    // calculatedWorkflowValue, so the panel finalizes: with zero
    // successful votes the value is INCONCLUSIVE — the plain error
    // codes are not availability-classified, so noSuccessResult cannot
    // yield UNAVAILABLE — and the verdict is the pass-through
    // back-projection. Both runs carry errors and empty findings so
    // validateRunState's non-success rules hold (failed runs must not
    // vote or emit findings), and distinct personas keep the plan
    // identities unique.
    const projectRoot = join(tmpdir(), `consolidate-council-zero-success-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // Default session metadata is the council shape (review-council/code);
    // only the two-entry explicit plan overrides it.
    const childSessionFailed = {
      code: "child_session_failed",
      message: "Child session exited before producing an assessment.",
      retryable: true,
    }
    const correlationId = await setupDispatchSession(
      [
        runFixture({ agent: "divisor-guard", status: "failed", error: childSessionFailed }),
        runFixture({ agent: "divisor-adversary", status: "failed", error: childSessionFailed }),
      ],
      { plan: [...explicitRunPlan("divisor-guard"), ...explicitRunPlan("divisor-adversary")] },
    )

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(projectRoot))
    const result = await tool.execute(
      {
        provenance: {
          branch: "opsx/fix-dispatch-verdict-derivation",
          // Provenance commit MUST match input_context.head_sha for non-issue kinds.
          commit: "b".repeat(40),
          workflow_id: "uf.review-council",
        },
      },
      noopContext(),
    )

    const finalizationResult = JSON.parse(result.output)
    // Errors asserted first so a regression surfaces the finalizer's
    // rejection text (value mismatch), not just a status mismatch.
    expect(finalizationResult.errors).toEqual([])
    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.correlation_id).toBe(correlationId)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    // Zero successful votes: noSuccessResult decides INCONCLUSIVE and
    // the pass-through back-projection keeps the verdict INCONCLUSIVE.
    expect(finalizationResult.operation_verdict).toBe("INCONCLUSIVE")
    const persistedPayload = finalizationResult.review_dispatch.payload
    expect(persistedPayload.workflow_result).toEqual({ kind: "council", value: "INCONCLUSIVE" })
    expect(persistedPayload.verdict).toBe("INCONCLUSIVE")
    // No findings, no advisories, and the failed runs never voted.
    expect(persistedPayload.findings).toHaveLength(0)
    expect(persistedPayload.advisories).toHaveLength(0)
    expect(persistedPayload.run_counts.total).toBe(2)
    expect(persistedPayload.run_counts.success).toBe(0)
    expect(persistedPayload.run_counts.failed).toBe(2)
    // Design D4 cosmetic quirk: verdict_reason stays severity-derived
    // beside the availability outcome — documented, not a mismatch.
    expect(persistedPayload.verdict_reason).toBe("No findings requiring changes")
    // The failed runs carry null verdicts (they contribute no votes).
    expect(persistedPayload.runs).toHaveLength(2)
    const runVerdicts = new Map<string, string>()
    for (const run of persistedPayload.runs) {
      runVerdicts.set(run.agent, run.workflow_verdict)
    }
    expect(runVerdicts.get("divisor-guard")).toBe(null)
    expect(runVerdicts.get("divisor-adversary")).toBe(null)
    // The canonical decision records the INCONCLUSIVE outcome (the
    // canonical-decision mapping passes availability outcomes through),
    // and no persona verdicts exist because no run succeeded.
    expect(finalizationResult.review_verdict.council_decision).toBe("INCONCLUSIVE")
    expect(finalizationResult.review_verdict.persona_verdicts).toHaveLength(0)
  })

  it("returns finalization payload JSON when provenance is omitted", async () => {
    const correlationId = await setupDispatchSession([
      runFixture({ agent: "divisor-guard" }),
    ])

    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    // No provenance — should return raw payload.
    const result = await tool.execute({}, noopContext())

    const payload = JSON.parse(result.output)
    // When provenance is omitted, we get the raw payload (not a finalization result).
    expect(payload.verdict).toBe("APPROVE")
    expect(payload.correlation_id).toBe(correlationId)
    // Raw payload has no "status" or "artifact_path" fields.
    expect(payload).not.toHaveProperty("status")
    expect(payload).not.toHaveProperty("artifact_path")
  })

  it("returns a triage payload without provenance that finalizes after stripping observability fields", async () => {
    const projectRoot = join(tmpdir(), `consolidate-triage-payload-${randomUUID()}`)
    await mkdir(projectRoot, { recursive: true })
    cleanupDirs.push(projectRoot)

    // No proposals and no failed runs: the returned payload carries no
    // observability data — the warnings key is omitted when empty (PR #776).
    const correlationId = await setupDispatchSession(
      [
        runFixture({
          agent: "divisor-guard",
          findings: [
            { severity: "LOW", category: "clarity", description: "Summary is ambiguous", root_cause: "No reproduction steps", file: null, line: null },
          ],
        }),
      ],
      { ...triageIssueMetadata(), plan: explicitRunPlan("divisor-guard") },
    )

    // No provenance: the tool returns the raw finalization payload.
    const tool = createConsolidateDispatchTool(createFinalizationDependencies(tmpdir()))
    const result = await tool.execute({}, noopContext())

    const returnedPayload = JSON.parse(result.output)
    // Raw payload shape: no finalization-result fields, native run verdicts.
    expect(returnedPayload.correlation_id).toBe(correlationId)
    expect(returnedPayload).not.toHaveProperty("status")
    expect(returnedPayload).not.toHaveProperty("artifact_path")
    expect(returnedPayload.runs).toHaveLength(1)
    expect(returnedPayload.runs[0].workflow_verdict).toBe("NEEDS-CLARIFICATION")
    expect(returnedPayload.workflow_result).toEqual({ kind: "triage", value: "NEEDS-CLARIFICATION" })

    // The result carries the top-level warnings observability field when
    // anything was excluded (RD-FR-025) and may carry proposals; both keys
    // are omitted when empty (PR #776). The finalizer payload schema is
    // strict, so the
    // caller strips those non-payload fields before external finalization
    // (the split the tool description documents); payload content itself is
    // submitted unmodified.
    const payloadForFinalization = { ...returnedPayload }
    delete payloadForFinalization.proposals
    delete payloadForFinalization.warnings

    // Submit the returned payload: structural (strict schema) and semantic
    // validation must both pass with native run verdicts.
    const finalizationResult = await finalizeReviewDispatch(
      {
        payload: payloadForFinalization,
        provenance: {
          branch: "opsx/dispatch-finalize-determinism",
          commit: "c".repeat(40),
          workflow_id: "uf.triage-issue",
        },
      },
      createFinalizationDependencies(projectRoot),
    )

    expect(finalizationResult.status).toBe("success")
    expect(finalizationResult.errors).toHaveLength(0)
    expect(finalizationResult.artifact_path).toContain(".uf/artifacts/dispatch/")
    // The persisted runs are exactly the returned runs — no transformation.
    expect(finalizationResult.review_dispatch?.payload.runs).toEqual(returnedPayload.runs)
  })
})
