Curated Replacement Plan — "God of Earth" retheme
Generated: 2025-10-04

Summary
- Purpose: Non-destructive, reviewed list of the high-priority remaining "fire"-themed strings and metadata found in the repo. Each entry contains: file path, example match, suggested replacement text, risk level, and recommended action (automated vs manual).
- Recommended next step: Review this plan and confirm whether I should apply the automated code/text replacements (excluding images/vendor/build artifacts) or only produce a fuller list before changes.

High-priority replacements (suggested)
1) memory_bank/projectbrief.md
   - Match (example): "**Name**: GoF RPG — God of Fire"
   - Suggest: "GoE RPG — God of Earth" and "God of Earth" (everywhere)
   - Risk: Low (documentation only)
   - Action: Safe to replace automatically.

2) README.md, memory_bank/*, memory_bank/docs/*
   - Matches: "GoF RPG", "God of Fire", "Fire-themed hero", "Flame Chain"
   - Suggest: Replace "GoF RPG" -> "GoE RPG", "God of Fire" -> "God of Earth", "Fire-themed" -> "Earth-themed", "Flame Chain" -> "Root Chain" (or keep "flame" ids if code depends on them — see note)
   - Risk: Low (docs). Action: Safe to replace automatically.

3) manifest.json, android-build/*, package/metadata
   - Matches: "GoF RPG", theme_color: "#ff6b35"
   - Suggest: "GoE RPG", update theme_color to an earth hex (e.g., "#6b5a49" or #caa36b)
   - Risk: Medium (if publishing / assets depend on name). Action: Replace after confirming desired brand name and color.

4) images/ (asset filenames like gof-*.png)
   - Matches: file names and image references in README/HTML
   - Suggest: Optionally rename files to goe-* and update references, or keep filenames (low functional impact)
   - Risk: High if renamed without updating references; manual review recommended.
   - Action: Provide a list of filenames to rename; wait for confirmation.

5) src/locales/en.json / src/locales/vi.json
   - Matches: skill names & descriptions (flame_chain, ignite, etc.)
   - Suggest: Replace names & descriptions: e.g., "Flame Chain" -> "Root Chain", "Ignite" -> "Petrify" or "Petrifying"
   - Risk: Medium (affects UI labels). Action: Safe to replace; ensure keys used by code remain valid (we only change values, not keys).

6) src/loadout.js, src/config.js, src/constants.js, src/* storage usage
   - Matches: storage key names like "gof_loadout_v1", "fire_loadout" or STORAGE_KEYS.fireLoadout
   - Suggest: Add new STORAGE_KEYS.earthLoadout and migrate existing data (safe migration): if old key exists, copy value and set new key.
   - Risk: Medium (user save data). Action: Implement migration helper when changing keys.

7) src/skills_pool.js, src/skills.js, src/effects.js, src/meshes.js, src/entities.js, src/main.js
   - Matches: code comments, comment strings, function names like spawnFireball, spawnFireStream, and literal comments referencing "fire" visuals
   - Suggest:
     - Leave function names (spawnFireball etc.) unchanged for API compatibility.
     - Replace in-code comments and UI-facing strings to earth equivalents (e.g., comments "FIRE EFFECT" -> "EARTH EFFECT"; FX default color references already remapped in constants.js).
     - Replace VFX literal color numbers only if necessary (constants already map former fire keys to earth colors).
   - Risk: Low for comments; medium if renaming internal keys or changing behaviors.
   - Action: Replace comments and UI strings automatically; keep API names unchanged.

8) src/splash.js (start screen copy)
   - Match: Vietnamese copy referencing "Hoả Thần" and GoF text
   - Suggest: Replace with earth-themed story copy and change title "Hành trình của Hoả Thần" -> "Hành trình của Thần Đất" and "GoF" -> "GoE" in data-i18n if locale entries updated.
   - Risk: Low; Action: Update both inline text and i18n keys/values in src/locales.

9) src/uplift.js
   - Match: fx impactColor: 0xffa500 // Ember orange
   - Suggest: Replace with an earth-toned default (e.g., 0xcaa36b) or use COLOR.midFire which is already remapped.
   - Risk: Low; Action: Replace literal colors or prefer COLOR tokens.

10) storage / localStorage keys like "gof.renderPrefs", "gof.uiPrefs", etc.
    - Suggest: Keep generic "gof.*" prefix but consider changing branding keys only if desired. If renaming, include migration.
    - Risk: Medium-high if user data must be preserved.
    - Action: Prefer to keep existing keys; optional migration path only if you confirm.

Non-destructive plan (recommended)
Step 1 (safe) — Docs and UI text:
- Replace occurrences in memory_bank, README.md, manifest.json (metadata text only), and locales (values only) to "GoE / God of Earth" and skill name updates.
Step 2 (safe) — Code comments & strings:
- Replace comments and in-code user-facing strings (splash inline HTML, in-js strings shown in UI) to earth equivalents.
Step 3 (cautious) — Storage keys & asset names:
- Propose and apply storage key changes with a migration routine (create migration snippet in src/config.js or src/loadout.js).
- For images: list assets to rename and update references; perform only after consent.
Step 4 (verify) — Run smoke test:
- Start a static server and test a few skills (basic attack, Q, W, E, R) to verify no runtime errors and VFX use new colors.

Automated replacements I can run now (if you confirm)
- All documentation files (memory_bank, README)
- CSS & splash UI text (already done in many files)
- src/locales value replacements
- In-code comments and non-critical strings (excluding vendor & android-build outputs)
- Update manifest.json name + theme_color (optionally)

Files I will NOT modify without explicit approval
- Vendor files under vendor/ or android-build/ (build artifacts)
- Image files in images/ (unless you explicitly ask)
- Anything under android-build/ unless you want mobile packaging updated

Next step
- I will produce an actionable set of exact replacements and apply them, or I can just produce a full curated list of all 117 matches with suggested replacements before applying changes.

Please confirm which action to take next:
- Option A: Generate and apply the automated doc + locale + comment replacements now (I will not change images/vendor/build files). I will create a small migration helper for any storage-key renames if you request them.
- Option B: Produce the full curated per-file list of all matches (117 entries) and wait for your approval before any changes.
- Option C: Apply everything including storage key renames + migration and update manifest + optionally rename images (requires explicit confirmation).
