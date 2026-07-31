---
description: "Pushes local backlog items to GitHub Issues"
agent: muti-mind-po
---

# Command: /muti-mind.sync-push

## Description

Pushes local backlog items to GitHub Issues using the Go backend, which relies on the `gh` CLI. If an item doesn't have an associated GitHub Issue, it will be created. If it does, the existing issue will be updated.

## Usage

```
/muti-mind.sync-push [item_id]
```

### Arguments

- `item_id` (optional): If provided, only pushes the specified backlog item (e.g., `BI-001`). If omitted, pushes all items.

## Instructions

1. **Preview sync state**: Use the `bash` tool to invoke the
   Go backend's sync-status command to show the user what
   will be synced:
   ```bash
   go run cmd/mutimind/main.go sync-status
   ```
   Note: `sync-status` always reports on all backlog items
   regardless of whether an `item_id` argument was provided.

2. **Handle preview result**:
   - If `sync-status` returns an error or non-zero exit code:
     display the error to the user and **STOP**. Do NOT
     proceed to the confirmation gate or invoke sync-push.
   - If `sync-status` reports no items requiring creation or
     update: inform the user "Nothing to sync." and **STOP**.
     Do NOT present the confirmation gate.
   - Otherwise: present the sync-status output to the user
     and continue to step 3.

3. **Confirmation gate**: Use the **AskUserQuestion tool**
   with the following options:
   - "Yes -- sync to GitHub"
   - "No -- abort"

4. **Handle user response**:
   - If the user selects **"Yes -- sync to GitHub"**: invoke
     the Go backend to perform the push:
     ```bash
     go run cmd/mutimind/main.go sync-push [item_id]
     ```
     Output the results returned by the backend.
   - If the user selects **"No -- abort"**: display
     "Sync aborted." and **STOP**. Do NOT invoke the Go
     backend.
