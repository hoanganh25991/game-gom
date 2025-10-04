import * as THREE from "../vendor/three/build/three.module.js";

export const LOCAL_STORAGE_PREFIX = "gom";

export const storageKey = (suffix, separator = ".") => {
  const suffixStr = String(suffix ?? "");
  const sep = typeof separator === "string" ? separator : ".";
  return `${LOCAL_STORAGE_PREFIX}${sep || ""}${suffixStr}`;
};

export const STORAGE_KEYS = {
  renderPrefs: storageKey("renderPrefs"),
  envPrefs: storageKey("envPrefs"),
  audioPrefs: storageKey("audioPrefs"),
  uiPrefs: storageKey("uiPrefs"),
  pendingReloadReason: storageKey("pendingReloadReason"),
  appPurchased: storageKey("app.purchased"),
  playerLevel: storageKey("playerLevel"),
  mapCurrentIndex: storageKey("mapCurrentIndex"),
  mapUnlockedMax: storageKey("mapUnlockedMax"),
  upliftChoices: storageKey("upliftChoices_v1"),
  persistentMarks: storageKey("persistentMarks"),
  markNextReadyAt: storageKey("markNextReadyAt"),
  villages: storageKey("dynamic.villages.v1"),
  roads: storageKey("dynamic.roads.v1"),
  roadsGeom: storageKey("dynamic.roads_geom.v1"),
  worldSeed: storageKey("worldSeed"),
  chunkPrefix: storageKey("chunk"),
  lang: storageKey("lang"),
  earthLoadout: storageKey("earth_loadout"),
  skillLevels: storageKey("skill_levels"),
  skillPoints: storageKey("skill_points"),
  unlockedSkills: storageKey("unlocked_skills"),
};

export const COLOR = {
  // Metal palette (values kept under original keys for compatibility)
  earth: 0x6f7b84,        // Iron gray primary
  darkEarth: 0x1b1f27,    // Deep steel/dark alloy
  midEarth: 0xB4B4C8,     // Brushed steel accent
  white: 0xffffff,        // Clean white
  hp: 0xc94b2a,           // HP (unchanged)
  mp: 0x88aaff,           // Electromagnetic blue
  xp: 0xE6B478,           // Forged bronze
  enemy: 0x2b3036,        // Dark metal
  enemyDark: 0x1e2228,    // Very dark alloy
  portal: 0x88aaff,       // Magnetic portal hue
  village: 0xB87333,      // Bronze accent for villages
  lava: 0xE6B478,         // Forge glow
  ember: 0xFFDCA0,        // Hot spark
  ash: 0x696969,          // Neutral gray
  volcano: 0x3a3f46,      // Gunmetal
};

export const WORLD = {
  groundSize: 500,     // local visual grid chunk size
  gridStep: 2,
  // Dynamic enemy spawning around hero (not fixed on map)
  enemyCount: 200,     // Legacy: used for initial spawn only
  enemySpawnRadius: 220,
  enemySpawnMinRadius: 30,  // Minimum spawn distance from hero
  // Dynamic spawning configuration
  dynamicSpawn: {
    enabled: true,
    minEnemies: 40,           // Minimum enemies around hero at level 1
    maxEnemies: 80,           // Maximum enemies around hero at high levels
    enemiesPerLevel: 2,       // Additional enemies per player level
    spawnInterval: 3,         // Seconds between continuous spawn checks
    spawnBatchSize: 3,        // Enemies to spawn per interval
    movementThreshold: 50,    // Distance hero must move to trigger burst spawn
    burstSpawnSize: 8,        // Enemies to spawn when hero moves significantly
    checkRadius: 250,         // Radius to count nearby enemies
  },
  // Make the player slightly faster and more responsive
  playerSpeed: 16,
  playerTurnSpeed: 10,
  // Slightly longer attack range and faster basic attack
  attackRange: 32,
  attackRangeMult: 1,
  basicAttackCooldown: 0.2,
  basicAttackDamage: 24,
  // Enemies are more aggressive and a bit tougher
  aiAggroRadius: 60,
  aiForgetRadius: 100,
  aiWanderRadius: 40,
  aiSpeed: 10,
  aiAttackRange: 10,
  aiAttackCooldown: 1.2,
  aiAttackDamage: 14,
  enemyRespawnDelay: 8,
  // Chunked world streaming
  chunking: {
    enabled: true,      // enable streaming chunks for environment/structures
    size: 150,          // chunk size in world units
    radius: 3,          // load radius in chunks (box radius)
    storagePrefix: storageKey("chunk")
  },
};

export const STATS_BASE = {
  // Hero as a "god" baseline: much higher HP/MP and regen so the player can clear many enemies
  hp: 800,
  mp: 400,
  hpRegen: 8,
  mpRegen: 4,
  // Increase XP required to level to give longer progression window
  xpToLevel: 200,
};

export const SKILLS = {
  // God of Metal default loadout mapping
  Q: { id: "iron_pulse", name: "Iron Pulse", type: "nova", cd: 6, mana: 32, radius: 16, dmg: 34 },
  W: { id: "magnet_field", name: "Magnet Field", type: "aura", cd: 14, mana: 0, radius: 14, tick: 0.6, dmg: 7, duration: 10, manaPerTick: 3 },
  E: { id: "steel_dash", name: "Steel Dash", type: "blink", cd: 7, mana: 18, distance: 16, trailRadius: 3, trailDmg: 8 },
  R: { id: "ironbound_form", name: "Ironbound Form", type: "buff", cd: 22, mana: 40, buffDuration: 10, buffMult: 1.2, speedMult: 1.1, atkSpeedMult: 1.1, defensePct: 0.35 }
};
 
// Progression and balancing knobs (tweak for desired pacing)
export const SCALING = {
  // XP curve multiplier applied to xpToLevel each time the hero levels up
  xpGrowth: 1.2,
  hero: {
    // Multiplicative per-level growth factors
    hpGrowth: 1.12,
    mpGrowth: 1.10,
    hpRegenGrowth: 1.08,
    mpRegenGrowth: 1.06,
    // Damage scaling
    baseDamageGrowth: 1.12,   // basic attack
    skillDamageGrowth: 1.10,  // skills
    // Movement and attack speed growth (small, per level)
    moveSpeedGrowth: 1.01,    // +1% movement speed per level
    atkSpeedGrowth: 1.01      // +1% permanent attack speed per level (reduces basic CD)
  },
  enemy: {
    // Per-hero-level growth factors for enemies
    hpGrowthPerLevel: 1.09,
    dmgGrowthPerLevel: 1.06,
    // Tier probability scaling with player level
    // Base probabilities: normal=78%, tough=18%, elite=3.5%, boss=0.5%
    tierScaling: {
      toughPerLevel: 0.005,   // +0.5% tough chance per level
      elitePerLevel: 0.003,   // +0.3% elite chance per level
      bossPerLevel: 0.001,    // +0.1% boss chance per level
    },
  },
};

export const FX = {
  // Global VFX timing controls. Increase timeScale to make effects last longer.
  // Reduce the *_RateScale to slow animations (fade, scaling, spins, orbits).
  timeScale: 1.6 * 1.2,          // >1 = longer lifetimes (slower overall VFX)
  fadeSpeedScale: 0.6 / 1.2,     // <1 = slower fades
  scaleRateScale: 0.6 / 1.2,     // <1 = slower scale growth animations
  spinRateScale: 0.6 / 1.2,      // <1 = slower spin animations
  orbitRateScale: 0.6 / 1.2,     // <1 = slower orbit movement
  pulseRateScale: 0.6 / 1.2,     // <1 = slower pulsing (breathing) animations
  popupDurationScale: 1.5 * 2, // >1 = damage popups linger longer
  sfxOnCast: true          // play a generic "cast" sound immediately on skill cast
};
 
// Village and recall/portals
export const VILLAGE_POS = new THREE.Vector3(0, 0, 0);
export const REST_RADIUS = 20;
