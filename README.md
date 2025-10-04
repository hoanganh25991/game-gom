# GoE RPG (Three.js Top‑Down Action/RTS‑like Prototype)

A lightweight prototype featuring DOTA‑style controls, earthen abilities, simple AI, HUD/minimap, portals/recall, and a village regen zone — implemented as modular ES modules with Three.js.

## Overview

**Game Play**
![guide](./images/gof-game-play-iphone-14-pro-max-1.png)

**First Person**
![guide](./images/gof-first-person-iphone-14-pro-max-4.png)

**Skills**
![guide](./images/gof-skills-iphone-14-pro-max-2.png)

**Guide**
![guide](./images/gof-guides-iphone-14-pro-max.png)

### Demo

[Demo Video](gof-demo.webm)

## Google Play

https://play.google.com/store/apps/details?id=io.github.hoanganh25991.gofsignature

## Quick Start

This project is static (no build step). Serve the root directory with any static file server to enable ES module imports.

Examples:
- Python 3: `python3 -m http.server 8000`
- Node: `npx http-server -p 8000`

Then open:
- http://localhost:8000 (or the port you chose)

## Gameplay Overview

- Player (GoE) moves with RTS‑style orders and auto‑attacks when in range.
- Enemies aggro, chase, attack, or wander when idle.
- Four skills with cooldowns and mana:
  - Q Root Chain (chains targets in range)
  - W Seismic AOE (damages + applies slow)
  - E Petrifying Aura (periodic ticks, drains mana)
  - R Earthen Spire (random strikes over time)
- HUD shows HP/MP/XP/Level; cooldown wedges display time remaining.
- Minimap shows player, enemies, village ring, and portals.
- Recall (B) spawns a return portal; click it to travel to the village; regen is boosted in the village ring.
- On death, auto‑respawn in the village after a short delay.

## Credits

Developed with passion by the Monk Journey team.

## License

Copyright © 2025 Monk Journey Team. All Rights Reserved.

This project is proprietary and confidential. Unauthorized reproduction, distribution, or disclosure is prohibited. No license, express or implied, to any intellectual property rights is granted by this document.

See the [LICENSE](LICENSE) file for full details.
