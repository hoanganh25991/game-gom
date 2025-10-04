Next steps for "God of Earth" retheme — choose one action

I finished a large safe pass: CSS, locales, many docs, effects/skills comments, manifest, and meshes fixes.
Several lower-risk and higher-risk items remain.

Please reply with the single letter/number you want me to execute next. I'll run the chosen step.

Options:
1) Produce a curated, per-file list of remaining "fire/flame/ember/lava/GoF" occurrences with suggested replacements (read-only). Recommended before applying more automated changes.

2) Update src/entities.js comments and visible strings to earth wording (safe; preserves API).

3) Implement storage-key migration helper (create new earth-pref keys and copy old values when present). Medium risk (preserves user data).

4) Prepare an asset rename plan for images (list gof-* files and references). I will not rename files until you confirm per-file.

5) Start a local static server for smoke testing (runs: npx http-server -p 8000). Requires your confirmation to run.

all) Run steps 1 → 2 → 3 in sequence (docs/list + entities.js + migration helper).

Notes:
- I will never rename vendor/ or android-build files unless you ask.
- I will not change function names or COLOR keys to avoid runtime breakage (colors are already remapped).
- After you choose, I will run the single corresponding action and save the results to memory_bank/, then wait for your confirmation.

Reply with: 1, 2, 3, 4, 5, or all
