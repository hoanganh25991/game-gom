/**
 * Map Manager
 * - Defines MAP 1..N with unlock requirements and enemy modifiers per map
 * - Persists current map index and unlocked max to localStorage
 * - Provides a simple API to integrate with UI and enemy spawning
 */
import { STORAGE_KEYS } from "./constants.js";

export function createMapManager() {
  const LS_CUR = STORAGE_KEYS.mapCurrentIndex;
  const LS_MAX = STORAGE_KEYS.mapUnlockedMax;

  // Endless tuning beyond the defined Acts
  const ENDLESS = {
    hpGrowthPerDepth: 1.18,
    dmgGrowthPerDepth: 1.16,
    speedGrowthPerDepth: 1.03,
    countGrowthPerDepth: 1.04,
  };

  // Deterministic icon set for maps (emoji). Order matters for stable mapping.
  const MAP_EMOJIS = [
    "🌿","🪨","⛰️","🏯","⚒️","🗺️","🪨","🪨","🌊","❄️",
    "🌱","🌀","⚡","🛖","⛰️","🏜️","🏞️","🛡️","🧭","🔮",
    "🌫️","⛏️","🌧️","🌥️","🌠"
  ];

  // Definitions: tune per-map enemy tint and multipliers
  const maps = [
    {
      index: 1,
      name: "Act I — Iron Fields",
      requiredLevel: 1,
      enemyTint: 0x6f7b84,
      enemyHpMul: 1.0,
      enemyDmgMul: 1.0,
      enemySpeedMul: 1.0,
      enemyCountMul: 1.0,
      desc: "Cold plains of iron dust and rusted frames. Scrappers and coil-runners prowl the slag ridges.",
      strongEnemies: ["Scrap Ravagers (fast melee)", "Coilcasters (ranged resonance)"],
      imgHint: "Square art: iron-gray field with scattered plates and pipes; metallic-tinted foes.",
    },
    {
      index: 2,
      name: "Act II — Foundry Flats",
      requiredLevel: 5,
      enemyTint: 0xB87333,
      enemyHpMul: 1.35,
      enemyDmgMul: 1.2,
      enemySpeedMul: 1.02,
      enemyCountMul: 1.1,
      desc: "Open foundry plates and slag channels. Molten vents flicker as bronze sentries patrol.",
      strongEnemies: ["Bronze Hounds (pack hunters)", "Rivet Skirmishers (ranged)"],
      imgHint: "Square art: glowing bronze channels across flat steel; bronze-tinted foes.",
    },
    {
      index: 3,
      name: "Act III — Steel Peaks",
      requiredLevel: 10,
      enemyTint: 0xB4B4C8,
      enemyHpMul: 1.8,
      enemyDmgMul: 1.45,
      enemySpeedMul: 1.05,
      enemyCountMul: 1.25,
      desc: "Knife-edged ridgelines of tempered steel. Harriers and shard drones strike from reflective slopes.",
      strongEnemies: ["Razor Stalkers (dive assaults)", "Shard Drones (support)"],
      imgHint: "Square art: jagged steel peaks with chrome sheen; silver-tinted foes.",
    },
    {
      index: 4,
      name: "Act IV — Magnet Citadel",
      requiredLevel: 20,
      enemyTint: 0x88aaff,
      enemyHpMul: 2.4,
      enemyDmgMul: 1.8,
      enemySpeedMul: 1.08,
      enemyCountMul: 1.45,
      desc: "A floating bastion humming with magnetic fields. Conductor wards and polarity knights bar the way.",
      strongEnemies: ["Conductor Constructs (shielded)", "Polarity Knights (coordinated strikes)"],
      imgHint: "Square art: floating citadel with blue electromagnetic glow; blue-tinted foes.",
    },
    {
      index: 5,
      name: "Act V — The Forge Core Spire",
      requiredLevel: 35,
      enemyTint: 0xE6B478,
      enemyHpMul: 3.2,
      enemyDmgMul: 2.3,
      enemySpeedMul: 1.12,
      enemyCountMul: 1.7,
      desc: "A towering spire where forge heat and resonance converge. Core wardens and arc welders test all intruders.",
      strongEnemies: ["Core Colossus (heavy slam)", "Arc Welders (piercing beams)"],
      imgHint: "Square art: colossal spire with molten veins; amber-blue tinted foes.",
    },
  ];

  // Allow endless indices (no upper clamp)
  function clampIndex(i) {
    const idx = Math.max(1, Math.floor(i || 1));
    return idx;
  }

  function emojiForIndex(i) {
    const idx = clampIndex(i);
    return MAP_EMOJIS[(idx - 1) % MAP_EMOJIS.length];
  }

  function depthForIndex(i) {
    const idx = clampIndex(i);
    return idx > maps.length ? (idx - maps.length) : 0;
  }

  function loadInt(key, def = 1) {
    try {
      const v = parseInt(localStorage.getItem(key) || "", 10);
      return Number.isFinite(v) ? v : def;
    } catch {
      return def;
    }
  }

  function saveInt(key, v) {
    try {
      localStorage.setItem(key, String(Math.floor(v)));
    } catch {}
  }

  let currentIndex = clampIndex(loadInt(LS_CUR, 1));
  let unlockedMax = clampIndex(loadInt(LS_MAX, 1));

  function getCurrentIndex() {
    return currentIndex;
  }

  function getUnlockedMax() {
    return unlockedMax;
  }

  function listMaps() {
    return maps.map((m) => ({
      ...m,
      unlocked: m.index <= unlockedMax,
      current: m.index === currentIndex,
      emoji: emojiForIndex(m.index),
    }));
  }

  function getCurrent() {
    const cur = maps.find((m) => m.index === currentIndex);
    if (cur) return cur;
    // Synthesize an endless map descriptor
    const depth = depthForIndex(currentIndex);
    const base = maps[maps.length - 1];
    return {
      index: currentIndex,
      name: `Endless +${depth}`,
      requiredLevel: base.requiredLevel + depth * 5,
      enemyTint: base.enemyTint,
      enemyHpMul: base.enemyHpMul,
      enemyDmgMul: base.enemyDmgMul,
      desc: `Endless Depth ${depth}. Enemies grow stronger with each depth.`,
      strongEnemies: base.strongEnemies,
      emoji: emojiForIndex(currentIndex),
      imgHint: base.imgHint,
      _endlessDepth: depth,
    };
  }

  function getModifiers() {
    const cur = getCurrent();
    const depth = cur._endlessDepth ? cur._endlessDepth : 0;
    const pow = (v, p) => Math.pow(v, Math.max(0, p));
    const enemyHpMul = (cur.enemyHpMul || 1) * pow(ENDLESS.hpGrowthPerDepth, depth);
    const enemyDmgMul = (cur.enemyDmgMul || 1) * pow(ENDLESS.dmgGrowthPerDepth, depth);
    const enemySpeedMul = pow(ENDLESS.speedGrowthPerDepth, depth);
    const enemyCountMul = pow(ENDLESS.countGrowthPerDepth, depth);
    return {
      enemyTint: cur.enemyTint,
      enemyHpMul,
      enemyDmgMul,
      enemySpeedMul,
      enemyCountMul,
      depth,
      name: cur.name,
    };
  }

  function canSelect(index) {
    const idx = clampIndex(index);
    return idx <= unlockedMax;
  }

  function setCurrent(index) {
    const idx = clampIndex(index);
    if (!canSelect(idx)) return false;
    currentIndex = idx;
    saveInt(LS_CUR, currentIndex);
    return true;
  }

  function unlockByLevel(heroLevel) {
    // Unlock all defined maps whose requiredLevel is met
    let maxIdx = unlockedMax;
    for (const m of maps) {
      if (heroLevel >= m.requiredLevel) {
        maxIdx = Math.max(maxIdx, m.index);
      }
    }
    // Additionally unlock endless depths gradually (every 5 hero levels adds +1 depth)
    const extraDepth = Math.max(0, Math.floor((heroLevel - (maps[maps.length - 1]?.requiredLevel || 1)) / 5));
    const endlessMaxIndex = maps.length + extraDepth;
    maxIdx = Math.max(maxIdx, endlessMaxIndex);

    if (maxIdx !== unlockedMax) {
      unlockedMax = maxIdx;
      saveInt(LS_MAX, unlockedMax);
      if (currentIndex > unlockedMax) {
        currentIndex = unlockedMax;
        saveInt(LS_CUR, currentIndex);
      }
      return true;
    }
    return false;
  }

  return {
    listMaps,
    getCurrent,
    getCurrentIndex,
    getUnlockedMax,
    getModifiers,
    canSelect,
    setCurrent,
    unlockByLevel,
    emojiForIndex,
  };
}
