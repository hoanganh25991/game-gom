import * as THREE from "../vendor/three/build/three.module.js";
import { hashStringToInt, createSeededRNG, seededRange } from "./utils.js";
import { STORAGE_KEYS } from "./constants.js";
import {
  createCypressTree,
  createOliveTree,
  createGreekTemple,
  createVilla,
  createGreekColumn,
  createGreekStatue,
  createObelisk,
} from "./meshes.js";

/**
 * Persist or retrieve a stable world seed so generation is consistent across sessions.
 */
export function getOrInitWorldSeed(key = STORAGE_KEYS.worldSeed) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return parseInt(existing, 10);
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    localStorage.setItem(key, String(seed));
    return seed;
  } catch (_) {
    // Fallback: deterministic but time-based
    return (Date.now() & 0x7fffffff) >>> 0;
  }
}

/**
 * ChunkingManager
 * - Streams chunks around the player.
 * - Drops far chunks to keep memory safe.
 * - Deterministic generation per chunk (seeded by worldSeed + chunk ix/iz).
 * - Optional minimal persistence marker in localStorage.
 *
 * Default generator places environment props (trees/rocks/flowers) and a rare structure.
 */
export class ChunkingManager {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.size = Math.max(50, Math.floor(opts.chunkSize || 200));
    this.radius = Math.max(1, Math.floor(opts.radius || 2)); // radius in chunks (Manhattan/box)
    this.seed = Number.isFinite(opts.seed) ? (opts.seed >>> 0) : 0;
    this.storagePrefix = String(opts.storagePrefix || STORAGE_KEYS.chunkPrefix);
    this.active = new Map(); // key -> { group, ix, iz }
    this.generators = []; // list of (ctx) => void
    this.densities = Object.assign({ trees: 40, rocks: 16, flowers: 60 }, opts.densities || {});
    // Register default generator
    this.addGenerator(this._defaultEnvAndStructuresGenerator.bind(this));
  }

  setRadius(r) {
    this.radius = Math.max(1, Math.floor(r || 1));
  }

  addGenerator(genFn) {
    if (typeof genFn === "function") this.generators.push(genFn);
  }

  _key(ix, iz) {
    return `${ix},${iz}`;
  }

  _chunkSeed(ix, iz) {
    // Derive chunk seed from world seed + indices (stable across sessions)
    const base = `${this.seed}:${ix}:${iz}`;
    return hashStringToInt(base);
  }

  _origin(ix, iz) {
    return { x: ix * this.size, z: iz * this.size };
  }

  /**
   * Update which chunks should be loaded based on player world position.
   */
  update(playerPos) {
    if (!playerPos) return;
    const cx = Math.floor(playerPos.x / this.size);
    const cz = Math.floor(playerPos.z / this.size);

    // Desired set within a square radius
    const desired = new Set();
    for (let dz = -this.radius; dz <= this.radius; dz++) {
      for (let dx = -this.radius; dx <= this.radius; dx++) {
        const ix = cx + dx;
        const iz = cz + dz;
        desired.add(this._key(ix, iz));
        if (!this.active.has(this._key(ix, iz))) {
          this._loadChunk(ix, iz);
        }
      }
    }

    // Unload any that are no longer desired
    for (const key of this.active.keys()) {
      if (!desired.has(key)) {
        this._unloadChunk(key);
      }
    }
  }

  _loadChunk(ix, iz) {
    const key = this._key(ix, iz);
    if (this.active.has(key)) return;
    const origin = this._origin(ix, iz);

    const group = new THREE.Group();
    group.name = `chunk_${ix}_${iz}`;
    group.position.set(origin.x, 0, origin.z);

    // Context for generators (local coords within [0..size))
    const ctx = {
      ix,
      iz,
      key,
      size: this.size,
      origin, // world origin of this chunk
      group, // parent to attach into; place children in local coords
      rng: createSeededRNG(this._chunkSeed(ix, iz)),
      densities: this.densities,
    };

    // Run all registered generators
    for (const gen of this.generators) {
      try {
        gen(ctx);
      } catch (e) {
        console.warn("[Chunking] generator failed:", e);
      }
    }

    this.scene.add(group);
    this.active.set(key, { group, ix, iz });

    // Minimal persistence marker (for future mutable state)
    this._markPersisted(ix, iz);
  }

  _unloadChunk(key) {
    const rec = this.active.get(key);
    if (!rec) return;
    try {
      this.scene.remove(rec.group);
    } catch (_) {}
    // Dispose geometries/materials to free memory
    this._disposeGroup(rec.group);
    this.active.delete(key);
  }

  disposeAll() {
    for (const key of Array.from(this.active.keys())) {
      this._unloadChunk(key);
    }
  }

  _disposeGroup(group) {
    try {
      group.traverse((obj) => {
        try {
          if (obj.geometry && typeof obj.geometry.dispose === "function") {
            obj.geometry.dispose();
          }
          const m = obj.material;
          if (Array.isArray(m)) {
            m.forEach((mm) => {
              try { mm.dispose?.(); } catch (_) {}
            });
          } else if (m && typeof m.dispose === "function") {
            m.dispose();
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  _persistKey(ix, iz) {
    return `${this.storagePrefix}.${this.seed}.${ix}.${iz}`;
  }

  _markPersisted(ix, iz) {
    try {
      const key = this._persistKey(ix, iz);
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ v: 1, generated: true, t: Date.now() }));
      }
    } catch (_) {}
  }

  /**
   * Default generator:
   * - Places trees/rocks/flowers with deterministic positions inside the chunk.
   * - Rarely places a structure (temple, villa, column, statue, obelisk).
   */
  _defaultEnvAndStructuresGenerator(ctx) {
    const { group, rng, size, densities } = ctx;

    // Helper: uniform random in [0, size)
    const randInChunk = () => ({
      x: seededRange(rng, 0, size),
      z: seededRange(rng, 0, size),
    });

    // Trees (mix of cypress/olive)
    const treeCount = Math.max(0, Math.floor(densities.trees || 0));
    for (let i = 0; i < treeCount; i++) {
      const pick = (rng() < 0.5) ? createCypressTree : createOliveTree;
      const t = pick();
      const p = randInChunk();
      t.position.set(p.x, 0, p.z);
      t.rotation.y = seededRange(rng, 0, Math.PI * 2);
      const s = seededRange(rng, 0.85, 1.25);
      t.scale.setScalar(s);
      group.add(t);
    }

    // Rocks (simple low-poly dodecahedrons)
    const rockCount = Math.max(0, Math.floor(densities.rocks || 0));
    for (let i = 0; i < rockCount; i++) {
      const geo = new THREE.DodecahedronGeometry(seededRange(rng, 0.4, 1.3), 0);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3a2520, roughness: 0.9 });
      const r = new THREE.Mesh(geo, mat);
      const p = randInChunk();
      r.position.set(p.x, 0.02, p.z);
      r.rotation.set(seededRange(rng, 0, Math.PI), seededRange(rng, 0, Math.PI), seededRange(rng, 0, Math.PI));
      group.add(r);
    }

    // Flowers (small glowing spheres + stem)
    const flowerCount = Math.max(0, Math.floor(densities.flowers || 0));
    for (let i = 0; i < flowerCount; i++) {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x4a2a1a })
      );
      stem.position.y = 0.12;
      g.add(stem);
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xff6347, emissive: 0xff4500 })
      );
      petal.position.y = 0.28;
      g.add(petal);
      const p = randInChunk();
      g.position.set(p.x, 0, p.z);
      g.scale.setScalar(seededRange(rng, 0.8, 1.2));
      group.add(g);
    }

    // Structures: increase frequency for better visibility under chunking
    // Place 1-2 structures per chunk on average (60% chance for one, 25% chance for a second)
    {
      // Guarantee at least one structure per chunk for better visibility.
      // Add a couple of probabilistic extras to avoid overcrowding.
      let count = 1;
      if (rng() < 0.35) count += 1;
      if (rng() < 0.15) count += 1;

      for (let i = 0; i < count; i++) {
        const p = randInChunk();
        const r = seededRange(rng, 0, Math.PI * 2);

        const which = rng();
        if (which < 0.2) {
          const t = createGreekTemple({
            cols: Math.max(5, Math.floor(seededRange(rng, 6, 9))),
            rows: Math.max(7, Math.floor(seededRange(rng, 9, 12))),
            columnHeight: seededRange(rng, 5.2, 6.2),
            colSpacingX: seededRange(rng, 2.2, 2.8),
            colSpacingZ: seededRange(rng, 2.3, 3.0),
          });
          t.position.set(p.x, 0, p.z);
          t.rotation.y = r;
          group.add(t);
        } else if (which < 0.45) {
          const v = createVilla({
            width: seededRange(rng, 10, 16),
            depth: seededRange(rng, 8, 12),
            height: seededRange(rng, 3.5, 5.2),
          });
          v.position.set(p.x, 0, p.z);
          v.rotation.y = r;
          v.scale.setScalar(seededRange(rng, 0.9, 1.2));
          group.add(v);
        } else if (which < 0.7) {
          const c = createGreekColumn({
            height: seededRange(rng, 4.2, 6.2),
            radius: seededRange(rng, 0.24, 0.34),
            order: ["doric", "ionic", "corinthian"][Math.floor(seededRange(rng, 0, 3)) | 0],
          });
          c.position.set(p.x, 0, p.z);
          c.rotation.y = r;
          group.add(c);
        } else if (which < 0.85) {
          const s = createGreekStatue();
          s.position.set(p.x, 0, p.z);
          s.rotation.y = r;
          group.add(s);
        } else {
          const o = createObelisk({ height: seededRange(rng, 5.5, 7.5) });
          o.position.set(p.x, 0, p.z);
          o.rotation.y = r;
          group.add(o);
        }
      }
    }
  }
}
