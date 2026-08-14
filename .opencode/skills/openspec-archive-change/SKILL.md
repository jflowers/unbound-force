---
name: openspec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.2.0"
---

Archive a completed change in the experimental workflow.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **question tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **question tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **question tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

5. **Commit and push all changes**

   Before archiving or switching branches, ALL work on
   the current branch MUST be committed and pushed.

   a. Run `git status --short` to check for uncommitted
      changes (staged, unstaged, or untracked files
      related to this change).

   b. **If uncommitted changes exist:**
      - Stage and commit all relevant changes with a
        descriptive commit message.
      - Push to the remote branch.
      - Verify `git status` is clean before proceeding.

   c. **If the working tree is already clean:** proceed.

   **CRITICAL**: Do NOT move to step 6 (archive) or
   step 7 (branch switch) with uncommitted changes.
   Switching branches with a dirty working tree causes
   changes to follow you to the wrong branch or be
   lost entirely.

   d. **Commit-state confirmation gate**: Before
      proceeding to step 6, run `git status --short` and
      present the output to the user. Use the
      **question tool** with options:
      - "Changes committed and pushed — proceed to archive"
      - "Abort — need to commit first"

      If the user selects **"Abort"**: display which
      steps have completed (steps 1-5), inform the user
      they can re-run the archive skill after committing
      and pushing their changes, then **STOP** execution
      immediately. Do NOT proceed to step 6 (archive) or
      step 7 (branch switch).

      This gate MUST be presented fresh in every session
      regardless of prior context. Compressed or resumed
      session state MUST NOT be treated as implicit
      authorization to skip this gate.

6. **Perform the archive**

   Create the archive directory if it doesn't exist:
   ```bash
   mkdir -p openspec/changes/archive
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move the change directory to archive

   Execute the following only if the target does not already exist:
   ```bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```

7. **Return to main branch**

   After the archive move completes, commit the archive:
   ```bash
   git add openspec/changes/archive/
   git commit -m "chore: archive openspec change <name>"
   git push
   ```

   Then use the **question tool** to confirm
   before switching branches:
   - **Options**: `["Return to main", "Stay on branch"]`

   **If "Return to main":**
   ```bash
   git checkout main
   ```

   The `opsx/<name>` branch still exists locally. Note
   in the summary that the developer can delete it
   manually with `git branch -d opsx/<name>` if desired.

   **If "Stay on branch":**
   Skip the checkout. Note in the summary that the
   developer remained on `opsx/<name>` and can switch
   to main manually with `git checkout main` when ready.

8. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Branch status (returned to main / stayed on opsx/<name>)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")
**Branch:** returned to main | stayed on opsx/<name>

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use openspec-sync-specs approach (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
