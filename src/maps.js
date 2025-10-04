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
      name: "Act I — Fields of Awakening",
      requiredLevel: 1,
      enemyTint: 0x6b5a49,
      enemyHpMul: 1.0,
      enemyDmgMul: 1.0,
      enemySpeedMul: 1.0,
      enemyCountMul: 1.0,
      desc: "A moss-grown grove outside the origin village. Stone-raiders and rootcasters haunt the shaded glades.",
      strongEnemies: ["Stone Ravagers (fast melee)", "Rootcasters (ranged control)"],
      imgHint: "Square art: verdant clearing with ancient stones and lichen; earthen-toned foes.",
    },
    {
      index: 2,
      name: "Act II — Quarry Plains",
      requiredLevel: 5,
      enemyTint: 0xcaa36b,
      enemyHpMul: 1.35,
      enemyDmgMul: 1.2,
      enemySpeedMul: 1.02,
      enemyCountMul: 1.1,
      desc: "Open stone flats and quarries where miners' echoes remain. Packs of stonebound beasts and quarry skirmishers roam.",
      strongEnemies: ["Quarry Hounds (pack hunters)", "Stonebowmen (ranged skirmishers)"],
      imgHint: "Square art: windswept quarry plains with stacked terraces; sandstone-toned foes.",
    },
    {
      index: 3,
      name: "Act III — Cragspire Peaks",
      requiredLevel: 10,
      enemyTint: 0x8c7455,
      enemyHpMul: 1.8,
      enemyDmgMul: 1.45,
      enemySpeedMul: 1.05,
      enemyCountMul: 1.25,
      desc: "Knife-edged ridgelines carved from ancient stone. Cliff-dwellers and shard-sorcerers harry those who cross the passes.",
      strongEnemies: ["Cliff Stalkers (dive assaults)", "Shard Shamans (support casters)"],
      imgHint: "Square art: jagged stone peaks and spires; stony-hued foes against a clear sky.",
    },
    {
      index: 4,
      name: "Act IV — Sky Citadel",
      requiredLevel: 20,
      enemyTint: 0xa0ffd1,
      enemyHpMul: 2.4,
      enemyDmgMul: 1.8,
      enemySpeedMul: 1.08,
      enemyCountMul: 1.45,
      desc: "A floating bastion crackling with bound sigils. Only the resolute can breach its shining walls.",
      strongEnemies: ["Sentinel Constructs (shielded)", "Zealous Templars (coordinated strikes)"],
      imgHint: "Square art: floating fortress with crackling runes; teal-tinted foes.",
    },
    {
      index: 5,
      name: "Act V — The Stonebound Spire",
      requiredLevel: 35,
      enemyTint: 0x7ec1c7,
      enemyHpMul: 3.2,
      enemyDmgMul: 2.3,
      enemySpeedMul: 1.12,
      enemyCountMul: 1.7,
      desc: "An ancient spire where earth's power concentrates. Guardians of stone and living constructs test intruders.",
      strongEnemies: ["Spire Colossus (heavy slam)", "Geode Artificers (channeling shards)"],
      imgHint: "Square art: towering stone spire with crystal veins; geode-lit foes.",
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
