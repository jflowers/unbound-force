---
tag: doctor-architecture
author: jay-flowers
category: pattern
created_at: 2026-10-27T18:28:37Z
identity: doctor-architecture-20261027T182837-jay-flowers
tier: draft
---

internal/doctor/checks.go accretes per-tool version vocabularies: parseGoVersion/checkGoVersion, parseVersionParts, parseNodeVersion/checkNodeVersion, parsePodmanVersion/checkPodmanVersion, parseDevPodVersion/checkDevPodVersionMin, and the strict three-part parseExactSemver/parseSemverComponent used by review-plugin runtime checks. When a design doc justifies adding (or rejecting reuse of) a version parser for this package, survey ALL of these vocabularies and name the closest existing implementation in the alternatives analysis — not just the most visible one. The replicator-version-floor change (design D4) rejected reuse by characterizing the package's vocabulary as "major.minor-only" via parseVersionParts, missing the strict three-part parser in the same file, and consequently shipped a second strict three-part parser (parseVersionTriple) with undocumented semantic divergence (leading-zero acceptance, int vs uint32).
