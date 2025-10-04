Remaining "fire" occurrences — curated list & suggested replacements
Generated: 2025-10-04

Purpose
- Non-destructive curated list of the highest-priority remaining occurrences of "fire", "flame", "ember", "lava", "GoF", etc.
- Each entry: file path, example snippet (short), suggested replacement.
- I will not apply any changes from this file without your explicit approval.

Documentation & metadata (low risk — safe to replace)
1) manifest.json (already updated) — previously:
   - "name": "GoF RPG"  -> replaced with "GoE RPG"
   - "theme_color": "#ff6b35" -> replaced with "#6b5a49"
   (done)

2) index.html
   - Snippet: <title>GoF RPG</title>, meta og:title "God of Fire RPG", og:description "God of Fire..."
   - Suggest: "GoE RPG", "God of Earth RPG", adjust description to earth-themed copy.
   - Risk: Low (UI/SEO). Action: replace after your approval.

3) README.md & memory_bank/*.md
   - Many occurrences already updated (projectbrief, productContext, systemPatterns).
   - Remaining: memory_bank/README.md references "GoF RPG" and repo path `game-gof`.
   - Suggest: "GoE RPG", update repo path notes if you want (optional).

Source files — high priority to review (low-to-medium risk)
4) src/locales/* (EN/VI)
   - status: en.json and vi.json values have been updated to earth skill names and hero/title.
   - Note: keys (ids) were preserved; only values changed.

5) src/skills_pool.js
   - Snippet: many in-data descriptions and skill ids may still reference flame_chain or flame ids.
   - Example: id: "flame_chain" or description text referencing "ignite/spread flames"
   - Suggest: Update skill display names & descriptions (values) to earth equivalents. If you want to rename skill ids (e.g., flame_chain -> root_chain), note this is higher risk since code may store ids (loadouts, saved data). Recommended: change names (locales + name fields) and leave ids unless you want to migrate stored loadouts.

6) src/skills.js (already edited — comments changed)
   - Snippet: many runtime uses still call effects.spawnFireball / spawnFireStream with COLOR.fire / COLOR.ember; these are safe because COLOR maps to earth hexes.
   - Action: No further changes required for behavior. If desired, we can update string comments left (many updated).

7) src/effects.js (already edited — comments changed)
   - Snippet: functions still named spawnFireball, spawnFireStream — preserved for compatibility.
   - Action: OK to keep names; comments updated to earth wording.

8) src/meshes.js (edited)
   - Snippet: placeholder names like "GoF" in comments changed to "GoE"; materials still referencing COLOR.fire (mapped).
   - Action: OK.

9) src/entities.js
   - Snippet: comments and docstrings references present:
     - "World position of GoF's right hand (fire hand)..."
     - "Fire light glow on the character..."
   - Suggest: Update comment text to "GoE", "earth hand / earth glow" (non-breaking). I can update these now (safe).

10) src/uplift.js
    - Snippet: fx impactColor: 0xffa500 // Ember orange
    - Suggest: set to 0xcaa36b or use COLOR.midFire (already mapped). I can change literal to COLOR.midFire or 0xcaa36b (safe).

11) src/main.js
    - Snippet: selectionRing usage: createGroundRing(..., COLOR.fire, ...)
    - Note: COLOR.fire already maps to earth hex; leave as-is for compatibility. Comments referencing "fire orange" can be updated.

12) Storage keys & localStorage (medium-high risk)
    - Keys: "gof.renderPrefs", "gof.uiPrefs", "gof_loadout_v1", STORAGE_KEYS.fireLoadout (if present)
    - Suggest:
      - Keep existing keys to preserve user data.
      - If you want to rename keys (e.g., fireLoadout -> earthLoadout), implement migration helper that copies old key to new key if present, then writes new key. I can add this migration wrapper (safe) if you confirm.

Assets & build artifacts (high risk)
13) images/
    - Filenames: gof-splash-..., gof-feature-graphics.png, etc.
    - Suggest:
      - Option A: leave filenames as-is (low risk) — only change visible text references in docs/UI.
      - Option B: rename assets to goe-* and update references across repo (high risk — must update README, index.html, manifest, and any references).
    - I can produce an assets list for your approval (read-only).

14) android-build & vendor
    - Many build outputs and vendor files reference "GoF" or theme_color. These are build artifacts and should generally be left unchanged. If you want packaged TWA updates, update android-build sources, not generated outputs (I can list the source files to update).

Summary of recommended safe automated actions (I can run now)
A) Produce the full curated per-file list with exact snippets and suggested replacements (write to memory_bank/remaining_matches_full.md). This is read-only and recommended before more changes. (Recommended next step.)

B) Apply targeted in-source comment / UI string edits for entities.js and uplift.js (safe).

C) Add a storage-key migration helper in src/loadout.js or src/config.js that preserves existing data and writes new keys (medium risk, but safe if migration implemented carefully).

Please confirm which of the above you want me to do next:
- Reply "A" to produce the full curated per-file list (I will generate memory_bank/remaining_matches_full.md).
- Reply "B" to immediately update src/entities.js and src/uplift.js comments/values.
- Reply "C" to implement a storage-key migration helper.
- Reply "D" to produce the assets list for images (gof-*) (read-only).
- Reply "E" to start the local static server for smoke testing (I will run: npx http-server -p 8000).

If you prefer a different action, state it and I will run that tooled step.
