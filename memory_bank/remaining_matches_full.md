Remaining matches — full curated list
Generated: 2025-10-04T22:46:25+07:00
Purpose:
- A non-destructive, per-file catalog of remaining "fire"/"flame"/"ember"/"lava"/"gof"/"God of Fire"/Vietnamese Hỏa/Hoả occurrences across the repository.
- Each entry includes: file path, example snippet (short), suggested replacement, risk level, and recommended action (automated vs manual).
- This file is read-only. No replacements will be applied by creating this file.

Notes:
- Code-level identifiers (function names, COLOR keys, storage keys) are high-risk to change automatically. The guidance below preserves function names and COLOR keys unless you explicitly ask for renames plus migration.
- Image binaries and generated build outputs are listed but not modified. File renames for images are medium-risk and will be proposed but not executed until you confirm per-file.
- Storage/localStorage keys should be preserved unless you want a migration helper implemented first.

High-priority (UX/runtime or highly visible text)
1) src/splash.js
   - Snippet: `localStorage.getItem("gof.uiPrefs")`
   - Suggested replacement: Keep `gof.uiPrefs` (no rename) OR migrate to `goe.uiPrefs` with migration helper.
   - Risk: medium (persistent prefs/migration required)
   - Action: no change by default; implement migration helper if renaming desired.

2) src/i18n.js
   - Snippet: comment `i18n utility (logic only) for GoF RPG.` and `const STORAGE_KEY = "gof.lang";`
   - Suggested replacement:
     - Doc: "GoE RPG — God of Earth"
     - Storage key: keep `gof.lang` OR plan migration
   - Risk: low for doc; medium for storage key.
   - Action: doc automated; storage key only after migration plan.

3) src/skills.js
   - Snippets (examples):
     - `// Attempt a basic fire attack if in range and off cooldown.`
     - `this.effects.spawnFireball(from, to, { color: COLOR.fire, size: 0.35, ... })`
     - `try { this.effects.spawnFireStreamAuto(from, to, COLOR.ember, 0.08); } catch(_) {}`
   - Suggested replacement:
     - Update comments to earth-themed wording (e.g., "basic earth attack")
     - Keep function names (`spawnFireball`, `spawnFireStream*`) and COLOR usage (safe — colors remapped in constants)
   - Risk: low if updating comments only; high if renaming identifiers.
   - Action: automated comment/string updates only.

4) src/effects.js
   - Snippets:
     - `normalizeColor(c, fallback = COLOR.fire)`
     - Many function defaults: `color = COLOR.fire`, `color = COLOR.ember`
   - Suggested replacement:
     - Update comments and in-file descriptive strings to earth equivalents (stone/dust/pebble)
     - Keep parameter defaults and function names unchanged
   - Risk: low (comments/strings); do NOT change defaults or function names automatically.
   - Action: automated comment updates.

5) src/meshes.js
   - Snippets:
     - `new THREE.MeshStandardMaterial({ color: COLOR.fire, emissive: 0x6a8f4e, ... })`
     - Comments: "World position of GoF's right hand (fire hand); fallback to chest height."
   - Suggested replacement:
     - Update comments/docstrings: "GoE", "earth hand", "earth glow"
     - Keep COLOR usage as-is (COLOR.fire now maps to earth hex)
   - Risk: low
   - Action: automated comment updates.

6) src/uplift.js
   - Snippet: `const fx = impactPicks > 0 ? { impactColor: 0xffa500 } : null; // Ember orange`
   - Suggested replacement:
     - Replace hard-coded literal with `impactColor: COLOR.midFire` (since constants map midFire to sandstone) OR `0xcaa36b`
     - Update comment to "sandstone / pebble"
   - Risk: low
   - Action: automated literal -> COLOR.* replacement recommended

7) src/entities.js
   - Snippets: 
     - `// Fire light glow on the character (updated for fire theme)`
     - `World position of GoF's right hand (fire hand); fallback to chest height.`
   - Suggested replacement:
     - Comments -> "earth glow", "GoE's right hand (earth hand)"
   - Risk: low
   - Action: automated comment updates.

8) src/skills_pool.js
   - Snippets: some `name`/`description` strings or example ids referencing flame/ignite
   - Suggested replacement:
     - Update `name` and `description` text to earth equivalents (e.g., "Flame Chain" -> "Root Chain")
     - Do NOT change internal `id` fields unless you're prepared to update all references (higher risk)
   - Risk: medium if changing ids; low if only changing display `name`/`description`
   - Action: automated updates to `name` and `description` only; produce id mapping before renaming ids.

9) src/portals.js
   - Snippet: `const LS_KEY_MARKS = "gof.persistentMarks";` etc.
   - Suggested replacement: keep `gof.*` localStorage keys, or plan migration
   - Risk: medium for storage keys
   - Action: leave keys; optional migration helper.

Medium-priority (docs, metadata, images, build)
10) index.html
    - Snippets: `<title>GoF RPG</title>`, meta `og:title`, `og:description` containing "God of Fire"
    - Suggested replacement: `<title>GoE RPG</title>` and updated description text
    - Risk: low
    - Action: automated

11) manifest.json
    - Snippet: `"name": "GoF RPG"`, `theme_color: "#ff6b35"`
    - Suggested replacement: `"name": "GoE RPG"`, `theme_color: "#6b5a49"`
    - Risk: low
    - Action: automated

12) android-build/*.json & android-build/* (TWA settings)
    - Snippets: web_app_manifest.json name/background/theme_color set to GoF/#ff6b35; android-build/app/build settings naming
    - Suggested replacement:
      - Update source files (android-build/app/src/main/res/raw/web_app_manifest.json and build files) where appropriate. Note: many android-build files are generated or used to package the TWA.
    - Risk: medium-high (packaging). If you want the packaged TWA updated, update the sources and rebuild TWA.
    - Action: propose edits to source JSON; do not overwrite build artifacts unless requested.

13) README.md & memory_bank/*.md & memory_bank/docs/**
    - Snippets: "GoF RPG", "God of Fire", fire-themed narrative
    - Suggested replacement: "GoE RPG", "God of Earth", update narratives
    - Risk: low
    - Action: automated for documentation files.

14) images/
    - Files matched: images/gof-*.png, images/gof-splash-*.png, images/gof-feature-graphics.png, etc.
    - Suggested replacement:
      - Filenames: optional rename `gof-` -> `goe-` and update references
      - Content: image art will remain fire-themed until replaced by new assets (manual step)
    - Risk: medium (binary rename + reference updates)
    - Action: produce assets list for review; do NOT rename images automatically.

15) memory_bank/publish.md and other narrative docs in Vietnamese
    - Snippet: lots of Vietnamese narrative referencing "Hoả Thần", "vị hoả thần", etc.
    - Suggested replacement: rewrite to earth-centered narrative "Thần Kim Loại", "vị thần đất", etc.
    - Risk: low
    - Action: automated replacements for text files OK; if you want to keep creative copy, review before applying.

Storage & localStorage keys (migration considerations)
- Keys found: "gof.renderPrefs", "gof.uiPrefs", "gof.lang", "gof.dynamic.villages.v1", "gof.persistentMarks", "gof.markNextReadyAt", "gof.chunk*", "gof.audioPrefs", "gof.envPrefs"
- Recommendation:
  - Preserve `gof.*` keys to avoid breaking existing users
  - If a rename is desired, implement a migration helper that copies old keys to new keys on first load then marks migration as complete
  - I can implement a small migration helper placed early in startup (e.g., `src/main.js`), which will be safe and idempotent.
- Risk: medium-high for direct rename; implementing migration helper is low-risk.

Vendor/build files (do not change)
- Files such as vendor/three/examples/jsm/... and android-build generated outputs contain many references. Do not modify vendor or generated artifact files unless necessary.

Concrete sample replacements I can safely apply now (non-runtime):
- Doc/comment replacements:
  - `GoF` -> `GoE`
  - `God of Fire` -> `God of Earth`
  - Comments: `fire` -> `earth/stone/moss` depending on context
  - `ember` -> `pebble/dust/sandstone` depending on context
- Code literal replacement (safe):
  - `impactColor: 0xffa500 // Ember orange` -> `impactColor: COLOR.midFire // Sandstone (mapped in constants)`
  - `const fx = impactPicks > 0 ? { impactColor: 0xffa500 } : null;` -> `const fx = impactPicks > 0 ? { impactColor: COLOR.midFire } : null;`

Recommended next steps (safe, staged)
1) Produce this full-match file (this step).
2) Apply automated replacements to documentation, index.html, manifest.json, memory_bank docs, README (low risk).
3) Apply automated in-code comment & non-functional string replacements across src/* (low risk) — do not change function names or storage keys.
4) Produce assets list (images/gof-*) so you can confirm per-file renames or replacements (read-only).
5) Optionally implement storage migration helper (adds safe migration code).
6) Start local server and run smoke tests.

If you want me to proceed with automated edits, reply with one of:
- `2` to apply doc/metadata changes now (index.html, manifest.json, README, memory_bank)
- `3` to apply in-code comment & non-functional string changes (src/*.js comments, docstrings, splash copy, locales already partially updated)
- `4` to insert a storage-key migration helper (non-destructive copy on first run)
- `5` to produce the assets list for images (read-only)
- `all` to run 2→5 in sequence (I will write changes and show updated files)

Task progress (updated):
- [x] Analyze requirements
- [x] Retheme CSS tokens and core color mapping
- [x] Update key JS files (effects, audio, meshes, environment, skills)
- [x] Update locales and manifest (partial)
- [x] Produce full list of remaining "fire" related occurrences across repo
- [ ] Apply approved replacements (pending your selection)
- [ ] Run smoke test locally and verify runtime
