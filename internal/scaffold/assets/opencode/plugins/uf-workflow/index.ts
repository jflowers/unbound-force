import { Buffer } from "node:buffer"
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { lstat, readFile, readdir, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"
import { tool, type PluginInput, type PluginModule } from "@opencode-ai/plugin"
import { z } from "zod"
import {
  DEFAULT_TIMEOUT_MILLISECONDS,
  PromptSchema,
  TimeoutSchema,
  executeAgentSession,
  resolveHostModel,
  type InvocationProvenance,
  type InvocationUsage,
} from "../../lib/agent-executor.js"
import { classifyBranch } from "../../lib/branch-classification.js"
import {
  DISPATCH_ARTIFACT_DIRECTORY,
  parseReviewDispatchArtifact,
  type ReviewDispatchArtifactSummary,
} from "../../lib/review-dispatch-artifact.js"
import {
  defaultGitExec,
  failure,
  normalizeModelName,
  sanitizeSlug,
  success,
  type GitExec,
} from "../../lib/uf-workflow-types.js"
import {
  UNLEASH_EXIT_VARIANTS,
  WORKFLOW_TIERS,
  formatUnleashDemo,
  formatUnleashExit,
} from "../../lib/unleash-templates.js"

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

/**
 * Create-or-update checkpoint state — the single mutation primitive both
 * the checkpoint tool and recordAutoCheckpoint consume. Semantics are
 * identical for both (FR-001/D3/D5): idempotent step append, shallow
 * data merge via Object.assign, timestamp refresh. Returns the updated
 * state. Throws on state I/O failure so callers fail closed.
 */
function upsertCheckpointStep(
  cwd: string,
  key: string,
  command: string,
  step: string,
  data?: Record<string, unknown>,
): ProgressState {
  const cmd = sanitizeSlug(command)
  const now = new Date().toISOString()

  let state = readState(cwd, key, cmd)

  if (state === null) {
    // First checkpoint — create new state.
    state = {
      command,
      branch: key,
      key,
      current_step: step,
      completed_steps: [step],
      data: data ? { ...data } : {},
      created_at: now,
      updated_at: now,
    }
  } else {
    // FR-001: Duplicate step is idempotent.
    if (!state.completed_steps.includes(step)) {
      state.completed_steps.push(step)
    }
    state.current_step = step
    // D3: Shallow merge via Object.assign.
    if (data) {
      Object.assign(state.data, data)
    }
    state.updated_at = now
  }

  writeState(cwd, key, cmd, state)
  return state
}

/**
 * Record a step checkpoint through the same state path as the checkpoint
 * tool (design decision D5: tools that complete pipeline steps persist
 * their own progress, so the command's ceremony blockquotes disappear).
 * Delegates to upsertCheckpointStep so the checkpoint tool and the
 * auto-recording path share one mutation primitive. Throws on state I/O
 * failure so callers fail closed.
 */
function recordAutoCheckpoint(
  cwd: string,
  key: string,
  command: string,
  step: string,
  data: Record<string, unknown>,
): void {
  upsertCheckpointStep(cwd, key, command, step, data)
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

        let dataToMerge: Record<string, unknown> | undefined
        if (args.data) {
          dataToMerge = JSON.parse(args.data) as Record<string, unknown>
        }

        const state = upsertCheckpointStep(
          cwd,
          key,
          args.command,
          args.step,
          dataToMerge,
        )
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
        exec(gitArgs, cwd)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(gitArgs, cwd)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(["push", "--force-with-lease"], cwd)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(["merge", args.ref], cwd)
        return {
          output: JSON.stringify(
            success({ success: true, conflicted: false }),
          ),
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(["merge", "--abort"], cwd)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(["rebase", args.ref], cwd)
        return {
          output: JSON.stringify(
            success({ success: true, conflicted: false }),
          ),
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(["rebase", "--abort"], cwd)
        return { output: JSON.stringify(success({ success: true })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        return { output: JSON.stringify(success({ files })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
        exec(["commit", "--no-edit"], cwd)
        const sha = exec(["rev-parse", "--short", "HEAD"], cwd)
        return { output: JSON.stringify(success({ success: true, sha })) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
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
// uf_unleash_branch_gate tool
// ---------------------------------------------------------------------------

/**
 * Workflow tier a gated feature branch belongs to. Derived from the shared
 * WORKFLOW_TIERS list in lib/unleash-templates.ts, the single source shared
 * with UnleashTier and ExitTierSchema.
 */
export type WorkflowTier = (typeof WORKFLOW_TIERS)[number]

/**
 * File-existence checker signature for testability (mirrors GitExec):
 * receives an absolute path and reports whether it exists. The default
 * implementation follows symlinks, matching the shell `[ -f ]` test the
 * original gate used.
 */
export type FileExists = (path: string) => boolean

/** Default file-existence checker backed by existsSync. */
const defaultFileExists: FileExists = (path: string): boolean => existsSync(path)

/** Structured output from uf_unleash_branch_gate. */
export interface UnleashBranchGateData {
  /** Current git branch name. */
  branch: string
  /** Workflow tier inferred from the branch naming convention. */
  workflow_tier: WorkflowTier
  /** Feature directory (trailing slash) relative to the repo root. */
  feature_dir: string
  /**
   * Change name: the opsx change id, or the speckit name with the numeric
   * prefix stripped (classifyBranch semantics).
   */
  change_name: string
}

/**
 * Factory that creates the uf_unleash_branch_gate tool with injectable
 * git executor, working directory, and file-existence checker for
 * testability.
 *
 * Gate semantics (OpenSpec change unleash-deterministic-tools, D3):
 * - main/master → failure ON_MAIN with the command's exact STOP message
 * - opsx/<name> → tier openspec, feature_dir openspec/changes/<name>/,
 *   tasks.md existence check → failure NO_TASKS
 * - NNN-* → tier speckit, feature_dir specs/<raw-branch>/ (the common.sh
 *   convention — never derived from changeName, which strips the numeric
 *   prefix), spec.md existence check → failure NO_SPEC
 * - anything else → failure UNRECOGNIZED_BRANCH
 *
 * On success the tool auto-checkpoints "branch-safety-gate" for command
 * "uf.unleash" through the same writeState path as the checkpoint tool
 * (D5), recording tier/feature-dir data.
 *
 * @param exec Git executor used to read the current branch.
 * @param cwd Repository root used to resolve prerequisite paths.
 * @param fileExists File-existence checker for prerequisite artifacts.
 * @returns The uf_unleash_branch_gate tool.
 */
export function createUnleashBranchGateTool(exec: GitExec, cwd: string, fileExists: FileExists): ReturnType<typeof tool> {
  return tool({
    description:
      "Branch safety gate for /uf.unleash: reads the current branch, " +
      "classifies it as OpenSpec (opsx/*) or Speckit (NNN-*), verifies the " +
      "tier prerequisite (openspec/changes/<name>/tasks.md or " +
      "specs/<branch>/spec.md), and returns {branch, workflow_tier, " +
      "feature_dir, change_name}. Rejection envelopes (ON_MAIN, NO_TASKS, " +
      "NO_SPEC, UNRECOGNIZED_BRANCH) carry the command's exact STOP " +
      "messages. Auto-checkpoints branch-safety-gate on success.",
    execute: async () => {
      try {
        const branch = exec(["rev-parse", "--abbrev-ref", "HEAD"], cwd)
        // Shared pure classifier (lib/branch-classification) so the gate
        // and uf_finale_startup cannot drift apart (DRY; D3).
        const { branchType, changeName, isMain } = classifyBranch(branch)

        if (isMain) {
          return {
            output: JSON.stringify(
              failure(
                "Cannot run /uf.unleash on main. Must be on a Speckit (`NNN-*`) or OpenSpec (`opsx/*`) feature branch.",
                { retryable: false, code: "ON_MAIN" },
              ),
            ),
          }
        }

        let workflowTier: WorkflowTier
        let featureDir: string

        if (branchType === "opsx") {
          workflowTier = "openspec"
          featureDir = `openspec/changes/${changeName}/`
          if (!fileExists(resolve(cwd, featureDir, "tasks.md"))) {
            return {
              output: JSON.stringify(
                failure(
                  `No tasks.md found for change \`${changeName}\`. Run \`/opsx-propose\` first.`,
                  { retryable: false, code: "NO_TASKS" },
                ),
              ),
            }
          }
        } else if (branchType === "speckit") {
          workflowTier = "speckit"
          // D3: the feature dir derives from the RAW branch (the common.sh
          // convention) — changeName strips the numeric prefix, but the
          // specs/ directory keeps it (e.g. specs/018-unleash-command/).
          featureDir = `specs/${branch}/`
          if (!fileExists(resolve(cwd, featureDir, "spec.md"))) {
            return {
              output: JSON.stringify(
                failure(
                  "No spec.md found in the feature directory. Run `/speckit.specify` first.",
                  { retryable: false, code: "NO_SPEC" },
                ),
              ),
            }
          }
        } else {
          return {
            output: JSON.stringify(
              failure(
                "Unrecognized branch pattern. /uf.unleash requires a Speckit feature branch (`NNN-*`) or OpenSpec branch (`opsx/*`). Run `/speckit.specify` or `/opsx-propose` to create one.",
                { retryable: false, code: "UNRECOGNIZED_BRANCH" },
              ),
            ),
          }
        }

        // D5: auto-checkpoint through the same state path the checkpoint
        // tool uses, so resumability detection sees the gate complete.
        // The state key is the sanitized branch — identical to what the
        // checkpoint tool derives via resolveKey, without a second git
        // round-trip.
        recordAutoCheckpoint(cwd, sanitizeSlug(branch), "uf.unleash", "branch-safety-gate", {
          workflow_tier: workflowTier,
          feature_dir: featureDir,
        })

        const data: UnleashBranchGateData = {
          branch,
          workflow_tier: workflowTier,
          feature_dir: featureDir,
          change_name: changeName,
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "BRANCH_GATE_ERROR" }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// uf_delegate_command tool
// ---------------------------------------------------------------------------

/**
 * Maximum command-file size accepted by uf_delegate_command (1 MiB),
 * matching the review-dispatch string-input bound.
 */
const MAX_COMMAND_FILE_BYTES = 1 * 1024 * 1024 // 1 MiB

/**
 * Exact /uf.unleash Step 2 STOP message when a delegated plan generation
 * finishes without creating plan.md (reproduced verbatim from the command).
 */
const PLAN_ARTIFACT_STOP_MESSAGE =
  "Plan generation failed -- plan.md was not created. Check the agent output for errors."

/**
 * Exact /uf.unleash Step 3 STOP message when a delegated task generation
 * finishes without creating tasks.md (reproduced verbatim from the command).
 */
const TASKS_ARTIFACT_STOP_MESSAGE =
  "Task generation failed -- tasks.md was not created. Check the agent output for errors."

/** Structured output from uf_delegate_command. */
export interface DelegateCommandData {
  /** Agent the command or task was delegated to. */
  agent: string
  /** Child session exit status (always "success" in this envelope). */
  status: "success"
  /** Child session ID created by the executor (null when unavailable). */
  child_session_id: string | null
  /** Whether the expected artifact was verified (false when none was supplied). */
  artifact_created: boolean
  /** Whether checkpoint_step was recorded through the progress state store. */
  checkpoint_recorded: boolean
  /** Child session usage, when the executor reported step-finish parts. */
  usage: InvocationUsage | null
  /** Request, host-resolution, and child-report provenance. */
  provenance: InvocationProvenance
  /** Child session response text. */
  text: string
}

/**
 * Injected session and I/O dependencies for uf_delegate_command, mirroring
 * InvokeAgentDependencies so tests never touch a real client or filesystem.
 */
export interface DelegateCommandDependencies {
  /** OpenCode client used for host model resolution and child session lifecycle. */
  readonly client: PluginInput["client"]
  /** Reads UTF-8 text from an absolute path (command-file input). */
  readonly readText: (path: string) => Promise<string>
  /** File-existence checker for expected-artifact verification. */
  readonly fileExists: FileExists
}

/**
 * Agent names accepted by uf_delegate_command. Reviewer agents (divisor-*)
 * are rejected in validation so the delegation/review boundary is structural
 * (D2): review invocations belong to invoke_agent.
 */
const DelegateAgentSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((value) => !/^divisor-/.test(value), {
    message:
      "reviewer agents (divisor-*) are dispatched via invoke_agent; uf_delegate_command is for content delegation",
  })

/** zod-validated input contract for uf_delegate_command. */
const DelegateCommandInputSchema = z
  .object({
    agent: DelegateAgentSchema.default("cobalt-crush-dev"),
    command_path: z.string().min(1).max(1024).optional(),
    prompt: PromptSchema.optional(),
    feature_dir: z.string().min(1).max(1024).optional(),
    expected_artifact: z.string().min(1).max(1024).optional(),
    checkpoint_step: z.string().min(1).max(128).optional(),
    phase: z.number().int().min(1).max(1000).optional(),
    timeout: TimeoutSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    // Prompt-only delegation (per-task implement and code-fix calls) omits
    // command_path but must still carry instructions.
    if (input.command_path === undefined && input.prompt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "one of command_path or prompt is required",
      })
    }
  })

/**
 * Resolve a repo-relative path against the repository root with path
 * traversal protection. Returns the absolute path, or null when the
 * resolved path escapes the root (same guard as statePath, FR-005).
 */
function resolveRepoRelative(cwd: string, relativePath: string): string | null {
  const resolved = resolve(cwd, relativePath)
  if (!resolved.startsWith(cwd + "/")) {
    return null
  }
  return resolved
}

/**
 * STOP message for a missing expected artifact. plan.md and tasks.md carry
 * the /uf.unleash Step 2/Step 3 STOP text verbatim; every other artifact
 * gets an analogous message naming the missing repo-relative path.
 */
function expectedArtifactStopMessage(expectedArtifact: string): string {
  const base = basename(expectedArtifact)
  if (base === "plan.md") {
    return PLAN_ARTIFACT_STOP_MESSAGE
  }
  if (base === "tasks.md") {
    return TASKS_ARTIFACT_STOP_MESSAGE
  }
  return `Artifact generation failed -- ${expectedArtifact} was not created. Check the agent output for errors.`
}

/**
 * Factory that creates the uf_delegate_command tool with injectable git
 * executor, working directory, and session/I/O dependencies for
 * testability.
 *
 * Delegation semantics (OpenSpec change unleash-deterministic-tools, D2):
 * - agent defaults to cobalt-crush-dev; divisor-* reviewer agents are
 *   rejected in zod validation (INVALID_AGENT) — review invocations belong
 *   to invoke_agent, and the reviewer manifest is deliberately NOT
 *   consulted here
 * - command_path is optional: prompt-only delegation (per-task implement
 *   and code-fix calls) omits it and passes the raw task or fix
 *   description through prompt
 * - the command file is read repo-relative with traversal protection (the
 *   statePath guard) and a 1 MiB size bound
 * - the prompt is composed deterministically: command text when present,
 *   then feature-dir context, then the extra prompt
 * - the child session runs through the shared executeAgentSession executor
 *   (host model resolution via parent introspection, parenting, abort
 *   linkage, timeout — default 600,000 ms) and expected_artifact is
 *   verified after the run; a missing artifact returns the command's exact
 *   STOP message (EXPECTED_ARTIFACT_MISSING)
 * - on success (child completed and artifact verified when supplied) the
 *   tool auto-checkpoints checkpoint_step for command "uf.unleash" through
 *   the same writeState path as the checkpoint tool (D5), recording the
 *   delegation facts as data
 *
 * @param exec Git executor used to derive the auto-checkpoint state key.
 * @param cwd Repository root used for repo-relative path resolution.
 * @param deps Client, command-file reader, and artifact-existence dependencies.
 * @returns The uf_delegate_command tool.
 */
export function createDelegateCommandTool(
  exec: GitExec,
  cwd: string,
  deps: DelegateCommandDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Delegate a command or task to a content agent (default cobalt-crush-dev) in a " +
      "parented child session with host model resolution. Reads the command file from " +
      "command_path when supplied (repo-relative, traversal-safe, max 1 MiB), composes " +
      "the prompt (command text + feature-dir context + extra prompt), verifies " +
      "expected_artifact after the run (missing artifacts return the command's exact " +
      "STOP message), and auto-checkpoints checkpoint_step on success. Reviewer agents " +
      "(divisor-*) are rejected — use invoke_agent for review invocations.",
    args: {
      agent: DelegateCommandInputSchema.shape.agent.describe(
        "Content agent to delegate to (default cobalt-crush-dev). Reviewer agents (divisor-*) are rejected; dispatch them via invoke_agent.",
      ),
      command_path: DelegateCommandInputSchema.shape.command_path.describe(
        "Optional repo-relative path to the command markdown (e.g. .opencode/commands/speckit.plan.md). Omit for prompt-only delegation.",
      ),
      prompt: DelegateCommandInputSchema.shape.prompt.describe(
        "Optional extra instructions appended after the command text and feature-dir context (task descriptions for implement delegation).",
      ),
      feature_dir: DelegateCommandInputSchema.shape.feature_dir.describe(
        "Optional feature directory (e.g. specs/018-name/ or openspec/changes/name/) appended to the prompt as working context.",
      ),
      expected_artifact: DelegateCommandInputSchema.shape.expected_artifact.describe(
        "Optional repo-relative path verified after the run (compose from the feature dir, e.g. specs/018-name/plan.md).",
      ),
      checkpoint_step: DelegateCommandInputSchema.shape.checkpoint_step.describe(
        "Optional step name auto-checkpointed for command uf.unleash on success (e.g. plan, tasks, implement).",
      ),
      phase: DelegateCommandInputSchema.shape.phase.describe(
        "Optional 1-based tasks.md phase number recorded as checkpoint data with checkpoint_step \"implement\" " +
          "for per-task delegation (same numbering as the implement exit variants).",
      ),
      timeout: DelegateCommandInputSchema.shape.timeout.describe(
        "Optional run timeout in milliseconds (bounded to 1_800_000; default 600_000).",
      ),
    },
    async execute(args, context) {
      try {
        const parsed = DelegateCommandInputSchema.safeParse(args)
        if (!parsed.success) {
          // The agent-field refine is the structural delegation/review
          // boundary (D2), so agent validation failures get their own code.
          const agentIssue = parsed.error.issues.find((issue) => issue.path[0] === "agent")
          if (agentIssue !== undefined) {
            return {
              output: JSON.stringify(
                failure(agentIssue.message, { retryable: false, code: "INVALID_AGENT" }),
              ),
            }
          }
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // Read the command file when supplied: repo-relative resolution with
        // traversal protection, then a size bound (invoke-agent prompt-file
        // pattern: read, then check bytes).
        let commandText: string | undefined
        if (input.command_path !== undefined) {
          const commandAbs = resolveRepoRelative(cwd, input.command_path)
          if (commandAbs === null) {
            return {
              output: JSON.stringify(
                failure(
                  "Path traversal blocked: command_path resolves outside the repository root",
                  { retryable: false, code: "COMMAND_PATH_TRAVERSAL" },
                ),
              ),
            }
          }
          let text: string
          try {
            text = await deps.readText(commandAbs)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            return {
              output: JSON.stringify(
                failure(`Cannot read command file: ${msg}`, {
                  retryable: false,
                  code: "COMMAND_FILE_READ_FAILED",
                }),
              ),
            }
          }
          if (Buffer.byteLength(text, "utf8") > MAX_COMMAND_FILE_BYTES) {
            return {
              output: JSON.stringify(
                failure(
                  `Command file exceeds 1 MiB limit (${Buffer.byteLength(text, "utf8")} bytes)`,
                  { retryable: false, code: "COMMAND_FILE_TOO_LARGE" },
                ),
              ),
            }
          }
          commandText = text
        }

        // Pre-resolve expected_artifact so a path escaping the repository
        // fails fast instead of wasting a child session run.
        let artifact: { relative: string; absolute: string } | null = null
        if (input.expected_artifact !== undefined) {
          const artifactAbs = resolveRepoRelative(cwd, input.expected_artifact)
          if (artifactAbs === null) {
            return {
              output: JSON.stringify(
                failure(
                  "Path traversal blocked: expected_artifact resolves outside the repository root",
                  { retryable: false, code: "EXPECTED_ARTIFACT_TRAVERSAL" },
                ),
              ),
            }
          }
          artifact = { relative: input.expected_artifact, absolute: artifactAbs }
        }

        // Compose the prompt deterministically: command text (when present),
        // then feature-dir context, then extra instructions.
        const sections: string[] = []
        if (commandText !== undefined) {
          sections.push(commandText)
        }
        if (input.feature_dir !== undefined) {
          sections.push(`Feature directory: ${input.feature_dir}`)
        }
        if (input.prompt !== undefined) {
          sections.push(input.prompt)
        }
        const promptText = sections.join("\n\n")

        // Resolve the host model through parent-session introspection so the
        // child replays the parent's active model and variant.
        let host: Awaited<ReturnType<typeof resolveHostModel>>
        try {
          host = await resolveHostModel(
            {
              client: deps.client,
              sessionID: context.sessionID,
              messageID: context.messageID,
              directory: context.directory,
            },
            context.abort,
          )
        } catch (err: unknown) {
          if (context.abort.aborted) {
            return {
              output: JSON.stringify(
                failure("uf_delegate_command run was cancelled", {
                  retryable: false,
                  code: "DELEGATE_CANCELLED",
                }),
              ),
            }
          }
          const msg = err instanceof Error ? err.message : String(err)
          return {
            output: JSON.stringify(
              failure(msg, { retryable: true, code: "HOST_MODEL_UNAVAILABLE" }),
            ),
          }
        }

        // Content delegation writes files (plans, tasks, code), so the
        // provenance records read_only: false, unlike review invocations.
        const provenance: InvocationProvenance = {
          agent: input.agent,
          requested_model: null,
          requested_variant: null,
          resolved_parent_model: host.identity.combined,
          resolved_parent_variant: host.variant,
          reported_child_model: null,
          model_mismatch: false,
          read_only: false,
        }

        // Delegate the child session lifecycle to the shared executor.
        const result = await executeAgentSession(
          {
            client: deps.client,
            sessionID: context.sessionID,
            directory: context.directory,
            parentAbort: context.abort,
            timeoutMilliseconds: input.timeout ?? DEFAULT_TIMEOUT_MILLISECONDS,
          },
          input.agent,
          promptText,
          host.identity,
          host.variant,
          false,
          provenance,
        )

        if (result.status !== "success" || result.error !== null) {
          const code = result.status === "cancelled" ? "DELEGATE_CANCELLED" : "DELEGATE_FAILED"
          return {
            output: JSON.stringify(
              failure(
                result.error !== null
                  ? `${result.error.code}: ${result.error.message}`
                  : `delegated run ended with status "${result.status}"`,
                { retryable: result.error?.retryable ?? false, code },
              ),
            ),
          }
        }

        // Verify the expected artifact after the run (Step 2/3 semantics);
        // a missing artifact carries the command's exact STOP message.
        let artifactCreated = false
        if (artifact !== null) {
          artifactCreated = deps.fileExists(artifact.absolute)
          if (!artifactCreated) {
            return {
              output: JSON.stringify(
                failure(expectedArtifactStopMessage(artifact.relative), {
                  retryable: false,
                  code: "EXPECTED_ARTIFACT_MISSING",
                }),
              ),
            }
          }
        }

        // D5: auto-checkpoint through the same state path the checkpoint
        // tool uses (same key derivation via resolveKey), so resumability
        // detection sees the step complete. Only successful, artifact-
        // verified runs record a checkpoint.
        let checkpointRecorded = false
        if (input.checkpoint_step !== undefined) {
          const key = resolveKey(exec, cwd)
          const checkpointData: Record<string, unknown> = { agent: input.agent }
          if (input.command_path !== undefined) {
            checkpointData.command_path = input.command_path
          }
          if (input.feature_dir !== undefined) {
            checkpointData.feature_dir = input.feature_dir
          }
          if (artifact !== null) {
            checkpointData.expected_artifact = artifact.relative
          }
          if (input.phase !== undefined) {
            checkpointData.phase = input.phase
          }
          recordAutoCheckpoint(cwd, key, "uf.unleash", input.checkpoint_step, checkpointData)
          checkpointRecorded = true
        }

        const data: DelegateCommandData = {
          agent: input.agent,
          status: result.status,
          child_session_id: result.childSessionID ?? null,
          artifact_created: artifactCreated,
          checkpoint_recorded: checkpointRecorded,
          usage: result.usage,
          provenance: result.provenance,
          text: result.text,
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "DELEGATE_ERROR" }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// uf_unleash_detect_resume tool
// ---------------------------------------------------------------------------

/** Clarification marker prefix probed in speckit spec.md (command Step 2). */
const CLARIFICATION_MARKER_PREFIX = "[NEEDS CLARIFICATION"

/** `## Clarifications` section heading in speckit spec.md. */
const CLARIFICATIONS_SECTION_PATTERN = /^##\s+Clarifications\s*$/m

/** Pipeline steps probed by uf_unleash_detect_resume, in resume order. */
export type ResumeStep =
  | "clarify"
  | "plan"
  | "tasks"
  | "spec_review"
  | "implement"
  | "code_review"

/** Pipeline steps in resume order (the command Step 2 check order). */
const RESUME_STEP_ORDER: readonly ResumeStep[] = [
  "clarify",
  "plan",
  "tasks",
  "spec_review",
  "implement",
  "code_review",
]

/** Structured output from uf_unleash_detect_resume. */
export interface UnleashDetectResumeData {
  /**
   * Step → done map keyed by pipeline step. spec_review and code_review
   * are done only when the dispatch-artifact freshness rules approve them.
   */
  readonly step_statuses: Record<ResumeStep, boolean>
  /** First incomplete step in pipeline order; null when all_complete. */
  readonly resume_from: ResumeStep | null
  /** True only when every step is done (all checkboxes and both reviews). */
  readonly all_complete: boolean
  /**
   * Unchecked top-level task checkbox count in feature_dir/tasks.md (shared
   * task-line grammar; indented boxes are continuation detail); null when
   * tasks.md is missing or unreadable.
   */
  readonly unchecked_count: number | null
  /**
   * State-store reconciliation: whether the checkpoint store claimed each
   * review step complete (the command records them as spec-review and
   * code-review). A claim without a matching approving dispatch artifact
   * never reports the step done — artifacts are authoritative.
   */
  readonly checkpoint_claims: { readonly spec_review: boolean; readonly code_review: boolean }
}

/**
 * Injected filesystem dependencies for uf_unleash_detect_resume, mirroring
 * DelegateCommandDependencies so tests never touch a real filesystem.
 */
export interface DetectResumeDependencies {
  /** Reads UTF-8 text from an absolute path (spec.md/tasks.md, dispatch artifacts). */
  readonly readText: (path: string) => Promise<string>
  /** File-existence checker for plan.md/tasks.md presence probes. */
  readonly fileExists: FileExists
  /** Lists file names in a directory (the flat dispatch artifact store). */
  readonly readDir: (path: string) => Promise<readonly string[]>
}

/** zod-validated input contract for uf_unleash_detect_resume. */
const DetectResumeInputSchema = z
  .object({
    feature_dir: z.string().min(1).max(1024),
    workflow_tier: z.enum(WORKFLOW_TIERS),
  })
  .strict()

/**
 * Count unchecked top-level task checkboxes in tasks.md content through the
 * shared task-line grammar (matchTaskLine): a `- [ ]` checkbox with a
 * leading task id at column 0. Indented checkbox lines are continuation
 * detail and prose checklist items without an id are not tasks — exactly
 * how parse_tasks and mark_task_complete classify lines — so the implement
 * probe and the task tools cannot disagree about completion. The command's
 * implement probe — zero unchecked boxes means every task is complete.
 */
function countUncheckedCheckboxes(tasksText: string): number {
  return tasksText
    .split("\n")
    .map((rawLine) => (rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine))
    .filter((line) => {
      const match = matchTaskLine(line)
      return match !== null && match.indent === "" && !match.checked
    })
    .length
}

/**
 * Select the most recently written dispatch artifact for one review mode
 * that belongs to the current branch. The store is flat and repo-global,
 * so foreign-branch artifacts are excluded before recency is considered,
 * and only the single most recent candidate is eligible — an older
 * approving artifact cannot override a newer non-approving one. Ties break
 * by file name so selection stays deterministic regardless of directory
 * order.
 */
function mostRecentArtifact(
  candidates: readonly ReviewDispatchArtifactSummary[],
  mode: string,
  branch: string,
): ReviewDispatchArtifactSummary | null {
  let mostRecent: ReviewDispatchArtifactSummary | null = null
  for (const candidate of candidates) {
    if (candidate.mode !== mode || candidate.branch !== branch) continue
    if (
      mostRecent === null ||
      candidate.writtenAt > mostRecent.writtenAt ||
      (candidate.writtenAt === mostRecent.writtenAt && candidate.source > mostRecent.source)
    ) {
      mostRecent = candidate
    }
  }
  return mostRecent
}

/** Approving council verdicts: APPROVE and APPROVE WITH ADVISORIES (D4). */
function isApprovingVerdict(verdict: string): boolean {
  return verdict === "APPROVE" || verdict === "APPROVE WITH ADVISORIES"
}

/**
 * Read every parseable dispatch artifact from the flat repo-global store
 * consolidate_dispatch persists. A missing directory means no reviews have
 * run (empty list); unreadable files and malformed envelopes are skipped —
 * fail-open to "not done", never a thrown error.
 */
async function readDispatchArtifacts(
  deps: DetectResumeDependencies,
  cwd: string,
): Promise<ReviewDispatchArtifactSummary[]> {
  const storeDir = resolve(cwd, DISPATCH_ARTIFACT_DIRECTORY)
  let names: readonly string[]
  try {
    names = await deps.readDir(storeDir)
  } catch (err: unknown) {
    if (isEnoent(err)) return []
    throw err
  }
  const candidates: ReviewDispatchArtifactSummary[] = []
  for (const name of names) {
    if (!name.endsWith(".json")) continue
    let raw: string
    try {
      raw = await deps.readText(resolve(storeDir, name))
    } catch {
      continue
    }
    const candidate = parseReviewDispatchArtifact(raw, name)
    if (candidate !== null) candidates.push(candidate)
  }
  return candidates
}

/**
 * Type guard for thrown errors carrying a process exit status — the
 * default GitExec surfaces non-zero git exits as thrown errors with
 * .status set to the exit code.
 */
function hasExitStatus(err: unknown): err is { status: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
  )
}

/**
 * Ancestor-or-equal probe for the specs-mode freshness rule: a spec review
 * stays fresh across implementation commits, which advance HEAD without
 * touching spec artifacts — strict equality would rerun the full spec
 * council on every mid-implementation resume (the accepted D4 trade).
 * Implemented with `git merge-base --is-ancestor <sha> HEAD`: exit 0 is
 * ancestor-or-equal, exit 1 is git's "no" answer (diverged — the artifact
 * is ignored), and any other failure is a genuine git error that fails
 * closed.
 */
function isAncestorOrEqual(exec: GitExec, cwd: string, sha: string, head: string): boolean {
  if (sha === head) return true
  try {
    exec(["merge-base", "--is-ancestor", sha, head], cwd)
    return true
  } catch (err: unknown) {
    if (hasExitStatus(err) && err.status === 1) {
      return false
    }
    throw err
  }
}

/**
 * Extract the tree path from one `git status --porcelain` line. Lines are
 * `XY <path>`; renames report `XY <old> -> <new>` where the new path is
 * the one present in the tree. Surrounding quotes (porcelain quotes paths
 * containing special characters) are stripped.
 */
function porcelainEntryPath(line: string): string {
  let rest = line.slice(3)
  const arrow = rest.indexOf(" -> ")
  if (arrow !== -1) {
    rest = rest.slice(arrow + 4)
  }
  if (rest.startsWith('"') && rest.endsWith('"')) {
    rest = rest.slice(1, -1)
  }
  return rest
}

/**
 * Specs-mode freshness guard: uncommitted modifications to the spec
 * artifacts invalidate an approving spec review (it must rerun). Checkbox
 * edits in the feature directory's tasks.md are excluded — implementation
 * bookkeeping is not a spec change (D4).
 */
function specArtifactsDirty(exec: GitExec, cwd: string, featureDir: string): boolean {
  const status = exec(["status", "--porcelain", "--", featureDir], cwd)
  if (status.trim() === "") return false
  const tasksPath = `${featureDir}tasks.md`
  return status
    .split("\n")
    .filter((line) => line.trim() !== "")
    .some((line) => porcelainEntryPath(line) !== tasksPath)
}

/**
 * Factory that creates the uf_unleash_detect_resume tool with injectable
 * git executor, working directory, and filesystem dependencies for
 * testability.
 *
 * Resumability semantics (OpenSpec change unleash-deterministic-tools, D4 —
 * artifact-first resumability):
 * - clarify (speckit): no `[NEEDS CLARIFICATION]` markers in spec.md AND
 *   (a `## Clarifications` section OR plan.md exists); openspec forces
 *   done
 * - plan (speckit): plan.md exists in the feature directory; openspec
 *   forces done
 * - tasks (speckit): tasks.md exists in the feature directory; openspec
 *   forces done
 * - implement: zero unchecked `- [ ]` checkboxes in feature_dir/tasks.md
 * - spec_review: done only when the most recent current-branch specs-mode
 *   dispatch artifact under .uf/artifacts/dispatch/ records an approving
 *   verdict AND its recorded head SHA is an ancestor of or equal to the
 *   current HEAD AND the spec artifacts have no uncommitted modifications
 *   (tasks.md checkbox edits excluded)
 * - code_review: done only when the most recent current-branch code-mode
 *   dispatch artifact records an approving verdict AND its recorded head
 *   SHA equals the current HEAD — the review must cover the exact code
 *   being merged
 *
 * Foreign-branch artifacts and diverged head SHAs are ignored; unreadable
 * or malformed artifacts are skipped (fail-open to "not done"). Checkpoint
 * state is read through the same readState path get_progress uses and
 * reconciled — a completion claim without a matching approving artifact
 * reports the step incomplete, with no get_progress tool round-trip. On
 * success the tool auto-checkpoints "resumability-detection" for command
 * "uf.unleash" (D5), recording tier/feature-dir/resume data.
 *
 * @param exec Git executor used for branch/HEAD reads, merge-base ancestry,
 *   and the spec-artifact dirtiness probe. Exit status 1 from merge-base is
 *   the "diverged" answer, not a failure.
 * @param cwd Repository root used to resolve the feature dir and the
 *   dispatch artifact store.
 * @param deps Feature-dir and dispatch-store readers.
 * @returns The uf_unleash_detect_resume tool.
 */
export function createUnleashDetectResumeTool(
  exec: GitExec,
  cwd: string,
  deps: DetectResumeDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Resumability detection for /uf.unleash: probes feature-dir artifacts " +
      "(clarification markers, ## Clarifications/plan.md, plan.md/tasks.md presence, " +
      "unchecked task checkboxes) and derives spec-review/code-review completion from " +
      "the dispatch artifacts under .uf/artifacts/dispatch/ — the most recent " +
      "current-branch artifact per mode with an approving verdict, under per-mode " +
      "freshness (code requires the recorded head SHA to equal current HEAD; specs " +
      "accepts ancestor-or-equal when the spec artifacts are clean, tasks.md checkbox " +
      "edits excluded) — reconciled with checkpoint state (artifacts authoritative). " +
      "Returns {step_statuses, resume_from, all_complete, unchecked_count, " +
      "checkpoint_claims}. OpenSpec forces clarify, plan, and tasks done. " +
      "Auto-checkpoints resumability-detection on success.",
    args: {
      feature_dir: DetectResumeInputSchema.shape.feature_dir.describe(
        "Feature directory relative to the repo root (e.g. openspec/changes/name/ or specs/018-name/), as returned by uf_unleash_branch_gate.",
      ),
      workflow_tier: DetectResumeInputSchema.shape.workflow_tier.describe(
        "Workflow tier: openspec forces clarify, plan, and tasks done (artifacts from /opsx-propose); speckit probes spec.md, plan.md, and tasks.md.",
      ),
    },
    async execute(args) {
      try {
        const parsed = DetectResumeInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // feature_dir is repo-relative with the same traversal guard the
        // delegation tool applies to command paths.
        const featureDirAbs = resolveRepoRelative(cwd, input.feature_dir)
        if (featureDirAbs === null) {
          return {
            output: JSON.stringify(
              failure(
                "Path traversal blocked: feature_dir resolves outside the repository root",
                { retryable: false, code: "FEATURE_DIR_TRAVERSAL" },
              ),
            ),
          }
        }
        // Normalize to a trailing slash so file joins and the git pathspec
        // compose identically whether or not the caller passed one.
        const featureDir = input.feature_dir.endsWith("/")
          ? input.feature_dir
          : `${input.feature_dir}/`

        // Git context: the branch filters the repo-global artifact store,
        // and HEAD anchors both per-mode freshness rules.
        const branch = exec(["rev-parse", "--abbrev-ref", "HEAD"], cwd)
        const headSha = exec(["rev-parse", "HEAD"], cwd)

        let clarifyDone = false
        let planDone = false
        let tasksDone = false
        if (input.workflow_tier === "openspec") {
          // OpenSpec forces checks 1-3 done: /opsx-propose created the
          // proposal artifacts (command Step 2).
          clarifyDone = true
          planDone = true
          tasksDone = true
        } else {
          planDone = deps.fileExists(resolve(featureDirAbs, "plan.md"))
          tasksDone = deps.fileExists(resolve(featureDirAbs, "tasks.md"))
          let specText: string | null = null
          try {
            specText = await deps.readText(resolve(featureDirAbs, "spec.md"))
          } catch {
            // Missing/unreadable spec.md — clarify cannot be verified done.
          }
          if (specText !== null) {
            const hasMarkers = specText.includes(CLARIFICATION_MARKER_PREFIX)
            const hasClarifications = CLARIFICATIONS_SECTION_PATTERN.test(specText)
            clarifyDone = !hasMarkers && (hasClarifications || planDone)
          }
        }

        // Implement probe (both tiers): zero unchecked task checkboxes.
        let uncheckedCount: number | null = null
        let implementDone = false
        try {
          const tasksText = await deps.readText(resolve(featureDirAbs, "tasks.md"))
          uncheckedCount = countUncheckedCheckboxes(tasksText)
          implementDone = uncheckedCount === 0
        } catch {
          // Missing/unreadable tasks.md — implement is not done.
        }

        // Review probes: the dispatch artifacts are the durable verdict
        // record (D4). The git calls stay lazy — ancestry and dirtiness
        // only matter for an approving most-recent artifact.
        const artifacts = await readDispatchArtifacts(deps, cwd)
        const specArtifact = mostRecentArtifact(artifacts, "specs", branch)
        const codeArtifact = mostRecentArtifact(artifacts, "code", branch)

        let specReviewDone = false
        if (specArtifact !== null && isApprovingVerdict(specArtifact.verdict)) {
          specReviewDone =
            isAncestorOrEqual(exec, cwd, specArtifact.headSha, headSha) &&
            !specArtifactsDirty(exec, cwd, featureDir)
        }
        let codeReviewDone = false
        if (codeArtifact !== null && isApprovingVerdict(codeArtifact.verdict)) {
          codeReviewDone = codeArtifact.headSha === headSha
        }

        // D4 reconciliation: read the same state get_progress would return
        // (no separate tool round-trip). Checkpoint claims never complete a
        // review step — the artifact-derived statuses above are
        // authoritative; the claims surface so the command can distinguish
        // "never recorded" from "recorded but not artifact-backed".
        const key = resolveKey(exec, cwd)
        const state = readState(cwd, key, sanitizeSlug("uf.unleash"))
        const claimedSteps =
          state !== null && Array.isArray(state.completed_steps) ? state.completed_steps : []
        const stepStatuses: Record<ResumeStep, boolean> = {
          clarify: clarifyDone,
          plan: planDone,
          tasks: tasksDone,
          spec_review: specReviewDone,
          implement: implementDone,
          code_review: codeReviewDone,
        }
        const allComplete = RESUME_STEP_ORDER.every((step) => stepStatuses[step])
        const resumeFrom = RESUME_STEP_ORDER.find((step) => !stepStatuses[step]) ?? null

        // D5: auto-checkpoint through the same state path the checkpoint
        // tool uses (same key derivation via resolveKey), so get_progress
        // readers see resumability-detection complete.
        recordAutoCheckpoint(cwd, key, "uf.unleash", "resumability-detection", {
          workflow_tier: input.workflow_tier,
          feature_dir: input.feature_dir,
          resume_from: resumeFrom,
          all_complete: allComplete,
        })

        const data: UnleashDetectResumeData = {
          step_statuses: stepStatuses,
          resume_from: resumeFrom,
          all_complete: allComplete,
          unchecked_count: uncheckedCount,
          checkpoint_claims: {
            spec_review: claimedSteps.includes("spec-review"),
            code_review: claimedSteps.includes("code-review"),
          },
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "RESUME_DETECT_ERROR" }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// scan_clarifications / resolve_clarification tools
// ---------------------------------------------------------------------------

/**
 * Full `[NEEDS CLARIFICATION: <question>]` marker pattern (command Step 1).
 * The detect_resume prefix probe (`CLARIFICATION_MARKER_PREFIX`) treats any
 * marker text as unresolved; this pattern additionally captures the question
 * between the colon and the closing bracket so the clarify tools can extract
 * and replace it. Markers are matched per line — the single-line syntax
 * speckit.specify emits — and the question cannot contain `]`, both inherent
 * to the marker syntax.
 */
const CLARIFICATION_MARKER_PATTERN = /\[NEEDS CLARIFICATION:\s*([^\]]*?)\s*\]/g

/**
 * Context window around a marker (command Step 1: "Read 3-5 surrounding
 * lines for context"): two lines before, the marker line, two lines after —
 * five lines mid-file, fewer at document edges.
 */
const CLARIFICATION_CONTEXT_LINES = 2

/** ATX heading line — bounds the `## Clarifications` section from below. */
const HEADING_LINE_PATTERN = /^#{1,6}\s/

/** One clarification question extracted from spec.md. */
export interface ClarificationQuestion {
  /** Question text from inside the marker. */
  readonly question: string
  /** Surrounding spec.md lines (marker line ± 2), newline-joined. */
  readonly context: string
  /** 1-based line number of the marker. */
  readonly line: number
}

/** Structured output from scan_clarifications. */
export interface ScanClarificationsData {
  /** Extracted questions in document order. */
  readonly questions: readonly ClarificationQuestion[]
  /** Number of extracted questions (questions.length). */
  readonly count: number
}

/** Structured output from resolve_clarification. */
export interface ResolveClarificationData {
  /** Feature directory the resolution was applied to (echoed input). */
  readonly feature_dir: string
  /** The question that was resolved. */
  readonly question: string
  /** Clarification markers still present in spec.md after the resolution. */
  readonly remaining: number
}

/**
 * Injected spec.md reader for scan_clarifications, mirroring
 * DetectResumeDependencies so tests never touch a real filesystem.
 */
export interface ScanClarificationsDependencies {
  /** Reads UTF-8 text from an absolute path (spec.md). */
  readonly readText: (path: string) => Promise<string>
}

/**
 * Injected filesystem dependencies for resolve_clarification: the scanner's
 * reader plus a writer for the modified spec.md.
 */
export interface ResolveClarificationDependencies extends ScanClarificationsDependencies {
  /** Writes UTF-8 text to an absolute path (the rewritten spec.md). */
  readonly writeText: (path: string, contents: string) => Promise<void>
}

/** zod-validated input contract for scan_clarifications. */
const ScanClarificationsInputSchema = z
  .object({
    feature_dir: z.string().min(1).max(1024),
  })
  .strict()

/** zod-validated input contract for resolve_clarification. */
const ResolveClarificationInputSchema = z
  .object({
    feature_dir: z.string().min(1).max(1024),
    question: z.string().min(1).max(4096),
    answer: z.string().min(1).max(16384),
    source: z.string().min(1).max(1024),
  })
  .strict()

/** Spec.md read outcome: the file text, or a pre-built failure envelope. */
type SpecReadOutcome =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly output: string }

/**
 * Read spec.md through the injected reader so both clarify tools share
 * identical read semantics: a missing file fails NO_SPEC with the branch
 * gate's exact message, an unreadable one SPEC_READ_FAILED with the delegate
 * command-file reader's message shape.
 */
async function readSpecText(
  deps: ScanClarificationsDependencies,
  specPath: string,
): Promise<SpecReadOutcome> {
  let text: string
  try {
    text = await deps.readText(specPath)
  } catch (err: unknown) {
    if (isEnoent(err)) {
      return {
        ok: false,
        output: JSON.stringify(
          failure("No spec.md found in the feature directory. Run `/speckit.specify` first.", {
            retryable: false,
            code: "NO_SPEC",
          }),
        ),
      }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      output: JSON.stringify(
        failure(`Cannot read spec.md: ${msg}`, { retryable: false, code: "SPEC_READ_FAILED" }),
      ),
    }
  }
  return { ok: true, text }
}

/**
 * Build the context block for a marker on lines[markerIndex]: the marker
 * line plus CLARIFICATION_CONTEXT_LINES on each side, newline-joined.
 */
function clarificationContext(lines: readonly string[], markerIndex: number): string {
  const start = Math.max(0, markerIndex - CLARIFICATION_CONTEXT_LINES)
  const end = Math.min(lines.length, markerIndex + CLARIFICATION_CONTEXT_LINES + 1)
  return lines.slice(start, end).join("\n")
}

/**
 * Return a copy of the spec.md lines with the first marker whose extracted
 * question equals `question` replaced by `answer` inline (mid-line markers
 * keep their surrounding text), or null when no marker matches — the caller
 * reports MARKER_NOT_FOUND, which also makes resolving the same question
 * twice fail on the second call.
 */
function replaceClarificationMarker(
  lines: readonly string[],
  question: string,
  answer: string,
): string[] | null {
  const updated = [...lines]
  for (const [index, line] of updated.entries()) {
    for (const match of line.matchAll(CLARIFICATION_MARKER_PATTERN)) {
      if (match[1] !== question) continue
      const start = match.index ?? 0
      updated[index] = line.slice(0, start) + answer + line.slice(start + match[0].length)
      return updated
    }
  }
  return null
}

/**
 * Append one entry to the `## Clarifications` section of spec.md, creating
 * the section at the bottom when absent (command Step 1). The heading test
 * reuses CLARIFICATIONS_SECTION_PATTERN so uf_unleash_detect_resume and the
 * clarify tools cannot disagree about what counts as the section.
 */
function appendClarificationsEntry(specText: string, entry: string): string {
  const lines = specText.split("\n")
  const headingIndex = lines.findIndex((line) => CLARIFICATIONS_SECTION_PATTERN.test(line))
  if (headingIndex === -1) {
    // Absent section: create it at the bottom, separated from existing
    // content by a blank line and terminated with a single newline.
    return `${specText.trimEnd()}\n\n## Clarifications\n\n${entry}\n`
  }
  // Present section: the entry appends after its last content line. The
  // section ends at the next heading (or end of file); insertIndex backs up
  // over the blank run before that boundary.
  let sectionEnd = lines.length
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (HEADING_LINE_PATTERN.test(lines[index])) {
      sectionEnd = index
      break
    }
  }
  let insertIndex = sectionEnd
  while (insertIndex > headingIndex + 1 && lines[insertIndex - 1].trim() === "") {
    insertIndex -= 1
  }
  if (insertIndex === headingIndex + 1) {
    // Empty section (heading with no entries yet): replace the blank run
    // after the heading with one blank line, the entry, and the separator.
    lines.splice(insertIndex, sectionEnd - insertIndex, "", entry, "")
  } else {
    lines.splice(insertIndex, 0, entry)
  }
  return lines.join("\n")
}

/**
 * Count clarification markers in spec.md text (the resolve payload's
 * remaining field), per line like the scan and replacement passes.
 */
function countClarificationMarkers(specText: string): number {
  let count = 0
  for (const line of specText.split("\n")) {
    count += Array.from(line.matchAll(CLARIFICATION_MARKER_PATTERN)).length
  }
  return count
}

/**
 * Factory that creates the scan_clarifications tool with injectable working
 * directory and spec.md reader for testability.
 *
 * Scan semantics (OpenSpec change unleash-deterministic-tools, D8 — the
 * mechanics half of command Step 1; query formulation, result evaluation,
 * and answer-sufficiency judgment stay in command prose):
 * - reads <feature_dir>spec.md; a missing file fails NO_SPEC with the
 *   branch gate's exact message, an unreadable one SPEC_READ_FAILED
 * - extracts every `[NEEDS CLARIFICATION: <question>]` marker in document
 *   order, returning {question, context, line} per marker — context is the
 *   marker line plus two lines on each side (Step 1's "3-5 surrounding
 *   lines"), line is the 1-based marker line number
 * - returns {questions, count}; an empty questions array means no markers
 *   remain (clarify complete)
 * - does NOT checkpoint: clarify completion is derived from markers by
 *   uf_unleash_detect_resume
 *
 * @param cwd Repository root used to resolve the feature dir.
 * @param deps Spec.md reader.
 * @returns The scan_clarifications tool.
 */
export function createScanClarificationsTool(
  cwd: string,
  deps: ScanClarificationsDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Scan spec.md in a feature directory for [NEEDS CLARIFICATION: ...] markers " +
      "(the /uf.unleash clarify step). Returns {questions: [{question, context, line}], " +
      "count} — each question extracted from inside its marker with the surrounding spec " +
      "lines (marker line ± 2) and its 1-based line number. An empty questions array " +
      "means no markers remain.",
    args: {
      feature_dir: ScanClarificationsInputSchema.shape.feature_dir.describe(
        "Feature directory relative to the repo root (e.g. openspec/changes/name/ or specs/018-name/), as returned by uf_unleash_branch_gate.",
      ),
    },
    async execute(args) {
      try {
        const parsed = ScanClarificationsInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // feature_dir is repo-relative with the same traversal guard the
        // delegation and resume tools apply.
        const featureDirAbs = resolveRepoRelative(cwd, input.feature_dir)
        if (featureDirAbs === null) {
          return {
            output: JSON.stringify(
              failure(
                "Path traversal blocked: feature_dir resolves outside the repository root",
                { retryable: false, code: "FEATURE_DIR_TRAVERSAL" },
              ),
            ),
          }
        }

        const specRead = await readSpecText(deps, resolve(featureDirAbs, "spec.md"))
        if (!specRead.ok) {
          return { output: specRead.output }
        }

        const lines = specRead.text.split("\n")
        const questions: ClarificationQuestion[] = []
        for (const [index, line] of lines.entries()) {
          for (const match of line.matchAll(CLARIFICATION_MARKER_PATTERN)) {
            questions.push({
              question: match[1],
              context: clarificationContext(lines, index),
              line: index + 1,
            })
          }
        }

        const data: ScanClarificationsData = {
          questions,
          count: questions.length,
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "SCAN_CLARIFICATIONS_ERROR" }),
          ),
        }
      }
    },
  })
}

/**
 * Factory that creates the resolve_clarification tool with injectable
 * working directory and filesystem dependencies for testability.
 *
 * Resolution semantics (OpenSpec change unleash-deterministic-tools, D8):
 * - reads <feature_dir>spec.md and replaces the first marker whose
 *   extracted question equals the input question with the answer text
 *   inline (mid-line markers keep their surrounding text)
 * - no matching marker fails MARKER_NOT_FOUND, so resolving the same
 *   question twice fails on the second call — the marker is gone
 * - appends the `- Q: <question> -> A: <answer> (Dewey-resolved from
 *   <source>)` entry to ## Clarifications, creating the section at the
 *   bottom of spec.md when absent, and writes the modified file back
 * - returns {feature_dir, question, remaining} where remaining counts the
 *   markers still present after the resolution
 * - does NOT checkpoint: clarify completion is derived from markers by
 *   uf_unleash_detect_resume
 *
 * @param cwd Repository root used to resolve the feature dir.
 * @param deps Spec.md reader and writer.
 * @returns The resolve_clarification tool.
 */
export function createResolveClarificationTool(
  cwd: string,
  deps: ResolveClarificationDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Resolve one spec.md clarification marker (the /uf.unleash clarify step): removes the " +
      "[NEEDS CLARIFICATION: <question>] marker, writes the answer inline where the marker " +
      "was, appends the - Q: ... -> A: ... (Dewey-resolved from ...) entry to ## " +
      "Clarifications (creating the section at the bottom when absent), and writes spec.md " +
      "back. Returns {feature_dir, question, remaining}. A missing marker fails " +
      "MARKER_NOT_FOUND — resolving the same question twice fails on the second call.",
    args: {
      feature_dir: ResolveClarificationInputSchema.shape.feature_dir.describe(
        "Feature directory relative to the repo root (e.g. openspec/changes/name/ or specs/018-name/), as returned by uf_unleash_branch_gate.",
      ),
      question: ResolveClarificationInputSchema.shape.question.describe(
        "Question text exactly as scan_clarifications extracted it; the marker carrying it must still be present.",
      ),
      answer: ResolveClarificationInputSchema.shape.answer.describe(
        "Answer text written inline where the marker was.",
      ),
      source: ResolveClarificationInputSchema.shape.source.describe(
        "Dewey provenance recorded in the Clarifications entry (page name or block UUID).",
      ),
    },
    async execute(args) {
      try {
        const parsed = ResolveClarificationInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // feature_dir is repo-relative with the same traversal guard the
        // delegation and resume tools apply.
        const featureDirAbs = resolveRepoRelative(cwd, input.feature_dir)
        if (featureDirAbs === null) {
          return {
            output: JSON.stringify(
              failure(
                "Path traversal blocked: feature_dir resolves outside the repository root",
                { retryable: false, code: "FEATURE_DIR_TRAVERSAL" },
              ),
            ),
          }
        }

        const specPath = resolve(featureDirAbs, "spec.md")
        const specRead = await readSpecText(deps, specPath)
        if (!specRead.ok) {
          return { output: specRead.output }
        }

        // Replace the first marker carrying this question with the answer,
        // inline. A question with no marker left fails closed — resolving
        // twice is an error, not a no-op.
        const updatedLines = replaceClarificationMarker(
          specRead.text.split("\n"),
          input.question,
          input.answer,
        )
        if (updatedLines === null) {
          return {
            output: JSON.stringify(
              failure(
                `No [NEEDS CLARIFICATION: ${input.question}] marker found in spec.md — it may have been resolved already`,
                { retryable: false, code: "MARKER_NOT_FOUND" },
              ),
            ),
          }
        }

        // Append the Q -> A entry to ## Clarifications (created at the
        // bottom when absent) and write the modified spec.md back.
        const entry = `- Q: ${input.question} -> A: ${input.answer} (Dewey-resolved from ${input.source})`
        const updatedText = appendClarificationsEntry(updatedLines.join("\n"), entry)
        try {
          await deps.writeText(specPath, updatedText)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          return {
            output: JSON.stringify(
              failure(`Cannot write spec.md: ${msg}`, {
                retryable: false,
                code: "SPEC_WRITE_FAILED",
              }),
            ),
          }
        }

        const data: ResolveClarificationData = {
          feature_dir: input.feature_dir,
          question: input.question,
          remaining: countClarificationMarkers(updatedText),
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "RESOLVE_CLARIFICATION_ERROR" }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// parse_tasks / mark_task_complete / scan_conflict_markers tools
// ---------------------------------------------------------------------------

/**
 * Task checkbox line in tasks.md: optional indentation, a `- [ ]` / `- [x]`
 * checkbox, then the task id as the first non-whitespace token (OpenSpec
 * `5.1`, Speckit `T001`), then optional description text. A checkbox line
 * without a trailing id token is a prose checklist item, not a task.
 */
const TASK_LINE_PATTERN = /^(\s*)- \[([ xX])\][ \t]+(\S+)(?:[ \t]+(.*))?$/

/**
 * Parallel-eligibility marker: `[P]` directly after the task id, followed
 * by whitespace or end of line — the position both the OpenSpec and
 * Speckit tasks templates use. A `[P]` appearing later in the description
 * is prose, not a parallelism marker.
 */
const PARALLEL_MARKER_PATTERN = /^\[P\](?:[ \t]+|$)/

/**
 * Phase heading in tasks.md: a level-2 ATX heading (`## Phase 1: Setup`,
 * `## 5. Increment 5 — ...`). Deeper headings (`###`) are sub-sections
 * inside a phase, not new phases; the document title (`# Tasks: ...`) is
 * level 1 and starts no phase.
 */
const PHASE_HEADING_PATTERN = /^##[ \t]+(.+)$/

/**
 * Cherry-pick residue markers: the three git conflict-marker prefixes at
 * the start of a line (column 0 — git writes conflict markers unindented,
 * and the residue this tool exists to catch is produced by git cherry-pick).
 * Lines that merely contain a marker mid-text (string literals, prose) do
 * not match. Known false-positive surface: a `=======` line is also a
 * markdown setext H1 underline (present in legacy contract markdown), so
 * callers scanning such files should expect those reports.
 */
const CONFLICT_MARKER_PATTERN = /^(<<<<<<<|=======|>>>>>>>)/

/** One task parsed from tasks.md (D9). */
export interface ParsedTask {
  /** Task identifier — the first token after the checkbox (e.g. "5.1", "T001"). */
  readonly id: string
  /** Task description after the id, `[P]` marker stripped. */
  readonly description: string
  /** True when the `[P]` parallel marker directly follows the id. */
  readonly parallel: boolean
  /** True when the checkbox is `[x]` (or `[X]`). */
  readonly done: boolean
}

/** One `##` phase section parsed from tasks.md. */
export interface ParsedPhase {
  /** Phase heading text with the `##` marker stripped (e.g. "5. Increment 5 — implement-step granular tools"). */
  readonly phase: string
  /** Top-level tasks in document order; indented checkbox lines are continuation detail, not tasks. */
  readonly tasks: readonly ParsedTask[]
}

/** Structured output from parse_tasks. */
export interface ParseTasksData {
  /** Phases in document order, each with its top-level tasks. */
  readonly phases: readonly ParsedPhase[]
  /** Total tasks across all phases. */
  readonly total_tasks: number
  /** Tasks whose checkbox is `[x]`. */
  readonly done_count: number
  /** True when every task is done — vacuously true for a tasks.md with no tasks, matching the detect_resume unchecked-box probe. */
  readonly all_done: boolean
}

/** Structured output from mark_task_complete. */
export interface MarkTaskCompleteData {
  /** Repo-relative tasks.md path (echoed input). */
  readonly tasks_path: string
  /** Task id whose checkbox was flipped (echoed input). */
  readonly task_id: string
  /** True when the checkbox was already `[x]` — no write was performed. */
  readonly already_complete: boolean
}

/** One conflict-marker occurrence in a scanned file. */
export interface ConflictMarkerHit {
  /** 1-based line number of the marker. */
  readonly line: number
  /** The marker prefix found at line start: "<<<<<<<", "=======", or ">>>>>>>". */
  readonly marker: string
}

/** Conflict markers found in one file. */
export interface ConflictFileReport {
  /** Repo-relative path of the file (input paths are normalized to repo-relative form). */
  readonly path: string
  /** Markers in line order. */
  readonly markers: readonly ConflictMarkerHit[]
}

/** Structured output from scan_conflict_markers. */
export interface ScanConflictMarkersData {
  /** Files containing conflict markers, in scan order. */
  readonly conflicts: readonly ConflictFileReport[]
  /** True when no conflict markers were found. */
  readonly clean: boolean
  /** Per-file skip notices (unreadable, unlistable, or binary files) — individual skips never fail the scan. */
  readonly warnings: readonly string[]
}

/**
 * Injected tasks.md reader for parse_tasks, mirroring
 * ScanClarificationsDependencies so tests never touch a real filesystem.
 */
export interface ParseTasksDependencies {
  /** Reads UTF-8 text from an absolute path (tasks.md). */
  readonly readText: (path: string) => Promise<string>
}

/**
 * Injected filesystem dependencies for mark_task_complete: the parser's
 * reader plus a writer for the flipped checkbox.
 */
export interface MarkTaskCompleteDependencies extends ParseTasksDependencies {
  /** Writes UTF-8 text to an absolute path (the rewritten tasks.md). */
  readonly writeText: (path: string, contents: string) => Promise<void>
}

/**
 * Injected filesystem dependencies for scan_conflict_markers: file reader,
 * directory lister, and directory probe. Mirrors DetectResumeDependencies
 * (the readDir precedent) so tests never touch a real filesystem.
 */
export interface ScanConflictMarkersDependencies {
  /** Reads UTF-8 text from an absolute path. */
  readonly readText: (path: string) => Promise<string>
  /** Lists entry names in a directory. */
  readonly readDir: (path: string) => Promise<readonly string[]>
  /**
   * Reports whether a path is a directory. MUST NOT throw (missing paths
   * report false). The default implementation uses lstat, so symlinked
   * directories report false and the recursive walk cannot cycle.
   */
  readonly isDirectory: (path: string) => Promise<boolean>
}

/** zod-validated input contract for parse_tasks. */
const ParseTasksInputSchema = z
  .object({
    tasks_path: z.string().min(1).max(1024),
  })
  .strict()

/** zod-validated input contract for mark_task_complete. */
const MarkTaskCompleteInputSchema = z
  .object({
    tasks_path: z.string().min(1).max(1024),
    task_id: z.string().min(1).max(128),
  })
  .strict()

/** zod-validated input contract for scan_conflict_markers. */
const ScanConflictMarkersInputSchema = z
  .object({
    paths: z.array(z.string().min(1).max(1024)).min(1).max(1000),
  })
  .strict()

/** Parsed fields of one tasks.md checkbox line. */
interface TaskLineMatch {
  /** Leading whitespace — empty for a top-level task. */
  readonly indent: string
  /** True when the checkbox is checked (`[x]` or `[X]`). */
  readonly checked: boolean
  /** Task id — the first token after the checkbox. */
  readonly id: string
  /** Text after the id (the description, possibly starting with the `[P]` marker). */
  readonly rest: string
}

/**
 * Match one tasks.md checkbox line, or null for any other line shape. Both
 * parse_tasks and mark_task_complete consume this so the two tools cannot
 * disagree about what counts as a task.
 */
function matchTaskLine(line: string): TaskLineMatch | null {
  const match = TASK_LINE_PATTERN.exec(line)
  if (match === null) return null
  return {
    indent: match[1],
    checked: match[2] !== " ",
    id: match[3],
    rest: match[4] ?? "",
  }
}

/**
 * Task description text with the leading `[P]` marker removed when present
 * — the marker is parallelism metadata for the orchestrating command, not
 * task content for the delegated worker.
 */
function taskDescription(rest: string): string {
  if (!PARALLEL_MARKER_PATTERN.test(rest)) return rest
  return rest.replace(PARALLEL_MARKER_PATTERN, "")
}

/** Tasks.md read outcome: the file text, or a pre-built failure envelope. */
type TasksReadOutcome =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly output: string }

/**
 * Read tasks.md through the injected reader so parse_tasks and
 * mark_task_complete share identical read semantics: a missing file fails
 * TASKS_FILE_NOT_FOUND, an unreadable one TASKS_READ_FAILED (the clarify
 * tools' reader shape with tasks-specific codes).
 */
async function readTasksText(
  deps: ParseTasksDependencies,
  tasksPath: string,
): Promise<TasksReadOutcome> {
  let text: string
  try {
    text = await deps.readText(tasksPath)
  } catch (err: unknown) {
    if (isEnoent(err)) {
      return {
        ok: false,
        output: JSON.stringify(
          failure("No tasks.md found at the given tasks_path. Generate it via the tasks step before parsing or marking.", {
            retryable: false,
            code: "TASKS_FILE_NOT_FOUND",
          }),
        ),
      }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      output: JSON.stringify(
        failure(`Cannot read tasks.md: ${msg}`, { retryable: false, code: "TASKS_READ_FAILED" }),
      ),
    }
  }
  return { ok: true, text }
}

/**
 * Parse tasks.md text into phases with tasks (the command Step 5 parse).
 * Every level-2 heading starts a phase; top-level checkbox lines with a
 * leading id token are its tasks; indented checkbox lines and tasks before
 * the first heading are continuation detail, not tasks. CRLF input is
 * tolerated — a trailing carriage return is stripped from parsed text only
 * (mark_task_complete preserves file bytes exactly).
 */
function parseTasksText(tasksText: string): ParseTasksData {
  const phases: { phase: string; tasks: ParsedTask[] }[] = []
  let current: { phase: string; tasks: ParsedTask[] } | null = null
  for (const rawLine of tasksText.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
    const heading = PHASE_HEADING_PATTERN.exec(line)
    if (heading !== null) {
      current = { phase: heading[1].trim(), tasks: [] }
      phases.push(current)
      continue
    }
    const match = matchTaskLine(line)
    if (match === null || current === null || match.indent !== "") continue
    current.tasks.push({
      id: match.id,
      description: taskDescription(match.rest),
      parallel: PARALLEL_MARKER_PATTERN.test(match.rest),
      done: match.checked,
    })
  }
  const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
  const doneCount = phases.reduce(
    (sum, phase) => sum + phase.tasks.filter((task) => task.done).length,
    0,
  )
  return {
    phases,
    total_tasks: totalTasks,
    done_count: doneCount,
    all_done: doneCount === totalTasks,
  }
}

/**
 * Locate the task line to flip for task_id: the first top-level unchecked
 * checkbox line carrying that id (an already-checked duplicate earlier in
 * the file does not stop the search). Returns the absolute character
 * offset of the checkbox's space — the only byte mark_task_complete
 * rewrites — or already-complete when the id exists only in checked form,
 * or null when the id matches no task line at all. CRLF input is matched
 * through the same normalization parseTasksText applies (a trailing
 * carriage return is stripped for matching only); the offset arithmetic
 * stays on the raw line length so flipAt remains byte-correct.
 */
function findTaskLine(
  tasksText: string,
  taskId: string,
): { readonly flipAt: number } | { readonly alreadyComplete: true } | null {
  let lineStart = 0
  let alreadyComplete = false
  for (const rawLine of tasksText.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
    const match = matchTaskLine(line)
    if (match !== null && match.indent === "" && match.id === taskId) {
      if (!match.checked) {
        // Top-level "- [ ]" — the space to flip sits at offset 3.
        return { flipAt: lineStart + 3 }
      }
      alreadyComplete = true
    }
    lineStart += rawLine.length + 1
  }
  return alreadyComplete ? { alreadyComplete: true } : null
}

/**
 * Repo-relative display form of an absolute path already confined to the
 * repository root by resolveRepoRelative — used for conflict reports and
 * warnings so payloads stay portable across machines.
 */
function toRepoRelative(cwd: string, absolutePath: string): string {
  return absolutePath.slice(cwd.length + 1)
}

/**
 * Collect every file under a scan root: the root itself when it is a file,
 * or a recursive sorted walk when it is a directory (sorted so scan output
 * is deterministic regardless of directory order). Symlinked directories
 * are not descended into — the default isDirectory uses lstat, matching
 * Unix-tool precedent and making cycles impossible. An unlistable
 * directory is skipped with a warning; read failures stay fail-open.
 */
async function collectScanFiles(
  deps: ScanConflictMarkersDependencies,
  root: string,
  cwd: string,
  files: string[],
  warnings: string[],
): Promise<void> {
  if (await deps.isDirectory(root)) {
    let entries: readonly string[]
    try {
      entries = await deps.readDir(root)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      warnings.push(`${toRepoRelative(cwd, root)}: cannot list directory (${msg})`)
      return
    }
    for (const entry of [...entries].sort()) {
      await collectScanFiles(deps, resolve(root, entry), cwd, files, warnings)
    }
    return
  }
  files.push(root)
}

/**
 * Find conflict markers in one file's text: lines starting with
 * `<<<<<<<`, `=======`, or `>>>>>>>` at column 0. Returns the hits in
 * line order.
 */
function scanTextForConflictMarkers(text: string): ConflictMarkerHit[] {
  const hits: ConflictMarkerHit[] = []
  for (const [index, line] of text.split("\n").entries()) {
    const match = CONFLICT_MARKER_PATTERN.exec(line)
    if (match !== null) {
      hits.push({ line: index + 1, marker: match[0] })
    }
  }
  return hits
}

/**
 * Factory that creates the parse_tasks tool with injectable working
 * directory and tasks.md reader for testability.
 *
 * Parse semantics (OpenSpec change unleash-deterministic-tools, D9 — the
 * mechanics half of command Step 5; phase iteration, batch-of-4
 * scheduling, and failure-stop stay in command prose):
 * - reads tasks.md from the repo-relative tasks_path (traversal-guarded);
 *   a missing file fails TASKS_FILE_NOT_FOUND, an unreadable one
 *   TASKS_READ_FAILED
 * - every level-2 `##` heading starts a phase; top-level `- [ ]` / `- [x]`
 *   checkbox lines with a leading id token (OpenSpec `5.1`, Speckit
 *   `T001`) are its tasks
 * - each task carries {id, description, parallel, done}: parallel when the
 *   `[P]` marker directly follows the id (stripped from description), done
 *   when the checkbox is `[x]`; indented checkbox lines and tasks before
 *   the first heading are continuation detail, not tasks
 * - returns {phases, total_tasks, done_count, all_done}; all_done is
 *   vacuously true for a tasks.md with no tasks, matching the
 *   detect_resume unchecked-box probe
 * - does NOT checkpoint: implement-phase progress is recorded by
 *   uf_delegate_command's checkpoint_step
 *
 * @param cwd Repository root used to resolve tasks_path.
 * @param deps Tasks.md reader.
 * @returns The parse_tasks tool.
 */
export function createParseTasksTool(
  cwd: string,
  deps: ParseTasksDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Parse a tasks.md file into phases and tasks (the /uf.unleash implement step). " +
      "Every ## heading starts a phase; each top-level checkbox task returns " +
      "{id, description, parallel, done} — parallel from the [P] marker after the id, done " +
      "from the checkbox state. Returns {phases, total_tasks, done_count, all_done}.",
    args: {
      tasks_path: ParseTasksInputSchema.shape.tasks_path.describe(
        "Repo-relative path to tasks.md (e.g. openspec/changes/name/tasks.md or specs/018-name/tasks.md).",
      ),
    },
    async execute(args) {
      try {
        const parsed = ParseTasksInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // tasks_path is repo-relative with the same traversal guard the
        // delegation and clarify tools apply.
        const tasksAbs = resolveRepoRelative(cwd, input.tasks_path)
        if (tasksAbs === null) {
          return {
            output: JSON.stringify(
              failure(
                "Path traversal blocked: tasks_path resolves outside the repository root",
                { retryable: false, code: "TASKS_PATH_TRAVERSAL" },
              ),
            ),
          }
        }

        const tasksRead = await readTasksText(deps, tasksAbs)
        if (!tasksRead.ok) {
          return { output: tasksRead.output }
        }

        const data = parseTasksText(tasksRead.text)
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(failure(msg, { retryable: false, code: "PARSE_TASKS_ERROR" })),
        }
      }
    },
  })
}

/**
 * Factory that creates the mark_task_complete tool with injectable working
 * directory and filesystem dependencies for testability.
 *
 * Mark semantics (OpenSpec change unleash-deterministic-tools, D9):
 * - reads tasks.md from the repo-relative tasks_path (traversal-guarded);
 *   missing and unreadable files fail with the parse_tasks codes
 * - flips the FIRST top-level `- [ ] <task_id>` checkbox to `- [x]` by
 *   replacing exactly one byte (slice surgery) — every other byte of the
 *   file is preserved
 * - idempotent: when the task is already `[x]`, succeeds WITHOUT writing,
 *   so repeated calls never dirty the file's mtime
 * - a task id matching no checkbox line (checked or unchecked) fails
 *   TASK_NOT_FOUND
 * - returns {tasks_path, task_id, already_complete}
 * - does NOT checkpoint: implement-phase progress is recorded by
 *   uf_delegate_command's checkpoint_step
 *
 * @param cwd Repository root used to resolve tasks_path.
 * @param deps Tasks.md reader and writer.
 * @returns The mark_task_complete tool.
 */
export function createMarkTaskCompleteTool(
  cwd: string,
  deps: MarkTaskCompleteDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Mark one tasks.md task complete (the /uf.unleash implement step): flips the first " +
      "- [ ] <task_id> checkbox to - [x] through single-byte slice surgery, preserving every " +
      "other byte. Idempotent — an already-complete task succeeds without rewriting the file. " +
      "Returns {tasks_path, task_id, already_complete}.",
    args: {
      tasks_path: MarkTaskCompleteInputSchema.shape.tasks_path.describe(
        "Repo-relative path to tasks.md, as passed to parse_tasks.",
      ),
      task_id: MarkTaskCompleteInputSchema.shape.task_id.describe(
        "Task id as parse_tasks reported it (e.g. 5.1, T001).",
      ),
    },
    async execute(args) {
      try {
        const parsed = MarkTaskCompleteInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        const tasksAbs = resolveRepoRelative(cwd, input.tasks_path)
        if (tasksAbs === null) {
          return {
            output: JSON.stringify(
              failure(
                "Path traversal blocked: tasks_path resolves outside the repository root",
                { retryable: false, code: "TASKS_PATH_TRAVERSAL" },
              ),
            ),
          }
        }

        const tasksRead = await readTasksText(deps, tasksAbs)
        if (!tasksRead.ok) {
          return { output: tasksRead.output }
        }

        const found = findTaskLine(tasksRead.text, input.task_id)
        if (found === null) {
          return {
            output: JSON.stringify(
              failure(
                `Task "${input.task_id}" not found in tasks.md — no checked or unchecked entry carries that id`,
                { retryable: false, code: "TASK_NOT_FOUND" },
              ),
            ),
          }
        }

        // Idempotent success: detect-and-return without rewriting, so an
        // already-complete task never dirties the file's mtime.
        if ("alreadyComplete" in found) {
          const data: MarkTaskCompleteData = {
            tasks_path: input.tasks_path,
            task_id: input.task_id,
            already_complete: true,
          }
          return { output: JSON.stringify(success(data)) }
        }

        const updated =
          tasksRead.text.slice(0, found.flipAt) + "x" + tasksRead.text.slice(found.flipAt + 1)
        try {
          await deps.writeText(tasksAbs, updated)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          return {
            output: JSON.stringify(
              failure(`Cannot write tasks.md: ${msg}`, {
                retryable: false,
                code: "TASKS_WRITE_FAILED",
              }),
            ),
          }
        }

        const data: MarkTaskCompleteData = {
          tasks_path: input.tasks_path,
          task_id: input.task_id,
          already_complete: false,
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(failure(msg, { retryable: false, code: "MARK_TASK_COMPLETE_ERROR" })),
        }
      }
    },
  })
}

/**
 * Factory that creates the scan_conflict_markers tool with injectable
 * working directory and filesystem dependencies for testability.
 *
 * Scan semantics (OpenSpec change unleash-deterministic-tools, D9):
 * - takes repo-relative file or directory paths, each traversal-guarded —
 *   traversal is fail-closed for the whole call; directories are walked
 *   recursively in sorted order, symlinked directories not followed
 * - reports every file containing lines that start with `<<<<<<<`,
 *   `=======`, or `>>>>>>>` at column 0, each hit as {line, marker} —
 *   cherry-pick residue that git_conflict_files cannot see because it
 *   reads `git diff --diff-filter=U`, which reports nothing once the
 *   merge has completed
 * - fail-open per file: unreadable, unlistable, or binary (NUL-byte)
 *   files are skipped with a warning in the payload, never failing the
 *   scan
 * - returns {conflicts, clean, warnings}; clean is true when no file
 *   carries markers
 * - does NOT checkpoint: conflict handling composes through
 *   format_unleash_exit in command prose
 *
 * @param cwd Repository root used to resolve and normalize scan paths.
 * @param deps File reader, directory lister, and directory probe.
 * @returns The scan_conflict_markers tool.
 */
export function createScanConflictMarkersTool(
  cwd: string,
  deps: ScanConflictMarkersDependencies,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Scan files or directories for git conflict-marker residue after a cherry-pick merge " +
      "(the /uf.unleash implement step). Reports files containing lines that start with " +
      "<<<<<<<, =======, or >>>>>>> — markers git diff --diff-filter=U cannot see once the " +
      "merge has completed. Returns {conflicts: [{path, markers: [{line, marker}]}], clean, " +
      "warnings}. Unreadable or binary files are skipped with a warning.",
    args: {
      paths: ScanConflictMarkersInputSchema.shape.paths.describe(
        "Repo-relative files or directories to scan (e.g. the files a worktree merge touched). " +
          "Directories are walked recursively; symlinked directories are not followed.",
      ),
    },
    async execute(args) {
      try {
        const parsed = ScanConflictMarkersInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // Traversal is fail-closed: one escaping path rejects the whole
        // call before any file is read.
        const roots: string[] = []
        for (const scanPath of input.paths) {
          const abs = resolveRepoRelative(cwd, scanPath)
          if (abs === null) {
            return {
              output: JSON.stringify(
                failure(
                  `Path traversal blocked: ${scanPath} resolves outside the repository root`,
                  { retryable: false, code: "PATHS_TRAVERSAL" },
                ),
              ),
            }
          }
          roots.push(abs)
        }

        const files: string[] = []
        const warnings: string[] = []
        for (const root of roots) {
          await collectScanFiles(deps, root, cwd, files, warnings)
        }

        // Overlapping inputs (a directory plus a file inside it) scan each
        // file once; conflicts stay deduplicated by resolved path.
        const conflicts: ConflictFileReport[] = []
        const seen = new Set<string>()
        for (const file of files) {
          if (seen.has(file)) continue
          seen.add(file)
          const rel = toRepoRelative(cwd, file)
          let text: string
          try {
            text = await deps.readText(file)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            warnings.push(`${rel}: cannot read (${msg})`)
            continue
          }
          // NUL-byte heuristic: files containing NUL are binary and carry
          // no line-structured conflict markers worth reporting.
          if (text.includes("\0")) {
            warnings.push(`${rel}: binary file skipped`)
            continue
          }
          const markers = scanTextForConflictMarkers(text)
          if (markers.length > 0) {
            conflicts.push({ path: rel, markers })
          }
        }

        const data: ScanConflictMarkersData = {
          conflicts,
          clean: conflicts.length === 0,
          warnings,
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "SCAN_CONFLICT_MARKERS_ERROR" }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// format_unleash_exit and format_unleash_demo tools
// ---------------------------------------------------------------------------

/**
 * Maximum number of findings, questions, reasons, or cycles rendered in
 * one exit message — bounded input keeps the rendered output bounded.
 */
const MAX_EXIT_LIST_ITEMS = 100

/** Structured output from format_unleash_exit and format_unleash_demo. */
export interface UnleashRenderedTextData {
  /** Rendered template markdown; the command emits it verbatim. */
  readonly text: string
}

/** One clarification question as scan_clarifications extracts it. */
const ExitClarifyQuestionSchema = z
  .object({
    question: z.string().min(1).max(4096).describe("Question text from inside the marker."),
    context: z
      .string()
      .min(1)
      .max(16384)
      .describe("Surrounding spec.md lines (marker line plus two lines on each side)."),
  })
  .strict()

/** Bounded list of free-text strings (findings, reasons, cycles). */
const ExitStringListSchema = z
  .array(z.string().min(1).max(16384))
  .min(1)
  .max(MAX_EXIT_LIST_ITEMS)

/** Bounded list of clarification questions. */
const ExitQuestionsSchema = z.array(ExitClarifyQuestionSchema).min(1).max(MAX_EXIT_LIST_ITEMS)

/** Bounded list of conflicting file paths. */
const ExitConflictingFilesSchema = z.array(z.string().min(1).max(1024)).min(1).max(1000)

/** Workflow tier (shared by the spec-review exit and the demo input). */
const ExitTierSchema = z.enum(WORKFLOW_TIERS)

/** Change name interpolated into openspec guidance paths. */
const ExitChangeNameSchema = z.string().min(1).max(1024)

/** 1-based tasks.md phase number. */
const ExitPhaseSchema = z.number().int().min(1).max(1000)

/**
 * zod-validated input contract for format_unleash_exit: a discriminated
 * union keyed on `variant`, one strict member per exit scenario. Field
 * names mirror the lib data shapes and the command's interpolations
 * (phase numbers, task descriptions, error text, finding lists, tier).
 */
const UnleashExitInputSchema = z.discriminatedUnion("variant", [
  z
    .object({
      variant: z.literal("clarify"),
      questions: ExitQuestionsSchema,
    })
    .strict(),
  z
    .object({
      variant: z.literal("spec-review"),
      tier: ExitTierSchema,
      findings: ExitStringListSchema,
      change_name: ExitChangeNameSchema.optional(),
    })
    .strict(),
  z
    .object({
      variant: z.literal("implement-worker-failed"),
      phase: ExitPhaseSchema,
      failed_task: z.string().min(1).max(4096),
      error: z.string().min(1).max(16384),
    })
    .strict(),
  z
    .object({
      variant: z.literal("implement-merge-conflict"),
      phase: ExitPhaseSchema,
      conflicting_files: ExitConflictingFilesSchema,
    })
    .strict(),
  z
    .object({
      variant: z.literal("implement-phase-checkpoint"),
      phase: ExitPhaseSchema,
      failed_command: z.string().min(1).max(4096),
      output: z.string().min(1).max(65536),
    })
    .strict(),
  z
    .object({
      variant: z.literal("code-review-preflight"),
      findings: ExitStringListSchema,
    })
    .strict(),
  z
    .object({
      variant: z.literal("code-review-no-success"),
      reasons: ExitStringListSchema,
    })
    .strict(),
  z
    .object({
      variant: z.literal("code-review-iterations-exhausted"),
      persistent_findings: ExitStringListSchema,
      circular_dependencies: ExitStringListSchema.optional(),
    })
    .strict(),
])

/**
 * zod-validated input contract for format_unleash_demo. The three content
 * fields use the write_unleash_summary demo-payload names (camelCase
 * whatWasBuilt/howToVerify/testResults, the shape /uf.finale consumes) so
 * the same values compose the rendered demo and the persisted summary
 * artifact (task 4.3) without a renaming hop.
 */
const UnleashDemoInputSchema = z
  .object({
    tier: ExitTierSchema,
    whatWasBuilt: z.string().min(1).max(16384),
    howToVerify: z.string().min(1).max(16384),
    testResults: z.string().min(1).max(16384),
    changeName: ExitChangeNameSchema.optional(),
  })
  .strict()

/**
 * Factory that creates the format_unleash_exit tool.
 *
 * Rendering semantics (OpenSpec change unleash-deterministic-tools, D6):
 * - validates the variant and its per-variant data through the
 *   discriminated union, then renders the exact paused-at template via
 *   the pure formatUnleashExit lib function (lib/unleash-templates.ts)
 * - returns {text}: the rendered markdown the command emits verbatim
 * - does NOT checkpoint: an exit pauses the pipeline rather than
 *   completing a step, and the command's exit paths never checkpoint
 *
 * The factory accepts cwd for signature symmetry with the sibling unleash
 * tools; exit rendering is pure and does not consult it.
 *
 * @param cwd Repository root (unused by rendering; factory-signature symmetry).
 * @returns The format_unleash_exit tool.
 */
export function createFormatUnleashExitTool(cwd: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Render a /uf.unleash paused-at exit message for one of the eight exit variants " +
      "(clarify, spec-review, implement-worker-failed, implement-merge-conflict, " +
      "implement-phase-checkpoint, code-review-preflight, code-review-no-success, " +
      "code-review-iterations-exhausted). Returns {text} — the exact template markdown " +
      "(heading, reason, body, What to do next, Then resume) to emit verbatim.",
    args: {
      variant: z.enum(UNLEASH_EXIT_VARIANTS).describe(
        "Exit scenario to render. Each variant requires its own fields: clarify → questions; " +
          "spec-review → tier, findings; implement-worker-failed → phase, failed_task, error; " +
          "implement-merge-conflict → phase, conflicting_files; implement-phase-checkpoint → " +
          "phase, failed_command, output; code-review-preflight → findings; " +
          "code-review-no-success → reasons; code-review-iterations-exhausted → " +
          "persistent_findings (circular_dependencies optional).",
      ),
      questions: ExitQuestionsSchema.describe(
        "clarify: the unanswerable questions, each {question, context} as scan_clarifications extracted.",
      ).optional(),
      tier: ExitTierSchema.describe(
        "spec-review: workflow tier selecting the recovery guidance (speckit or openspec).",
      ).optional(),
      findings: ExitStringListSchema.describe(
        "spec-review (HIGH/CRITICAL findings with context) or code-review-preflight " +
          "(branch-caused failures as CRITICAL findings with full output).",
      ).optional(),
      change_name: ExitChangeNameSchema.describe(
        "spec-review (optional): change name interpolated into the openspec recovery guidance " +
          "(openspec/changes/<name>/); the literal <name> placeholder renders when omitted.",
      ).optional(),
      phase: ExitPhaseSchema.describe(
        "implement-worker-failed, implement-merge-conflict, implement-phase-checkpoint: " +
          "1-based phase number from tasks.md.",
      ).optional(),
      failed_task: z
        .string()
        .min(1)
        .max(4096)
        .describe("implement-worker-failed: failed task ID and description.")
        .optional(),
      error: z
        .string()
        .min(1)
        .max(16384)
        .describe("implement-worker-failed: error details from the worker.")
        .optional(),
      conflicting_files: ExitConflictingFilesSchema.describe(
        "implement-merge-conflict: files with conflict markers after the cherry-pick merge.",
      ).optional(),
      failed_command: z
        .string()
        .min(1)
        .max(4096)
        .describe("implement-phase-checkpoint: the command that failed.")
        .optional(),
      output: z
        .string()
        .min(1)
        .max(65536)
        .describe("implement-phase-checkpoint: error output of the failed command.")
        .optional(),
      reasons: ExitStringListSchema.describe(
        "code-review-no-success: which reviewers ran or failed, and why.",
      ).optional(),
      persistent_findings: ExitStringListSchema.describe(
        "code-review-iterations-exhausted: findings persisting across iterations, " +
          "noting which were fixed vs. which remain.",
      ).optional(),
      circular_dependencies: ExitStringListSchema.describe(
        "code-review-iterations-exhausted (optional): reviewer-check cycles where fixing one " +
          "reviewer's finding causes another's check to fail; the section renders only when present.",
      ).optional(),
    },
    async execute(args) {
      try {
        const parsed = UnleashExitInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const { variant, ...data } = parsed.data
        const rendered: UnleashRenderedTextData = { text: formatUnleashExit(variant, data) }
        return { output: JSON.stringify(success(rendered)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "FORMAT_UNLEASH_EXIT_ERROR" }),
          ),
        }
      }
    },
  })
}

/**
 * Factory that creates the format_unleash_demo tool with injectable git
 * executor and working directory for testability.
 *
 * Rendering semantics (OpenSpec change unleash-deterministic-tools, D6):
 * - validates the demo payload, then renders the exact Step 8 (Demo)
 *   block via the pure formatUnleashDemo lib function: What Was Built /
 *   How to Verify / Test Results / Next Steps with the two prescribed
 *   options (the fixed /uf.finale option plus the tier-selected
 *   refinement option)
 * - returns {text}: the rendered markdown the command emits verbatim
 * - auto-checkpoints "demo" for command "uf.unleash" through the same
 *   writeState path as the checkpoint tool (D5), keyed via resolveKey;
 *   the change name records as checkpoint data when supplied — the
 *   rendered content is presented output, and the full demo payload is
 *   persisted separately by write_unleash_summary (task 4.3)
 *
 * @param exec Git executor used to derive the state key (resolveKey).
 * @param cwd Repository root used for state-key resolution.
 * @returns The format_unleash_demo tool.
 */
export function createFormatUnleashDemoTool(exec: GitExec, cwd: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Render the /uf.unleash Step 8 (Demo) block: What Was Built / How to Verify / Test " +
      "Results / Next Steps, ending with exactly two options — Run `/uf.finale` to create " +
      "PR and watch CI, and the tier-selected refinement option (speckit: Run " +
      "`/speckit.clarify` to refine and iterate; openspec: Update the artifacts under " +
      "`openspec/changes/<name>/` to refine and iterate). Returns {text} to emit verbatim. " +
      "Auto-checkpoints the demo step on success.",
    args: {
      tier: ExitTierSchema.describe(
        "Workflow tier selecting the second Next Steps option (speckit or openspec).",
      ),
      whatWasBuilt: z
        .string()
        .min(1)
        .max(16384)
        .describe(
          "What Was Built: summary from the spec user stories (speckit) or the change proposal (openspec).",
        ),
      howToVerify: z
        .string()
        .min(1)
        .max(16384)
        .describe(
          "How to Verify: verification commands from quickstart.md or the acceptance scenarios.",
        ),
      testResults: z
        .string()
        .min(1)
        .max(16384)
        .describe(
          "Test Results: pass/fail summary with counts from the most recent build/test checkpoint.",
        ),
      changeName: ExitChangeNameSchema.describe(
        "Optional change name interpolated into the openspec second option " +
          "(openspec/changes/<name>/) and recorded as demo checkpoint data; the literal " +
          "<name> placeholder renders when omitted.",
      ).optional(),
    },
    async execute(args) {
      try {
        const parsed = UnleashDemoInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data
        const rendered: UnleashRenderedTextData = { text: formatUnleashDemo(input) }

        // D5: auto-checkpoint through the same state path the checkpoint
        // tool uses (same key derivation via resolveKey), so get_progress
        // readers see the demo step complete.
        const key = resolveKey(exec, cwd)
        const checkpointData: Record<string, unknown> = {}
        if (input.changeName !== undefined) {
          checkpointData.change_name = input.changeName
        }
        recordAutoCheckpoint(cwd, key, "uf.unleash", "demo", checkpointData)

        return { output: JSON.stringify(success(rendered)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "FORMAT_UNLEASH_DEMO_ERROR" }),
          ),
        }
      }
    },
  })
}

// ---------------------------------------------------------------------------
// write_unleash_summary tool
// ---------------------------------------------------------------------------

/** Unleash-summary artifact directory relative to the project root. */
const UNLEASH_SUMMARY_DIR = ".uf/artifacts/unleash-summary"

/** One review gate's terminal verdict and the fix iterations it took. */
export interface UnleashSummaryReviewVerdict {
  /** Terminal verdict as the review loop recorded it (e.g. APPROVE). */
  readonly verdict: string
  /** Fix iterations the gate needed before reaching that verdict. */
  readonly iterations: number
}

/**
 * The unleash-summary artifact shape (OpenSpec changes
 * unleash-deterministic-tools, D7, and persist-unleash-summary, FR-002/D2;
 * finale-token-reduction, D5).
 *
 * Naming convention: workflow metadata and the three finale contract fields
 * are camelCase; the provenance fields `artifact_type` and `schema_version`
 * keep the snake_case names the persist-unleash-summary contract pinned
 * (its FR-002 scenario asserts those exact keys), and `branch`/`timestamp`
 * complete that provenance block. The tool input keeps the sibling tools'
 * snake_case parameter names (change_name, feature_dir, review_verdicts,
 * learnings_stored) and the factory maps them to these artifact names at
 * write time.
 *
 * `whatWasBuilt`/`howToVerify`/`testResults` are fixed by the consumer
 * contract: uf_finale_pr_context (uf-finale/index.ts, "Unleash summary
 * artifact" block) reads `.uf/artifacts/unleash-summary/<slug>.json`,
 * JSON-parses it into `unleashSummary`, and the three fields populate
 * /uf.finale's PR body sections. The values are the same ones the demo
 * step passed to format_unleash_demo, so the rendered demo and the
 * persisted artifact cannot drift. Consumers ignore unknown fields, so
 * the workflow metadata riding along is forward-safe.
 */
export interface UnleashSummary {
  /** Change name as uf_unleash_branch_gate derived it. */
  readonly changeName: string
  /** Workflow tier of the completed pipeline. */
  readonly tier: WorkflowTier
  /** Feature directory (trailing slash) the pipeline ran against. */
  readonly featureDir: string
  /** Terminal review-gate verdicts and iteration counts. */
  readonly reviewVerdicts: {
    readonly specReview?: UnleashSummaryReviewVerdict
    readonly codeReview?: UnleashSummaryReviewVerdict
  }
  /** Learnings stored during the retrospective (paths or identifiers). */
  readonly learningsStored: readonly string[]
  /** What Was Built, exactly as format_unleash_demo rendered it. */
  readonly whatWasBuilt: string
  /** How to Verify, exactly as format_unleash_demo rendered it. */
  readonly howToVerify: string
  /** Test Results, exactly as format_unleash_demo rendered it. */
  readonly testResults: string
  /** Artifact kind discriminator; always "unleash-summary" (persist-unleash-summary FR-002). */
  readonly artifact_type: "unleash-summary"
  /** Artifact schema version (persist-unleash-summary FR-002). */
  readonly schema_version: 1
  /** Raw git branch name detected at write time (the slug is derived from it). */
  readonly branch: string
  /** Completion timestamp (ISO 8601), generated at write time (persist-unleash-summary FR-002). */
  readonly timestamp: string
}

/** Structured output from write_unleash_summary. */
export interface WriteUnleashSummaryData {
  /** Absolute path of the written artifact. */
  readonly path: string
  /** Byte size of the written artifact (UTF-8, including the newline). */
  readonly bytes: number
  /** Raw branch name the artifact was keyed by (persist-unleash-summary FR-005). */
  readonly branch: string
}

/** One review gate's verdict and iteration count (zod input mirror). */
const SummaryReviewVerdictSchema = z
  .object({
    verdict: z.string().min(1).max(256).describe("Terminal verdict the review loop recorded (e.g. APPROVE)."),
    iterations: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .describe("Fix iterations the gate needed before reaching that verdict."),
  })
  .strict()

/**
 * zod-validated input contract for write_unleash_summary. Parameter
 * names follow the sibling tools' snake_case conventions (change_name,
 * feature_dir, review_verdicts, learnings_stored — as
 * uf_unleash_branch_gate and the checkpoint family use them); the three
 * demo-payload fields reuse format_unleash_demo's camelCase names so
 * the same values compose the rendered demo and the persisted artifact
 * without a renaming hop. The demo-payload fields carry no zod `.min(1)`
 * here: the execute body's INVALID_UNLEASH_SUMMARY pre-check
 * (persist-unleash-summary FR-004) owns their non-empty/non-whitespace
 * validation so empty and missing content both surface under that code.
 */
const WriteUnleashSummaryInputSchema = z
  .object({
    change_name: ExitChangeNameSchema,
    tier: ExitTierSchema,
    feature_dir: z.string().min(1).max(1024),
    review_verdicts: z
      .object({
        spec_review: SummaryReviewVerdictSchema.optional(),
        code_review: SummaryReviewVerdictSchema.optional(),
      })
      .strict(),
    learnings_stored: z.array(z.string().min(1).max(1024)).max(1000),
    whatWasBuilt: z.string().max(16384),
    howToVerify: z.string().max(16384),
    testResults: z.string().max(16384),
  })
  .strict()

/**
 * Factory that creates the write_unleash_summary tool with injectable
 * git executor and working directory for testability.
 *
 * Write semantics (OpenSpec change unleash-deterministic-tools, D7,
 * merged with persist-unleash-summary FR-001 through FR-005):
 * - derives the artifact file name from the current branch through the
 *   progress-store slug rules (sanitizeSlug — the exact derivation
 *   uf_finale_pr_context applies on its read side), so writer and
 *   reader cannot disagree about the path; detached HEAD fails
 *   DETACHED_HEAD because the file name is branch-derived; no
 *   caller-supplied branch override exists, keeping the write path
 *   symmetric with the uf_finale_pr_context read path
 * - validates the three demo-content parameters as non-empty,
 *   non-whitespace strings BEFORE any schema parse, git call, or
 *   filesystem side effect, failing with INVALID_UNLEASH_SUMMARY so
 *   /uf.finale keeps its no-artifact fallback rather than preferring
 *   an empty artifact
 * - writes `.uf/artifacts/unleash-summary/<slug>.json` with the state
 *   store's hygiene: 0o700 recursive mkdir, 0o600 file, lstat-based
 *   symlink refusal on both the target path and the artifact directory,
 *   and a statePath-style prefix check enforcing that the resolved path
 *   cannot escape the artifact directory (the slug rules already
 *   confine the name to [a-zA-Z0-9._-]; the check is defense in depth)
 * - stamps `timestamp` server-side at write time (ISO 8601) — the
 *   completion moment is when the artifact is written, not when the
 *   caller started composing it — alongside the persist-unleash-summary
 *   provenance block (artifact_type, schema_version, branch)
 * - an existing regular artifact is replaced unconditionally (a resumed
 *   demo rewrites it with the newer summary; latest run is
 *   authoritative); a symlinked path is never followed
 * - feature_dir is recorded as metadata only — this tool performs no
 *   filesystem access through it
 * - does NOT checkpoint: the demo step already checkpointed through
 *   format_unleash_demo; this is the terminal artifact write
 *
 * @param exec Git executor used to read the current branch.
 * @param cwd Repository root the artifact directory resolves against.
 * @returns The write_unleash_summary tool.
 */
export function createWriteUnleashSummaryTool(exec: GitExec, cwd: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Write the /uf.unleash summary artifact to " +
      ".uf/artifacts/unleash-summary/<sanitized-branch>.json for /uf.finale consumption: " +
      "change name, tier, feature dir, review verdicts with iteration counts, learnings " +
      "stored, the demo payload whatWasBuilt/howToVerify/testResults — the same values " +
      "format_unleash_demo rendered (uf_finale_pr_context reads them back as " +
      "unleashSummary) — and provenance metadata (artifact_type, schema_version, branch, " +
      "timestamp). Creates the directory with " +
      "0o700 and the file with 0o600, refuses symlinked paths, and blocks traversal. " +
      "Returns {path, bytes, branch}. Does not checkpoint.",
    args: {
      change_name: WriteUnleashSummaryInputSchema.shape.change_name.describe(
        "Change name as uf_unleash_branch_gate derived it (opsx change id, or the speckit name with the numeric prefix stripped).",
      ),
      tier: WriteUnleashSummaryInputSchema.shape.tier.describe(
        "Workflow tier of the completed pipeline (speckit or openspec).",
      ),
      feature_dir: WriteUnleashSummaryInputSchema.shape.feature_dir.describe(
        "Feature directory relative to the repo root, as returned by uf_unleash_branch_gate " +
          "(recorded as artifact metadata; not used for filesystem access).",
      ),
      review_verdicts: WriteUnleashSummaryInputSchema.shape.review_verdicts.describe(
        "Terminal review verdicts and iteration counts: spec_review and code_review, each " +
          "{verdict, iterations}; a gate the pipeline did not reach is omitted.",
      ),
      learnings_stored: WriteUnleashSummaryInputSchema.shape.learnings_stored.describe(
        "Learnings stored during the retrospective: Dewey learning identifiers or " +
          ".uf/dewey/learnings file paths; empty when none were stored.",
      ),
      whatWasBuilt: WriteUnleashSummaryInputSchema.shape.whatWasBuilt.describe(
        "What Was Built: the exact value format_unleash_demo rendered (summary from the spec user stories or the change proposal).",
      ),
      howToVerify: WriteUnleashSummaryInputSchema.shape.howToVerify.describe(
        "How to Verify: the exact value format_unleash_demo rendered (verification commands from quickstart.md or the acceptance scenarios).",
      ),
      testResults: WriteUnleashSummaryInputSchema.shape.testResults.describe(
        "Test Results: the exact value format_unleash_demo rendered (pass/fail summary with counts from the most recent build/test checkpoint).",
      ),
    },
    async execute(args) {
      try {
        // FR-004 (persist-unleash-summary, D7): the three demo-content
        // parameters must be non-empty, non-whitespace strings — validated
        // before any schema parse, git call, or filesystem side effect so
        // nothing is ever written and /uf.finale keeps its no-artifact
        // fallback instead of preferring an empty artifact.
        const sections: ReadonlyArray<readonly [string, unknown]> = [
          ["whatWasBuilt", args.whatWasBuilt],
          ["howToVerify", args.howToVerify],
          ["testResults", args.testResults],
        ]
        for (const [name, value] of sections) {
          if (typeof value !== "string" || value.trim() === "") {
            return {
              output: JSON.stringify(
                failure(`Parameter \`${name}\` must be a non-empty, non-whitespace string`, {
                  retryable: false,
                  code: "INVALID_UNLEASH_SUMMARY",
                }),
              ),
            }
          }
        }

        const parsed = WriteUnleashSummaryInputSchema.safeParse(args)
        if (!parsed.success) {
          const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
          return {
            output: JSON.stringify(failure(details, { retryable: false, code: "INVALID_INPUT" })),
          }
        }
        const input = parsed.data

        // Branch-derived file name, sanitized through the progress-store
        // slug rules — the same derivation the finale consumer applies
        // when reading the artifact back (resolveKey precedent).
        const branch = exec(["rev-parse", "--abbrev-ref", "HEAD"], cwd)
        if (branch === "HEAD") {
          return {
            output: JSON.stringify(
              failure(
                "Detached HEAD — write_unleash_summary derives the artifact file name from the branch name",
                { retryable: false, code: "DETACHED_HEAD" },
              ),
            ),
          }
        }
        const slug = sanitizeSlug(branch)

        const summaryRoot = resolve(cwd, UNLEASH_SUMMARY_DIR)
        const filePath = resolve(summaryRoot, `${slug}.json`)

        // Traversal protection (statePath precedent): the slug rules
        // already confine the file name; the prefix check enforces it
        // structurally instead of trusting the sanitizer.
        if (!filePath.startsWith(summaryRoot + "/")) {
          return {
            output: JSON.stringify(
              failure("Path traversal blocked: resolved path escapes .uf/artifacts/unleash-summary/", {
                retryable: false,
                code: "SUMMARY_PATH_TRAVERSAL",
              }),
            ),
          }
        }

        // Symlink refusal — the artifact path itself. writeFileSync
        // would follow a symlink and write outside the artifact
        // directory, so an existing symlink fails closed.
        try {
          const stats = lstatSync(filePath)
          if (stats.isSymbolicLink()) {
            return {
              output: JSON.stringify(
                failure(`Refusing to write unleash summary through symlinked path: ${filePath}`, {
                  retryable: false,
                  code: "SUMMARY_PATH_IS_SYMLINK",
                }),
              ),
            }
          }
        } catch (err: unknown) {
          if (!isEnoent(err)) throw err
          // No existing artifact — the write below creates it.
        }

        // Symlink refusal — the artifact directory (writeState
        // precedent: refuse before the recursive mkdir creates it).
        try {
          const dirStats = lstatSync(summaryRoot)
          if (dirStats.isSymbolicLink()) {
            return {
              output: JSON.stringify(
                failure("Refusing to write into symlinked directory: .uf/artifacts/unleash-summary/", {
                  retryable: false,
                  code: "SUMMARY_DIR_IS_SYMLINK",
                }),
              ),
            }
          }
        } catch (err: unknown) {
          if (!isEnoent(err)) throw err
          // Directory does not exist yet — created below.
        }

        // Input (snake_case parameters) → artifact (camelCase fields).
        // Mutable local shape; assigned into the readonly summary field
        // (construction-time assignment, never mutated afterwards).
        const reviewVerdicts: {
          specReview?: UnleashSummaryReviewVerdict
          codeReview?: UnleashSummaryReviewVerdict
        } = {}
        if (input.review_verdicts.spec_review !== undefined) {
          reviewVerdicts.specReview = input.review_verdicts.spec_review
        }
        if (input.review_verdicts.code_review !== undefined) {
          reviewVerdicts.codeReview = input.review_verdicts.code_review
        }
        const summary: UnleashSummary = {
          changeName: input.change_name,
          tier: input.tier,
          featureDir: input.feature_dir,
          reviewVerdicts,
          learningsStored: input.learnings_stored,
          whatWasBuilt: input.whatWasBuilt,
          howToVerify: input.howToVerify,
          testResults: input.testResults,
          // Provenance block pinned by the persist-unleash-summary FR-002
          // scenario: artifact kind, schema version, raw branch, and the
          // server-stamped ISO 8601 completion timestamp.
          artifact_type: "unleash-summary",
          schema_version: 1,
          branch,
          timestamp: new Date().toISOString(),
        }

        // Same write hygiene as the state store: 0o700 recursive mkdir,
        // 0o600 file, pretty-printed JSON with a trailing newline.
        mkdirSync(summaryRoot, { recursive: true, mode: 0o700 })
        const contents = JSON.stringify(summary, null, 2) + "\n"
        writeFileSync(filePath, contents, { mode: 0o600 })

        const data: WriteUnleashSummaryData = {
          path: filePath,
          bytes: Buffer.byteLength(contents, "utf-8"),
          branch,
        }
        return { output: JSON.stringify(success(data)) }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          output: JSON.stringify(
            failure(msg, { retryable: false, code: "SUMMARY_WRITE_ERROR" }),
          ),
        }
      }
    },
  })
}

/**
 * Compatibility factory for the persist_unleash_summary tool name.
 *
 * The persist-unleash-summary change (origin/main) and the
 * unleash-deterministic-tools change (this branch) independently
 * implemented Step 10 summary persistence; the merge deduplicated them
 * into write_unleash_summary above as the mechanism of record, absorbing
 * the persist-unleash-summary contract (artifact path, flat camelCase
 * content fields, provenance block, INVALID_UNLEASH_SUMMARY validation,
 * hardened write). This factory preserves that change's FR-005
 * registration surface — the tool map exposes the same implementation
 * under `persist_unleash_summary`, and the exported factory keeps its
 * (exec, cwd) signature — while delegating to the single implementation
 * so the two names can never drift.
 *
 * @param exec Git executor used to read the current branch.
 * @param cwd Repository root the artifact directory resolves against.
 * @returns The write_unleash_summary tool, registered as persist_unleash_summary.
 */
export function createPersistUnleashSummaryTool(exec: GitExec, cwd: string): ReturnType<typeof tool> {
  return createWriteUnleashSummaryTool(exec, cwd)
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
        // Compatibility registration (persist-unleash-summary FR-005): the
        // same write_unleash_summary implementation, exposed under the name
        // that change specced. See createPersistUnleashSummaryTool.
        persist_unleash_summary: createPersistUnleashSummaryTool(defaultGitExec, cwd),
        git_fetch: createGitFetchTool(defaultGitExec, cwd),
        git_push: createGitPushTool(defaultGitExec, cwd),
        git_push_force_with_lease: createGitPushForceWithLeaseTool(defaultGitExec, cwd),
        git_merge: createGitMergeTool(defaultGitExec, cwd),
        git_merge_abort: createGitMergeAbortTool(defaultGitExec, cwd),
        git_rebase: createGitRebaseTool(defaultGitExec, cwd),
        git_rebase_abort: createGitRebaseAbortTool(defaultGitExec, cwd),
        git_conflict_files: createGitConflictFilesTool(defaultGitExec, cwd),
        git_commit_no_edit: createGitCommitNoEditTool(defaultGitExec, cwd),
        uf_unleash_branch_gate: createUnleashBranchGateTool(defaultGitExec, cwd, defaultFileExists),
        uf_delegate_command: createDelegateCommandTool(defaultGitExec, cwd, {
          client: input.client,
          readText: (path: string) => readFile(path, "utf8"),
          fileExists: defaultFileExists,
        }),
        uf_unleash_detect_resume: createUnleashDetectResumeTool(defaultGitExec, cwd, {
          readText: (path: string) => readFile(path, "utf8"),
          fileExists: defaultFileExists,
          readDir: (path: string) => readdir(path),
        }),
        scan_clarifications: createScanClarificationsTool(cwd, {
          readText: (path: string) => readFile(path, "utf8"),
        }),
        resolve_clarification: createResolveClarificationTool(cwd, {
          readText: (path: string) => readFile(path, "utf8"),
          writeText: (path: string, contents: string) => writeFile(path, contents, "utf8"),
        }),
        parse_tasks: createParseTasksTool(cwd, {
          readText: (path: string) => readFile(path, "utf8"),
        }),
        mark_task_complete: createMarkTaskCompleteTool(cwd, {
          readText: (path: string) => readFile(path, "utf8"),
          writeText: (path: string, contents: string) => writeFile(path, contents, "utf8"),
        }),
        scan_conflict_markers: createScanConflictMarkersTool(cwd, {
          readText: (path: string) => readFile(path, "utf8"),
          readDir: (path: string) => readdir(path),
          isDirectory: async (path: string) => {
            try {
              return (await lstat(path)).isDirectory()
            } catch {
              return false
            }
          },
        }),
        format_unleash_exit: createFormatUnleashExitTool(cwd),
        format_unleash_demo: createFormatUnleashDemoTool(defaultGitExec, cwd),
        write_unleash_summary: createWriteUnleashSummaryTool(defaultGitExec, cwd),
      },
    }
  },
} satisfies PluginModule

export default UfWorkflowPlugin
