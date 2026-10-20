/** Minimal Bun runtime surface required by plugin server() registration. */
export type BunRuntime = { readonly YAML: { readonly parse: (text: string) => unknown } }

/**
 * Shim `Bun.YAML.parse` (JSON-backed) so review-dispatch and invoke-agent
 * `server()` registration — which constructs a Bun-backed YAML parser for
 * manifest dependencies — succeeds under the Node vitest environment.
 * Shared extraction of the shim previously duplicated per suite
 * (default.md CS-004; learning test-infrastructure-20261020T165710):
 * golden-output-shape.test.ts and registration-surface.test.ts import it
 * here; the older per-suite copies migrate opportunistically.
 */
export function withBun<T>(run: () => T | Promise<T>): Promise<T> {
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
