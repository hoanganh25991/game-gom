Replacement Apply Plan (read-only)
Generated: 2025-10-04T22:57:42+07:00

Purpose
- Provide an exact, per-file replacement plan (SEARCH/REPLACE style) that lists the concrete changes I will apply if you approve. This file is read-only and does not change code.
- Each entry shows the target file, the exact text to SEARCH for (a short unique snippet or line) and the exact REPLACE text I will write.
- I will NOT change function names, API identifiers, or localStorage keys unless you explicitly approve a migration step. This plan focuses on non-functional text, comments, docs, metadata, and safe literal color swaps.

How to use
- Review planned replacements below.
- Reply with "apply plan" to let me run the changes from this plan (I will apply them using replace_in_file/write_to_file).
- Or reply with a number to pick a different next step (see memory_bank/next_steps_choice.md).

Planned replacements (representative and non-exhaustive)
Note: SEARCH blocks are exact substrings to match; REPLACE blocks are the new text.

1) docs & metadata
- index.html
  SEARCH: <title>GoF RPG</title>
  REPLACE: <title>GoM RPG</title>

  SEARCH: <meta name="theme-color" content="#ff6b35" />
  REPLACE: <meta name="theme-color" content="#6b5a49" />

  SEARCH: <meta property="og:title" content="God of Fire RPG" />
  REPLACE: <meta property="og:title" content="God of Earth RPG" />

  SEARCH: <meta property="og:description" content="Top-down action game with God of Fire and volcanic fire abilities." />
  REPLACE: <meta property="og:description" content="Top-down action game with God of Earth and earthen abilities." />

- manifest.json (already updated) — no action
- README.md
  SEARCH: "Player (GoF) moves with RTS‑style orders and auto‑attacks when in range."
  REPLACE: "Player (GoM) moves with RTS‑style orders and auto‑attacks when in range."

  SEARCH: The skills list referencing Chain Lightning/Lightning/Thunderstorm
  REPLACE: Earth skill names (Root Chain, Seismic AOE, Petrifying Aura, Earthen Spire)

- memory_bank/* and other docs
  SEARCH: "GoF RPG"
  REPLACE: "GoM RPG"
  (applies to memory_bank/README.md, memory_bank/projectbrief.md, memory_bank/docs/*, etc.)

2) UI strings & splash
- index.html
  SEARCH: Đang tải Hoả Thần Mãi Đỉnh
  REPLACE: Đang tải Thần Kim Loại

  SEARCH: Chuẩn bị trải nghiệm hoả sét…
  REPLACE: Chuẩn bị trải nghiệm sức mạnh đất…

- src/locales/en.json and vi.json (where present)
  SEARCH: "God of Fire"
  REPLACE: "God of Earth"
  SEARCH: skill name values like "Flame Chain"
  REPLACE: "Root Chain" (only values, not ids)

3) In-code comments and docstrings (safe)
- src/i18n.js
  SEARCH: i18n utility (logic only) for GoF RPG.
  REPLACE: i18n utility (logic only) for GoM RPG.

- src/skill_upgrades.js
  SEARCH: Skill upgrade system for God of Fire
  REPLACE: Skill upgrade system for God of Earth

- src/entities.js, src/meshes.js, src/skills.js, src/effects.js, src/main.js
  - Replace occurrences in comments/docstrings:
    SEARCH: "GoF" (in comments / docstrings)
    REPLACE: "GoM"
    SEARCH: "fire" (only in comments/docstrings/contextual)
    REPLACE: "earth/stone/moss" (contextual; pattern-based)
  - Note: I will not change calls to spawnFireball/spawnFireStream/etc. or COLOR.* keys. These functions and keys will remain, as their values are remapped in src/constants.js.

4) Safe literal color replacements
- src/uplift.js
  SEARCH: const fx = impactPicks > 0 ? { impactColor: 0xffa500 } : null; // Ember orange
  REPLACE: const fx = impactPicks > 0 ? { impactColor: COLOR.midFire } : null; // Sandstone (mapped in constants)

- src/effects.js
  SEARCH: new THREE.MeshBasicMaterial({ color: 0xff6347, transparent: true, opacity: 0.9 })
  REPLACE: new THREE.MeshBasicMaterial({ color: normalizeColor(COLOR.midFire), transparent: true, opacity: 0.9 })

(These were already applied in earlier pass; plan includes them for completeness.)

5) Assets (read-only plan)
- images/gof-*.png
  Plan: produce an assets list (filename + referenced locations). If you want to rename files to gom-*, we will proceed per-file (I will not rename binaries automatically).

6) Storage keys (migration plan — not applied by default)
- Current keys: gof.renderPrefs, gof.uiPrefs, gof.audioPrefs, gof.lang, gof.envPrefs, gof.dynamic.villages.v1, etc.
- Migration helper (optional): add a small, idempotent migration that:
  - On first run, copies localStorage["gof.*"] -> localStorage["gom.*"] for a whitelist of keys.
  - Sets localStorage["gom.migration.v1"] = "1" to avoid re-running.
- I will only implement this if you explicitly select the migration option.

7) Android-build & TWA
- I will update source JSONs under android-build/app/src/main/res/raw/... (where they are source files), replacing "GoF" name and #ff6b35 theme colors with GoM/#6b5a49.
- I will NOT touch generated build artifacts in android-build/build/... unless you ask to.

Scope notes & safeguards
- No function or identifier renames (spawnFireball, COLOR.fire, localStorage keys) unless you explicitly ask and accept migration risk.
- Binary images will not be altered; plan lists them for review.
- All changes are reversible via git (recommended). Please commit or create a branch before applying automated replacements.

Next step
- Reply "apply plan" to let me run all replacements listed above (docs + in-code comments + safe literals).
- Or reply with a number corresponding to memory_bank/next_steps_choice.md (1–6) to pick a different action.
