/**
 * Tests for the shared per-run timeout derivation (OpenSpec change
 * derive-per-run-timeout, task 1.2 — RD-FR-028 scenarios).
 *
 * The derivation is a pure function of scalar signals (constitution
 * Principles II/IV): formula arithmetic, monotonicity in prompt bytes
 * and tier, contention gating and cap, floor-at-base, ceiling clamp
 * including the 1_800_000 executor bound, ceiling-below-base floor
 * precedence, tier-less zero profile term, determinism, and the
 * explicit-source passthrough (design D1/D2/D5).
 */
import { describe, expect, it } from "vitest"

import {
  CONTENTION_FACTOR_PER_PARALLEL_RUN,
  MAX_CONTENTION_MULTIPLIER,
  MAX_TIMEOUT_MS,
  MS_PER_KIB_ABOVE_FREE,
  PROMPT_FREE_BYTES,
  TIER_TERM_MS,
  contentionMultiplier,
  derivePerRunTimeoutMs,
  profileTermMs,
  promptTermMs,
  resolveBaseWindowMs,
  type TimeoutDerivationSignals,
} from "../lib/run-timeout.js"

/** Baseline signals matching the 2026-10-27 incident panel shape. */
function signals(overrides: Partial<TimeoutDerivationSignals> = {}): TimeoutDerivationSignals {
  return {
    baseMs: 1_200_000,
    promptBytes: PROMPT_FREE_BYTES,
    resolvedTier: "standard",
    sessionProfileTier: "standard",
    maxParallelRuns: 1,
    configuredCeilingMs: MAX_TIMEOUT_MS,
    ...overrides,
  }
}

describe("promptTermMs", () => {
  it("adds nothing at or below the free window", () => {
    expect(promptTermMs(0)).toBe(0)
    expect(promptTermMs(PROMPT_FREE_BYTES)).toBe(0)
  })

  it("charges whole KiB above the free window (D5 example)", () => {
    // 179_200 - 65_536 = 113_664 bytes = 111 KiB; 111 x 1_500 = 166_500.
    expect(promptTermMs(179_200)).toBe(166_500)
  })

  it("is monotonically non-decreasing in prompt bytes", () => {
    let previous = -1
    for (let bytes = 0; bytes <= 400_000; bytes += 517) {
      const term = promptTermMs(bytes)
      expect(term).toBeGreaterThanOrEqual(previous)
      previous = term
    }
  })
})

describe("profileTermMs", () => {
  it("applies the tier additive terms", () => {
    expect(profileTermMs("lightweight")).toBe(TIER_TERM_MS.lightweight)
    expect(profileTermMs("standard")).toBe(TIER_TERM_MS.standard)
    expect(profileTermMs("heavy")).toBe(TIER_TERM_MS.heavy)
    expect(TIER_TERM_MS.lightweight).toBe(0)
    expect(TIER_TERM_MS.standard).toBe(120_000)
    expect(TIER_TERM_MS.heavy).toBe(300_000)
  })

  it("derives zero for a tier-less (direct-model) entry", () => {
    expect(profileTermMs(null)).toBe(0)
  })
})

describe("contentionMultiplier", () => {
  it("is 1 at or below one parallel run", () => {
    expect(contentionMultiplier(1)).toBe(1)
    expect(contentionMultiplier(0)).toBe(1)
  })

  it("applies the configured factor above one run", () => {
    expect(contentionMultiplier(2)).toBe(1 + CONTENTION_FACTOR_PER_PARALLEL_RUN)
    expect(contentionMultiplier(4)).toBe(1.45)
  })

  it("caps at the maximum multiplier", () => {
    expect(contentionMultiplier(5)).toBe(MAX_CONTENTION_MULTIPLIER)
    expect(contentionMultiplier(8)).toBe(MAX_CONTENTION_MULTIPLIER)
    expect(MAX_CONTENTION_MULTIPLIER).toBe(1.5)
  })
})

describe("resolveBaseWindowMs", () => {
  it("uses the scalar limit for tier-less runs", () => {
    expect(resolveBaseWindowMs(null, { per_run_timeout_seconds: 1200 })).toBe(1_200_000)
  })

  it("uses the per-tier override when configured for the resolved tier", () => {
    expect(
      resolveBaseWindowMs("heavy", {
        per_run_timeout_seconds: 1200,
        per_run_timeout_tiers: { heavy: 1500 },
      }),
    ).toBe(1_500_000)
  })

  it("falls back to the scalar limit when the tier has no override", () => {
    expect(
      resolveBaseWindowMs("standard", {
        per_run_timeout_seconds: 1200,
        per_run_timeout_tiers: { heavy: 1500 },
      }),
    ).toBe(1_200_000)
  })
})

describe("derivePerRunTimeoutMs", () => {
  it("composes the formula: (base + prompt + profile) x multiplier", () => {
    const result = derivePerRunTimeoutMs(
      signals({ promptBytes: 179_200, resolvedTier: "heavy", maxParallelRuns: 1 }),
    )
    // 1_200_000 + 166_500 + 300_000 = 1_666_500, no multiplier.
    expect(result.effectiveMs).toBe(1_666_500)
    expect(result.provenance.source).toBe("derived")
    expect(result.provenance.clamped).toBe(false)
  })

  it("matches the incident-panel calibration (4-parallel, clamped at ceiling)", () => {
    const result = derivePerRunTimeoutMs(
      signals({ promptBytes: 179_200, resolvedTier: "heavy", maxParallelRuns: 4 }),
    )
    // 1_666_500 x 1.45 = 2_416_425 -> clamped to the 1_800_000 ceiling.
    expect(result.effectiveMs).toBe(MAX_TIMEOUT_MS)
    expect(result.provenance.clamped).toBe(true)
    expect(result.provenance.contention_multiplier).toBe(1.45)
    expect(result.provenance.ceiling_ms).toBe(MAX_TIMEOUT_MS)
  })

  it("is monotonically non-decreasing in prompt bytes", () => {
    let previous = -1
    for (let bytes = 0; bytes <= 400_000; bytes += 4_031) {
      const { effectiveMs } = derivePerRunTimeoutMs(signals({ promptBytes: bytes }))
      expect(effectiveMs).toBeGreaterThanOrEqual(previous)
      previous = effectiveMs
    }
  })

  it("is monotonically non-decreasing in tier", () => {
    const tiers = ["lightweight", "standard", "heavy"] as const
    let previous = -1
    for (const tier of tiers) {
      const { effectiveMs } = derivePerRunTimeoutMs(signals({ resolvedTier: tier }))
      expect(effectiveMs).toBeGreaterThanOrEqual(previous)
      previous = effectiveMs
    }
  })

  it("never reduces below the base window (floor)", () => {
    // Zero prompt and zero profile terms leave exactly the base.
    const result = derivePerRunTimeoutMs(
      signals({ promptBytes: 0, resolvedTier: "lightweight", maxParallelRuns: 1 }),
    )
    expect(result.effectiveMs).toBe(1_200_000)
  })

  it("clamps at the executor bound even with a higher configured ceiling", () => {
    const result = derivePerRunTimeoutMs(
      signals({
        promptBytes: 4_000_000,
        resolvedTier: "heavy",
        maxParallelRuns: 8,
        configuredCeilingMs: 3_600_000,
      }),
    )
    expect(result.effectiveMs).toBe(MAX_TIMEOUT_MS)
    expect(result.provenance.ceiling_ms).toBe(MAX_TIMEOUT_MS)
  })

  it("raises a configured ceiling below the base to the base (floor precedence)", () => {
    const result = derivePerRunTimeoutMs(signals({ configuredCeilingMs: 300_000 }))
    expect(result.effectiveMs).toBe(1_200_000)
    expect(result.provenance.ceiling_ms).toBe(1_200_000)
  })

  it("derives a zero profile term for tier-less entries", () => {
    const result = derivePerRunTimeoutMs(
      signals({ resolvedTier: null, sessionProfileTier: "heavy" }),
    )
    expect(result.effectiveMs).toBe(1_200_000)
    expect(result.provenance.profile_term_ms).toBe(0)
    expect(result.provenance.resolved_tier).toBeNull()
    // The session profile tier is provenance only and never alters the term.
    expect(result.provenance.session_profile_tier).toBe("heavy")
  })

  it("records every derivation input in the provenance record (D5)", () => {
    const result = derivePerRunTimeoutMs(
      signals({ promptBytes: 179_200, resolvedTier: "heavy", maxParallelRuns: 4 }),
    )
    expect(result.provenance).toEqual({
      effective_ms: MAX_TIMEOUT_MS,
      source: "derived",
      base_ms: 1_200_000,
      prompt_bytes: 179_200,
      prompt_term_ms: 166_500,
      profile_term_ms: 300_000,
      resolved_tier: "heavy",
      session_profile_tier: "standard",
      contention_multiplier: 1.45,
      max_parallel_runs: 4,
      ceiling_ms: MAX_TIMEOUT_MS,
      clamped: true,
    })
  })

  it("is deterministic: identical inputs produce identical output", () => {
    const input = signals({ promptBytes: 200_000, resolvedTier: "standard", maxParallelRuns: 4 })
    expect(derivePerRunTimeoutMs(input)).toEqual(derivePerRunTimeoutMs(input))
  })

  it("passes an explicit timeout through unchanged with source explicit", () => {
    const result = derivePerRunTimeoutMs(signals({ explicitTimeoutMs: 900_000 }))
    expect(result.effectiveMs).toBe(900_000)
    expect(result.provenance).toEqual({ effective_ms: 900_000, source: "explicit" })
  })
})
