Next steps — choose one action to continue the retheme (pick a number)

Progress so far:
- CSS tokens rethemed (css/base.css + component files)
- index.html, manifest.json, README.md updated
- locales partially updated
- src: effects.js, main.js, uplift.js, entities.js, skill_upgrades.js, README and other docs updated
- Generated memory_bank/remaining_matches_full.md with all remaining occurrences
- Listed images/gof-* assets

Remaining high-priority items:
- Non-functional in-code comments and user-facing strings referencing "fire"/"Flame"/"Ember"/"GoF" across src/ (about ~92 matches found)
- Storage/localStorage keys prefixed with "gof.*" (migration required if you want to rename)
- Images named gof-* (binary assets; optional rename)
- Android-build/TWA source files (packaging metadata)

Choose one of the following actions for me to perform next:
1) Produce a detailed per-file replacement plan (exact SEARCH/REPLACE lines) and save to memory_bank/replacement_apply_plan.md (read-only). No code changes applied.
2) Apply automated replacements to documentation and metadata only (README, memory_bank docs, memory_bank/README, memory_bank/projectbrief already partially updated, android-build source JSONs where safe).
3) Apply automated in-code comment & non-functional string replacements across src/* (update comments, docstrings, UI text values, splash text) — this will NOT rename functions or storage keys. (Risk: low)
4) Insert a storage-key migration helper (adds idempotent code that copies existing gof.* localStorage keys to gom.* keys at startup, then marks migration complete).
5) Produce an assets report for images/gof-* listing all references and recommended per-file rename actions (read-only).
6) Run actions 1→5 in sequence (full continuation). This will write multiple files/edits; I will show each changed file after edits.

Reply by typing the number (1,2,3,4,5,6). I will wait for your selection and then proceed.

Task progress:
- [x] Analyze requirements
- [x] Retheme CSS tokens and core color mapping
- [x] Update key JS files (effects, audio, meshes, environment, skills)
- [x] Update locales and manifest (partial)
- [x] Produce full list of remaining "fire" related occurrences across repo
- [x] Apply docs/metadata updates (index.html, manifest.json, README.md)
- [x] Apply in-code comment & non-functional string replacements (partial)
- [ ] Apply approved replacements (awaiting your selection)
- [ ] Run smoke test locally and verify runtime
