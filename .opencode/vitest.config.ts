import { defineConfig } from "vitest/config"

// Coverage thresholds enforce the measurable-verification gate. The
// statements floor is 94 percent (ts-plugin-coverage-gate design D2,
// raised from the fanout D14 floor of 90): it sits just under the
// unleash-tier-routing baselines (94.61 percent round-1, 94.58
// percent round-2 final recorded) and the 2026-10-22 measurement
// (95.18 percent, 3521 of 3699 statements), and it changes only
// through a spec-workflow governance change (issue #780). The
// branches floor stays 85 percent (review-council-multi-model-fanout
// design D14, unchanged). The plugin runtime is provider, GitHub,
// Dewey, and network free, so every test runs in the Node
// environment with the v8 coverage provider.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "plugins/**/*.ts",
        "lib/**/*.ts",
      ],
      exclude: [
        "plugins/**/*.test.ts",
        "lib/**/*.test.ts",
        "test/**",
      ],
      thresholds: {
        statements: 94,
        branches: 85,
      },
      reporter: ["text", "text-summary"],
    },
  },
})
