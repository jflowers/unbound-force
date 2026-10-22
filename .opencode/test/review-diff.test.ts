import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  BASE_REF_CANDIDATES,
  captureReviewDiff,
  createCaptureReviewDiffTool,
  createReviewDiffDependencies,
  resolveBaseRefWithDivergence,
  type BaseRefResolution,
  type ReviewDiffDependencies,
  type ReviewDiffError,
  type ReviewDiffResult,
} from "../lib/review-diff.js"
import type { GitExec } from "../lib/uf-workflow-types.js"

const BASE_SHA = "a".repeat(40)
const HEAD_SHA = "b".repeat(40)

/** Executor for a healthy repo: upstream/main is an ancestor of HEAD. */
const healthyExec: GitExec = (args: string[]) => {
  const cmd = args.join(" ")
  if (cmd.startsWith("merge-base")) return ""
  if (cmd.includes("rev-parse") && cmd.includes("HEAD")) return HEAD_SHA
  if (cmd.includes("upstream/main")) return BASE_SHA
  throw new Error("not found")
}

/** Executor for a stale fork: upstream/main is NOT an ancestor of HEAD. */
const staleForkExec: GitExec = (args: string[]) => {
  const cmd = args.join(" ")
  if (cmd.startsWith("merge-base")) throw new Error("not an ancestor")
  if (cmd.includes("rev-parse") && cmd.includes("HEAD")) return HEAD_SHA
  if (cmd.includes("upstream/main")) return BASE_SHA
  throw new Error("not found")
}

describe("resolveBaseRefWithDivergence()", () => {
  it("resolves a healthy base that is an ancestor of HEAD", () => {
    const resolved = resolveBaseRefWithDivergence(healthyExec, "/proj")
    expect(resolved).toEqual({
      ref: "upstream/main",
      sha: BASE_SHA,
      source: "upstream/main",
      head_sha: HEAD_SHA,
      diverged: false,
    } satisfies BaseRefResolution)
  })

  it("flags divergence when the base is ahead of HEAD (stale fork)", () => {
    const resolved = resolveBaseRefWithDivergence(staleForkExec, "/proj")
    expect(resolved).toEqual({
      ref: "upstream/main",
      sha: BASE_SHA,
      source: "upstream/main",
      head_sha: HEAD_SHA,
      diverged: true,
    } satisfies BaseRefResolution)
  })

  it("returns null when no candidate resolves", () => {
    const exec: GitExec = () => {
      throw new Error("not found")
    }
    expect(resolveBaseRefWithDivergence(exec, "/proj")).toBeNull()
  })

  it("reports empty head_sha and diverged false when HEAD cannot be resolved", () => {
    const exec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd.includes("HEAD")) throw new Error("no HEAD")
      if (cmd.includes("upstream/main")) return BASE_SHA
      throw new Error("not found")
    }
    const resolved = resolveBaseRefWithDivergence(exec, "/proj")
    expect(resolved).toEqual({
      ref: "upstream/main",
      sha: BASE_SHA,
      source: "upstream/main",
      head_sha: "",
      diverged: false,
    } satisfies BaseRefResolution)
  })

  it("skips candidates that resolve to an empty string", () => {
    const exec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd.startsWith("merge-base")) return ""
      if (cmd.includes("rev-parse") && cmd.includes("HEAD")) return HEAD_SHA
      if (cmd.includes("upstream/main")) return ""
      if (cmd.includes("origin/main")) return "c".repeat(40)
      throw new Error("not found")
    }
    const resolved = resolveBaseRefWithDivergence(exec, "/proj")
    expect(resolved?.source).toBe("origin/main")
  })

  it("tries candidates in the documented order", () => {
    expect(BASE_REF_CANDIDATES).toEqual(["upstream/main", "origin/main", "main"])
  })
})

function expectOk(result: ReviewDiffResult | ReviewDiffError): ReviewDiffResult {
  if ("error" in result) {
    throw new Error("expected success, got error: " + result.message)
  }
  return result
}

function expectErr(result: ReviewDiffResult | ReviewDiffError): ReviewDiffError {
  if (!("error" in result)) {
    throw new Error("expected error, got success")
  }
  return result
}

type FileTable = Record<string, { content?: string; symlink?: boolean; size?: number }>

function makeCaptureDeps(exec: GitExec, files: FileTable = {}): { deps: ReviewDiffDependencies; written: Array<{ path: string; contents: string }> } {
  const written: Array<{ path: string; contents: string }> = []
  const deps: ReviewDiffDependencies = {
    exec,
    cwd: "/proj",
    diffDir: "/tmp/opencode",
    newId: () => "test-id",
    statFile: async (path) => {
      const rel = path.slice("/proj/".length)
      const file = files[rel]
      if (file === undefined) {
        throw new Error("ENOENT: " + rel)
      }
      return { isSymlink: file.symlink === true, size: file.size ?? (file.content ?? "").length }
    },
    readFile: async (path) => {
      const rel = path.slice("/proj/".length)
      const file = files[rel]
      if (file === undefined) {
        throw new Error("ENOENT: " + rel)
      }
      return file.content ?? ""
    },
    writeDiffFile: async (path, contents) => {
      written.push({ path, contents })
    },
  }
  return { deps, written }
}

interface CaptureOptions {
  diverged?: boolean
  noBase?: boolean
  trackedDiff?: string
  numstat?: string
  headDiff?: string
  headNumstat?: string
  untracked?: string[]
  ignored?: string[]
}

function captureExec(options: CaptureOptions = {}): GitExec {
  return (args: string[]) => {
    const cmd = args.join(" ")
    if (cmd.startsWith("merge-base")) {
      if (options.diverged) throw new Error("not an ancestor")
      return ""
    }
    if (cmd.includes("rev-parse") && cmd.includes("HEAD")) return HEAD_SHA
    if (cmd.includes("rev-parse")) {
      if (options.noBase) throw new Error("not found")
      return BASE_SHA
    }
    if (cmd.startsWith("diff --no-renames --numstat")) {
      return cmd.endsWith("HEAD") ? options.headNumstat ?? "" : options.numstat ?? ""
    }
    if (cmd.startsWith("diff --no-renames")) {
      return cmd.endsWith("HEAD") ? options.headDiff ?? "" : options.trackedDiff ?? ""
    }
    if (cmd.startsWith("ls-files --others --ignored")) return (options.ignored ?? []).join("\n")
    if (cmd.startsWith("ls-files --others")) return (options.untracked ?? []).join("\n")
    throw new Error("unexpected command: " + cmd)
  }
}

const TRACKED_DIFF_FIXTURE = [
  "diff --git a/src/a.ts b/src/a.ts",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -1 +1 @@",
  "-old",
  "+new",
].join("\n")

describe("captureReviewDiff()", () => {
  it("captures a healthy-base diff with numstat and a saved patch", async () => {
    const { deps, written } = makeCaptureDeps(
      captureExec({ trackedDiff: TRACKED_DIFF_FIXTURE, numstat: "3\t1\tsrc/a.ts" }),
    )
    const result = expectOk(await captureReviewDiff({}, deps))
    expect(result.mode).toBe("base")
    expect(result.base).toEqual({
      ref: "upstream/main",
      sha: BASE_SHA,
      source: "upstream/main",
      head_sha: HEAD_SHA,
      diverged: false,
    })
    expect(result.files).toEqual([{ path: "src/a.ts", additions: 3, deletions: 1 }])
    expect(result.total_files).toBe(1)
    expect(result.total_additions).toBe(3)
    expect(result.total_deletions).toBe(1)
    expect(result.excluded).toEqual([])
    expect(result.diff_path).toBe("/tmp/opencode/review-diff-test-id.patch")
    expect(written).toHaveLength(1)
    expect(written[0].path).toBe("/tmp/opencode/review-diff-test-id.patch")
    expect(written[0].contents).toContain(TRACKED_DIFF_FIXTURE)
    expect(result.diff_bytes).toBe(written[0].contents.length)
  })

  it("falls back to uncommitted-local when the base is diverged", async () => {
    const { deps } = makeCaptureDeps(
      captureExec({
        diverged: true,
        headDiff: TRACKED_DIFF_FIXTURE,
        headNumstat: "2\t0\tsrc/b.ts",
      }),
    )
    const result = expectOk(await captureReviewDiff({}, deps))
    expect(result.mode).toBe("uncommitted-local")
    expect(result.fallback_reason).toContain("not an ancestor of HEAD")
    expect(result.base?.diverged).toBe(true)
    expect(result.files).toEqual([{ path: "src/b.ts", additions: 2, deletions: 0 }])
  })

  it("falls back to uncommitted-local when no base resolves", async () => {
    const { deps } = makeCaptureDeps(captureExec({ noBase: true, headDiff: "", headNumstat: "" }))
    const result = expectOk(await captureReviewDiff({}, deps))
    expect(result.mode).toBe("uncommitted-local")
    expect(result.base).toBeNull()
    expect(result.fallback_reason).toContain("no resolvable base ref")
  })

  it("captures git-ignored files under the feature dir as new-file diffs", async () => {
    const { deps, written } = makeCaptureDeps(
      captureExec({ ignored: ["openspec/changes/x/proposal.md"] }),
      { "openspec/changes/x/proposal.md": { content: "line one\nline two\n" } },
    )
    const result = expectOk(await captureReviewDiff({ feature_dir: "openspec/changes/x" }, deps))
    expect(result.files).toEqual([
      { path: "openspec/changes/x/proposal.md", additions: 2, deletions: 0 },
    ])
    expect(result.total_additions).toBe(2)
    expect(written).toHaveLength(1)
    expect(written[0].contents).toContain("new file mode 100644")
    expect(written[0].contents).toContain("+++ b/openspec/changes/x/proposal.md")
    expect(written[0].contents).toContain("+line one")
  })

  it("scopes ls-files to the feature dir pathspec", async () => {
    const commands: string[] = []
    const exec: GitExec = (args) => {
      const cmd = args.join(" ")
      commands.push(cmd)
      return captureExec()(args)
    }
    const { deps } = makeCaptureDeps(exec)
    await captureReviewDiff({ feature_dir: "specs/1" }, deps)
    const lsCommands = commands.filter((cmd) => cmd.startsWith("ls-files"))
    expect(lsCommands).toHaveLength(2)
    for (const cmd of lsCommands) {
      expect(cmd.endsWith("-- specs/1")).toBe(true)
    }
  })

  it("refuses symlinks under the feature dir", async () => {
    const { deps, written } = makeCaptureDeps(
      captureExec({ ignored: ["evil/link.md"] }),
      { "evil/link.md": { symlink: true, content: "should not be read" } },
    )
    const result = expectOk(await captureReviewDiff({ feature_dir: "evil" }, deps))
    expect(result.excluded).toEqual([{ path: "evil/link.md", reason: "file-symlink" }])
    expect(result.files).toEqual([])
    expect(written[0].contents).not.toContain("should not be read")
  })

  it("excludes files larger than the per-file cap", async () => {
    const { deps } = makeCaptureDeps(
      captureExec({ ignored: ["big.bin"] }),
      { "big.bin": { content: "x", size: 256 * 1024 + 1 } },
    )
    const result = expectOk(await captureReviewDiff({ feature_dir: "." }, deps))
    expect(result.excluded).toEqual([{ path: "big.bin", reason: "file-too-large" }])
  })

  it("excludes binary files containing NUL bytes", async () => {
    const { deps } = makeCaptureDeps(
      captureExec({ ignored: ["blob.dat"] }),
      { "blob.dat": { content: "a\u0000b" } },
    )
    const result = expectOk(await captureReviewDiff({ feature_dir: "." }, deps))
    expect(result.excluded).toEqual([{ path: "blob.dat", reason: "binary-file" }])
  })

  it("captures an empty file as a zero-line new-file diff", async () => {
    const { deps, written } = makeCaptureDeps(
      captureExec({ ignored: ["empty.md"] }),
      { "empty.md": { content: "" } },
    )
    const result = expectOk(await captureReviewDiff({ feature_dir: "." }, deps))
    expect(result.files).toEqual([{ path: "empty.md", additions: 0, deletions: 0 }])
    expect(written[0].contents).toContain("new file mode 100644")
    expect(written[0].contents).not.toContain("@@")
  })

  it("round-trips tracked plus new-file counts into the totals", async () => {
    const { deps, written } = makeCaptureDeps(
      captureExec({
        trackedDiff: TRACKED_DIFF_FIXTURE,
        numstat: "1\t1\tsrc/a.ts",
        ignored: ["docs/new.md"],
      }),
      { "docs/new.md": { content: "alpha\nbeta\n" } },
    )
    const result = expectOk(await captureReviewDiff({ feature_dir: "docs" }, deps))
    expect(result.total_files).toBe(2)
    expect(result.total_additions).toBe(3)
    expect(result.total_deletions).toBe(1)
    const newFileSection = written[0].contents.slice(
      written[0].contents.indexOf("+++ b/docs/new.md"),
    )
    expect(newFileSection.match(/^\+[^+]/gm)?.length).toBe(2)
  })

  it("degrades to feature-dir-only capture when HEAD is unresolvable", async () => {
    const exec: GitExec = (args: string[]) => {
      const cmd = args.join(" ")
      if (cmd.startsWith("ls-files")) return ""
      throw new Error("git unavailable")
    }
    const { deps } = makeCaptureDeps(exec)
    const result = expectOk(await captureReviewDiff({ feature_dir: "specs" }, deps))
    expect(result.mode).toBe("uncommitted-local")
    expect(result.fallback_reason).toContain("tracked diff unavailable")
    expect(result.files).toEqual([])
  })

  it("rejects feature_dir containing .. via the tool wrapper", async () => {
    const { deps } = makeCaptureDeps(captureExec({}))
    const definition = createCaptureReviewDiffTool(deps)
    const raw = await definition.execute({ feature_dir: "../outside" }, {} as never)
    const text = typeof raw === "string" ? raw : raw.output
    const parsed = JSON.parse(text) as ReviewDiffError
    expect(parsed.error).toBe(true)
    expect(parsed.code).toBe("invalid_input")
  })
})

describe("captureReviewDiff() real-repo write->read round-trip", () => {
  it("captures tracked changes plus untracked and git-ignored feature files from a real git repo", async () => {
    const repo = await mkdtemp(join(tmpdir(), "review-diff-real-"))
    const git = (args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }) as string
    git(["init", "-b", "main"])
    git(["config", "user.email", "test@example.com"])
    git(["config", "user.name", "test"])
    await mkdir(join(repo, "src"), { recursive: true })
    await writeFile(join(repo, "src", "a.ts"), "old\n", "utf8")
    // The feature dir is git-ignored -- the case the prose recipe missed.
    await writeFile(join(repo, ".gitignore"), "openspec/\n", "utf8")
    git(["add", "."])
    git(["commit", "-m", "base"])
    // Tracked modification after the base commit.
    await writeFile(join(repo, "src", "a.ts"), "old\nnew\n", "utf8")
    const featureDir = "openspec/changes/real"
    await mkdir(join(repo, featureDir), { recursive: true })
    await writeFile(join(repo, featureDir, "proposal.md"), "alpha\nbeta\n", "utf8")
    // Untracked noise outside the feature dir -- must be excluded.
    await writeFile(join(repo, "stray.txt"), "noise\n", "utf8")

    try {
      const result = expectOk(await captureReviewDiff({ feature_dir: featureDir }, createReviewDiffDependencies(repo)))

      // No remotes exist, so the candidate loop falls through to local main.
      expect(result.mode).toBe("base")
      expect(result.base).toMatchObject({ ref: "main", source: "main", diverged: false })
      expect(result.files).toEqual([
        { path: "src/a.ts", additions: 1, deletions: 0 },
        { path: `${featureDir}/proposal.md`, additions: 2, deletions: 0 },
      ])
      expect(result.total_files).toBe(2)
      expect(result.total_additions).toBe(3)
      expect(result.total_deletions).toBe(0)
      expect(result.excluded).toEqual([])

      // Round-trip: the saved patch is readable and carries both sections.
      const written = await readFile(result.diff_path, "utf8")
      expect(written).toContain("+++ b/src/a.ts")
      expect(written).toContain(`+++ b/${featureDir}/proposal.md`)
      expect(written).toContain("+alpha")
      expect(written).not.toContain("stray.txt")
      expect(result.diff_bytes).toBe(Buffer.byteLength(written, "utf8"))
    } finally {
      await rm(repo, { recursive: true, force: true })
    }
  })
})
