/**
 * God of Earth Skill Pool — Earth-themed skills with per-skill VFX "effects"
 *
 * effects:
 *  - beam: primary projectile/tunnel color (hex)
 *  - impact: ground impact/debris color (hex)
 *  - ring: ground ring/terrace color (hex)
 *  - arc: secondary shard/root arc color (hex)
 *  - hand: caster-hand tint (hex)
 *  - shake: camera shake magnitude (0..1)
 */
export const SKILL_POOL = [
  {
    "id": "root_chain",
    "name": "Root Chain",
    "short": "Chain",
    "icon": "🌿",
    "type": "chain",
    "cd": 5,
    "mana": 22,
    "range": 45,
    "jumps": 5,
    "jumpRange": 24,
    "dmg": 24,
    "slowFactor": 0.25,
    "slowDuration": 0.9,
    "effects": {
      "beam": "0x6b5a49",
      "arc": "0x8c7455",
      "impact": "0xcaa36b",
      "ring": "0x6a8f4e",
      "hand": "0x4a3f35",
      "shake": 0.2
    },
    "description": "Grow snapping roots that latch to an enemy and leap to nearby foes, entangling and slowing each struck target.",
    "behavior": "On cast:\n- Validate an initial enemy target within range and LoS from the caster's aim reticle; if none, fail (no cost).\n- Play effects.hand on caster.\n- Hit the initial target for dmg earth, apply slow (slowFactor, slowDuration). Play effects.impact at target and camera shake with effects.shake.\n- Draw a thorny root beam from caster to target using effects.beam.\n- Chain logic:\n - Maintain a set of already-hit targets (start with the initial target).\n - For up to jumps additional hits:\n - Find the nearest enemy to the last hit target within jumpRange and LoS that is not yet hit and is alive.\n - If none found, stop chaining.\n - Travel time is instantaneous; draw effects.arc (root arc) between the last target and the new target and play effects.impact on hit.\n - Apply dmg and the same slow to the new target; add to hit set.\n- No damage falloff between jumps by default.\n- No friendly fire; ignores dead/untargetable units."
  },
  {
    "id": "seismic_blast",
    "name": "Seismic Blast",
    "short": "Blast",
    "icon": "⛏️",
    "type": "aoe",
    "cd": 8,
    "mana": 34,
    "radius": 16,
    "dmg": 35,
    "slowFactor": 0.45,
    "slowDuration": 1.5,
    "effects": {
      "ring": "0x6a8f4e",
      "impact": "0xcaa36b",
      "arc": "0x8c7455",
      "hand": "0x4a3f35",
      "shake": 0.35
    },
    "description": "Slam the ground to send a concussive shock that damages and heavily slows enemies.",
    "behavior": "On cast:\n- Centered on the caster, create an immediate AoE with radius.\n- Play effects.hand on caster and effects.ring expanding from caster; flash effects.impact on each enemy hit.\n- All enemies within radius take dmg earth and are slowed by slowFactor for slowDuration.\n- Apply camera shake effects.shake once at cast.\n- Ignores LoS (affects enemies behind cover within the radius)."
  },
  {
    "id": "petrifying_aura",
    "name": "Petrifying Aura",
    "short": "Petrify",
    "icon": "🪨",
    "type": "aura",
    "cd": 15,
    "mana": 0,
    "radius": 14,
    "tick": 0.7,
    "dmg": 8,
    "duration": 10,
    "manaPerTick": 2,
    "effects": {
      "ring": "0x8c7455",
      "impact": "0xcaa36b",
      "hand": "0x4a3f35",
      "shake": 0.1
    },
    "description": "Emanate petrifying grit that chips away at nearby foes while consuming mana.",
    "behavior": "On cast:\n- Start an aura centered on the caster for duration. Aura follows the caster.\n- Every tick seconds:\n - If caster has >= manaPerTick, spend manaPerTick; otherwise end the aura early.\n - Damage all enemies within radius for dmg earth; play effects.impact on each and a subtle effects.ring pulse on caster.\n- Play effects.hand on activation; maintain a faint looping ring visual (effects.ring) for the aura's lifetime.\n- Ignores LoS; ticks cannot crit; no slow applied."
  },
  {
    "id": "earthen_spire",
    "name": "Earthen Spire",
    "short": "Spire",
    "icon": "🗿",
    "type": "storm",
    "cd": 22,
    "mana": 55,
    "radius": 30,
    "strikes": 22,
    "dmg": 20,
    "duration": 7,
    "effects": {
      "impact": "0x8c7455",
      "ring": "0x6a8f4e",
      "hand": "0x4a3f35",
      "shake": 0.45
    },
    "description": "Summon jagged earthen spires that erupt from the ground, impaling and damaging foes.",
    "behavior": "On cast:\n- Anchor the spire storm to the caster's current position; the storm area (radius) is stationary for duration.\n- Strike scheduling uses an accumulator at rate = strikes / duration; each time the accumulator >= 1, spawn a strike and decrement by 1. Multiple strikes can occur in a single frame.\n- Each strike:\n - If there are enemies inside radius, pick one at random and impact at their position; otherwise pick a random point uniformly within radius.\n - Deal dmg earth to all enemies within strikeRadius = 2.5 units of impact.\n - Play effects.impact at impact location and apply camera shake effects.shake (scaled down by distance to player).\n- On cast, play effects.hand and a large effects.ring on the ground. Ignores LoS."
  },
  {
    "id": "boulder_bolt",
    "name": "Boulder Bolt",
    "short": "Bolt+",
    "icon": "🪨",
    "type": "beam",
    "cd": 2.5,
    "mana": 14,
    "range": 36,
    "dmg": 22,
    "effects": {
      "beam": "0x4a3f35",
      "impact": "0xcaa36b",
      "hand": "0x6b5a49",
      "shake": 0.2
    },
    "description": "Hurl a compact boulder that strikes the first enemy in your aim.",
    "behavior": "On cast:\n- Trace a straight line from caster origin along aim up to range, requiring LoS.\n- Hit the first enemy intersected for dmg physical.\n- Play effects.hand on cast, a stone beam (effects.beam) along the traced line, and effects.impact at the hit location with camera shake effects.shake.\n- If no enemy is hit, still show a brief stone trail to max range; no damage dealt; cost is consumed (successful cast)."
  },
  {
    "id": "seismic_wave",
    "name": "Seismic Wave",
    "short": "Nova",
    "icon": "🌐",
    "type": "nova",
    "cd": 12,
    "mana": 26,
    "radius": 14,
    "dmg": 30,
    "effects": {
      "ring": "0x6a8f4e",
      "impact": "0xcaa36b",
      "hand": "0x4a3f35",
      "shake": 0.35
    },
    "description": "Unleash a radial tremor that pulses outward in a violent stone shock.",
    "behavior": "On cast:\n- Spawn a radial wave that expands from 0 to radius over 0.25s (visual only); damage is applied instantly to enemies within radius at cast time.\n- Deal dmg earth to all enemies in radius. Ignores LoS.\n- Play effects.hand on caster, effects.ring expanding, and effects.impact flashes on enemies hit; apply camera shake effects.shake once."
  },
  {
    "id": "stone_aegis",
    "name": "Stone Aegis",
    "short": "Aegis",
    "icon": "🛡️",
    "type": "aura",
    "cd": 18,
    "mana": 0,
    "radius": 12,
    "tick": 0.5,
    "dmg": 6,
    "duration": 9,
    "manaPerTick": 2.5,
    "effects": {
      "ring": "0xcaa36b",
      "impact": "0x8c7455",
      "hand": "0x6b5a49",
      "shake": 0.18
    },
    "description": "Hold a ward of stone grit that both chips at foes and grants defensive sturdiness to nearby allies (visual/logic interchangeable).",
    "behavior": "On cast:\n- Start a following aura for duration; ticks every tick seconds.\n- Each tick: if caster has >= manaPerTick, spend it; else end aura early. Damage all enemies in radius for dmg earth; play effects.impact per enemy; pulse effects.ring on caster.\n- Slightly faster tick than Petrifying Aura; otherwise identical rules (no LoS needed)."
  },
  {
    "id": "quagmire_field",
    "name": "Quagmire Field",
    "short": "Quagmire",
    "icon": "🪷",
    "type": "aura",
    "cd": 14,
    "mana": 0,
    "radius": 13,
    "tick": 0.6,
    "dmg": 7,
    "duration": 8,
    "manaPerTick": 2,
    "effects": {
      "ring": "0x6a8f4e",
      "impact": "0x8c7455",
      "hand": "0x6b5a49",
      "shake": 0.15
    },
    "description": "Create a muddy, rutting field that drags and damages enemies over time.",
    "behavior": "On cast:\n- Start a following aura for duration; every tick seconds spend manaPerTick or end early if insufficient.\n- On each tick, damage all enemies within radius for dmg earth and apply a strong slow (conceptually mud slow); play effects.impact on each; maintain a looping subtle effects.ring around caster."
  },
  {
    "id": "terraburst",
    "name": "Terraburst",
    "short": "Over",
    "icon": "🔆",
    "type": "aura",
    "cd": 16,
    "mana": 0,
    "radius": 15,
    "tick": 0.55,
    "dmg": 9,
    "duration": 9,
    "manaPerTick": 3,
    "effects": {
      "ring": "0x6a8f4e",
      "impact": "0x8c7455",
      "hand": "0x6b5a49",
      "shake": 0.2
    },
    "description": "A high-intensity earthen field that crushes and fractures nearby foes at higher mana upkeep.",
    "behavior": "On cast:\n- Start a following aura for duration; on each tick spend manaPerTick or end early if insufficient.\n- Each tick deals dmg earth to all enemies within radius; trigger effects.impact on enemies and a brighter effects.ring on caster."
  },
  {
    "id": "boulder_toss",
    "name": "Boulder Toss",
    "short": "Ball",
    "icon": "🪨",
    "type": "beam",
    "cd": 2.2,
    "mana": 16,
    "range": 48,
    "dmg": 20,
    "effects": {
      "beam": "0x4a3f35",
      "impact": "0xcaa36b",
      "hand": "0x6b5a49",
      "shake": 0.22
    },
    "description": "Launch a heavy boulder that impacts the first enemy in line.",
    "behavior": "On cast:\n- Hitscan along aim up to range (LoS required).\n- First enemy hit takes dmg physical. Play effects.beam along path and effects.impact at hit; effects.hand at cast; apply camera shake effects.shake.\n- If no hit, show a stone trail to max range; cost consumed."
  },
  {
    "id": "stone_spear",
    "name": "Stone Spear",
    "short": "Spear",
    "icon": "🗡️",
    "type": "beam",
    "cd": 3.2,
    "mana": 18,
    "range": 52,
    "dmg": 28,
    "effects": {
      "beam": "0x8c7455",
      "impact": "0xcaa36b",
      "hand": "0x4a3f35",
      "shake": 0.28
    },
    "description": "Drive a barbed stone spear forward that pierces armor and strikes a single target.",
    "behavior": "On cast:\n- Hitscan along aim up to range (LoS). Impact the first enemy hit for dmg physical.\n- Visuals: effects.hand on cast, a thin stone effects.beam, and effects.impact at hit with camera shake effects.shake."
  },
  {
    "id": "tremor_pulse",
    "name": "Tremor Pulse",
    "short": "Pulse",
    "icon": "🌊",
    "type": "beam",
    "cd": 2.8,
    "mana": 15,
    "range": 40,
    "dmg": 24,
    "effects": {
      "beam": "0x6b5a49",
      "impact": "0xcaa36b",
      "hand": "0x4a3f35",
      "shake": 0.3
    },
    "description": "Project a concentrated tremor in a line that knocks and damages rock-bound foes.",
    "behavior": "On cast:\n- Hitscan along aim up to range; first enemy hit takes dmg earth.\n- Visuals: thicker, short-duration stone beam and effects.impact at hit; play effects.hand and camera shake effects.shake.\n- Optional knockdown/knockback can be applied by higher-level upgrades."
  },
  {
    "id": "quarry_wrath",
    "name": "Quarry Wrath",
    "short": "Wrath",
    "icon": "🏔️",
    "type": "storm",
    "cd": 18,
    "mana": 42,
    "radius": 24,
    "strikes": 14,
    "dmg": 18,
    "duration": 5.5,
    "effects": {
      "impact": "0x8c7455",
      "ring": "0x6a8f4e",
      "hand": "0x6b5a49",
      "shake": 0.35
    },
    "description": "A focused barrage of falling boulders and debris over a smaller area.",
    "behavior": "On cast:\n- Stationary storm centered at cast position for duration.\n- Strike rate = strikes / duration via accumulator. Each strike selects a random enemy inside radius (or random point if none).\n- Each strike deals dmg to enemies within strikeRadius = 2.5 units; play effects.impact and shake = effects.shake (distance-attenuated).\n- effects.hand on cast; earthen effects.ring marking the area. Ignores LoS."
  },
  {
    "id": "earthen_dome",
    "name": "Earthen Dome",
    "short": "Dome",
    "icon": "🪨",
    "type": "storm",
    "cd": 24,
    "mana": 60,
    "radius": 32,
    "strikes": 28,
    "dmg": 18,
    "duration": 8,
    "effects": {
      "impact": "0x8c7455",
      "ring": "0x6a8f4e",
      "hand": "0x6b5a49",
      "shake": 0.6
    },
    "description": "Summon a massive dome of earthen strikes and collapsing rubble over time.",
    "behavior": "On cast:\n- Stationary storm, large radius, duration as specified.\n- Strike scheduling with accumulator at rate = strikes / duration. Prefer randomly selecting from current enemies in radius; fallback to random ground points.\n- Each strike deals dmg to enemies within strikeRadius = 3.0 units; play effects.impact per strike and strong shake effects.shake (distance-attenuated).\n- Draw a prominent boundary using effects.ring on cast; ignores LoS."
  },
  {
    "id": "rockfall_storm",
    "name": "Rockfall Storm",
    "short": "Rockfall",
    "icon": "🪨",
    "type": "storm",
    "cd": 20,
    "mana": 50,
    "radius": 28,
    "strikes": 20,
    "dmg": 19,
    "duration": 6.5,
    "effects": {
      "impact": "0x8c7455",
      "ring": "0x6a8f4e",
      "hand": "0x6b5a49",
      "shake": 0.38
    },
    "description": "A sustained storm of falling rocks and rubble across the area.",
    "behavior": "On cast:\n- Stationary storm at cast position for duration.\n- Spawn strikes using accumulator at rate = strikes / duration; each strike targets a random enemy in radius or a random point.\n- Impact deals dmg to enemies within strikeRadius = 2.5 units; play effects.impact and shake with intensity effects.shake.\n- On cast, show effects.ring and effects.hand. Ignores LoS."
  },
  {
    "id": "stone_ring",
    "name": "Stone Ring",
    "short": "Ring",
    "icon": "🪨",
    "type": "aoe",
    "cd": 10,
    "mana": 32,
    "radius": 18,
    "dmg": 32,
    "slowFactor": 0.4,
    "slowDuration": 1.2,
    "effects": {
      "ring": "0x6a8f4e",
      "impact": "0xcaa36b",
      "hand": "0x6b5a49",
      "shake": 0.32
    },
    "description": "Create a shattering ring of stone that damages and knocks ground-stagger into nearby foes.",
    "behavior": "On cast:\n- Instant AoE centered on caster with radius.\n- Deal dmg physical to all enemies in radius; apply slow (slowFactor, slowDuration) representing stunned footing.\n- Play effects.hand on caster, effects.ring expanding, and effects.impact on each enemy hit; camera shake effects.shake once.\n- Ignores LoS."
  },
  {
    "id": "pebble_burst",
    "name": "Pebble Burst",
    "short": "Burst",
    "icon": "🪨",
    "type": "aoe",
    "cd": 7,
    "mana": 28,
    "radius": 15,
    "dmg": 28,
    "effects": {
      "ring": "0xcaa36b",
      "impact": "0x8c7455",
      "hand": "0x6b5a49",
      "shake": 0.28
    },
    "description": "Kick a burst of sharp pebbles around you that abrade and damage nearby foes.",
    "behavior": "On cast:\n- Instant AoE centered on caster with radius.\n- Deal dmg physical to all enemies in radius.\n- Play effects.hand, effects.ring expanding, and effects.impact on enemies; camera shake effects.shake.\n- Ignores LoS."
  },
  {
    "id": "seismic_cataclysm",
    "name": "Seismic Cataclysm",
    "short": "Cataclysm",
    "icon": "🏔️",
    "type": "aoe",
    "cd": 11,
    "mana": 36,
    "radius": 20,
    "dmg": 38,
    "slowFactor": 0.5,
    "slowDuration": 1.8,
    "effects": {
      "ring": "0x6a8f4e",
      "impact": "0xcaa36b",
      "hand": "0x6b5a49",
      "shake": 0.4
    },
    "description": "Trigger a catastrophic seismic rupture that shatters the ground and hinders foes.",
    "behavior": "On cast:\n- Instant AoE centered on caster with radius.\n- Deal dmg earth to all enemies in radius; apply slow (slowFactor, slowDuration) representing footing loss.\n- Play effects.hand, effects.ring expanding, and effects.impact on enemies; strong camera shake effects.shake.\n- Ignores LoS."
  }
];

/**
 * Default starting loadout (4 skill IDs)
 */
export const DEFAULT_LOADOUT = Object.freeze(
  SKILL_POOL.slice(0, 4).map((skill) => skill.id)
);
