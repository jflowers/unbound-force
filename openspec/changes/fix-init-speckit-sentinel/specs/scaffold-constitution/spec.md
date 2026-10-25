## ADDED Requirements

### Requirement: FR-007 — Constitution and specify install coexist

The starter constitution and a full Speckit install MUST coexist
on a fresh `uf init` with the `specify` binary in PATH. The
constitution (`.specify/memory/constitution.md`) is written by
the asset walk; the specify delegation — gated by the
`.specify/scripts` sentinel per the 027-externalize-tool-init
delta (FR-004, FR-017) — then merges the full Speckit framework
around it via `--force` merge semantics (FR-018). The
constitution write MUST NOT suppress the delegation, and the
delegation MUST NOT displace the scaffolded constitution.

#### Scenario: Fresh init yields constitution and framework

- **GIVEN** a fresh target directory and the `specify` binary in
  PATH
- **WHEN** `uf init` completes without `--force`
- **THEN** `.specify/memory/constitution.md` exists, written by
  the asset walk
- **AND** the specify delegation executed
  `specify init --here --integration opencode --offline --force`
- **AND** `.specify/` is reported as `initialized`

#### Scenario: Re-run over an existing install preserves both

- **GIVEN** a full specify install (`.specify/scripts` present)
  with a user-customized
  `.specify/memory/constitution.md`
- **WHEN** `uf init` re-runs without `--force`
- **THEN** the constitution is preserved and reported as
  `skipped` (FR-003)
- **AND** the specify delegation is reported as
  `already configured`

## MODIFIED Requirements

None.

## REMOVED Requirements

### FR-005: Sentinel Interaction — `specify init` Skipped

Reason: FR-005 codified the emergent sentinel collision
introduced by commit ca57106 as intended behavior — the embedded
constitution asset creates the bare `.specify` directory during
the asset walk, the delegation's sentinel check succeeds, and
`specify init` is skipped, yielding a half-installed Speckit
framework (no templates, scripts, or workflows) with no visible
indication of the skip. (Header mirrored from the
fix-constitution-scaffold delta's colon-format ADDED record;
no canonical scaffold-constitution spec exists in
openspec/specs/.) This change restores the coexistence the
fix-constitution-scaffold proposal intended ("The `specify
init` call remains — it scaffolds templates, config, and scripts
that are still needed") and supersedes that change's design
decision to keep the sentinel as a skip gate — its design.md
rejected strengthening the sentinel for fear `specify init`
would overwrite the starter constitution with a `[PLACEHOLDER]`
template, a fear the `--force` merge semantics verified against
specify 1.1.0 (user-owned memory preserved) now disprove; see
this change's design.md. The sentinel is strengthened to
`.specify/scripts` and the invocation gains `--force` per the
027-externalize-tool-init delta (MODIFIED FR-004; ADDED FR-017,
FR-018). The replacement contract on this capability is FR-007
above.

<!-- scaffolded by uf vdev -->
