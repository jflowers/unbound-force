import { execSync } from "node:child_process"
import { lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { tool, type PluginModule } from "@opencode-ai/plugin"
import { failure, success } from "../../lib/uf-workflow-types.js"

// Re-export envelope helpers for consumer convenience.
export { failure, success } from "../../lib/uf-workflow-types.js"
export type { ToolFailure, ToolResult, ToolSuccess } from "../../lib/uf-workflow-types.js"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Git execution function signature for testability. */
export type GitExec = (cmd: string, cwd: string) => string

// ---------------------------------------------------------------------------
// resolve_base_ref tool
// ---------------------------------------------------------------------------

/** Valid base-ref source labels. */
export type BaseRefSource = "upstream/main" | "origin/main" | "main"

/** Structured output from resolve_base_ref. */
export interface ResolveBaseRefData {
  ref: BaseRefSource
  sha: string
  source: BaseRefSource
}

/** Ordered candidate refs to try (no network access needed). */
const BASE_REF_CANDIDATES: readonly BaseRefSource[] = [
  "upstream/main",
  "origin/main",
  "main",
] as const

/** Default git executor using execSync. */
const defaultGitExec: GitExec = (cmd: string, cwd: string): string =>
  execSync(cmd, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim()

/**
 * Factory that creates the resolve_base_ref tool with injectable
 * git executor and working directory for testability.
 */
export function createResolveBaseRefTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Resolve the best available base ref for local review diffs. " +
      "Tries upstream/main, origin/main, then main (no network access). " +
      "Returns the ref name, its resolved SHA, and a source label.",
    execute: async () => {
      for (const candidate of BASE_REF_CANDIDATES) {
        try {
          const sha = exec(`git rev-parse --verify ${candidate}`, cwd)
          if (sha) {
            const data: ResolveBaseRefData = {
              ref: candidate,
              sha,
              source: candidate,
            }
            return { output: JSON.stringify(success(data)) }
          }
        } catch {
          // Candidate not available, try next.
        }
      }
      return {
        output: JSON.stringify(
          failure(
            `No resolvable base ref found. Tried: ${BASE_REF_CANDIDATES.join(", ")}`,
            { retryable: false, code: "NO_BASE_REF" },
          ),
        ),
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Checkpoint types
// ---------------------------------------------------------------------------

/** Persistent workflow progress state (FR-001, FR-007). */
export interface ProgressState {
  command: string
  branch: string
  key: string
  current_step: string
  completed_steps: string[]
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Checkpoint helpers
// ---------------------------------------------------------------------------

/** Progress state directory relative to project root. */
const PROGRESS_DIR = ".uf/progress"

/** Maximum slug length after sanitization (FR-004). */
const MAX_SLUG_LENGTH = 100

/**
 * Sanitize a string to a filesystem-safe slug (FR-004).
 * Replaces `/` with `-`, strips characters outside [a-zA-Z0-9._-],
 * and truncates to 100 characters. Applied to branch names,
 * explicit keys, and command names.
 */
export function sanitizeSlug(input: string): string {
  const result = input
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, MAX_SLUG_LENGTH)
  if (result === "") {
    const safe = input.slice(0, 100).replace(/[\x00-\x1f]/g, "?")
    throw new Error(
      `Invalid input: "${safe}" produces empty slug after sanitization`,
    )
  }
  return result
}

/**
 * Resolve the state key from an explicit key or auto-detected git
 * branch (FR-004). Detached HEAD without explicit key returns an error.
 */
export function resolveKey(
  exec: GitExec,
  cwd: string,
  explicitKey?: string,
): string {
  if (explicitKey !== undefined && explicitKey !== "") {
    return sanitizeSlug(explicitKey)
  }
  const branch = exec("git rev-parse --abbrev-ref HEAD", cwd)
  if (branch === "HEAD") {
    throw new Error(
      "Detached HEAD state — provide an explicit `key` parameter",
    )
  }
  return sanitizeSlug(branch)
}

/**
 * Compute state file path with path traversal protection (FR-005).
 * Both key and sanitizedCommand MUST be pre-sanitized by the caller.
 */
function statePath(
  cwd: string,
  key: string,
  sanitizedCommand: string,
): string {
  const progressRoot = resolve(cwd, PROGRESS_DIR)
  const filePath = resolve(
    progressRoot,
    key,
    `${sanitizedCommand}.json`,
  )
  if (!filePath.startsWith(progressRoot + "/")) {
    throw new Error(
      "Path traversal blocked: resolved path escapes .uf/progress/",
    )
  }
  return filePath
}

/** Type guard for ENOENT filesystem errors. */
function isEnoent(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  )
}

/**
 * Read state from disk. Returns null if file does not exist.
 * FR-005: Does not follow symlinks; reports I/O errors.
 */
function readState(
  cwd: string,
  key: string,
  sanitizedCommand: string,
): ProgressState | null {
  const fp = statePath(cwd, key, sanitizedCommand)
  try {
    const stats = lstatSync(fp)
    if (stats.isSymbolicLink()) {
      throw new Error("Refusing to read symlinked state file")
    }
    const raw = readFileSync(fp, "utf-8")
    return JSON.parse(raw) as ProgressState
  } catch (err: unknown) {
    if (isEnoent(err)) return null
    throw err
  }
}

/**
 * Write state to disk with restricted permissions (FR-005).
 * Creates directories with 0o700, files with 0o600.
 * Does not follow symlinks.
 */
function writeState(
  cwd: string,
  key: string,
  sanitizedCommand: string,
  state: ProgressState,
): void {
  const fp = statePath(cwd, key, sanitizedCommand)
  const dir = resolve(fp, "..")
  try {
    const dirStats = lstatSync(dir)
    if (dirStats.isSymbolicLink()) {
      throw new Error("Refusing to write into symlinked directory")
    }
  } catch (err: unknown) {
    if (!isEnoent(err)) throw err
    // Directory does not exist yet — will be created below.
  }
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  writeFileSync(fp, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 })
}

/**
 * Delete state file. Idempotent — succeeds silently when no file
 * exists (FR-003).
 */
function deleteState(
  cwd: string,
  key: string,
  sanitizedCommand: string,
): void {
  const fp = statePath(cwd, key, sanitizedCommand)
  try {
    const stat = lstatSync(fp)
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to delete symlinked state file: ${fp}`)
    }
    rmSync(fp)
  } catch (err: unknown) {
    if (isEnoent(err)) return
    throw err
  }
}

// ---------------------------------------------------------------------------
// Checkpoint tool factories (exported for testability)
// ---------------------------------------------------------------------------

/** Factory for the checkpoint tool (FR-001). */
export function createCheckpointTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Record a completed workflow step to persistent storage. " +
      "Creates or updates the progress state file with the step name, " +
      "merges optional data via shallow merge, and returns the updated state.",
    parameters: {
      command: {
        type: "string",
        description: "Command identifier (e.g. uf.unleash)",
      },
      step: {
        type: "string",
        description: "Step name to record as completed",
      },
      data: {
        type: "string",
        description:
          "Optional JSON object string to merge into state data via Object.assign",
      },
      key: {
        type: "string",
        description:
          "Optional state key override; defaults to sanitized current git branch",
      },
    },
    execute: async (args: {
      command: string
      step: string
      data?: string
      key?: string
    }) => {
      try {
        const key = resolveKey(exec, cwd, args.key)
        const cmd = sanitizeSlug(args.command)
        const now = new Date().toISOString()

        let dataToMerge: Record<string, unknown> | undefined
        if (args.data) {
          dataToMerge = JSON.parse(args.data) as Record<string, unknown>
        }

        let state = readState(cwd, key, cmd)

        if (state === null) {
          // First checkpoint — create new state.
          state = {
            command: args.command,
            branch: key,
            key,
            current_step: args.step,
            completed_steps: [args.step],
            data: dataToMerge ? { ...dataToMerge } : {},
            created_at: now,
            updated_at: now,
          }
        } else {
          // FR-001: Duplicate step is idempotent.
          if (!state.completed_steps.includes(args.step)) {
            state.completed_steps.push(args.step)
          }
          state.current_step = args.step
          // D3: Shallow merge via Object.assign.
          if (dataToMerge) {
            Object.assign(state.data, dataToMerge)
          }
          state.updated_at = now
        }

        writeState(cwd, key, cmd, state)
        return { output: JSON.stringify(success(state)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "CHECKPOINT_ERROR" }),
          ),
        }
      }
    },
  })
}

/** Factory for the get_progress tool (FR-002). */
export function createGetProgressTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Read the current progress state for a command. " +
      "Returns the full state object or null if no prior state exists.",
    parameters: {
      command: {
        type: "string",
        description: "Command identifier (e.g. uf.unleash)",
      },
      key: {
        type: "string",
        description:
          "Optional state key override; defaults to sanitized current git branch",
      },
    },
    execute: async (args: { command: string; key?: string }) => {
      try {
        const key = resolveKey(exec, cwd, args.key)
        const cmd = sanitizeSlug(args.command)
        const state = readState(cwd, key, cmd)
        return { output: JSON.stringify(success(state)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "GET_PROGRESS_ERROR",
            }),
          ),
        }
      }
    },
  })
}

/** Factory for the clear_progress tool (FR-003). */
export function createClearProgressTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Remove the progress state file for a command on successful " +
      "workflow completion. Idempotent — succeeds if no state exists.",
    parameters: {
      command: {
        type: "string",
        description: "Command identifier (e.g. uf.unleash)",
      },
      key: {
        type: "string",
        description:
          "Optional state key override; defaults to sanitized current git branch",
      },
    },
    execute: async (args: { command: string; key?: string }) => {
      try {
        const key = resolveKey(exec, cwd, args.key)
        const cmd = sanitizeSlug(args.command)
        deleteState(cwd, key, cmd)
        return {
          output: JSON.stringify(
            success({ cleared: true, command: args.command, key }),
          ),
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "CLEAR_PROGRESS_ERROR",
            }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Plugin entry point
// ---------------------------------------------------------------------------

/** UF Workflow plugin — provides workflow tools for review and release. */
const UfWorkflowPlugin = {
  id: "uf-workflow",
  server: async (input) => {
    const cwd = input.worktree || input.directory
    return {
      tool: {
        resolve_base_ref: createResolveBaseRefTool(defaultGitExec, cwd),
        checkpoint: createCheckpointTool(defaultGitExec, cwd),
        get_progress: createGetProgressTool(defaultGitExec, cwd),
        clear_progress: createClearProgressTool(defaultGitExec, cwd),
      },
    }
  },
} satisfies PluginModule

export default UfWorkflowPlugin
