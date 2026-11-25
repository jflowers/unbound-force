import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { sanitizeSlug } from "../lib/uf-workflow-types.js"
import {
  createAcquireIntentContextTool,
  detectIntentGroundingTier,
  deriveFeatureDirFromBranch,
  extractIntentCriteria,
  extractOriginatingIssueValue,
  IntentSatisfactionStateSchema,
  parsePrBodyReferences,
  validateIssueReferenceValue,
  type AcquireIntentContextDependencies,
  type AcquireIntentContextResult,
} from "../plugins/review-dispatch/index.js"

// ---------------------------------------------------------------------------
// acquire_intent_context (intent-satisfaction-check task 1.1, RC-FR-010/011,
// designs D2/D3/D6). Every test runs network-free (Principle IV): the gh
// fetcher, branch resolver, and file reader are injected fakes, and the
// acquisition chain — resolve, fetch, extract, tier, forward — is pinned
// end to end through the tool's execute path.
// ---------------------------------------------------------------------------

const PROJECT_ROOT = "/repo"

type ToolInput = { pr_body?: string; repo?: string }

interface ToolFixtureOptions {
  readonly branch?: string | Error
  readonly files?: Readonly<Record<string, string>>
  readonly gh?: string | Error
}

interface ToolFixture {
  readonly tool: ReturnType<typeof createAcquireIntentContextTool>
  readonly ghCalls: number[]
}

/** A label in the object form real `gh issue view --json labels` emits. */
interface GhObjectLabel {
  readonly name: string
  readonly color?: string
  readonly description?: string
}

function defaultIssueJson(overrides?: {
  number?: number
  title?: string
  body?: string | null
  labels?: ReadonlyArray<string | GhObjectLabel>
  /** Verbatim label array bypassing the label typing — malformed-payload fixtures. */
  rawLabels?: unknown
}): string {
  return JSON.stringify({
    number: overrides?.number ?? 42,
    title: overrides?.title ?? "Add auth endpoint",
    body:
      overrides?.body === undefined
        ? "## Acceptance Criteria\n- [ ] The API returns 201\n- [ ] Errors are typed"
        : overrides.body,
    labels: overrides?.rawLabels !== undefined ? overrides.rawLabels : (overrides?.labels ?? []),
  })
}

function makeTool(options: ToolFixtureOptions = {}): ToolFixture {
  const ghCalls: number[] = []
  const files = new Map<string, string>(Object.entries(options.files ?? {}))
  const dependencies: AcquireIntentContextDependencies = {
    projectRoot: PROJECT_ROOT,
    currentBranch: async (): Promise<string> => {
      if (options.branch instanceof Error) throw options.branch
      return options.branch ?? "opsx/feature"
    },
    fetchIssue: async (issueNumber: number): Promise<string> => {
      ghCalls.push(issueNumber)
      if (options.gh instanceof Error) throw options.gh
      return options.gh ?? defaultIssueJson({ number: issueNumber })
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

async function run(
  tool: ToolFixture["tool"],
  args: ToolInput = {},
): Promise<AcquireIntentContextResult> {
  const result = await tool.execute(args)
  return JSON.parse(result.output) as AcquireIntentContextResult
}

function statePath(branch: string): string {
  return resolve(PROJECT_ROOT, `.uf/progress/${sanitizeSlug(branch)}/uf.unleash.json`)
}

function checkpointState(issueNumber: unknown): string {
  return JSON.stringify({
    completed_steps: ["tier-routing"],
    data: { issue_number: issueNumber },
  })
}

describe("acquire_intent_context resolution chain", () => {
  it("should resolve from the PR body first when it carries an in-scope reference", async () => {
    const fixture = makeTool({
      files: {
        [statePath("opsx/feature")]: checkpointState(7),
        [resolve(PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")]:
          "originating_issue: 563\n",
      },
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.issue_number).toBe(42)
    expect(result.intent_satisfaction.resolution_source).toBe("pr-body")
    expect(fixture.ghCalls).toEqual([42])
  })

  it("should resolve from tier-routing checkpoint state when no PR body is provided", async () => {
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState(7) },
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.issue_number).toBe(7)
    expect(result.intent_satisfaction.resolution_source).toBe("tier-routing-checkpoint")
  })

  it("should accept a digits-only string issue_number from checkpoint state", async () => {
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState("7") },
    })
    const result = await run(fixture.tool)
    expect(result.intent_satisfaction.issue_number).toBe(7)
    expect(result.intent_satisfaction.resolution_source).toBe("tier-routing-checkpoint")
  })

  it("should resolve from the change's .openspec.yaml when checkpoint state is absent", async () => {
    const fixture = makeTool({
      files: {
        [resolve(PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")]:
          "originating_issue: 563\n",
      },
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.issue_number).toBe(563)
    expect(result.intent_satisfaction.resolution_source).toBe("openspec-yaml")
  })

  it("should prefer the change's .openspec.yaml over the repo root", async () => {
    const fixture = makeTool({
      files: {
        [resolve(PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")]:
          "originating_issue: 563\n",
        [resolve(PROJECT_ROOT, ".openspec.yaml")]: "originating_issue: 999\n",
      },
    })
    const result = await run(fixture.tool)
    expect(result.intent_satisfaction.issue_number).toBe(563)
  })

  it("should fall back to the repo-root .openspec.yaml when the change has none", async () => {
    const fixture = makeTool({
      files: { [resolve(PROJECT_ROOT, ".openspec.yaml")]: "originating_issue: 999\n" },
    })
    const result = await run(fixture.tool)
    expect(result.intent_satisfaction.issue_number).toBe(999)
    expect(result.intent_satisfaction.resolution_source).toBe("openspec-yaml")
  })

  it("should reject a non-digits checkpoint issue_number and fall through to .openspec.yaml", async () => {
    const fixture = makeTool({
      files: {
        [statePath("opsx/feature")]: checkpointState("12a"),
        [resolve(PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")]:
          "originating_issue: 563\n",
      },
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.issue_number).toBe(563)
    expect(fixture.ghCalls).toEqual([563])
    const checkpointEntry = result.resolution_trace.find(
      (entry) => entry.source === "tier-routing-checkpoint",
    )
    expect(checkpointEntry?.outcome).toBe("rejected")
    expect(checkpointEntry?.detail).toContain("not digits-only")
  })

  it("should reject a non-positive checkpoint issue_number without fetching it", async () => {
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState(0) },
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("skipped")
    expect(fixture.ghCalls).toEqual([])
    const checkpointEntry = result.resolution_trace.find(
      (entry) => entry.source === "tier-routing-checkpoint",
    )
    expect(checkpointEntry?.outcome).toBe("rejected")
  })

  it("should reject a non-digits originating_issue value with the reason recorded", async () => {
    const fixture = makeTool({
      files: {
        [resolve(PROJECT_ROOT, "openspec/changes/feature/.openspec.yaml")]:
          "originating_issue: '563'\n",
      },
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("skipped")
    const yamlEntry = result.resolution_trace.find((entry) => entry.source === "openspec-yaml")
    expect(yamlEntry?.outcome).toBe("rejected")
    expect(yamlEntry?.detail).toContain("not digits-only")
  })

  it("should skip with an informational note when no source resolves", async () => {
    const fixture = makeTool()
    const result = await run(fixture.tool)
    expect(result.status).toBe("skipped")
    expect(result.intent_satisfaction.skip_unavailable?.state).toBe("skipped")
    expect(result.intent_satisfaction.skip_unavailable?.reason).toContain("pr-body")
    expect(result.intent_satisfaction.skip_unavailable?.reason).toContain("tier-routing-checkpoint")
    expect(result.intent_satisfaction.skip_unavailable?.reason).toContain("openspec-yaml")
    expect(fixture.ghCalls).toEqual([])
  })

  it("should degrade to unavailable with the failure reason when the fetch fails", async () => {
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState(7) },
      gh: new Error("gh: command not found"),
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("unavailable")
    expect(result.intent_satisfaction.skip_unavailable?.state).toBe("unavailable")
    expect(result.intent_satisfaction.skip_unavailable?.reason).toContain("gh: command not found")
  })

  it("should degrade to unavailable when gh returns a malformed payload", async () => {
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState(7) },
      gh: "not json",
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("unavailable")
    expect(result.intent_satisfaction.skip_unavailable?.reason).toContain("malformed")
  })

  it("should degrade to unavailable when gh labels are neither strings nor {name} objects", async () => {
    // Design D6: labels that are neither strings nor {name} objects make
    // the whole payload malformed, so the acquisition degrades to
    // unavailable instead of trusting a partial payload.
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState(7) },
      gh: defaultIssueJson({ rawLabels: [42, { title: "not a name" }] }),
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("unavailable")
    expect(result.intent_satisfaction.skip_unavailable?.state).toBe("unavailable")
    expect(result.intent_satisfaction.skip_unavailable?.reason).toContain("malformed")
  })
})

describe("acquire_intent_context PR-body validation", () => {
  it("should record reference_count and context-only references for multiple in-scope references", async () => {
    const fixture = makeTool()
    const result = await run(fixture.tool, { pr_body: "Fixes #42 and Closes #43" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.issue_number).toBe(42)
    expect(result.intent_satisfaction.reference_count).toBe(2)
    const prBodyEntry = result.resolution_trace.find((entry) => entry.source === "pr-body")
    expect(prBodyEntry?.detail).toContain("#43")
    expect(prBodyEntry?.detail).toContain("context only")
  })

  it("should resolve a same-repo URL reference", async () => {
    const fixture = makeTool()
    const result = await run(fixture.tool, {
      pr_body: "Fixes https://github.com/owner/repo/issues/42",
      repo: "owner/repo",
    })
    expect(result.intent_satisfaction.issue_number).toBe(42)
    expect(result.intent_satisfaction.resolution_source).toBe("pr-body")
  })

  it("should not resolve cross-repo URL references", async () => {
    const fixture = makeTool()
    const result = await run(fixture.tool, {
      pr_body: "Fixes https://github.com/other/repo/issues/9 then Closes #42",
      repo: "owner/repo",
    })
    expect(result.intent_satisfaction.issue_number).toBe(42)
    const prBodyEntry = result.resolution_trace.find((entry) => entry.source === "pr-body")
    expect(prBodyEntry?.detail).toContain("cross-repo")
  })

  it("should treat URL references as out of scope when no repo slug is provided", async () => {
    const fixture = makeTool({
      files: { [statePath("opsx/feature")]: checkpointState(7) },
    })
    const result = await run(fixture.tool, {
      pr_body: "Fixes https://github.com/owner/repo/issues/42",
    })
    expect(result.intent_satisfaction.issue_number).toBe(7)
    expect(result.intent_satisfaction.resolution_source).toBe("tier-routing-checkpoint")
  })

  it("should return an api_error envelope for invalid input", async () => {
    const fixture = makeTool()
    const result = await fixture.tool.execute({ nope: true } as unknown as ToolInput)
    const parsed = JSON.parse(result.output) as { error: boolean; code: string }
    expect(parsed.error).toBe(true)
    expect(parsed.code).toBe("api_error")
  })
})

describe("acquire_intent_context grounding and extraction", () => {
  it("should construct strict with checkbox criteria when the issue carries an intake-kit label", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({
        labels: ["intake-kit"],
        body: "- [ ] The API returns 201\n- [ ] Errors are typed",
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.intent_satisfaction.grounding_tier).toBe("strict")
    expect(result.intent_satisfaction.criteria?.map((criterion) => criterion.origin)).toEqual([
      "checkbox",
      "checkbox",
    ])
  })

  it("should construct strict from an intake-kit label in the object form real gh emits", async () => {
    // `gh issue view --json labels` emits [{name, color, description}]
    // objects, not bare strings — pin the object-form branch (design D6)
    // so a regression cannot degrade real-world labeled issues to
    // unavailable, or silently downgrade intake-kit strict grounding to
    // best-effort by dropping the labels.
    const fixture = makeTool({
      gh: defaultIssueJson({
        labels: [
          { name: "needs-triage", color: "d73a4a", description: "Awaiting triage" },
          { name: "intake-kit", color: "006b75", description: "Criteria seeded by the intake kit" },
        ],
        body: "- [ ] The API returns 201\n- [ ] Errors are typed",
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.grounding_tier).toBe("strict")
    expect(result.intent_satisfaction.criteria?.map((criterion) => criterion.origin)).toEqual([
      "checkbox",
      "checkbox",
    ])
  })

  it("should construct best-effort from object-form labels without an intake-kit name", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({
        labels: [{ name: "bug", color: "d73a4a", description: "Something is broken" }],
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    // The object form must parse (resolved, not unavailable) while the
    // labels carry no provenance signal — best-effort.
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.grounding_tier).toBe("best-effort")
  })

  it("should construct strict when the criteria heading carries [intake-kit]", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({
        body: "## Acceptance Criteria [intake-kit]\nThe API returns 201\nErrors are typed\n\n## Notes\nOther text",
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.intent_satisfaction.grounding_tier).toBe("strict")
    expect(result.intent_satisfaction.criteria?.map((criterion) => criterion.origin)).toEqual([
      "intake-kit-criteria",
      "intake-kit-criteria",
    ])
  })

  it("should construct best-effort for Given/When/Then checkboxes without a provenance signal", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({
        body: "- [ ] GIVEN the auth endpoint\n- [ ] WHEN a valid token is posted\n- [ ] THEN the API returns 201",
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.intent_satisfaction.grounding_tier).toBe("best-effort")
    expect(result.intent_satisfaction.criteria).toHaveLength(3)
  })

  it("should construct best-effort general intent for a free-form issue", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({ body: "We should really make auth work better." }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.intent_satisfaction.grounding_tier).toBe("best-effort")
    expect(result.intent_satisfaction.general_intent?.title).toBe("Add auth endpoint")
    expect(result.intent_satisfaction.general_intent?.body_summary).toContain("auth")
    expect(result.intent_satisfaction.criteria).toBeUndefined()
  })

  it("should construct strict general intent for an intake-kit-labeled free-form issue", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({
        labels: ["needs-triage", "Intake-Kit"],
        body: "Make auth work.",
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.intent_satisfaction.grounding_tier).toBe("strict")
    expect(result.intent_satisfaction.general_intent).toBeDefined()
  })

  it("should count a checkbox inside an Acceptance Criteria section once, as checkbox origin", async () => {
    const fixture = makeTool({
      gh: defaultIssueJson({
        body: "## Acceptance Criteria\n- [ ] The API returns 201\nErrors are typed\n\n## Implementation\nLater prose outside the section",
      }),
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    const criteria = result.intent_satisfaction.criteria ?? []
    expect(criteria).toHaveLength(2)
    expect(criteria[0]).toEqual({ text: "The API returns 201", origin: "checkbox" })
    expect(criteria[1]).toEqual({ text: "Errors are typed", origin: "acceptance-criteria" })
  })

  it("should bound each criterion to 2000 characters and the total to 8192", async () => {
    const body = Array.from(
      { length: 5 },
      (_, index) => `- [ ] ${String.fromCharCode(97 + index).repeat(3000)}`,
    ).join("\n")
    const fixture = makeTool({ gh: defaultIssueJson({ body }) })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    const criteria = result.intent_satisfaction.criteria ?? []
    expect(criteria).toHaveLength(5)
    expect(criteria.slice(0, 4).every((criterion) => criterion.text.length === 2000)).toBe(true)
    expect(criteria[4]?.text.length).toBe(192)
    const total = criteria.reduce((sum, criterion) => sum + criterion.text.length, 0)
    expect(total).toBe(8192)
  })

  it("should use a documented body summary when the issue has no body", async () => {
    const fixture = makeTool({ gh: defaultIssueJson({ body: null }) })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.intent_satisfaction.general_intent?.body_summary).toContain("no issue body")
  })

  it("should return intent_satisfaction that validates against IntentSatisfactionStateSchema", async () => {
    const fixture = makeTool()
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    const check = IntentSatisfactionStateSchema.safeParse(result.intent_satisfaction)
    expect(check.success).toBe(true)
  })
})

describe("acquire_intent_context pure helpers", () => {
  it("deriveFeatureDirFromBranch maps branch tiers and rejects traversal segments", () => {
    expect(deriveFeatureDirFromBranch("opsx/feature")).toBe("openspec/changes/feature/")
    expect(deriveFeatureDirFromBranch("018-name")).toBe("specs/018-name/")
    expect(deriveFeatureDirFromBranch("speckit/018-name")).toBe("specs/018-name/")
    expect(deriveFeatureDirFromBranch("quick/foo")).toBeNull()
    expect(deriveFeatureDirFromBranch("main")).toBeNull()
    expect(deriveFeatureDirFromBranch("opsx/../../etc")).toBeNull()
    expect(deriveFeatureDirFromBranch("opsx/feature/../../escape")).toBeNull()
  })

  it("should resolve through the repo-root fallback when the branch derives no feature dir", async () => {
    const fixture = makeTool({
      branch: "opsx/../../etc",
      files: { [resolve(PROJECT_ROOT, ".openspec.yaml")]: "originating_issue: 999\n" },
    })
    const result = await run(fixture.tool)
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.issue_number).toBe(999)
  })

  it("parsePrBodyReferences is stateless across invocations", () => {
    const first = parsePrBodyReferences("Fixes #1 Closes #2")
    const second = parsePrBodyReferences("Resolves #3")
    expect(first.map((reference) => reference.number)).toEqual([1, 2])
    expect(second.map((reference) => reference.number)).toEqual([3])
  })

  it("detectIntentGroundingTier keys on provenance signals only", () => {
    expect(detectIntentGroundingTier(["intake-kit"], false)).toBe("strict")
    expect(detectIntentGroundingTier(["Intake-Kit"], false)).toBe("strict")
    expect(detectIntentGroundingTier([], true)).toBe("strict")
    expect(detectIntentGroundingTier(["bug"], false)).toBe("best-effort")
  })

  it("validateIssueReferenceValue accepts digits and positive integers, rejects the rest", () => {
    expect(validateIssueReferenceValue(563)).toEqual({ valid: true, number: 563 })
    expect(validateIssueReferenceValue("563")).toEqual({ valid: true, number: 563 })
    expect(validateIssueReferenceValue("12a").valid).toBe(false)
    expect(validateIssueReferenceValue(0).valid).toBe(false)
    expect(validateIssueReferenceValue(-1).valid).toBe(false)
    expect(validateIssueReferenceValue(1.5).valid).toBe(false)
    expect(validateIssueReferenceValue(null).valid).toBe(false)
  })

  it("extractOriginatingIssueValue returns the raw value for validation", () => {
    expect(extractOriginatingIssueValue("schema: unbound-force\noriginating_issue: 563\n")).toBe(
      "563",
    )
    expect(extractOriginatingIssueValue("schema: unbound-force\n")).toBeNull()
  })

  it("extractIntentCriteria stops at a same-level heading and skips empty checkboxes", () => {
    const extraction = extractIntentCriteria(
      "intro\n\n## Acceptance Criteria\n- [ ]\nreal criterion\n### deeper heading\ntext under deeper\n## Next Section\nnot included",
    )
    expect(extraction.criteria).toEqual([
      { text: "real criterion", origin: "acceptance-criteria" },
      { text: "text under deeper", origin: "acceptance-criteria" },
    ])
    expect(extraction.intakeKitHeading).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Disposition read-back (RC-FR-014, review findings F4/F10/F14): a resolved
// acquisition reads the branch-scoped human-decision record
// (.uf/progress/<slug>/human-decisions.json) back for the resolved issue and
// carries the selected dispositions on the state — absent → [], malformed →
// [] plus dispositions_unavailable, so the read-back's outcome is
// unambiguous downstream.
// ---------------------------------------------------------------------------

function decisionsPath(branch: string): string {
  return resolve(PROJECT_ROOT, `.uf/progress/${sanitizeSlug(branch)}/human-decisions.json`)
}

function decisionEntry(overrides?: {
  readonly decision_id?: string
  readonly question?: string
  readonly answer?: string
}): Record<string, unknown> {
  return {
    decision_id: overrides?.decision_id ?? "123e4567-e89b-42d3-a456-426614174000",
    source: "question-tool",
    question:
      overrides?.question ?? "Override the intent-deviation finding for issue #42, criterion 3?",
    answer: overrides?.answer ?? "Yes — the criterion is invalidated by the API change; amend the issue.",
    recorded_at: "2026-11-24T12:00:00.000Z",
  }
}

describe("acquire_intent_context disposition read-back", () => {
  it("should carry an empty disposition list when the human-decision record is absent", async () => {
    const result = await run(makeTool().tool, { pr_body: "Fixes #42" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.recorded_dispositions).toEqual([])
    expect(result.intent_satisfaction.dispositions_unavailable).toBeUndefined()
  })

  it("should select the recorded dispositions for the resolved issue from the branch record", async () => {
    const fixture = makeTool({
      files: {
        [decisionsPath("opsx/feature")]: JSON.stringify([
          decisionEntry(),
          decisionEntry({
            decision_id: "223e4567-e89b-42d3-a456-426614174001",
            // Another issue's disposition: marker present, references #99.
            question: "Override the intent-deviation finding for issue #99?",
            answer: "No.",
          }),
          decisionEntry({
            decision_id: "323e4567-e89b-42d3-a456-426614174002",
            // No marker: an unrelated gate decision, never selected.
            question: "Skip the coverage gate for this branch?",
            answer: "No.",
          }),
        ]),
      },
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.recorded_dispositions).toEqual([
      {
        decision_id: "123e4567-e89b-42d3-a456-426614174000",
        question: "Override the intent-deviation finding for issue #42, criterion 3?",
        answer: "Yes — the criterion is invalidated by the API change; amend the issue.",
        recorded_at: "2026-11-24T12:00:00.000Z",
      },
    ])
    expect(result.intent_satisfaction.dispositions_unavailable).toBeUndefined()
  })

  it("should record why a malformed human-decision record could not be read", async () => {
    const fixture = makeTool({
      files: { [decisionsPath("opsx/feature")]: "{not json" },
    })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.recorded_dispositions).toEqual([])
    expect(result.intent_satisfaction.dispositions_unavailable).toContain(
      ".uf/progress/opsx-feature/human-decisions.json is malformed",
    )
  })

  it("should still resolve the reference while recording the branch-resolution read-back failure", async () => {
    // The PR body resolves the issue, so the fetch proceeds; the failed
    // branch resolution degrades the disposition read-back with the
    // recorded reason (design D6 — never an error).
    const fixture = makeTool({ branch: new Error("no git") })
    const result = await run(fixture.tool, { pr_body: "Fixes #42" })
    expect(result.status).toBe("resolved")
    expect(result.intent_satisfaction.recorded_dispositions).toEqual([])
    expect(result.intent_satisfaction.dispositions_unavailable).toContain(
      "branch resolution failed",
    )
  })
})
