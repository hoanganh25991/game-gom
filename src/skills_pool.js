/**
 * God of Metal — Skill Pool
 *
 * effects:
 *  - beam: primary projectile/beam color (hex)
 *  - impact: impact/forge glow color (hex)
 *  - ring: ring/ripple color (hex)
 *  - arc: spark/trace arc color (hex)
 *  - hand: caster-hand tint (hex)
 *  - shake: camera shake magnitude (0..1)
 */
export const SKILL_POOL = [
  {
    "id": "iron_pulse",
    "name": "Iron Pulse",
    "short": "Pulse",
    "icon": "🔩",
    "type": "nova",
    "cd": 6,
    "mana": 32,
    "radius": 16,
    "dmg": 34,
    "effects": {
      "ring": "0xB4B4C8",
      "impact": "0xE6B478",
      "arc": "0xFFDCA0",
      "hand": "0xD0D8E8",
      "shake": 0.35
    },
    "description": "Emit a radial shockwave of metallic energy that reverberates through enemies.",
    "behavior": "On cast:\n- Centered on the caster, apply damage to all enemies within radius.\n- Visuals: metallic ripple ring, iron dust pulse, resonance arcs; moderate pushback feel.\n- Camera shake scales with distance; ignores LoS."
  },
  {
    "id": "magnet_field",
    "name": "Magnet Field",
    "short": "Field",
    "icon": "🧲",
    "type": "aura",
    "cd": 14,
    "mana": 0,
    "radius": 14,
    "tick": 0.6,
    "dmg": 7,
    "duration": 10,
    "manaPerTick": 3,
    "effects": {
      "ring": "0x9EC4FF",
      "impact": "0xE6B478",
      "hand": "0x88AAFF",
      "shake": 0.18
    },
    "description": "Create a magnetic field that pulls nearby enemies inward while lightly damaging them over time.",
    "behavior": "On cast:\n- Begin a following aura for duration; each tick attempts mana upkeep.\n- Pull enemies slightly toward the caster on each tick; apply small damage.\n- Visuals: shimmering magnetic disc, blue-white ring pulses, gentle spark arcs.\n- Ends early if mana is insufficient."
  },
  {
    "id": "steel_dash",
    "name": "Steel Dash",
    "short": "Dash",
    "icon": "⚙️",
    "type": "blink",
    "cd": 7,
    "mana": 18,
    "distance": 16,
    "trailRadius": 3,
    "trailDmg": 8,
    "effects": {
      "ring": "0x9EC4FF",
      "impact": "0xE6B478",
      "arc": "0xFFDCA0",
      "hand": "0xD0D8E8",
      "shake": 0.2
    },
    "description": "Dash forward, leaving a trail of molten sparks and metal shards that cut foes.",
    "behavior": "On cast:\n- Teleport a short distance forward along facing direction.\n- Along path, create spark trail ticks that damage nearby enemies.\n- Visuals: orange-white spark streaks, metallic ring at start/end."
  },
  {
    "id": "echo_slam",
    "name": "Echo Slam",
    "short": "Echo",
    "icon": "🔊",
    "type": "nova",
    "cd": 12,
    "mana": 28,
    "radius": 14,
    "dmg": 26,
    "effects": {
      "ring": "0xB4B4C8",
      "impact": "0xE6B478",
      "arc": "0xAAB0C8",
      "hand": "0xD0D8E8",
      "shake": 0.42
    },
    "description": "Slam the ground with metallic resonance, staggering enemies in a ring.",
    "behavior": "On cast:\n- Apply damage to enemies in radius and stagger (short attack delay).\n- Visuals: expanding metal echo ring, vibration distortion, resonance arcs."
  },
  {
    "id": "magnetic_lance",
    "name": "Magnetic Lance",
    "short": "Lance",
    "icon": "🧲",
    "type": "beam",
    "cd": 3,
    "mana": 16,
    "range": 52,
    "dmg": 26,
    "effects": {
      "beam": "0x88AAFF",
      "impact": "0xE6B478",
      "arc": "0x9EC4FF",
      "hand": "0x88AAFF",
      "shake": 0.28
    },
    "description": "Fire a focused electromagnetic beam that pierces enemies.",
    "behavior": "On cast:\n- Hitscan along aim up to range; first enemy hit takes damage.\n- Visuals: linear particle beam with flickering arcs; slight attraction toward beam line."
  },
  {
    "id": "titan_skin",
    "name": "Titan Skin",
    "short": "Titan",
    "icon": "🛡️",
    "type": "shield",
    "cd": 18,
    "mana": 24,
    "duration": 8,
    "defensePct": 0.4,
    "effects": {
      "ring": "0xD0D8E8",
      "impact": "0xE6B478",
      "hand": "0xB4B4C8",
      "shake": 0.12
    },
    "description": "Coat yourself in living metal, reducing incoming damage.",
    "behavior": "On cast:\n- Apply temporary damage reduction for duration.\n- Visuals: chrome reflection overlay, low-frequency forge rumble, shield bubble."
  },
  {
    "id": "ironbound_form",
    "name": "Ironbound Form",
    "short": "Form",
    "icon": "🏭",
    "type": "buff",
    "cd": 22,
    "mana": 40,
    "buffDuration": 10,
    "buffMult": 1.2,
    "speedMult": 1.1,
    "atkSpeedMult": 1.1,
    "defensePct": 0.35,
    "effects": {
      "ring": "0xFFA64D",
      "impact": "0xE6B478",
      "hand": "0xD0D8E8",
      "shake": 0.28
    },
    "description": "Become a walking forge, radiating heat, sparks, and magnetic pulses.",
    "behavior": "On cast:\n- Grants damage, speed and defense buffs for duration.\n- Visuals: forge glow, orbiting sparks, periodic pulses."
  },
  {
    "id": "forge_core",
    "name": "Forge Core",
    "short": "Core",
    "icon": "⚒️",
    "type": "aoe",
    "cd": 20,
    "mana": 42,
    "radius": 18,
    "dmg": 40,
    "effects": {
      "ring": "0xFFA64D",
      "impact": "0xE6B478",
      "arc": "0x9EC4FF",
      "hand": "0xD0D8E8",
      "shake": 0.55
    },
    "description": "Detonate a molten forge core that blasts outward then pulls metal inward.",
    "behavior": "On cast:\n- Stationary explosion at point; strong initial push, then magnetic draw.\n- Visuals: molten glow, dual ripple rings (amber/blue), heavy sparks."
  }
];

/**
 * Default starting loadout (4 skill IDs)
 */
export const DEFAULT_LOADOUT = Object.freeze([
  "iron_pulse",
  "magnet_field",
  "steel_dash",
  "ironbound_form"
]);
