import { lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { tool, type PluginModule } from "@opencode-ai/plugin"
import {
  defaultGitExec,
  failure,
  normalizeModelName,
  sanitizeSlug,
  success,
  type GitExec,
} from "../../lib/uf-workflow-types.js"

// Re-export envelope helpers and shared utilities for consumer convenience.
export { defaultGitExec, failure, normalizeModelName, sanitizeSlug, success } from "../../lib/uf-workflow-types.js"
export type { GitExec, ToolFailure, ToolResult, ToolSuccess } from "../../lib/uf-workflow-types.js"

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
          const sha = exec(["rev-parse", "--verify", candidate], cwd)
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
  const branch = exec(["rev-parse", "--abbrev-ref", "HEAD"], cwd)
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
// normalize_model_name tool
// ---------------------------------------------------------------------------

/**
 * Factory that creates the normalize_model_name tool.
 * Pure computation — no git or filesystem access needed.
 *
 * Algorithm (6 steps):
 * 1. Strip everything before and including the last `/`
 * 2. Strip everything after and including the first `@`
 * 3. Strip trailing date suffix matching `-YYYYMMDD` (regex: `-\d{8}$`)
 * 4. Repeatedly strip trailing version segments matching `-N` (single digit)
 * 5. Validate the result contains only `[a-zA-Z0-9._-]`
 * 6. Return `unknown-model` if the result is empty or invalid
 */
export function createNormalizeModelNameTool() {
  return tool({
    description:
      "Normalize a raw model identifier to a canonical short name. " +
      "Strips provider prefixes, @-suffixes, date suffixes, and trailing " +
      "version digits. Returns {normalized} on success.",
    parameters: {
      rawModelId: {
        type: "string",
        description:
          "Raw model identifier to normalize " +
          "(e.g. google-vertex-anthropic/claude-sonnet-4-20250514@default)",
      },
    },
    execute: async (args: { rawModelId: string }) => {
      const raw = args.rawModelId ?? ""
      const normalized = normalizeModelName(raw)

      if (normalized === "unknown-model" && raw.trim() !== "") {
        return {
          output: JSON.stringify(
            success({
              normalized,
              warning: `Could not normalize model identifier: ${raw}`,
            }),
          ),
        }
      }

      if (normalized === "unknown-model") {
        return {
          output: JSON.stringify(
            success({
              normalized,
              warning: "Empty rawModelId provided",
            }),
          ),
        }
      }

      return { output: JSON.stringify(success({ normalized })) }
    },
  })
}

// ---------------------------------------------------------------------------
// Git operation tools
// ---------------------------------------------------------------------------

/** Factory for the git_fetch tool. */
export function createGitFetchTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Fetch refs from a remote repository. " +
      "Accepts a remote name and optional branch to fetch.",
    parameters: {
      remote: {
        type: "string",
        description: "Remote name to fetch from (e.g. origin, upstream)",
      },
      branch: {
        type: "string",
        description: "Optional branch name to fetch",
      },
    },
    execute: async (args: { remote: string; branch?: string }) => {
      try {
        const gitArgs = args.branch
          ? ["fetch", args.remote, args.branch]
          : ["fetch", args.remote]
        const output = exec(gitArgs, cwd)
        console.log(output)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: true, code: "GIT_FETCH_ERROR" }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_push tool. */
export function createGitPushTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Push commits to the remote repository. " +
      "Optionally set upstream tracking for a branch.",
    parameters: {
      setUpstream: {
        type: "boolean",
        description: "Set upstream tracking (--set-upstream origin <branch>)",
      },
      branch: {
        type: "string",
        description: "Branch name (required when setUpstream is true)",
      },
    },
    execute: async (args: { setUpstream?: boolean; branch?: string }) => {
      try {
        const gitArgs =
          args.setUpstream && args.branch
            ? ["push", "--set-upstream", "origin", args.branch]
            : ["push"]
        const output = exec(gitArgs, cwd)
        console.log(output)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: true, code: "GIT_PUSH_ERROR" }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_push_force_with_lease tool. */
export function createGitPushForceWithLeaseTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Force-push with lease safety. Pushes to the remote using " +
      "--force-with-lease to prevent overwriting others' work.",
    execute: async () => {
      try {
        const output = exec(["push", "--force-with-lease"], cwd)
        console.log(output)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "GIT_PUSH_FORCE_ERROR",
            }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_merge tool. */
export function createGitMergeTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Merge a ref into the current branch. Returns conflict information " +
      "if the merge produces conflicts instead of failing.",
    parameters: {
      ref: {
        type: "string",
        description: "Git ref to merge (branch name, tag, or commit SHA)",
      },
    },
    execute: async (args: { ref: string }) => {
      try {
        const output = exec(["merge", args.ref], cwd)
        console.log(output)
        return {
          output: JSON.stringify(
            success({ success: true, conflicted: false }),
          ),
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        // Detect merge conflicts by checking error message.
        if (/conflict/i.test(msg)) {
          try {
            const filesOutput = exec(
              ["diff", "--name-only", "--diff-filter=U"],
              cwd,
            )
            const conflictingFiles = filesOutput
              .split("\n")
              .filter((f) => f.length > 0)
            return {
              output: JSON.stringify(
                success({
                  success: false,
                  conflicted: true,
                  conflictingFiles,
                }),
              ),
            }
          } catch {
            // Could not list conflict files — return empty array.
            return {
              output: JSON.stringify(
                success({
                  success: false,
                  conflicted: true,
                  conflictingFiles: [],
                }),
              ),
            }
          }
        }
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "GIT_MERGE_ERROR" }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_merge_abort tool. */
export function createGitMergeAbortTool(exec: GitExec, cwd: string) {
  return tool({
    description: "Abort an in-progress merge and restore the pre-merge state.",
    execute: async () => {
      try {
        const output = exec(["merge", "--abort"], cwd)
        console.log(output)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "GIT_MERGE_ABORT_ERROR",
            }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_rebase tool. */
export function createGitRebaseTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Rebase the current branch onto a ref. Returns conflict information " +
      "if the rebase produces conflicts instead of failing.",
    parameters: {
      ref: {
        type: "string",
        description:
          "Git ref to rebase onto (branch name, tag, or commit SHA)",
      },
    },
    execute: async (args: { ref: string }) => {
      try {
        const output = exec(["rebase", args.ref], cwd)
        console.log(output)
        return {
          output: JSON.stringify(
            success({ success: true, conflicted: false }),
          ),
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        // Detect rebase conflicts by checking error message.
        if (/conflict/i.test(msg)) {
          try {
            const filesOutput = exec(
              ["diff", "--name-only", "--diff-filter=U"],
              cwd,
            )
            const conflictingFiles = filesOutput
              .split("\n")
              .filter((f) => f.length > 0)
            return {
              output: JSON.stringify(
                success({
                  success: false,
                  conflicted: true,
                  conflictingFiles,
                }),
              ),
            }
          } catch {
            // Could not list conflict files — return empty array.
            return {
              output: JSON.stringify(
                success({
                  success: false,
                  conflicted: true,
                  conflictingFiles: [],
                }),
              ),
            }
          }
        }
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "GIT_REBASE_ERROR" }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_rebase_abort tool. */
export function createGitRebaseAbortTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Abort an in-progress rebase and restore the pre-rebase state.",
    execute: async () => {
      try {
        const output = exec(["rebase", "--abort"], cwd)
        console.log(output)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "GIT_REBASE_ABORT_ERROR",
            }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_conflict_files tool. */
export function createGitConflictFilesTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "List files with unresolved merge conflicts in the working tree.",
    execute: async () => {
      try {
        const output = exec(["diff", "--name-only", "--diff-filter=U"], cwd)
        const files = output.split("\n").filter((f) => f.length > 0)
        console.log(output)
        return { output: JSON.stringify(success({ files })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "GIT_CONFLICT_FILES_ERROR",
            }),
          ),
        }
      }
    },
  })
}

/** Factory for the git_commit_no_edit tool. */
export function createGitCommitNoEditTool(exec: GitExec, cwd: string) {
  return tool({
    description:
      "Commit staged changes using the default merge/rebase commit message " +
      "(--no-edit). Returns the short SHA of the new commit.",
    execute: async () => {
      try {
        const commitOutput = exec(["commit", "--no-edit"], cwd)
        console.log(commitOutput)
        const sha = exec(["rev-parse", "--short", "HEAD"], cwd)
        return { output: JSON.stringify(success({ success: true, sha })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(msg)
        return {
          output: JSON.stringify(
            failure(msg, {
              retryable: false,
              code: "GIT_COMMIT_NO_EDIT_ERROR",
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
        normalize_model_name: createNormalizeModelNameTool(),
        git_fetch: createGitFetchTool(defaultGitExec, cwd),
        git_push: createGitPushTool(defaultGitExec, cwd),
        git_push_force_with_lease: createGitPushForceWithLeaseTool(defaultGitExec, cwd),
        git_merge: createGitMergeTool(defaultGitExec, cwd),
        git_merge_abort: createGitMergeAbortTool(defaultGitExec, cwd),
        git_rebase: createGitRebaseTool(defaultGitExec, cwd),
        git_rebase_abort: createGitRebaseAbortTool(defaultGitExec, cwd),
        git_conflict_files: createGitConflictFilesTool(defaultGitExec, cwd),
        git_commit_no_edit: createGitCommitNoEditTool(defaultGitExec, cwd),
      },
    }
  },
} satisfies PluginModule

export default UfWorkflowPlugin
