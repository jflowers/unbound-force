import { lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolFailure, ToolResult } from "../lib/uf-workflow-types.js"
import {
  createUnleashRouteDecisionTool,
  type FileExists,
  type GitExec,
  type ProgressState,
  type UnleashRouteDecisionData,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The decision's auto-checkpoint (D5) persists through readState/writeState,
// which hit node:fs directly. Mocking the functions that path uses (the
// unleash-branch-gate.test.ts recipe) keeps every route test off the real
// filesystem: state I/O is observed through the recorded calls instead of
// performed.
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

/** Rubric rationale recorded alongside every decision in these tests. */
const RATIONALE = "Single-file fix with an obvious implementation; no spec artifacts needed."

/** Change description that drove the routing decision. */
const DESCRIPTION = "Fix the typo in the install instructions."

/** Node-shaped ENOENT error so state readers treat a path as absent. */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

/** Invoke the route decision tool and parse its JSON output. */
async function invokeRouteDecision(
  exec: GitExec,
  args: Record<string, unknown>,
  existsFile: FileExists = () => true,
): Promise<ToolResult<UnleashRouteDecisionData>> {
  const route = createUnleashRouteDecisionTool(exec, FAKE_CWD, existsFile)
  const result = await (
    route as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string },
      ) => Promise<{ output: string }>
    }
  ).execute(args, { sessionID: "test-session" })
  return JSON.parse(result.output) as ToolResult<UnleashRouteDecisionData>
}

/** Assert an ok envelope and return its data payload (narrowing helper). */
function okData(result: ToolResult<UnleashRouteDecisionData>): UnleashRouteDecisionData {
  expect(result.status).toBe("ok")
  if (result.status !== "ok") {
    throw new Error(`expected ok envelope, received ${JSON.stringify(result)}`)
  }
  return result.data as UnleashRouteDecisionData
}

/** Assert an error envelope and return it (narrowing helper). */
function errorEnvelope(result: ToolResult<UnleashRouteDecisionData>): ToolFailure {
  expect(result.status).toBe("error")
  if (result.status !== "error") {
    throw new Error(`expected error envelope, received ${JSON.stringify(result)}`)
  }
  return result
}

interface FakeRouteGitOptions {
  /** Branch reported before any checkout (default "main"). */
  readonly branch?: string
  /** `git status --porcelain` output. */
  readonly porcelain?: string
  /** Error thrown by `checkout -b` (simulated branch-creation failure). */
  readonly checkoutError?: Error
}

/**
 * Fake GitExec covering every command the tool issues: the branch reads
 * (rev-parse --abbrev-ref HEAD), the dirty-tree guard (status --porcelain),
 * and quick-tier branch creation (checkout -b). The fake is stateful — a
 * successful checkout switches the branch that subsequent rev-parse calls
 * report, mirroring the read-back the tool performs to anchor its
 * checkpoint. Every call is recorded.
 */
function fakeRouteGit(options: FakeRouteGitOptions = {}): {
  exec: GitExec
  calls: Array<{ args: string[]; cwd: string }>
} {
  let currentBranch = options.branch ?? "main"
  const calls: Array<{ args: string[]; cwd: string }> = []
  const exec: GitExec = (args: string[], cwd: string) => {
    calls.push({ args, cwd })
    const joined = args.join(" ")
    if (joined === "rev-parse --abbrev-ref HEAD") return currentBranch
    if (joined === "status --porcelain") return options.porcelain ?? ""
    if (args[0] === "checkout" && args[1] === "-b") {
      if (options.checkoutError) throw options.checkoutError
      currentBranch = args[2] ?? ""
      return ""
    }
    throw new Error(`unexpected git command: ${joined}`)
  }
  return { exec, calls }
}

/** Flatten recorded git calls to joined command strings. */
function gitCommands(calls: ReadonlyArray<{ args: string[] }>): string[] {
  return calls.map((call) => call.args.join(" "))
}

/** Progress-state file path for a command key (slug-sanitized branch). */
function stateFilePath(key: string): string {
  return resolve(FAKE_CWD, ".uf/progress", key, "uf.unleash.json")
}

/** Every ProgressState written through the mocked writeFileSync surface. */
function writtenStates(): ProgressState[] {
  return vi.mocked(writeFileSync).mock.calls.map((call) => JSON.parse(String(call[1])) as ProgressState)
}

beforeEach(() => {
  vi.resetAllMocks()
  // Default state-store simulation: no prior state file or directory, so
  // readState returns null (first checkpoint) and writeState takes the
  // create-directory branch.
  vi.mocked(lstatSync).mockImplementation(() => {
    throw enoent("lstat state path")
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — quick tier success
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision success (quick tier)", () => {
  it("creates and switches to the quick branch from main, then checkpoints under the new key", async () => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
    })

    expect(okData(result)).toStrictEqual({
      tier: "quick",
      change_name: "fix-typo",
      branch: "quick/fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
      issue_number: null,
    })

    // Branch read, dirty-tree guard, branch creation, then the read-back
    // that anchors the checkpoint on the new branch — in that order.
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "status --porcelain",
      "checkout -b quick/fix-typo",
      "rev-parse --abbrev-ref HEAD",
    ])

    // D5: the checkpoint lands under the NEW branch key (post-switch), so
    // quick resumability sees the decision on quick/fix-typo, not on main.
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [statePathArg, stateRaw, writeOptions] = vi.mocked(writeFileSync).mock.calls[0]
    expect(statePathArg).toBe(stateFilePath("quick-fix-typo"))
    expect(writeOptions).toMatchObject({ mode: 0o600 })
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.command).toBe("uf.unleash")
    expect(state.key).toBe("quick-fix-typo")
    expect(state.current_step).toBe("tier-routing")
    expect(state.completed_steps).toEqual(["tier-routing"])
    expect(state.data).toEqual({
      tier: "quick",
      change_name: "fix-typo",
      description: DESCRIPTION,
      rationale: RATIONALE,
    })
  })

  it("routes from an unrecognized branch the same way (branchType other)", async () => {
    const { exec, calls } = fakeRouteGit({ branch: "feature/foo" })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
    })

    const data = okData(result)
    expect(data.branch).toBe("quick/fix-typo")
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "status --porcelain",
      "checkout -b quick/fix-typo",
      "rev-parse --abbrev-ref HEAD",
    ])
    expect(writtenStates()).toHaveLength(1)
    expect(vi.mocked(writeFileSync).mock.calls[0][0]).toBe(stateFilePath("quick-fix-typo"))
  })

  it("threads the resolved issue number into the decision and the checkpoint", async () => {
    const { exec } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
      issue_number: 42,
    })

    // The issue number travels with the decision so /uf.finale can
    // reference (and close) the issue from the final summary.
    expect(okData(result).issue_number).toBe(42)
    const states = writtenStates()
    expect(states).toHaveLength(1)
    expect(states[0]?.data).toEqual({
      tier: "quick",
      change_name: "fix-typo",
      description: DESCRIPTION,
      issue_number: 42,
      rationale: RATIONALE,
    })
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — speckit and openspec success
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision success (speckit and openspec tiers)", () => {
  it.each(["speckit", "openspec"] as const)(
    "records the %s decision without creating a branch (the entry command owns it)",
    async (tier) => {
      const { exec, calls } = fakeRouteGit({ branch: "main" })

      const result = await invokeRouteDecision(exec, {
        tier,
        change_name: "add-search",
        rationale: "Focused feature touching two stories — tactical spec territory.",
        description: "Add search to the docs site.",
      })

      expect(okData(result)).toStrictEqual({
        tier,
        change_name: "add-search",
        branch: "main",
        rationale: "Focused feature touching two stories — tactical spec territory.",
        description: "Add search to the docs site.",
        issue_number: null,
      })

      // D5: /speckit.specify assigns the NNN prefix and /opsx-propose runs
      // its own checkout — the decision never creates a branch for these
      // tiers, only the branch read and the dirty-tree guard.
      expect(gitCommands(calls)).toEqual([
        "rev-parse --abbrev-ref HEAD",
        "status --porcelain",
      ])

      // The checkpoint stays under the current branch key ("main") until
      // the entry command switches branches.
      expect(writtenStates()).toHaveLength(1)
      expect(vi.mocked(writeFileSync).mock.calls[0][0]).toBe(stateFilePath("main"))
      const state = writtenStates()[0] as ProgressState
      expect(state.current_step).toBe("tier-routing")
      expect(state.data).toEqual({
        tier,
        change_name: "add-search",
        description: "Add search to the docs site.",
        rationale: "Focused feature touching two stories — tactical spec territory.",
      })
    },
  )
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — tier entry-command validation
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision tier entry-command validation (unleash-pipeline-hardening)", () => {
  it("rejects a tier whose entry command is not scaffolded, naming the available tiers", async () => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })
    // speckit.specify.md missing, opsx-propose.md present.
    const existsFile: FileExists = (path) => !path.endsWith("speckit.specify.md")

    const result = await invokeRouteDecision(
      exec,
      {
        tier: "speckit",
        change_name: "add-search",
        rationale: "Focused feature touching two stories — tactical spec territory.",
        description: "Add search to the docs site.",
      },
      existsFile,
    )

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("ROUTE_TIER_TOOLING")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toContain(".opencode/commands/speckit.specify.md")
    expect(envelope.message).toContain("openspec (.opencode/commands/opsx-propose.md)")

    // Rejected after the branch read and the dirty-tree guard — before any
    // branch creation or state write.
    expect(gitCommands(calls)).toEqual(["rev-parse --abbrev-ref HEAD", "status --porcelain"])
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it("reports that no other tier is available when no entry commands exist", async () => {
    const { exec } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(
      exec,
      {
        tier: "openspec",
        change_name: "add-search",
        rationale: RATIONALE,
        description: DESCRIPTION,
      },
      () => false,
    )

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("ROUTE_TIER_TOOLING")
    expect(envelope.message).toContain("No other tier's entry commands exist")
  })

  it("skips the check for the quick tier (no entry commands)", async () => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(
      exec,
      {
        tier: "quick",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
      },
      () => false,
    )

    expect(okData(result).branch).toBe("quick/fix-typo")
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "status --porcelain",
      "checkout -b quick/fix-typo",
      "rev-parse --abbrev-ref HEAD",
    ])
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — guard failures
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision guard failures", () => {
  it.each([
    ["opsx/unleash-deterministic-tools", "OpenSpec"],
    ["018-unleash-command", "Speckit"],
    ["quick/fix-typo", "quick"],
  ])(
    "rejects routing on the %s branch with ROUTE_ON_TIER_BRANCH (committed intent)",
    async (branch, tierLabel) => {
      const { exec, calls } = fakeRouteGit({ branch })

      const result = await invokeRouteDecision(exec, {
        tier: "openspec",
        change_name: "some-change",
        rationale: RATIONALE,
        description: DESCRIPTION,
      })

      // D3: a tier-named branch is committed intent — routing on it would
      // mask that intent behind a different workflow.
      const envelope = errorEnvelope(result)
      expect(envelope.code).toBe("ROUTE_ON_TIER_BRANCH")
      expect(envelope.retryable).toBe(false)
      expect(envelope.message).toBe(
        `Cannot route a new change on branch \`${branch}\` — the branch name already commits to the ${tierLabel} workflow. Continue the existing pipeline instead.`,
      )

      // Rejected after the single branch read — before the dirty-tree
      // guard, any branch creation, or any state write.
      expect(gitCommands(calls)).toEqual(["rev-parse --abbrev-ref HEAD"])
      expect(writeFileSync).not.toHaveBeenCalled()
    },
  )

  it("rejects a dirty working tree with DIRTY_TREE before creating any branch", async () => {
    // Untracked files count — routing must not fold them into a new change.
    const { exec, calls } = fakeRouteGit({ branch: "main", porcelain: "?? untracked.txt" })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("DIRTY_TREE")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toBe(
      "Working tree is not clean. Commit or stash your changes before starting a new change — tier routing must not sweep uncommitted work into it.",
    )

    // Deterministic Execution: a rejected decision leaves the repository
    // untouched — branch read and status probe only, no checkout, no state.
    expect(gitCommands(calls)).toEqual(["rev-parse --abbrev-ref HEAD", "status --porcelain"])
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — input validation
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision input validation", () => {
  it.each([
    [
      "quick tier with a non-slug change name",
      { tier: "quick", change_name: "Fix Typo", rationale: RATIONALE, description: DESCRIPTION },
      "kebab-case",
    ],
    [
      "quick tier with a leading hyphen in the change name",
      { tier: "quick", change_name: "-fix", rationale: RATIONALE, description: DESCRIPTION },
      "kebab-case",
    ],
    [
      "quick tier with a trailing hyphen in the change name",
      { tier: "quick", change_name: "fix-", rationale: RATIONALE, description: DESCRIPTION },
      "kebab-case",
    ],
    [
      "quick tier with consecutive hyphens in the change name",
      { tier: "quick", change_name: "fix--typo", rationale: RATIONALE, description: DESCRIPTION },
      "kebab-case",
    ],
    [
      "change name over the 128-character bound",
      {
        tier: "quick",
        change_name: "a".repeat(129),
        rationale: RATIONALE,
        description: DESCRIPTION,
      },
      "change_name",
    ],
    [
      "unknown tier",
      { tier: "enterprise", change_name: "fix-typo", rationale: RATIONALE, description: DESCRIPTION },
      "tier",
    ],
    [
      "empty rationale",
      { tier: "quick", change_name: "fix-typo", rationale: "", description: DESCRIPTION },
      "rationale",
    ],
    [
      "missing description",
      { tier: "quick", change_name: "fix-typo", rationale: RATIONALE },
      "description",
    ],
    [
      "non-positive issue number",
      {
        tier: "quick",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
        issue_number: 0,
      },
      "issue_number",
    ],
    [
      "risk_signals over the 32-entry bound",
      {
        tier: "openspec",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
        risk_signals: Array.from({ length: 33 }, (_value, index) => `signal-${index}`),
      },
      "risk_signals",
    ],
    [
      "risk_signals entry over the 128-character bound",
      {
        tier: "openspec",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
        risk_signals: ["x".repeat(129)],
      },
      "risk_signals",
    ],
    [
      "unknown input key (strict schema)",
      {
        tier: "quick",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
        extra: "not part of the contract",
      },
      "extra",
    ],
  ])("rejects %s with INVALID_INPUT before any git call", async (_description, args, messagePart) => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(exec, args)

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("INVALID_INPUT")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toContain(messagePart)
    // Rejected at the schema boundary — the git executor never runs.
    expect(calls).toEqual([])
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  // The bounds are inclusive: a value exactly at the cap parses, routes,
  // and checkpoints — only values beyond it are rejected by the table
  // above. The risk-signal bounds pair with the openspec tier because a
  // quick decision carrying any signal is a ROUTE_RISK_FLOOR rejection,
  // not a schema question.
  it.each([
    [
      "a max-length (128-character) quick-tier slug",
      {
        tier: "quick",
        change_name: "a".repeat(128),
        rationale: RATIONALE,
        description: DESCRIPTION,
      },
      `quick/${"a".repeat(128)}`,
    ],
    [
      "risk_signals at the 32-entry bound",
      {
        tier: "openspec",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
        risk_signals: Array.from({ length: 32 }, (_value, index) => `signal-${index}`),
      },
      "main",
    ],
    [
      "a max-length (128-character) risk_signals entry",
      {
        tier: "openspec",
        change_name: "fix-typo",
        rationale: RATIONALE,
        description: DESCRIPTION,
        risk_signals: ["x".repeat(128)],
      },
      "main",
    ],
  ])("accepts %s (the bound is inclusive)", async (_description, args, expectedBranch) => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(exec, args)

    const data = okData(result)
    expect(data.branch).toBe(expectedBranch)
    expect(gitCommands(calls)).toEqual(
      expectedBranch === "main"
        ? ["rev-parse --abbrev-ref HEAD", "status --porcelain"]
        : [
            "rev-parse --abbrev-ref HEAD",
            "status --porcelain",
            `checkout -b ${expectedBranch}`,
            "rev-parse --abbrev-ref HEAD",
          ],
    )
    expect(writtenStates()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — fail-closed error envelope
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision fail-closed error envelope", () => {
  it("wraps unexpected git failures as ROUTE_DECISION_ERROR", async () => {
    const exec: GitExec = () => {
      throw new Error("git executable not found")
    }

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("ROUTE_DECISION_ERROR")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toBe("git executable not found")
  })

  it("fails closed with ROUTE_DECISION_ERROR and no checkpoint when branch creation fails", async () => {
    const { exec, calls } = fakeRouteGit({
      branch: "main",
      checkoutError: new Error("fatal: a branch named 'quick/fix-typo' already exists"),
    })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
    })

    // The checkpoint only lands after a verified branch switch — a failed
    // checkout leaves no tier-routing state behind (fail closed, D5).
    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("ROUTE_DECISION_ERROR")
    expect(envelope.retryable).toBe(false)
    expect(envelope.message).toBe("fatal: a branch named 'quick/fix-typo' already exists")
    expect(gitCommands(calls)).toEqual([
      "rev-parse --abbrev-ref HEAD",
      "status --porcelain",
      "checkout -b quick/fix-typo",
    ])
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// uf_unleash_route_decision — risk floors (D4, escalate only)
// ---------------------------------------------------------------------------

describe("uf_unleash_route_decision risk floors (unleash-tier-routing D4)", () => {
  // Every floor signal the tier-routing rubric names in Phase 4. Each one
  // is a hard minimum of openspec, so a quick decision carrying any of
  // them must be rejected mechanically — the floor cannot depend on the
  // caller remembering the prose.
  const FLOOR_SIGNALS = [
    "security-sensitive",
    "auth",
    "data-loss",
    "public-API-breaking",
  ] as const

  it.each([...FLOOR_SIGNALS])(
    "rejects a quick decision carrying the %s signal with ROUTE_RISK_FLOOR before any git call",
    async (signal) => {
      const { exec, calls } = fakeRouteGit({ branch: "main" })

      const result = await invokeRouteDecision(exec, {
        tier: "quick",
        change_name: "fix-token-validation",
        rationale: "Single-file fix with an obvious implementation; no spec artifacts needed.",
        description: "Fix the token validation bypass.",
        risk_signals: [signal],
      })

      const envelope = errorEnvelope(result)
      expect(envelope.code).toBe("ROUTE_RISK_FLOOR")
      expect(envelope.retryable).toBe(false)
      // The error names the signal and directs the escalation.
      expect(envelope.message).toBe(
        `Risk floor: the quick tier is forbidden for changes carrying risk signals (${signal}). Re-route at openspec or above — risk floors only escalate.`,
      )
      // The floor fires before any git access, branch creation, or
      // checkpoint write — a rejected decision leaves the repository
      // untouched.
      expect(calls).toEqual([])
      expect(writeFileSync).not.toHaveBeenCalled()
    },
  )

  it("names every triggering signal when several floors apply", async () => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-token-validation",
      rationale: "Single-file fix with an obvious implementation; no spec artifacts needed.",
      description: "Fix the token validation bypass.",
      risk_signals: ["security-sensitive", "auth"],
    })

    const envelope = errorEnvelope(result)
    expect(envelope.code).toBe("ROUTE_RISK_FLOOR")
    expect(envelope.message).toBe(
      "Risk floor: the quick tier is forbidden for changes carrying risk signals (security-sensitive, auth). Re-route at openspec or above — risk floors only escalate.",
    )
    expect(calls).toEqual([])
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it.each(["speckit", "openspec"] as const)(
    "allows the %s tier to carry floor signals — floors only escalate",
    async (tier) => {
      const { exec, calls } = fakeRouteGit({ branch: "main" })

      const result = await invokeRouteDecision(exec, {
        tier,
        change_name: "fix-token-validation",
        rationale: "Security-sensitive fix — the risk floor routes it to openspec at minimum.",
        description: "Fix the token validation bypass.",
        risk_signals: ["security-sensitive", "auth"],
      })

      // The heavier tiers are the floor's destination, so signals pass
      // through untouched: no branch is created and the decision records
      // under the pre-route branch key.
      expect(okData(result).tier).toBe(tier)
      expect(gitCommands(calls)).toEqual([
        "rev-parse --abbrev-ref HEAD",
        "status --porcelain",
      ])
      expect(writtenStates()).toHaveLength(1)
      expect(writtenStates()[0]?.completed_steps).toEqual(["tier-routing"])
    },
  )

  it.each([
    ["risk_signals omitted", undefined],
    ["risk_signals empty", []],
  ] as const)("allows a quick decision when %s", async (_label, riskSignals) => {
    const { exec, calls } = fakeRouteGit({ branch: "main" })

    const result = await invokeRouteDecision(exec, {
      tier: "quick",
      change_name: "fix-typo",
      rationale: RATIONALE,
      description: DESCRIPTION,
      risk_signals: riskSignals,
    })

    expect(okData(result).branch).toBe("quick/fix-typo")
    expect(gitCommands(calls)).toContain("checkout -b quick/fix-typo")
    expect(writtenStates()).toHaveLength(1)
  })
})
