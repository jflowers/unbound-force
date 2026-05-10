---
tag: go-patterns
author: jay-flowers
category: gotcha
created_at: 2026-05-10T17:33:14Z
identity: go-patterns-20260510T173314-jay-flowers
tier: draft
---

Go's fmt.Fscanln is fundamentally broken for interactive terminal prompts because it uses whitespace-delimited token scanning, not line-oriented reading. On macOS with iTerm2, pressing Enter can send a bare carriage return (0x0D) instead of newline, causing fmt.Fscanln to block indefinitely. The correct replacement is bufio.NewScanner(stdin) with scanner.Scan() and scanner.Text(), which correctly handles all line endings including bare CR, CRLF, and LF. It also naturally handles EOF from piped input — scanner.Scan() returns false, making cancellation detection trivial.
