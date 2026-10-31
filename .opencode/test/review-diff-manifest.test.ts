/**
 * Tests for the shared diff-manifest construction (OpenSpec change
 * review-dispatch-diff-manifest, task 1.2 — RD-FR-033 scenarios).
 *
 * The manifest builder is a pure function of the patch text (constitution
 * Principles II/IV): determinism, hunk-aligned chunk boundaries under the
 * 256 KiB budget, annotated mid-hunk splits of oversized single hunks,
 * synthesized new-file sections, binary and rename flags, numstat
 * override, hint classification that never filters or reorders, the
 * DIFF_THRESHOLD re-export, and the countDiffLines boundary rule
 * (design D3/D4/D10).
 */
import { describe, expect, it } from "vitest"

import {
  DIFF_THRESHOLD,
  MAX_CHUNK_BYTES,
  buildDiffManifest,
  classifyPathHints,
  countDiffLines,
  type DiffManifestEntry,
} from "../lib/review-diff-manifest.js"

/** A small two-file patch with one modified Go file and one new doc. */
const TWO_FILE_PATCH = [
  "diff --git a/internal/foo/bar.go b/internal/foo/bar.go",
  "index 1111111..2222222 100644",
  "--- a/internal/foo/bar.go",
  "+++ b/internal/foo/bar.go",
  "@@ -1,4 +1,6 @@",
  " context",
  "-old line",
  "+new line",
  "+added line",
  "@@ -10,3 +12,4 @@",
  " context2",
  "+another add",
  "diff --git a/docs/new.md b/docs/new.md",
  "new file mode 100644",
  "index 0000000..3333333",
  "--- /dev/null",
  "+++ b/docs/new.md",
  "@@ -0,0 +1,2 @@",
  "+hello",
  "+world",
  "",
].join("\n")

/** Build a multi-hunk single-file patch with hunks of a given size. */
function multiHunkPatch(hunkCount: number, contextLinesPerHunk: number, contextLineLength: number): string {
  const lines: string[] = ["diff --git a/big.go b/big.go", "--- a/big.go", "+++ b/big.go"]
  for (let h = 0; h < hunkCount; h++) {
    lines.push(`@@ -${1 + h * 3},3 +${1 + h * 3},3 @@`)
    for (let c = 0; c < contextLinesPerHunk; c++) {
      lines.push(" " + "c".repeat(contextLineLength) + ` ${h}-${c}`)
    }
  }
  return lines.join("\n") + "\n"
}

describe("DIFF_THRESHOLD", () => {
  it("re-exports the gate-fixed 1500-line value", () => {
    expect(DIFF_THRESHOLD).toBe(1500)
  })

  it("bounds MAX_CHUNK_BYTES at 256 KiB", () => {
    expect(MAX_CHUNK_BYTES).toBe(256 * 1024)
  })
})

describe("countDiffLines", () => {
  it("counts zero for empty content", () => {
    expect(countDiffLines("")).toBe(0)
  })

  it("does not count a trailing terminator as an extra line", () => {
    expect(countDiffLines("a\nb\n")).toBe(2)
    expect(countDiffLines("a\nb")).toBe(2)
    expect(countDiffLines("\n")).toBe(1)
  })

  it("normalizes CRLF and lone-CR terminators", () => {
    expect(countDiffLines("a\r\nb\r\n")).toBe(2)
    expect(countDiffLines("a\rb")).toBe(2)
    expect(countDiffLines("a\r\nb\r\nc")).toBe(3)
  })

  it("pins the 1500/1501 delivery-mode boundary", () => {
    expect(countDiffLines("x\n".repeat(1500))).toBe(1500)
    expect(countDiffLines("x\n".repeat(1501))).toBe(1501)
    // A 1500-line diff without a trailing terminator counts the same.
    expect(countDiffLines("x\n".repeat(1499) + "x")).toBe(1500)
  })
})

describe("buildDiffManifest determinism", () => {
  it("produces identical manifests for identical patch content (run twice)", () => {
    const first = buildDiffManifest(TWO_FILE_PATCH)
    const second = buildDiffManifest(TWO_FILE_PATCH)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
  })

  it("uses stable chunk identifiers derived from path and index", () => {
    const entries = buildDiffManifest(TWO_FILE_PATCH)
    expect(entries[0].chunks[0].id).toBe("internal/foo/bar.go#1")
    expect(entries[1].chunks[0].id).toBe("docs/new.md#1")
  })
})

describe("buildDiffManifest entries", () => {
  it("carries one entry per file section in patch order", () => {
    const entries = buildDiffManifest(TWO_FILE_PATCH)
    expect(entries.map((e) => e.path)).toEqual(["internal/foo/bar.go", "docs/new.md"])
  })

  it("derives addition and deletion counts from hunks when numstat is absent", () => {
    const entries = buildDiffManifest(TWO_FILE_PATCH)
    expect(entries[0].additions).toBe(3)
    expect(entries[0].deletions).toBe(1)
    expect(entries[1].additions).toBe(2)
    expect(entries[1].deletions).toBe(0)
  })

  it("prefers authoritative numstat counts over hunk-derived counts", () => {
    const entries = buildDiffManifest(TWO_FILE_PATCH, [
      { path: "internal/foo/bar.go", additions: 42, deletions: 17 },
    ])
    expect(entries[0].additions).toBe(42)
    expect(entries[0].deletions).toBe(17)
    // Non-matching paths keep their hunk-derived counts.
    expect(entries[1].additions).toBe(2)
  })

  it("includes synthesized new-file sections with addition counts", () => {
    // The capture tools emit standard diff --git sections for untracked
    // files (design D3) — they parse naturally.
    const entries = buildDiffManifest(TWO_FILE_PATCH)
    const newFile = entries.find((e) => e.path === "docs/new.md")
    expect(newFile).toBeDefined()
    expect(newFile!.additions).toBe(2)
    expect(newFile!.chunks.length).toBeGreaterThan(0)
  })

  it("parses binary flags from section headers", () => {
    const patch = [
      "diff --git a/assets/logo.png b/assets/logo.png",
      "Binary files a/assets/logo.png and b/assets/logo.png differ",
      "",
    ].join("\n")
    const entries = buildDiffManifest(patch)
    expect(entries[0].binary).toBe(true)
    expect(entries[0].rename).toBe(false)
    // Binary sections carry no hunks: counts stay 0/0 without numstat.
    expect(entries[0].additions).toBe(0)
    expect(entries[0].deletions).toBe(0)
  })

  it("parses rename flags from rename headers", () => {
    const patch = [
      "diff --git a/old/name.ts b/new/name.ts",
      "similarity index 90%",
      "rename from old/name.ts",
      "rename to new/name.ts",
      "",
    ].join("\n")
    const entries = buildDiffManifest(patch)
    expect(entries[0].rename).toBe(true)
    expect(entries[0].path).toBe("new/name.ts")
  })
})

describe("buildDiffManifest chunking", () => {
  it("keeps a small patch in one chunk per section", () => {
    const entries = buildDiffManifest(TWO_FILE_PATCH)
    for (const entry of entries) {
      expect(entry.chunks.length).toBe(1)
      expect(entry.chunks[0].midHunkSplit).toBe(false)
    }
  })

  it("splits multi-hunk sections at @@ hunk headers under the budget", () => {
    // ~40 KiB hunks x 10 = ~400 KiB, exceeding the 256 KiB budget.
    const patch = multiHunkPatch(10, 400, 95)
    const entries = buildDiffManifest(patch)
    expect(entries[0].chunks.length).toBeGreaterThan(1)
    for (const chunk of entries[0].chunks) {
      expect(chunk.byteEnd - chunk.byteStart).toBeLessThanOrEqual(MAX_CHUNK_BYTES)
      expect(chunk.midHunkSplit).toBe(false)
    }
    // Every boundary after the first falls on an @@ hunk header.
    const content = patch
    for (const chunk of entries[0].chunks.slice(1)) {
      expect(content.slice(chunk.byteStart, chunk.byteStart + 2)).toBe("@@")
    }
    // Chunk byte ranges tile the section contiguously.
    for (let i = 1; i < entries[0].chunks.length; i++) {
      expect(entries[0].chunks[i].byteStart).toBe(entries[0].chunks[i - 1].byteEnd)
    }
  })

  it("splits an oversized single hunk mid-hunk with annotation", () => {
    const hugeLine = "+" + "y".repeat(300 * 1024)
    const patch = [
      "diff --git a/gen.ts b/gen.ts",
      "--- a/gen.ts",
      "+++ b/gen.ts",
      "@@ -1,1 +1,2 @@",
      " base",
      hugeLine,
      "",
    ].join("\n")
    const entries = buildDiffManifest(patch)
    const chunks = entries[0].chunks
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.byteEnd - chunk.byteStart).toBeLessThanOrEqual(MAX_CHUNK_BYTES)
    }
    // The pieces of the split hunk carry the mid-hunk annotation; a
    // leading headers-only chunk closed at the hunk header is aligned
    // and stays unannotated.
    const splitPieces = chunks.filter((c) => c.midHunkSplit)
    expect(splitPieces.length).toBeGreaterThan(1)
    // No unannotated chunk may end mid-hunk: unannotated chunks end at
    // hunk headers or the section end.
    for (const chunk of chunks.filter((c) => !c.midHunkSplit)) {
      const atEnd = chunk.byteEnd === Buffer.byteLength(patch, "utf8")
      const nextTwo = patch.slice(chunk.byteEnd, chunk.byteEnd + 2)
      expect(atEnd || nextTwo === "@@" || nextTwo === "di").toBe(true)
    }
  })

  it("computes byte offsets that match UTF-8 content length", () => {
    const last = (entries: readonly DiffManifestEntry[]): number =>
      entries[entries.length - 1].chunks.slice(-1)[0].byteEnd
    expect(last(buildDiffManifest(TWO_FILE_PATCH))).toBe(Buffer.byteLength(TWO_FILE_PATCH, "utf8"))
    const crlfPatch = TWO_FILE_PATCH.replaceAll("\n", "\r\n")
    expect(last(buildDiffManifest(crlfPatch))).toBe(Buffer.byteLength(crlfPatch, "utf8"))
  })
})

describe("classifyPathHints", () => {
  it("classifies workflow files as ci-cd", () => {
    expect(classifyPathHints(".github/workflows/ci.yml")).toEqual(["ci-cd"])
  })

  it("classifies test and fixture locations as test-quality", () => {
    expect(classifyPathHints("internal/foo/bar_test.go")).toEqual(["test-quality"])
    expect(classifyPathHints("pkg/suite_spec.rb")).toEqual(["test-quality"])
    expect(classifyPathHints("test/helper.ts")).toEqual(["test-quality"])
    expect(classifyPathHints("src/fixtures/data.json")).toEqual(["test-quality"])
  })

  it("classifies command-surface paths as cli-ux over documentation", () => {
    // Command files carry *.md; the cli-ux pattern takes precedence.
    expect(classifyPathHints(".opencode/commands/uf.review-council.md")).toEqual(["cli-ux"])
    expect(classifyPathHints("cmd/unbound-force/main.go")).toEqual(["cli-ux"])
  })

  it("classifies lockfiles and dependency manifests as dependencies", () => {
    expect(classifyPathHints("package-lock.json")).toEqual(["dependencies"])
    expect(classifyPathHints("go.sum")).toEqual(["dependencies"])
  })

  it("classifies security-adjacent segments as security", () => {
    expect(classifyPathHints("internal/auth/token.go")).toEqual(["security"])
    expect(classifyPathHints("pkg/crypto/cipher.ts")).toEqual(["security"])
    // Segment equality: an "author" directory is not "auth".
    expect(classifyPathHints("internal/author/bio.go")).toEqual(["standard"])
  })

  it("classifies documentation locations as documentation", () => {
    expect(classifyPathHints("docs/guide.md")).toEqual(["documentation"])
    expect(classifyPathHints("openspec/changes/x/proposal.md")).toEqual(["documentation"])
    expect(classifyPathHints("README.md")).toEqual(["documentation"])
  })

  it("defaults to standard and never returns empty", () => {
    expect(classifyPathHints("internal/foo/bar.go")).toEqual(["standard"])
  })
})

describe("hints never filter or reorder (RD-FR-033 scenario)", () => {
  it("lists every file in patch order for a mixed-path fixture", () => {
    const sections: string[] = []
    const expectedPaths: string[] = []
    const files = [
      ".github/workflows/ci.yml",
      "docs/guide.md",
      "internal/foo/bar_test.go",
      "internal/foo/bar.go",
      "cmd/tool/main.go",
      "package-lock.json",
      "internal/auth/token.go",
      "src/thing.ts",
    ]
    for (const file of files) {
      sections.push(
        `diff --git a/${file} b/${file}`,
        "--- " + (file.endsWith(".md") && file.startsWith("docs/") ? "/dev/null" : `a/${file}`),
        `+++ b/${file}`,
        "@@ -1,1 +1,2 @@",
        " ctx",
        "+change",
        "",
      )
      expectedPaths.push(file)
    }
    const entries = buildDiffManifest(sections.join("\n"))
    // Every file appears, in patch order, regardless of its hint.
    expect(entries.map((e) => e.path)).toEqual(expectedPaths)
    // Each entry carries at least one scope hint.
    for (const entry of entries) {
      expect(entry.hints.length).toBeGreaterThanOrEqual(1)
    }
  })
})
