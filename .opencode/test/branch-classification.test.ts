import { describe, expect, it } from "vitest"

import { classifyBranch, type BranchClassification } from "../lib/branch-classification.js"

// ---------------------------------------------------------------------------
// classifyBranch() — pure classification extracted from uf_finale_startup
// ---------------------------------------------------------------------------

describe("classifyBranch() opsx branches", () => {
  it("strips the opsx/ prefix to derive the change name", () => {
    const result: BranchClassification = classifyBranch("opsx/some-change")
    expect(result).toStrictEqual({
      branchType: "opsx",
      changeName: "some-change",
      isMain: false,
    })
  })

  it("returns an empty change name for the bare opsx/ prefix", () => {
    expect(classifyBranch("opsx/")).toStrictEqual({
      branchType: "opsx",
      changeName: "",
      isMain: false,
    })
  })

  it("preserves everything after the opsx/ prefix verbatim", () => {
    expect(classifyBranch("opsx/nested/change")).toStrictEqual({
      branchType: "opsx",
      changeName: "nested/change",
      isMain: false,
    })
  })

  it("does not flag opsx/main as main", () => {
    // isMain is an exact branch-name match, not derived from changeName.
    expect(classifyBranch("opsx/main")).toStrictEqual({
      branchType: "opsx",
      changeName: "main",
      isMain: false,
    })
  })
})

describe("classifyBranch() speckit branches", () => {
  it("strips the leading numeric prefix", () => {
    expect(classifyBranch("018-unleash-command")).toStrictEqual({
      branchType: "speckit",
      changeName: "unleash-command",
      isMain: false,
    })
  })

  it("returns an empty change name for a numeric prefix ending at the dash", () => {
    // /^\d+-/ matches "123-"; the replace leaves the empty string.
    expect(classifyBranch("123-")).toStrictEqual({
      branchType: "speckit",
      changeName: "",
      isMain: false,
    })
  })

  it("strips only the first numeric segment", () => {
    // /^\d+-/ is greedy over digits and the non-global replace removes
    // only the first match, so later numeric segments survive.
    expect(classifyBranch("123-456-foo")).toStrictEqual({
      branchType: "speckit",
      changeName: "456-foo",
      isMain: false,
    })
  })
})

describe("classifyBranch() main and master", () => {
  it("classifies main as other with isMain true", () => {
    expect(classifyBranch("main")).toStrictEqual({
      branchType: "other",
      changeName: "main",
      isMain: true,
    })
  })

  it("classifies master as other with isMain true", () => {
    expect(classifyBranch("master")).toStrictEqual({
      branchType: "other",
      changeName: "master",
      isMain: true,
    })
  })
})

describe("classifyBranch() unrecognized branches", () => {
  it("returns feature branches verbatim as other", () => {
    expect(classifyBranch("feature/foo")).toStrictEqual({
      branchType: "other",
      changeName: "feature/foo",
      isMain: false,
    })
  })

  it("classifies bare digits without a dash as other", () => {
    // /^\d+-/ requires a dash after the digits, so "123" is unrecognized.
    expect(classifyBranch("123")).toStrictEqual({
      branchType: "other",
      changeName: "123",
      isMain: false,
    })
  })

  it("requires an exact match for isMain", () => {
    expect(classifyBranch("main-branch")).toStrictEqual({
      branchType: "other",
      changeName: "main-branch",
      isMain: false,
    })
  })
})
