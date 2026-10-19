import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ToolResult } from "../lib/uf-workflow-types.js"
import {
  UNLEASH_EXIT_VARIANTS,
  formatUnleashDemo,
  formatUnleashExit,
  type UnleashDemoData,
  type UnleashExitDataMap,
  type UnleashExitVariant,
} from "../lib/unleash-templates.js"
import {
  createFormatUnleashDemoTool,
  createFormatUnleashExitTool,
  type GitExec,
  type ProgressState,
  type UnleashRenderedTextData,
} from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by vitest)
// ---------------------------------------------------------------------------

// The demo tool's auto-checkpoint (D5) persists through readState/writeState,
// which hit node:fs directly. Mocking the four functions that path uses (the
// unleash-branch-gate.test.ts recipe, per Dewey learning
// uf-workflow-testing-20261015T201843) keeps every demo-tool test off the real
// filesystem: state I/O is observed through the recorded calls instead of
// performed. existsSync is mocked so tests can prove the checkpoint path never
// probes existence through it. The exit tool renders purely and touches no
// filesystem surface — its tests assert exactly that against the same mocks.
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

/**
 * Recording GitExec answering the demo tool's state-key derivation with a
 * canned branch. The demo tool runs git only on the success path (after the
 * payload validates), so rejection tests assert on the recorded calls to
 * prove exactly that.
 */
function recordingExec(
  branch = "opsx/unleash-deterministic-tools",
): { exec: GitExec; calls: Array<{ args: string[]; cwd: string }> } {
  const calls: Array<{ args: string[]; cwd: string }> = []
  const exec: GitExec = (args, cwd) => {
    calls.push({ args, cwd })
    if (args.join(" ") === "rev-parse --abbrev-ref HEAD") return branch
    throw new Error(`unexpected git command: ${args.join(" ")}`)
  }
  return { exec, calls }
}

/**
 * Node-shaped ENOENT error so readState/writeState treat a path as absent.
 * The error must carry .code = "ENOENT" — a plain Error fails the isEnoent
 * check and surfaces as a tool failure instead of a first-checkpoint create.
 */
function enoent(what: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${what}`), { code: "ENOENT" })
}

/**
 * Invoke a format tool with a full parent-session context (the
 * unleash-delegate.test.ts direct-factory pattern) and parse its JSON output.
 */
async function invokeTool(
  target: ReturnType<typeof createFormatUnleashExitTool>,
  args: Record<string, unknown>,
): Promise<ToolResult<UnleashRenderedTextData>> {
  const result = await (
    target as {
      execute: (
        args: Record<string, unknown>,
        ctx: { sessionID: string; messageID: string; directory: string; abort: AbortSignal },
      ) => Promise<{ output: string }>
    }
  ).execute(args, {
    sessionID: "parent-session",
    messageID: "message-parent",
    directory: FAKE_CWD,
    abort: new AbortController().signal,
  })
  return JSON.parse(result.output) as ToolResult<UnleashRenderedTextData>
}

/** Invoke format_unleash_exit with the fake parent-session context. */
async function invokeExitTool(args: Record<string, unknown>): Promise<ToolResult<UnleashRenderedTextData>> {
  return invokeTool(createFormatUnleashExitTool(FAKE_CWD), args)
}

/** Invoke format_unleash_demo with the fake parent-session context. */
async function invokeDemoTool(
  exec: GitExec,
  args: Record<string, unknown>,
): Promise<ToolResult<UnleashRenderedTextData>> {
  return invokeTool(createFormatUnleashDemoTool(exec, FAKE_CWD), args)
}

/**
 * Representative per-variant data for the structural sweep — one valid
 * payload per variant, keyed by the variant the renderer dispatches on.
 */
const REPRESENTATIVE_EXIT_DATA: { readonly [V in UnleashExitVariant]: UnleashExitDataMap[V] } = {
  clarify: { questions: [{ question: "Which backend?", context: "spec.md:12" }] },
  "spec-review": { tier: "openspec", findings: ["HIGH: ambiguous story"] },
  "implement-worker-failed": { phase: 1, failed_task: "2.1 Extract renderers", error: "worker failed" },
  "implement-merge-conflict": { phase: 1, conflicting_files: ["a.go"] },
  "implement-phase-checkpoint": { phase: 1, failed_command: "make test", output: "FAIL" },
  "code-review-preflight": { findings: ["CRITICAL: gofmt drift"] },
  "code-review-no-success": { reasons: ["reviewer unavailable"] },
  "code-review-iterations-exhausted": {
    persistent_findings: ["HIGH: finding persists"],
    circular_dependencies: ["guard fix breaks sre check"],
  },
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
// UNLEASH_EXIT_VARIANTS — the dispatch surface
// ---------------------------------------------------------------------------

describe("UNLEASH_EXIT_VARIANTS", () => {
  it("enumerates the eight exit variants in command order", () => {
    // The tool's zod enum and the lib's renderer dispatch both derive from
    // this list, so pinning it pins the whole exit surface.
    expect(UNLEASH_EXIT_VARIANTS).toEqual([
      "clarify",
      "spec-review",
      "implement-worker-failed",
      "implement-merge-conflict",
      "implement-phase-checkpoint",
      "code-review-preflight",
      "code-review-no-success",
      "code-review-iterations-exhausted",
    ])
  })
})

// ---------------------------------------------------------------------------
// formatUnleashExit — golden templates
// ---------------------------------------------------------------------------

describe("formatUnleashExit golden templates", () => {
  // Goldens are line-by-line: each array element is one rendered line, so
  // heading placement, the **Reason** label, section headings, blank-line
  // layout, and bullet prefixes are all pinned by the join. Lines are the
  // renderer's unwrapped logical lines — the lib emits each heading, label,
  // guidance sentence, and list item as a single line by design, so goldens
  // match actual output, never hand-wrapped markdown — and the joined string
  // carries no trailing newline.

  it("renders the clarify exit with numbered questions, per-question context, and the plan-step resume", () => {
    const rendered = formatUnleashExit("clarify", {
      questions: [
        {
          question: "Which storage backend backs the artifact store?",
          context: "spec.md:41: Envelopes persist locally.\nspec.md:42: The backend is configurable.",
        },
        {
          question: "Should failed checks retry automatically?",
          context: "spec.md:88: Failed checks are reported once.",
        },
      ],
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: clarify",
        "",
        "**Reason**: 2 question(s) require human input",
        "",
        "Q1: Which storage backend backs the artifact store?",
        "Context: spec.md:41: Envelopes persist locally.",
        "spec.md:42: The backend is configurable.",
        "",
        "Q2: Should failed checks retry automatically?",
        "Context: spec.md:88: Failed checks are reported once.",
        "",
        "### What to do next",
        "Answer these questions in the spec, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from the plan step.",
      ].join("\n"),
    )
  })

  it("renders the spec-review exit with openspec guidance and the interpolated change name", () => {
    const rendered = formatUnleashExit("spec-review", {
      tier: "openspec",
      findings: ["CRITICAL: FR-1 acceptance scenario is unverifiable", "HIGH: story 2 lacks Given/When/Then"],
      change_name: "unleash-deterministic-tools",
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: spec review",
        "",
        "**Reason**: HIGH/CRITICAL findings in spec artifacts",
        "",
        "### Findings",
        "",
        "- CRITICAL: FR-1 acceptance scenario is unverifiable",
        "- HIGH: story 2 lacks Given/When/Then",
        "",
        "### What to do next",
        "Update the artifacts under `openspec/changes/unleash-deterministic-tools/` to address the findings, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from spec review.",
      ].join("\n"),
    )
  })

  it("renders the spec-review exit with speckit clarify guidance", () => {
    const rendered = formatUnleashExit("spec-review", {
      tier: "speckit",
      findings: ["CRITICAL: FR-1 acceptance scenario is unverifiable"],
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: spec review",
        "",
        "**Reason**: HIGH/CRITICAL findings in spec artifacts",
        "",
        "### Findings",
        "",
        "- CRITICAL: FR-1 acceptance scenario is unverifiable",
        "",
        "### What to do next",
        "Run `/speckit.clarify` to address the findings, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from spec review.",
      ].join("\n"),
    )
  })

  it("renders the spec-review exit with quick code guidance", () => {
    // Unreachable in a well-formed quick run (spec review is skipped);
    // the defensive branch still renders code-directed guidance.
    const rendered = formatUnleashExit("spec-review", {
      tier: "quick",
      findings: ["CRITICAL: FR-1 acceptance scenario is unverifiable"],
    })

    expect(rendered).toContain(
      "### What to do next\nQuick changes carry no spec artifacts; address the findings in the code, then re-run `/uf.unleash`.",
    )
  })

  it("renders the openspec guidance with the literal <name> placeholder when change_name is omitted", () => {
    const rendered = formatUnleashExit("spec-review", {
      tier: "openspec",
      findings: ["HIGH: story lacks an acceptance scenario"],
    })

    // The tier-selected guidance directly follows the What to do next
    // heading as one unwrapped line, with the template's literal placeholder.
    expect(rendered).toContain(
      "### What to do next\nUpdate the artifacts under `openspec/changes/<name>/` to address the findings, then re-run `/uf.unleash`.",
    )
  })

  it("renders the implement-worker-failed exit for the failed phase", () => {
    const rendered = formatUnleashExit("implement-worker-failed", {
      phase: 3,
      failed_task: "4.2 [P] Extract the template renderers",
      error: "worker exited with code 1: build failed",
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: implement (Phase 3)",
        "",
        "**Reason**: Parallel worker failed",
        "",
        "**Failed task**: 4.2 [P] Extract the template renderers",
        "**Error**: worker exited with code 1: build failed",
        "",
        "### What to do next",
        "Fix the issue described above, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from the failed phase.",
      ].join("\n"),
    )
  })

  it("renders the implement-merge-conflict exit with the conflicting-files bullets", () => {
    const rendered = formatUnleashExit("implement-merge-conflict", {
      phase: 2,
      conflicting_files: ["internal/scaffold/engine.go", "internal/scaffold/engine_test.go"],
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: implement (Phase 2)",
        "",
        "**Reason**: Worktree merge conflict",
        "",
        "**Conflicting files**:",
        "- internal/scaffold/engine.go",
        "- internal/scaffold/engine_test.go",
        "",
        "### What to do next",
        "Resolve the merge conflicts manually, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from the current phase.",
      ].join("\n"),
    )
  })

  it("renders the implement-phase-checkpoint exit with the failed command and output", () => {
    const rendered = formatUnleashExit("implement-phase-checkpoint", {
      phase: 2,
      failed_command: "make test",
      output: "FAIL: TestScaffold_Run/renders_templates [0.01s]",
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: implement (Phase 2 checkpoint)",
        "",
        "**Reason**: Build or test failure after Phase 2",
        "",
        "**Failed command**: make test",
        "**Output**: FAIL: TestScaffold_Run/renders_templates [0.01s]",
        "",
        "### What to do next",
        "Fix the build/test failure, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from the next phase.",
      ].join("\n"),
    )
  })

  it("renders the code-review-preflight exit with branch-caused findings", () => {
    const rendered = formatUnleashExit("code-review-preflight", {
      findings: ["CRITICAL: gofmt drift in internal/scaffold/engine.go", "CRITICAL: unused variable in scaffold.go:212"],
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: code review",
        "",
        "**Reason**: Pre-flight gate: branch-caused failures",
        "",
        "### Findings",
        "",
        "- CRITICAL: gofmt drift in internal/scaffold/engine.go",
        "- CRITICAL: unused variable in scaffold.go:212",
        "",
        "### What to do next",
        "Fix the branch-caused failures, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from code review.",
      ].join("\n"),
    )
  })

  it("renders the code-review-no-success exit with reviewer-run reasons", () => {
    const rendered = formatUnleashExit("code-review-no-success", {
      reasons: ["divisor-guard: model unavailable", "divisor-sre: run timed out after 3 retries"],
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: code review",
        "",
        "**Reason**: Code review produced no successful assessment",
        "",
        "### No-success reasons",
        "",
        "- divisor-guard: model unavailable",
        "- divisor-sre: run timed out after 3 retries",
        "",
        "### What to do next",
        "Address the reviewer-run failures, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from code review.",
      ].join("\n"),
    )
  })

  it("renders the code-review-iterations-exhausted exit with the circular-dependencies section", () => {
    const rendered = formatUnleashExit("code-review-iterations-exhausted", {
      persistent_findings: ["HIGH: missing GoDoc on NewEngine (re-opened twice)"],
      circular_dependencies: ["fixing divisor-guard findings breaks the divisor-sre lint check"],
    })

    expect(rendered).toBe(
      [
        "## /uf.unleash paused at: code review",
        "",
        "**Reason**: 3 review iterations exhausted",
        "",
        "### Persistent findings",
        "",
        "- HIGH: missing GoDoc on NewEngine (re-opened twice)",
        "",
        "### Circular dependencies (if any)",
        "",
        "- fixing divisor-guard findings breaks the divisor-sre lint check",
        "",
        "### What to do next",
        "Fix the outstanding findings manually, then re-run `/uf.unleash`.",
        "",
        "### Then resume",
        "Run `/uf.unleash` to continue from code review.",
      ].join("\n"),
    )
  })
})

// ---------------------------------------------------------------------------
// formatUnleashExit — template structure
// ---------------------------------------------------------------------------

describe("formatUnleashExit template structure", () => {
  it("renders the shared skeleton for every variant: heading, Reason label, What to do next, Then resume", () => {
    for (const variant of UNLEASH_EXIT_VARIANTS) {
      const lines = formatUnleashExit(variant, REPRESENTATIVE_EXIT_DATA[variant]).split("\n")

      // The paused-at heading is line one, a blank line follows, and the
      // **Reason** label sits on line three.
      expect(lines[0]).toMatch(/^## \/uf\.unleash paused at: .+$/)
      expect(lines[1]).toBe("")
      expect(lines[2]?.startsWith("**Reason**: ")).toBe(true)

      // Both guidance sections appear, in template order, each with its
      // guidance as a single unwrapped line directly under the heading.
      const nextIndex = lines.indexOf("### What to do next")
      const resumeIndex = lines.indexOf("### Then resume")
      expect(nextIndex).toBeGreaterThan(2)
      expect(resumeIndex).toBeGreaterThan(nextIndex)
      expect(lines[nextIndex + 1]?.length).toBeGreaterThan(0)
      expect(lines[nextIndex + 2]).toBe("")
      expect(lines[resumeIndex + 1]?.length).toBeGreaterThan(0)

      // The resume guidance is the final line: the render ends without a
      // trailing blank line or trailing newline.
      expect(lines).toHaveLength(resumeIndex + 2)
      expect(lines[lines.length - 1]).toMatch(/^Run `\/uf\.unleash` to continue from /)
    }
  })

  it("omits the Circular dependencies section when no cycles are reported", () => {
    // Omitted entirely...
    const omitted = formatUnleashExit("code-review-iterations-exhausted", {
      persistent_findings: ["HIGH: finding persists"],
    })
    expect(omitted).not.toContain("### Circular dependencies (if any)")

    // ...and an empty cycle list renders nothing either — the section is
    // conditional on at least one reported cycle.
    const empty = formatUnleashExit("code-review-iterations-exhausted", {
      persistent_findings: ["HIGH: finding persists"],
      circular_dependencies: [],
    })
    expect(empty).not.toContain("### Circular dependencies (if any)")

    // Both renders are otherwise identical.
    expect(omitted).toBe(empty)
  })
})

// ---------------------------------------------------------------------------
// formatUnleashDemo — golden templates
// ---------------------------------------------------------------------------

describe("formatUnleashDemo golden templates", () => {
  it("renders the speckit demo with the clarify refinement option", () => {
    const rendered = formatUnleashDemo({
      tier: "speckit",
      whatWasBuilt: "The eight /uf.unleash exits and the Step 8 demo render through pure template functions.",
      howToVerify: "Run `npx vitest run test/unleash-formatters.test.ts` from .opencode.",
      testResults: "All plugin tests pass.",
    })

    expect(rendered).toBe(
      [
        "## What Was Built",
        "",
        "The eight /uf.unleash exits and the Step 8 demo render through pure template functions.",
        "",
        "## How to Verify",
        "",
        "Run `npx vitest run test/unleash-formatters.test.ts` from .opencode.",
        "",
        "## Test Results",
        "",
        "All plugin tests pass.",
        "",
        "## Next Steps",
        "",
        "- Run `/uf.finale` to create PR and watch CI",
        "- Run `/speckit.clarify` to refine and iterate",
      ].join("\n"),
    )
  })

  it("renders the openspec demo with the interpolated change name in the refinement option", () => {
    const rendered = formatUnleashDemo({
      tier: "openspec",
      whatWasBuilt: "The change extracts /uf.unleash terminal output into deterministic tools.",
      howToVerify: "Run `openspec validate unleash-deterministic-tools`.",
      testResults: "make check passes with the coverage gate green.",
      changeName: "unleash-deterministic-tools",
    })

    expect(rendered).toBe(
      [
        "## What Was Built",
        "",
        "The change extracts /uf.unleash terminal output into deterministic tools.",
        "",
        "## How to Verify",
        "",
        "Run `openspec validate unleash-deterministic-tools`.",
        "",
        "## Test Results",
        "",
        "make check passes with the coverage gate green.",
        "",
        "## Next Steps",
        "",
        "- Run `/uf.finale` to create PR and watch CI",
        "- Update the artifacts under `openspec/changes/unleash-deterministic-tools/` to refine and iterate",
      ].join("\n"),
    )
  })

  it("falls back to the literal <name> placeholder in the refinement option when changeName is omitted", () => {
    const rendered = formatUnleashDemo({
      tier: "openspec",
      whatWasBuilt: "Built.",
      howToVerify: "Verify.",
      testResults: "Passing.",
    })

    const lines = rendered.split("\n")
    expect(lines[lines.length - 1]).toBe(
      "- Update the artifacts under `openspec/changes/<name>/` to refine and iterate",
    )
  })

  it("renders the quick demo with the follow-up-issue refinement option", () => {
    const rendered = formatUnleashDemo({
      tier: "quick",
      whatWasBuilt: "Fixed the flaky retry assertion in the dispatch tests.",
      howToVerify: "Run `npx vitest run test/dispatch-status.test.ts` from .opencode.",
      testResults: "All plugin tests pass.",
    })

    const lines = rendered.split("\n")
    expect(lines[lines.length - 1]).toBe(
      "- Open a follow-up issue for anything this change surfaced",
    )
  })
})

// ---------------------------------------------------------------------------
// formatUnleashDemo — template structure
// ---------------------------------------------------------------------------

describe("formatUnleashDemo template structure", () => {
  it("ends the demo with exactly two Next Steps options and nothing after them", () => {
    const lines = formatUnleashDemo({
      tier: "speckit",
      whatWasBuilt: "Built.",
      howToVerify: "Verify.",
      testResults: "Passing.",
    }).split("\n")

    const heading = lines.indexOf("## Next Steps")
    expect(heading).toBeGreaterThan(-1)
    // The Next Steps section is the terminal section: its heading, a blank
    // line, and exactly the two prescribed options — no third bullet, no
    // trailing content.
    expect(lines.slice(heading)).toEqual([
      "## Next Steps",
      "",
      "- Run `/uf.finale` to create PR and watch CI",
      "- Run `/speckit.clarify` to refine and iterate",
    ])
  })
})

// ---------------------------------------------------------------------------
// format_unleash_exit tool
// ---------------------------------------------------------------------------

describe("format_unleash_exit tool", () => {
  it("returns the rendered spec-review exit in a {text} success envelope without checkpointing", async () => {
    const result = await invokeExitTool({
      variant: "spec-review",
      tier: "openspec",
      findings: ["CRITICAL: FR-1 acceptance scenario is unverifiable"],
      change_name: "unleash-deterministic-tools",
    })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      // The flat args surface revalidates through the discriminated union
      // and renders through the same pure lib function — tool output and the
      // lib goldens cannot drift.
      expect(result.data).toStrictEqual({
        text: formatUnleashExit("spec-review", {
          tier: "openspec",
          findings: ["CRITICAL: FR-1 acceptance scenario is unverifiable"],
          change_name: "unleash-deterministic-tools",
        }),
      })
    }

    // An exit pauses the pipeline rather than completing a step: no state
    // read, no state write, no directory creation, no existence probe.
    expect(lstatSync).not.toHaveBeenCalled()
    expect(readFileSync).not.toHaveBeenCalled()
    expect(mkdirSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
    expect(existsSync).not.toHaveBeenCalled()
  })

  it("passes optional per-variant fields through the flat args surface to the renderer", async () => {
    const result = await invokeExitTool({
      variant: "code-review-iterations-exhausted",
      persistent_findings: ["HIGH: missing GoDoc on NewEngine"],
      circular_dependencies: ["fixing divisor-guard findings breaks the divisor-sre lint check"],
    })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({
        text: formatUnleashExit("code-review-iterations-exhausted", {
          persistent_findings: ["HIGH: missing GoDoc on NewEngine"],
          circular_dependencies: ["fixing divisor-guard findings breaks the divisor-sre lint check"],
        }),
      })
      // The optional circular_dependencies field survived the union.
      expect(result.data?.text).toContain("### Circular dependencies (if any)")
    }
    expect(writeFileSync).not.toHaveBeenCalled()
  })

  it.each([
    ["an unknown variant", { variant: "spec-rejected", findings: ["HIGH: x"] }, "variant"],
    ["clarify without its questions", { variant: "clarify" }, "questions"],
    ["spec-review without its tier", { variant: "spec-review", findings: ["HIGH: x"] }, "tier"],
    [
      "a union violation carrying another variant's field",
      { variant: "clarify", questions: [{ question: "Q?", context: "C" }], phase: 2 },
      "phase",
    ],
  ])("rejects %s with INVALID_INPUT", async (_description, args, messagePart) => {
    const result = await invokeExitTool(args)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_INPUT")
      expect(result.retryable).toBe(false)
      // The zod issue details name the offending field.
      expect(result.message).toContain(messagePart)
    }
    // Rejected before any state I/O — exits never checkpoint.
    expect(lstatSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// format_unleash_demo tool
// ---------------------------------------------------------------------------

describe("format_unleash_demo tool", () => {
  it("returns the rendered demo in a {text} success envelope and auto-checkpoints the demo step", async () => {
    const { exec, calls: execCalls } = recordingExec()
    const input: UnleashDemoData = {
      tier: "openspec",
      whatWasBuilt: "The eight /uf.unleash exits and the Step 8 demo render through pure template functions.",
      howToVerify: "Run `npx vitest run` from .opencode.",
      testResults: "All plugin tests pass.",
    }
    const result = await invokeDemoTool(exec, { ...input })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data).toStrictEqual({ text: formatUnleashDemo(input) })
    }

    // Key derivation: exactly one git invocation — the state-key branch
    // read — against the injected cwd.
    expect(execCalls).toEqual([{ args: ["rev-parse", "--abbrev-ref", "HEAD"], cwd: FAKE_CWD }])

    // D5: the demo step auto-checkpoints through the same writeState path as
    // the checkpoint tool — .uf/progress/<sanitized-branch>/uf.unleash.json
    // with 0o600 file mode.
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [statePathArg, stateRaw, writeOptions] = vi.mocked(writeFileSync).mock.calls[0]
    expect(statePathArg).toBe(
      resolve(FAKE_CWD, ".uf/progress/opsx-unleash-deterministic-tools/uf.unleash.json"),
    )
    expect(writeOptions).toMatchObject({ mode: 0o600 })
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.command).toBe("uf.unleash")
    expect(state.branch).toBe("opsx-unleash-deterministic-tools")
    expect(state.key).toBe("opsx-unleash-deterministic-tools")
    expect(state.current_step).toBe("demo")
    expect(state.completed_steps).toEqual(["demo"])
    // change_name records as checkpoint data only when supplied — this run
    // supplied none, so the data object stays empty.
    expect(state.data).toEqual({})

    expect(mkdirSync).toHaveBeenCalledTimes(1)
    const [mkdirPathArg, mkdirOptions] = vi.mocked(mkdirSync).mock.calls[0]
    expect(mkdirPathArg).toBe(resolve(FAKE_CWD, ".uf/progress/opsx-unleash-deterministic-tools"))
    expect(mkdirOptions).toMatchObject({ recursive: true, mode: 0o700 })

    // The checkpoint path probes state only through lstat/read/write —
    // never existsSync.
    expect(existsSync).not.toHaveBeenCalled()
  })

  it("fails closed with FORMAT_UNLEASH_DEMO_ERROR when the auto-checkpoint write fails", async () => {
    const { exec } = recordingExec()
    // The renderer succeeds; the checkpoint write fails. recordAutoCheckpoint
    // throws on state I/O failure so the tool fails closed instead of
    // half-reporting success with a missing checkpoint.
    vi.mocked(writeFileSync).mockImplementation(() => {
      throw new Error("simulated checkpoint write failure")
    })
    const input: UnleashDemoData = {
      tier: "openspec",
      whatWasBuilt: "The demo block renders through pure template functions.",
      howToVerify: "Run `npx vitest run` from .opencode.",
      testResults: "All plugin tests pass.",
    }

    const result = await invokeDemoTool(exec, { ...input })

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("FORMAT_UNLEASH_DEMO_ERROR")
      expect(result.retryable).toBe(false)
      expect(result.message).toContain("simulated checkpoint write failure")
    }
  })

  it("records change_name as checkpoint data when supplied and routes it through the renderer", async () => {
    const { exec } = recordingExec()
    const input: UnleashDemoData = {
      tier: "openspec",
      whatWasBuilt: "The change extracts /uf.unleash terminal output into deterministic tools.",
      howToVerify: "Run `openspec validate unleash-deterministic-tools`.",
      testResults: "make check passes with the coverage gate green.",
      changeName: "unleash-deterministic-tools",
    }
    const result = await invokeDemoTool(exec, { ...input })

    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.data?.text).toBe(formatUnleashDemo(input))
      // The supplied change name interpolates into the second option.
      expect(result.data?.text).toContain(
        "- Update the artifacts under `openspec/changes/unleash-deterministic-tools/` to refine and iterate",
      )
    }

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    const state = JSON.parse(stateRaw as string) as ProgressState
    expect(state.current_step).toBe("demo")
    expect(state.completed_steps).toEqual(["demo"])
    // The change name persists under its snake_case checkpoint-data key.
    expect(state.data).toEqual({ change_name: "unleash-deterministic-tools" })
  })

  it("appends the demo checkpoint idempotently to existing state, merging change_name into prior data", async () => {
    // Simulate a re-run: prior state exists with earlier steps recorded and
    // feature-dir data from the branch gate.
    const existing: ProgressState = {
      command: "uf.unleash",
      branch: "opsx-unleash-deterministic-tools",
      key: "opsx-unleash-deterministic-tools",
      current_step: "code-review",
      completed_steps: ["branch-safety-gate", "implement", "code-review"],
      data: { feature_dir: "openspec/changes/unleash-deterministic-tools/" },
      created_at: "2026-10-14T00:00:00.000Z",
      updated_at: "2026-10-14T00:00:00.000Z",
    }
    vi.mocked(lstatSync).mockImplementation(
      () => ({ isSymbolicLink: () => false }) as unknown as ReturnType<typeof lstatSync>,
    )
    vi.mocked(readFileSync).mockImplementation(() => JSON.stringify(existing))

    const result = await invokeDemoTool(recordingExec().exec, {
      tier: "openspec",
      whatWasBuilt: "Re-rendered demo.",
      howToVerify: "Re-verified.",
      testResults: "Still passing.",
      changeName: "unleash-deterministic-tools",
    })

    expect(result.status).toBe("ok")

    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const [, stateRaw] = vi.mocked(writeFileSync).mock.calls[0]
    const state = JSON.parse(stateRaw as string) as ProgressState
    // The demo step appends without duplicating earlier ones (FR-001)...
    expect(state.completed_steps).toEqual(["branch-safety-gate", "implement", "code-review", "demo"])
    expect(state.current_step).toBe("demo")
    // ...the shallow data merge keeps the prior feature_dir while adding
    // this run's change_name...
    expect(state.data).toEqual({
      feature_dir: "openspec/changes/unleash-deterministic-tools/",
      change_name: "unleash-deterministic-tools",
    })
    // ...and created_at survives while updated_at is refreshed.
    expect(state.created_at).toBe("2026-10-14T00:00:00.000Z")
    expect(state.updated_at).not.toBe("2026-10-14T00:00:00.000Z")
  })

  it.each([
    ["a missing tier", { whatWasBuilt: "b", howToVerify: "v", testResults: "r" }, "tier"],
    [
      "an empty whatWasBuilt",
      { tier: "speckit", whatWasBuilt: "", howToVerify: "v", testResults: "r" },
      "whatWasBuilt",
    ],
    [
      "an unrecognized key",
      { tier: "speckit", whatWasBuilt: "b", howToVerify: "v", testResults: "r", featureDir: "x" },
      "featureDir",
    ],
  ])("rejects %s with INVALID_INPUT and records no checkpoint", async (_description, args, messagePart) => {
    const { exec, calls: execCalls } = recordingExec()
    const result = await invokeDemoTool(exec, args)

    expect(result.status).toBe("error")
    if (result.status === "error") {
      expect(result.code).toBe("INVALID_INPUT")
      expect(result.retryable).toBe(false)
      // The zod issue details name the offending field.
      expect(result.message).toContain(messagePart)
    }
    // Rejected before key derivation or any state I/O.
    expect(execCalls).toEqual([])
    expect(lstatSync).not.toHaveBeenCalled()
    expect(writeFileSync).not.toHaveBeenCalled()
  })
})
