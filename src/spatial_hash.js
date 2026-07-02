import { distanceSq2D } from "./utils.js";

/**
 * Uniform spatial grid for enemy proximity queries (O(k) vs O(n)).
 */
export class EnemySpatialGrid {
  constructor(cellSize = 40) {
    this.cellSize = cellSize;
    this.buckets = new Map();
    this.rebuildFrame = 0;
  }

  _key(cx, cz) {
    return ((cx & 0xffff) << 16) | (cz & 0xffff);
  }

  rebuild(enemies) {
    this.buckets.clear();
    const cs = this.cellSize;
    for (let i = 0; i < enemies.length; i++) {
      const en = enemies[i];
      if (!en.alive) continue;
      const p = en.pos();
      const cx = Math.floor(p.x / cs);
      const cz = Math.floor(p.z / cs);
      const k = this._key(cx, cz);
      en._cellKey = k;
      let b = this.buckets.get(k);
      if (!b) {
        b = [];
        this.buckets.set(k, b);
      }
      b.push(en);
    }
    this.rebuildFrame++;
  }

  getNearest(origin, maxDistSq) {
    const cs = this.cellSize;
    const cx = Math.floor(origin.x / cs);
    const cz = Math.floor(origin.z / cs);
    const cells = Math.ceil(Math.sqrt(maxDistSq) / cs) + 1;
    let nearest = null;
    let best = maxDistSq;
    for (let dx = -cells; dx <= cells; dx++) {
      for (let dz = -cells; dz <= cells; dz++) {
        const list = this.buckets.get(this._key(cx + dx, cz + dz));
        if (!list) continue;
        for (let i = 0; i < list.length; i++) {
          const en = list[i];
          if (!en.alive) continue;
          const d2 = distanceSq2D(origin, en.pos());
          if (d2 <= maxDistSq && d2 < best) {
            best = d2;
            nearest = en;
          }
        }
      }
    }
    return nearest;
  }

  forEachInRadius(center, radiusSq, fn) {
    const cs = this.cellSize;
    const cx = Math.floor(center.x / cs);
    const cz = Math.floor(center.z / cs);
    const cells = Math.ceil(Math.sqrt(radiusSq) / cs) + 1;
    for (let dx = -cells; dx <= cells; dx++) {
      for (let dz = -cells; dz <= cells; dz++) {
        const list = this.buckets.get(this._key(cx + dx, cz + dz));
        if (!list) continue;
        for (let i = 0; i < list.length; i++) {
          const en = list[i];
          if (!en.alive) continue;
          if (distanceSq2D(center, en.pos()) <= radiusSq) fn(en);
        }
      }
    }
  }
}
