import type { PluginInput, PluginModule } from "@opencode-ai/plugin"
import { beforeAll, describe, expect, it } from "vitest"
import { z } from "zod"

import InvokeAgentPlugin from "../plugins/invoke-agent/index.js"
import ReviewDispatchPlugin from "../plugins/review-dispatch/index.js"
import UfFinalePlugin from "../plugins/uf-finale/index.js"
import UfWorkflowPlugin from "../plugins/uf-workflow/index.js"

// ---------------------------------------------------------------------------
// Layer 1 — registration surface (seam-verification task 1.1, issue #732)
//
// This suite generalizes the retired FR-004 args-exposure block (formerly
// uf-finale.test.ts:113-143, three uf-finale tools) to all four plugins.
// It loads each plugin module through the SDK's registration path — the
// same `module.server(fakeInput)` call the smoke tests and the OpenCode
// host make — and asserts, per registered tool, on the surface the SDK
// actually exposes. Background: the @opencode-ai/plugin `tool()` helper is
// an identity pass-through that reads only `args` (a zod raw shape); a
// factory declaring the pre-#732 mis-keyed `parameters:` plain-object form
// had its declaration silently ignored, exposing an empty parameter
// schema to the model while smoke tests (tool names only) stayed green.
// ---------------------------------------------------------------------------

/**
 * Runtime view of one registered tool definition. `tool()` returns its
 * input unchanged, so the object in the registry is exactly what the
 * OpenCode host consumes: `description` for the model, `args` as the zod
 * raw shape the host converts into the model-facing parameter schema and
 * validates tool input against, and `execute` for dispatch. The
 * compile-time `ToolDefinition` type promises `args` is a `ZodRawShape`;
 * this suite verifies the runtime keeps that promise.
 *
 * `parameters` is included (as unknown) so the pre-#732 mis-keyed
 * declaration form is observable: the SDK reads only `args`, so a
 * `parameters` key is invisible to the host (issue #732).
 */
interface RegisteredTool {
  readonly description: unknown
  readonly args?: Record<string, unknown> | undefined
  readonly parameters?: Record<string, unknown> | undefined
  readonly execute: unknown
}

/** Tool registry as returned by a plugin `server()` call. */
type ToolRegistry = Record<string, RegisteredTool>

/** Minimal Bun runtime surface required by plugin server() registration. */
type BunRuntime = { readonly YAML: { readonly parse: (text: string) => unknown } }

/** The four plugin modules whose registration surface this suite covers. */
const PLUGINS: ReadonlyArray<{ readonly id: string; readonly module: PluginModule }> = [
  { id: "uf-workflow", module: UfWorkflowPlugin },
  { id: "uf-finale", module: UfFinalePlugin },
  { id: "review-dispatch", module: ReviewDispatchPlugin },
  { id: "invoke-agent", module: InvokeAgentPlugin },
]

/**
 * Shim `Bun.YAML.parse` (JSON-backed) so review-dispatch and invoke-agent
 * server() registration — which constructs a Bun-backed YAML parser for
 * manifest dependencies — succeeds under the Node vitest environment.
 * Same pattern as build-review-prompts.test.ts and
 * plugin-integration.test.ts.
 */
function withBun<T>(run: () => T | Promise<T>): Promise<T> {
  const runtime = globalThis as typeof globalThis & { Bun?: BunRuntime }
  const original = runtime.Bun
  runtime.Bun = { YAML: { parse: (text: string): unknown => JSON.parse(text) as unknown } }
  const finish = (): void => {
    runtime.Bun = original
  }
  try {
    return Promise.resolve(run()).finally(finish)
  } catch (error) {
    finish()
    throw error
  }
}

/**
 * Minimal fake PluginInput for the smoke-test loading pattern: server()
 * registration creates tool factories without touching the filesystem or
 * network (all dependencies are captured lazily).
 */
function fakePluginInput(): PluginInput {
  return {
    directory: "/tmp/fake",
    worktree: "/tmp/fake",
    client: {} as PluginInput["client"],
  } as PluginInput
}

/**
 * Load a plugin's tool registry through the SDK's registration path.
 * @param module Plugin module whose registered surface to load.
 * @returns The `tool` record the OpenCode host consumes.
 */
async function registeredTools(module: PluginModule): Promise<ToolRegistry> {
  const hooks = await module.server(fakePluginInput())
  return (hooks.tool ?? {}) as ToolRegistry
}

/**
 * Parameter names the tool declaration carries, under either the
 * SDK-recognized `args` key or the pre-#732 mis-keyed `parameters` key.
 * The union keeps a mis-keyed declaration observable to the biconditional
 * in the (b) assertion: parameters declared but not exposed.
 */
function declaredParameterKeys(toolDef: RegisteredTool): Set<string> {
  const keys = new Set<string>()
  for (const source of [toolDef.args, toolDef.parameters]) {
    if (source !== undefined) {
      for (const key of Object.keys(source)) {
        keys.add(key)
      }
    }
  }
  return keys
}

/** Parameter names the SDK exposes to the model: the `args` keys only. */
function exposedParameterKeys(toolDef: RegisteredTool): string[] {
  return toolDef.args !== undefined ? Object.keys(toolDef.args) : []
}

const registries = new Map<string, ToolRegistry>()

beforeAll(async () => {
  await withBun(async () => {
    for (const plugin of PLUGINS) {
      registries.set(plugin.id, await registeredTools(plugin.module))
    }
  })
})

for (const plugin of PLUGINS) {
  describe(`registration surface: ${plugin.id}`, () => {
    /** Registry for this plugin, loaded once in beforeAll. */
    function registry(): ToolRegistry {
      return registries.get(plugin.id) ?? {}
    }

    it("registers a non-empty tool set, enumerated dynamically from the module", () => {
      // Dynamic enumeration means added tools are auto-covered; tool
      // removal stays guarded by the existing name-list smoke tests.
      expect(Object.keys(registry()).length).toBeGreaterThan(0)
    })

    it("(a) registers every tool with a description and an execute function", () => {
      for (const [name, toolDef] of Object.entries(registry())) {
        expect(toolDef, `${plugin.id}.${name} must be present in the registry`).toBeDefined()
        expect(
          typeof toolDef?.description,
          `${plugin.id}.${name} must expose a string description`,
        ).toBe("string")
        expect(
          typeof toolDef?.execute,
          `${plugin.id}.${name} must expose an execute function`,
        ).toBe("function")
      }
    })

    it("(b) exposes a parameter schema that is non-empty exactly when the tool declares parameters", () => {
      for (const [name, toolDef] of Object.entries(registry())) {
        // The SDK reads only `args`; a `parameters` key is silently
        // ignored, so the model-facing schema comes from `args` alone.
        expect(
          toolDef,
          `${plugin.id}.${name} must not declare the pre-#732 mis-keyed ` +
            "parameters: form — the SDK's tool() helper reads only args, so the " +
            "declaration is silently ignored and the model sees an empty schema",
        ).not.toHaveProperty("parameters")

        const exposed = exposedParameterKeys(toolDef)
        const declared = declaredParameterKeys(toolDef)
        expect(
          exposed.length > 0,
          `${plugin.id}.${name} exposed parameter schema [${exposed.join(", ")}] ` +
            `must be non-empty exactly when the tool declares parameters ` +
            `[${[...declared].join(", ")}] — a tool that declares parameters the SDK ` +
            "cannot see is the issue #732 defect form (empty == empty is correct: " +
            "resolve_base_ref declares none)",
        ).toBe(declared.size > 0)
      }
    })

    it("(c) exposes schema keys in parity with the zod shape the execute path validates", () => {
      for (const [name, toolDef] of Object.entries(registry())) {
        const declared = declaredParameterKeys(toolDef)
        if (declared.size === 0) {
          continue // No declared parameters — nothing is exposed or validated.
        }
        expect(
          toolDef.args,
          `${plugin.id}.${name} declares parameters [${[...declared].join(", ")}], so ` +
            "args must carry the zod shape the execute path validates — a missing args " +
            "value means the declaration is mis-keyed and nothing reaches the model " +
            "(issue #732)",
        ).toBeDefined()

        // The host derives the model-facing schema and validates tool
        // input through the same z.object(args) conversion; parity holds
        // only when that conversion reproduces the exposed keys. A
        // non-zod shape (plain { type, description } values) throws here.
        const objectSchema = z.object(toolDef.args as z.ZodRawShape)
        expect(
          [...Object.keys(objectSchema.shape)].sort(),
          `${plugin.id}.${name} z.object(args) validation shape must match the ` +
            "exposed schema keys",
        ).toEqual(exposedParameterKeys(toolDef).sort())
      }
    })

    it("declares parameters as a zod raw shape under args (structural fallback, pre-#732 guard)", () => {
      // Structural fallback (interim mechanism of record): the plugin
      // registry surfaces no computed parameter schema — tool() is an
      // identity pass-through, so the registered object's `args` value is
      // the input the host converts into the model-facing schema.
      // Transition condition: when the SDK registry exposes parameter
      // schemas directly, move these assertions to that SDK surface
      // without changing the contract; until then this structural check
      // is the mechanism of record. The pre-#732 `parameters:`
      // plain-object form fails both this path and the SDK path above.
      for (const [name, toolDef] of Object.entries(registry())) {
        const declared = declaredParameterKeys(toolDef)
        if (declared.size === 0) {
          continue // No declared parameters — resolve_base_ref passes empty.
        }
        expect(
          toolDef.args,
          `${plugin.id}.${name} declares parameters [${[...declared].join(", ")}], so ` +
            "its args value must be a zod raw shape (z.ZodType values) — undefined " +
            "means the declaration is mis-keyed (parameters:) and invisible to the " +
            "SDK (issue #732)",
        ).toBeDefined()
        for (const [key, value] of Object.entries(toolDef.args ?? {})) {
          expect(
            value instanceof z.ZodType,
            `${plugin.id}.${name}.${key} args value must be a zod schema ` +
              "(z.ZodType) — the pre-#732 plain-object form " +
              "({ type, description }) is not a zod raw shape",
          ).toBe(true)
        }
      }
    })
  })
}
