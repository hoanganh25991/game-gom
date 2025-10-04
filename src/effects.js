import * as THREE from "../vendor/three/build/three.module.js";
import { COLOR, FX } from "./constants.js";
import { now } from "./utils.js";
import { handWorldPos, leftHandWorldPos } from "./entities.js";
import { audio } from "./audio.js";

// Normalize color inputs from various formats ("0x66ffc2", "#66ffc2", 0x66ffc2, 6750146)
function normalizeColor(c, fallback = COLOR.earth) {
  try {
    if (typeof c === "number" && Number.isFinite(c)) return c >>> 0;
    if (typeof c === "string") {
      const s = c.trim();
      if (/^0x[0-9a-fA-F]{6}$/.test(s)) return Number(s);
      if (/^#[0-9a-fA-F]{6}$/.test(s)) return parseInt(s.slice(1), 16) >>> 0;
      if (/^[0-9a-fA-F]{6}$/.test(s)) return parseInt(s, 16) >>> 0;
    }
  } catch (_) {}
  return fallback >>> 0;
}

// Standalone ring factory (used by UI modules and effects)
export function createGroundRing(innerR, outerR, color, opacity = 0.6) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerR, outerR, 48),
    new THREE.MeshBasicMaterial({
      color: normalizeColor(color),
      transparent: true,
      opacity,
      side: THREE.FrontSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  return ring;
}

// Manages transient effects (lines, flashes) and indicator meshes (rings, pings)
export class EffectsManager {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.quality =
      (opts && opts.quality) ||
      (typeof localStorage !== "undefined"
        ? (JSON.parse(localStorage.getItem("gof.renderPrefs") || "{}").quality || "high")
        : "high");

    this.transient = new THREE.Group();
    scene.add(this.transient);

    this.indicators = new THREE.Group();
    scene.add(this.indicators);

    // Small pool of temporaries used by hot VFX paths to avoid per-frame allocations.
    // These are reused within each EffectsManager instance (safe as VFX creation is synchronous).
    this._tmpVecA = new THREE.Vector3();
    this._tmpVecB = new THREE.Vector3();
    this._tmpVecC = new THREE.Vector3();
    this._tmpVecD = new THREE.Vector3();
    this._tmpVecE = new THREE.Vector3();

    // Internal timed queue for cleanup and animations
    this.queue = []; // items: { obj, until, fade?, mat?, scaleRate? }
  }

  // ----- Indicator helpers -----
  spawnMovePing(point, color = COLOR.earth) {
    const ring = createGroundRing(0.6, 0.85, color, 0.8);
    ring.position.set(point.x, 0.02, point.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.8 * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.6 });
  }

  spawnTargetPing(entity, color = COLOR.village) {
    if (!entity || !entity.alive) return;
    const p = entity.pos();
    const ring = createGroundRing(0.65, 0.9, color, 0.85);
    ring.position.set(p.x, 0.02, p.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.7 * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.4 });
  }

  showNoTargetHint(player, radius) {
    const ring = createGroundRing(Math.max(0.1, radius - 0.2), radius + 0.2, 0xffa500, 0.35);
    const p = player.pos();
    ring.position.set(p.x, 0.02, p.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.8 * FX.timeScale, fade: true, mat: ring.material });
    // subtle spark at player for feedback
    this.spawnStrike(player.pos(), 1.2, 0xffa500);
  }

  // ----- Projectile helpers -----
   // Boulder projectile that travels from source to target with trail
  spawnFireball(from, to, opts = {}) {
    const color = opts.color || COLOR.earth;
    const size = opts.size || 0.4;
    const speed = opts.speed || 20;
    const trail = opts.trail !== false;
    
    const dir = this._tmpVecA.copy(to).sub(this._tmpVecB.copy(from));
    const distance = dir.length();
    const travelTime = distance / speed;
    
    // Create fireball sphere with glowing material
    const fireballGeo = new THREE.SphereGeometry(size, 12, 12);
    const fireballMat = new THREE.MeshBasicMaterial({ 
      color: normalizeColor(color), 
      transparent: true, 
      opacity: 0.95 
    });
    const fireball = new THREE.Mesh(fireballGeo, fireballMat);
    fireball.position.copy(from);
    
    // Add outer glow layer
    const glowGeo = new THREE.SphereGeometry(size * 1.4, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({ 
      color: 0xcaa36b, 
      transparent: true, 
      opacity: 0.4 
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    fireball.add(glow);
    
    this.transient.add(fireball);
    
    const startTime = now();
    this.queue.push({
      obj: fireball,
      until: startTime + travelTime * FX.timeScale,
      projectile: true,
      from: from.clone(),
      to: to.clone(),
      startTime,
      travelTime,
      mat: fireballMat,
      glowMat,
      trail,
      trailColor: color,
      onComplete: opts.onComplete
    });
  }

  // ----- Beam helpers -----
  spawnBeam(from, to, color = COLOR.earth, life = 0.12) {
    // Avoid allocating temporary vectors for simple two-point lines by reusing instance temps.
    const p0 = this._tmpVecA.copy(from);
    const p1 = this._tmpVecB.copy(to);
    const geometry = new THREE.BufferGeometry().setFromPoints([p0, p1]);
    const material = new THREE.LineBasicMaterial({ color: normalizeColor(color), linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    this.transient.add(line);
    const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
    this.queue.push({ obj: line, until: now() + life * lifeMul * FX.timeScale, fade: true, mat: material });
  }

   // Stone stream with flickering dust/pebbles (continuous earth effects)
  spawnFireStream(from, to, color = COLOR.earth, life = 0.12, segments = 10, amplitude = 0.6) {
    // Use temporaries to compute dir/normal/up without allocations.
    const dir = this._tmpVecA.copy(to).sub(this._tmpVecB.copy(from));
    const normal = this._tmpVecC.set(-dir.z, 0, dir.x).normalize();
    const up = this._tmpVecD.set(0, 1, 0);
    const length = dir.length() || 1;

    // EARTH EFFECT: Multiple thick passes with gradient colors (sandstone core, stone edges)
    const fireColors = [
      0xcaa36b,  // Sandstone core
      0x8c7455,  // Stone mid
      0x4a3f35,  // Dark rock outer
    ];
    
    const passes = this.quality === "low" ? 2 : (this.quality === "medium" ? 3 : 4);
    
    for (let pass = 0; pass < passes; pass++) {
      const points = [];
      const seg = Math.max(4, Math.round(segments * (this.quality === "low" ? 0.5 : (this.quality === "medium" ? 0.75 : 1))));
      const spreadMult = pass * 0.15; // Each pass spreads wider
      
      for (let i = 0; i <= seg; i++) {
        const t = i / segments;
        // build point into a temp vector - smoother curve for earth stream
        const pTmp = this._tmpVecE.copy(from).lerp(this._tmpVecB.copy(to), t);
        // Wavy stone shard pattern with turbulence
        const amp = Math.sin(Math.PI * t) * amplitude * (0.3 + spreadMult);
        const waveOffset = Math.sin(t * Math.PI * 3 + Date.now() * 0.01 + pass * 0.5) * amplitude * (0.2 + spreadMult);
        // Add turbulence for organic shard look
        const turbulence = (Math.random() - 0.5) * amplitude * (0.4 + spreadMult);
        const j1 = this._tmpVecA.copy(normal).multiplyScalar(waveOffset + turbulence);
        const j2 = this._tmpVecC.copy(up).multiplyScalar((Math.random() * 2 - 1) * amp * 0.6);
        pTmp.add(j1).add(j2);
        points.push(pTmp.clone());
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const colorIdx = Math.min(pass, fireColors.length - 1);
      const fireColor = fireColors[colorIdx];
      const opacity = pass === 0 ? 0.9 : (0.7 - pass * 0.15);
      const material = new THREE.LineBasicMaterial({ 
        color: normalizeColor(fireColor), 
        transparent: true, 
        opacity: opacity,
        linewidth: 2 // Thicker lines for rock stream
      });
      const line = new THREE.Line(geometry, material);
      this.transient.add(line);
      const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
      this.queue.push({ obj: line, until: now() + life * lifeMul * FX.timeScale, fade: true, mat: material });
    }

    // Stone dust and pebbles rising upward from the stream
    const emberCount = this.quality === "low" ? 2 : (this.quality === "medium" ? 4 : 6);
    for (let i = 0; i < emberCount; i++) {
      const t = Math.random();
      const emberPos = from.clone().lerp(to, t);
      // Dust rises and drifts
      const emberEnd = emberPos.clone().add(up.clone().multiplyScalar(0.5 + Math.random() * 1.5));
      emberEnd.add(normal.clone().multiplyScalar((Math.random() - 0.5) * 0.8));
      const g2 = new THREE.BufferGeometry().setFromPoints([emberPos, emberEnd]);
      const emberColor = Math.random() > 0.5 ? 0xcaa36b : 0x8c7455;
      const m2 = new THREE.LineBasicMaterial({ color: normalizeColor(emberColor), transparent: true, opacity: 0.7 });
      const l2 = new THREE.Line(g2, m2);
      this.transient.add(l2);
      const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
      this.queue.push({ obj: l2, until: now() + life * lifeMul * (0.8 + Math.random() * 0.4) * FX.timeScale, fade: true, mat: m2 });
    }
  }

  // Auto-scaling multi-pass stone stream for thickness by distance (continuous earth stream)
  spawnFireStreamAuto(from, to, color = COLOR.earth, life = 0.12) {
    const dir = to.clone().sub(from);
    const length = dir.length() || 1;
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const segments = Math.max(8, Math.min(18, Math.round(8 + length * 0.5)));
    const seg = Math.max(6, Math.round(segments * (this.quality === "low" ? 0.5 : (this.quality === "medium" ? 0.75 : 1))));
    const amplitude = Math.min(1.0, 0.25 + length * 0.02);

    // EARTH EFFECT: Gradient from sandstone core to dark rock edges
    const fireColors = [
      0xffff00,  // Bright yellow core
      0xffaa00,  // Yellow-orange
      0xff6600,  // Orange
      0xff4500,  // Orange-red outer
    ];

    const countCap = this.quality === "low" ? 2 : (this.quality === "medium" ? 3 : 4);
    const passes = Math.min(countCap, fireColors.length);

    for (let n = 0; n < passes; n++) {
      const pts = [];
      const spreadMult = n * 0.2; // Each pass spreads wider for volumetric fire
      
      for (let i = 0; i <= seg; i++) {
        const t = i / segments;
        const pTmp = this._tmpVecE.copy(from).lerp(this._tmpVecB.copy(to), t);
        // Organic wavy pattern with turbulence
        const amp = Math.sin(Math.PI * t) * amplitude * (0.6 + spreadMult);
        const wavePhase = t * Math.PI * 2 + n * 0.5 + Date.now() * 0.008;
        const wave = Math.sin(wavePhase) * amplitude * (0.4 + spreadMult);
        // Add random turbulence for fire chaos
        const turbulence = (Math.random() - 0.5) * amplitude * (0.3 + spreadMult);
        const j1 = this._tmpVecA.copy(normal).multiplyScalar(wave * (0.9 + n * 0.1) + turbulence);
        const j2 = this._tmpVecC.copy(up).multiplyScalar((Math.random() * 2 - 1) * amp * 0.5);
        pTmp.add(j1).add(j2);
        pts.push(pTmp.clone());
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const fireColor = fireColors[n];
      const opacity = n === 0 ? 0.9 : Math.max(0.4, (0.75 - n * 0.15));
      const m = new THREE.LineBasicMaterial({ 
        color: normalizeColor(fireColor), 
        transparent: true, 
        opacity,
        linewidth: 2
      });
      const l = new THREE.Line(g, m);
      this.transient.add(l);
      const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
      this.queue.push({ obj: l, until: now() + life * lifeMul * FX.timeScale, fade: true, mat: m });
    }

    // Stone dust and pebbles along the beam
    const emberCount = this.quality === "low" ? 3 : (this.quality === "medium" ? 5 : 8);
    for (let i = 0; i < emberCount; i++) {
      const t = Math.random();
      const emberPos = from.clone().lerp(to, t);
      // Embers rise and drift randomly
      const emberEnd = emberPos.clone().add(up.clone().multiplyScalar(0.6 + Math.random() * 1.8));
      emberEnd.add(normal.clone().multiplyScalar((Math.random() - 0.5) * 1.2));
      const g2 = new THREE.BufferGeometry().setFromPoints([emberPos, emberEnd]);
      const emberColor = Math.random() > 0.6 ? 0xffaa00 : (Math.random() > 0.5 ? 0xff6600 : 0xff4500);
      const m2 = new THREE.LineBasicMaterial({ color: normalizeColor(emberColor), transparent: true, opacity: 0.75 });
      const l2 = new THREE.Line(g2, m2);
      this.transient.add(l2);
      const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
      this.queue.push({ obj: l2, until: now() + life * lifeMul * (0.7 + Math.random() * 0.5) * FX.timeScale, fade: true, mat: m2 });
    }
  }

  spawnArcNoisePath(from, to, color = COLOR.midEarth, life = 0.08, passes = 2) {
    for (let i = 0; i < passes; i++) {
      this.spawnFireStream(from, to, color, life, 6, 0.2);
    }
  }

  // ----- Impact helpers -----
  spawnHitDecal(center, color = COLOR.midEarth) {
    const ring = createGroundRing(0.2, 0.55, color, 0.5);
    ring.position.set(center.x, 0.02, center.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.22 * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.3 });
  }

  spawnStrike(point, radius = 2, color = COLOR.earth) {
    // STONE PILLAR: Multiple layered pillars and shards erupting from ground with gradient colors
    const fireColors = [
      0xcaa36b,  // Sandstone core
      0x8c7455,  // Sand shard mid
      0x4a3f35,  // Dark rock outer
      0x6b5a49,  // Rocky accent
    ];
    
    const pillarPasses = this.quality === "low" ? 2 : (this.quality === "medium" ? 3 : 4);
    
    // Main stone pillar with multiple passes for thickness
    for (let i = 0; i < pillarPasses; i++) {
      const from = point.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3 * i, 
        0.1, 
        (Math.random() - 0.5) * 0.3 * i
      ));
      const to = point.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5 * i, 
        6 + Math.random() * 2, 
        (Math.random() - 0.5) * 0.5 * i
      ));
      const pillarColor = fireColors[Math.min(i, fireColors.length - 1)];
      this.spawnBeam(from, to, pillarColor, 0.15);
    }

    // Explosive radial rock shards (outward and upward like a rupturing ground)
    const burstCount = this.quality === "low" ? 3 : (this.quality === "medium" ? 6 : 8);
    for (let i = 0; i < burstCount; i++) {
      const ang = (i / burstCount) * Math.PI * 2 + Math.random() * 0.5;
      const r = radius * (0.5 + Math.random() * 0.5);
      const p2 = point.clone().add(new THREE.Vector3(
        Math.cos(ang) * r, 
        0.8 + Math.random() * 1.5, 
        Math.sin(ang) * r
      ));
      const burstColor = Math.random() > 0.5 ? 0xcaa36b : 0x8c7455;
      this.spawnBeam(point.clone().add(new THREE.Vector3(0, 0.2, 0)), p2, burstColor, 0.12);
    }
    
    // Stone dust and pebbles shooting upward from impact point
    const emberCount = this.quality === "low" ? 4 : (this.quality === "medium" ? 8 : 12);
    for (let i = 0; i < emberCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.5;
      const emberStart = point.clone().add(new THREE.Vector3(
        Math.cos(ang) * r, 
        0.1, 
        Math.sin(ang) * r
      ));
      const emberEnd = emberStart.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 1.5
      ));
      const emberColor = Math.random() > 0.6 ? 0xcaa36b : (Math.random() > 0.5 ? 0x8c7455 : 0x4a3f35);
      this.spawnBeam(emberStart, emberEnd, emberColor, 0.1 + Math.random() * 0.1);
    }
  }
  
  // Expanding ground ring pulse (scales and fades)
  spawnRingPulse(center, radius = 6, color = COLOR.midEarth, duration = 0.35, width = 0.6, opacity = 0.55) {
    try {
      const ring = createGroundRing(Math.max(0.05, radius - width * 0.5), radius + width * 0.5, color, opacity);
      ring.position.set(center.x, 0.02, center.z);
      this.indicators.add(ring);
      // Scale out over time; fade handled by update loop
      this.queue.push({ obj: ring, until: now() + duration * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.0 });
    } catch (_) {}
  }

  // Cage of vertical bars for "Stone Prison" and similar effects
  spawnCage(center, radius = 12, color = COLOR.earth, duration = 0.6, bars = 12, height = 2.2) {
    try {
      const g = new THREE.Group();
      const mats = [];
      const h = Math.max(1.4, height);
      const yMid = h * 0.5;
      const r = Math.max(1, radius);
      const col = normalizeColor(color);
      for (let i = 0; i < Math.max(6, bars); i++) {
        const ang = (i / Math.max(6, bars)) * Math.PI * 2;
        const x = center.x + Math.cos(ang) * r;
        const z = center.z + Math.sin(ang) * r;
        const geo = new THREE.CylinderGeometry(0.06, 0.06, h, 6);
        const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, yMid, z);
        g.add(m);
        mats.push(mat);
      }
      // Ground ring tying the cage together
      const baseRing = createGroundRing(Math.max(0.2, r - 0.25), r + 0.25, col, 0.4);
      baseRing.position.set(center.x, 0.02, center.z);
      g.add(baseRing);
      mats.push(baseRing.material);

      this.transient.add(g);
      this.queue.push({ obj: g, until: now() + duration * FX.timeScale, fade: true, mats });
    } catch (_) {}
  }

  // Shield bubble that follows an entity and gently pulses
  spawnShieldBubble(entity, color = COLOR.earth, duration = 6, radius = 1.7) {
    try {
      const mat = new THREE.MeshBasicMaterial({ color: normalizeColor(color), transparent: true, opacity: 0.22, wireframe: true });
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), mat);
      const p = entity.pos();
      bubble.position.set(p.x, 1.1, p.z);
      this.transient.add(bubble);
      this.queue.push({
        obj: bubble,
        until: now() + duration * FX.timeScale,
        fade: true,
        mat,
        follow: entity,
        followYOffset: 1.1,
        pulseAmp: 0.06,
        pulseRate: 3.5,
        baseScale: 1
      });
    } catch (_) {}
  }

  // Storm cloud disc hovering over an area (rotates and fades)
  spawnStormCloud(center, radius = 12, color = COLOR.earth, duration = 6, height = 3.6) {
    try {
      const thick = Math.max(0.6, radius * 0.08);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(2, radius * 0.8), thick * 0.5, 12, 32),
      new THREE.MeshBasicMaterial({ color: normalizeColor(color), transparent: true, opacity: 0.18 })
    );
      torus.position.set(center.x, height, center.z);
      torus.rotation.x = Math.PI / 2; // lie flat like a cloud disc
      this.transient.add(torus);
      this.queue.push({ obj: torus, until: now() + duration * FX.timeScale, fade: true, mat: torus.material, spinRate: 0.6 });
    } catch (_) {}
  }

  // Orbiting energy orbs around an entity for a short duration
  spawnOrbitingOrbs(entity, color = COLOR.earth, opts = {}) {
    try {
      const count = Math.max(1, opts.count ?? 4);
      const r = Math.max(0.4, opts.radius ?? 1.2);
      const duration = Math.max(0.2, opts.duration ?? 1.0);
      const size = Math.max(0.06, opts.size ?? 0.16);
      const rate = Math.max(0.5, opts.rate ?? 4.0);

      const group = new THREE.Group();
      const children = [];
      for (let i = 0; i < count; i++) {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(size, 10, 10),
      new THREE.MeshBasicMaterial({ color: normalizeColor(COLOR.midEarth), transparent: true, opacity: 0.9 })
    );
        group.add(orb);
        children.push(orb);
      }
      const p = entity.pos();
      group.position.set(p.x, 0, p.z);
      this.transient.add(group);
      this.queue.push({
        obj: group,
        until: now() + duration * FX.timeScale,
        fade: true,
        follow: entity,
        followYOffset: 0,
        orbitChildren: children,
        orbitR: r,
        orbitRate: rate,
        orbitYOffset: 1.2
      });
    } catch (_) {}
  }

  spawnHandFlash(player, left = false) {
    const p = left ? leftHandWorldPos(player) : handWorldPos(player);
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshBasicMaterial({ color: normalizeColor(COLOR.midEarth), transparent: true, opacity: 0.9 })
    );
    s.position.copy(p);
    this.transient.add(s);
    this.queue.push({ obj: s, until: now() + 0.12 * FX.timeScale, fade: true, mat: s.material, scaleRate: 1.8 });
  }

  // Colored variant for skill-tinted flashes
  spawnHandFlashColored(player, color = 0xff6347, left = false) {
    const p = left ? leftHandWorldPos(player) : handWorldPos(player);
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshBasicMaterial({ color: normalizeColor(color), transparent: true, opacity: 0.95 })
    );
    s.position.copy(p);
    this.transient.add(s);
    this.queue.push({ obj: s, until: now() + 0.14 * FX.timeScale, fade: true, mat: s.material, scaleRate: 2.0 });
  }

  /**
   * Spawn a small floating damage text at world position.
   * amount may be a number or string. Color is a hex number.
   */
  spawnDamagePopup(worldPos, amount, color = 0xffe1e1) {
    // Throttle popups on lower qualities to reduce CanvasTexture churn
    const q = this.quality || "high";
    if (q === "low" && Math.random() > 0.3) return;
    if (q === "medium" && Math.random() > 0.6) return;
    if (!worldPos) return;
    const text = String(Math.floor(Number(amount) || amount));
    const w = 160;
    const h = 64;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    // Background transparent
    ctx.clearRect(0, 0, w, h);
    // Shadow / stroke for readability
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hex = (color >>> 0).toString(16).padStart(6, "0");
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = `#${hex}`;
    ctx.fillText(text, w / 2, h / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
    const spr = new THREE.Sprite(mat);

    // Scale sprite so it's readable in world units
    const scaleBase = 0.8;
    const scale = scaleBase + Math.min(2.0, text.length * 0.08);
    spr.scale.set(scale * (w / 128), scale * (h / 64), 1);
    spr.position.set(worldPos.x, worldPos.y + 2.4, worldPos.z);

    this.transient.add(spr);
    this.queue.push({
      obj: spr,
      until: now() + 1.0 * FX.popupDurationScale,
      fade: true,
      mat: mat,
      velY: 0.9,
      map: tex,
    });
  }

  // Hand crackle sparks around hand anchor (stone dust / pebbles)
  spawnHandCrackle(player, left = false, strength = 1) {
    if (!player) return;
    const origin = left ? leftHandWorldPos(player) : handWorldPos(player);
    const qMul = this.quality === "low" ? 0.4 : (this.quality === "medium" ? 0.6 : 1);
    const count = Math.max(1, Math.round((2 + Math.random() * 2 * strength) * qMul));
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.2), (Math.random() - 0.5)).normalize();
      const len = 0.35 + Math.random() * 0.5 * strength;
      const to = origin.clone().add(dir.multiplyScalar(len));
      // Fire sparks/embers
      this.spawnBeam(origin.clone(), to, COLOR.midEarth, 0.06);
    }
  }

  // Short arc connecting both hands (stone stream between hands)
  spawnHandLink(player, life = 0.08) {
    if (!player) return;
    const a = handWorldPos(player);
    const b = leftHandWorldPos(player);
    this.spawnFireStreamAuto(a, b, COLOR.midEarth, life);
  }

  // ----- Frame update -----
  update(t, dt) {
    // Adaptive VFX throttling based on FPS to reduce draw calls on low-end devices
    let fps = 60;
    try { fps = (window.__perfMetrics && window.__perfMetrics.fps) ? window.__perfMetrics.fps : (1000 / Math.max(0.001, (window.__perfMetrics && window.__perfMetrics.avgMs) || 16.7)); } catch (_) {}
    const __fadeBoost = fps < 20 ? 2.4 : (fps < 28 ? 1.8 : (fps < 40 ? 1.25 : 1));
    try {
      const maxAllowed = fps < 20 ? 28 : (fps < 28 ? 42 : (fps < 40 ? 80 : 120));
      if (this.queue.length > maxAllowed) {
        const toCull = Math.min(this.queue.length - maxAllowed, Math.floor(this.queue.length * 0.2));
        // Mark a subset to end soon; disposal occurs below when t >= until
        for (let k = 0; k < toCull; k++) {
          const idx = (k % this.queue.length);
          const e = this.queue[idx];
          if (e) e.until = Math.min(e.until || (t + 0.3), t + 0.12);
        }
      }
    } catch (_) {}

    for (let i = this.queue.length - 1; i >= 0; i--) {
      const e = this.queue[i];

      // Projectile motion (fireballs, etc.)
      if (e.projectile && e.obj && e.obj.position) {
        const elapsed = t - e.startTime;
        const progress = Math.min(1, elapsed / e.travelTime);
        
        // Lerp position from start to end
        const newPos = this._tmpVecA.copy(e.from).lerp(this._tmpVecB.copy(e.to), progress);
        e.obj.position.copy(newPos);
        
        // Add slight wobble for organic fire movement
        const wobble = Math.sin(t * 15) * 0.1;
        e.obj.position.y += wobble;
        
        // Spawn fire trail particles
        if (e.trail && this.quality !== "low" && Math.random() > 0.6) {
          const trailPos = e.obj.position.clone();
          const trailEnd = trailPos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            -0.2 - Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
          ));
          this.spawnBeam(trailPos, trailEnd, e.trailColor || COLOR.earth, 0.08);
        }
        
        // Check if reached destination
        if (progress >= 1 && e.onComplete) {
          try { e.onComplete(e.to); } catch (_) {}
        }
      }

      // Vertical motion for popups
      if (e.velY && e.obj && e.obj.position) {
        e.obj.position.y += e.velY * dt;
      }

      // Optional animated scaling (for pings)
      if (e.scaleRate && e.obj && e.obj.scale) {
        const s = 1 + (e.scaleRate || 0) * dt * FX.scaleRateScale;
        e.obj.scale.multiplyScalar(s);
      }

      // Follow an entity (for bubbles/rings that should stick to a unit)
      if (e.follow && e.obj && typeof e.follow.pos === "function") {
        const p = e.follow.pos();
        try { e.obj.position.set(p.x, (e.followYOffset ?? e.obj.position.y), p.z); } catch (_) {}
      }

      // Pulsing scale (breathing bubble, buff auras)
      if (e.pulseAmp && e.obj && e.obj.scale) {
        const base = e.baseScale || 1;
        const rate = (e.pulseRate || 3) * FX.pulseRateScale;
        const amp = e.pulseAmp || 0.05;
        const s2 = base * (1 + Math.sin(t * rate) * amp);
        try { e.obj.scale.set(s2, s2, s2); } catch (_) {}
      }

      // Spin rotation (e.g., storm cloud disc)
      if (e.spinRate && e.obj && e.obj.rotation) {
        try { e.obj.rotation.y += (e.spinRate || 0) * dt * FX.spinRateScale; } catch (_) {}
      }

      // Orbiting orbs around a followed entity
      if (e.orbitChildren && e.obj) {
        const cnt = e.orbitChildren.length || 0;
        e.orbitBase = (e.orbitBase || 0) + (e.orbitRate || 4) * dt * FX.orbitRateScale;
        const base = e.orbitBase || 0;
        const r = e.orbitR || 1.2;
        const y = e.orbitYOffset ?? 1.2;
        for (let i = 0; i < cnt; i++) {
          const child = e.orbitChildren[i];
          if (!child) continue;
          const ang = base + (i * Math.PI * 2) / Math.max(1, cnt);
          try { child.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r); } catch (_) {}
        }
      }

      if (e.fade) {
        const fadeOne = (m) => {
          if (!m) return;
          m.opacity = m.opacity ?? 1;
          m.transparent = true;
          m.opacity = Math.max(0, m.opacity - dt * 1.8 * FX.fadeSpeedScale * __fadeBoost);
        };
        if (e.mat) fadeOne(e.mat);
        if (e.mats && Array.isArray(e.mats)) e.mats.forEach(fadeOne);
      }

      if (t >= e.until) {
        // Remove from either transient or indicators group if present
        this.transient.remove(e.obj);
        this.indicators.remove(e.obj);
        // Dispose recursively
        const disposeMat = (m) => {
          try { if (m && m.map) m.map.dispose?.(); } catch (_) {}
          try { m && m.dispose?.(); } catch (_) {}
        };
        const disposeObj = (o) => {
          try { o.geometry && o.geometry.dispose?.(); } catch (_) {}
          try {
            if (Array.isArray(o.material)) o.material.forEach(disposeMat);
            else disposeMat(o.material);
          } catch (_) {}
        };
        try {
          if (e.obj && typeof e.obj.traverse === "function") {
            e.obj.traverse(disposeObj);
          } else {
            disposeObj(e.obj);
          }
        } catch (_) {}
        this.queue.splice(i, 1);
      }
    }
  }
}

// ===========================
// God of Metal — Assets & API
// ===========================

// All shader/material asset paths point under this base:
const METAL_ASSETS_BASE = "/assets/effects/metal/";

// Shader & Material Library (metadata only; used for QA/validation)
export const METAL_SHADER_LIBRARY = Object.freeze({
  metalRipple: {
    name: "metalRipple.mat",
    assetPath: METAL_ASSETS_BASE + "metalRipple.mat",
    reflectivity: 0.9,
    heat_glow: 0.4,
    vibration_intensity: 0.3,
    color_tone: [170, 170, 180],
    metallic: true
  },
  sparkTrail: {
    name: "sparkTrail.mat",
    assetPath: METAL_ASSETS_BASE + "sparkTrail.mat",
    reflectivity: 0.75,
    heat_glow: 0.35,
    vibration_intensity: 0.25,
    color_tone: [220, 180, 140],
    metallic: true
  },
  ironParticle: {
    name: "ironParticle.mat",
    assetPath: METAL_ASSETS_BASE + "ironParticle.mat",
    reflectivity: 0.8,
    heat_glow: 0.2,
    vibration_intensity: 0.15,
    color_tone: [160, 160, 170],
    metallic: true
  },
  magnetField: {
    name: "magnetField.mat",
    assetPath: METAL_ASSETS_BASE + "magnetField.mat",
    reflectivity: 0.85,
    heat_glow: 0.3,
    vibration_intensity: 0.4,
    color_tone: [140, 180, 220],
    metallic: true
  },
  forgeGlow: {
    name: "forgeGlow.mat",
    assetPath: METAL_ASSETS_BASE + "forgeGlow.mat",
    reflectivity: 0.7,
    heat_glow: 0.6,
    vibration_intensity: 0.2,
    color_tone: [230, 180, 120],
    metallic: true
  }
});

// Internal helpers used by MetalEffects (designed to integrate with EffectsManager)
function __metal_playSound(name) {
  try { audio.sfx?.(name); } catch (_) {}
}

/**
 * Spawn a quick particle cloud using Points.
 * Adds to fx.transient and queues fade/dispose via EffectsManager.queue.
 */
function __metal_spawnParticles(fx, opts) {
  const {
    center,
    count = 80,
    lifetime = 0.8,
    color = 0xB4B4C8,
    size = 0.06,
    spread = 0.8
  } = opts || {};
  if (!fx || !center) return null;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const rx = (Math.random() - 0.5) * spread * 2;
    const ry = Math.random() * spread * 0.8; // upward bias
    const rz = (Math.random() - 0.5) * spread * 2;
    positions[i * 3 + 0] = center.x + rx;
    positions[i * 3 + 1] = Math.max(0.05, center.y + ry);
    positions[i * 3 + 2] = center.z + rz;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const m = new THREE.PointsMaterial({
    color: color >>> 0,
    size: size,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  const pts = new THREE.Points(g, m);
  fx.transient.add(pts);
  fx.queue.push({ obj: pts, until: now() + lifetime * FX.timeScale, fade: true, mat: m });
  return pts;
}

/**
 * Apply a metal shader "effect". Since we are pure-ESM without custom shader loaders,
 * this translates shader intent to existing primitives + metadata tagging for QA.
 */
function __metal_applyShaderEffect(fx, name, params = {}) {
  if (!fx || !name) return;
  const lib = METAL_SHADER_LIBRARY[name] || null;
  const center = params.center || new THREE.Vector3();
  const col = (params.color && (typeof params.color === "number" ? params.color : 0xB4B4C8)) || 0xB4B4C8;

  // Visual analogs:
  switch (name) {
    case "metalRipple": {
      // Expanding, refractive-like ring
      try { fx.spawnRingPulse(center, params.radius || 5.2, col, 0.42, 0.8, 0.55); } catch (_) {}
      break;
    }
    case "forgeGlow": {
      // Warm glow + ring
      try {
        fx.spawnRingPulse(center, params.radius || 3.6, 0xE6B478, 0.5, 0.9, 0.5);
        fx.spawnStrike(center, 1.2, 0xE6B478);
      } catch (_) {}
      break;
    }
    case "magneticDistortion":
    case "magnetField": {
      // Hovering torus disc to indicate field
      try { fx.spawnStormCloud(center, params.radius || 7, 0x8FB8FF, params.duration || 2.6, 3.2); } catch (_) {}
      break;
    }
    case "sparkTrail": {
      // short spark arc
      try {
        const base = center.clone().add(new THREE.Vector3(0, 0.4, 0));
        const off = new THREE.Vector3((Math.random() - 0.5) * 2, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 2);
        fx.spawnArcNoisePath(base, base.clone().add(off), 0xFFDCA0, 0.08, 2);
      } catch (_) {}
      break;
    }
    default: {
      // Fallback ping
      try { fx.spawnMovePing(center, col); } catch (_) {}
    }
  }

  // Attach metadata for uniqueness validation
  try {
    const tag = { METAL_EFFECT: true, shader: name, params, asset: lib?.assetPath || null };
    // Put metadata into a harmless no-op queue entry for audit visibility
    fx.queue.push({ obj: { userData: tag }, until: now() + 0.01 });
  } catch (_) {}
}

/**
 * Apply simple forces to enemies near 'center'.
 * mode: 'repel' | 'attract' | 'vibrate' | 'stagger'
 */
function __metal_applyForceToEntitiesInRadius(center, radius = 6, magnitude = 1, mode = "repel", enemies = []) {
  if (!center || !enemies || !Array.isArray(enemies)) return;
  for (const en of enemies) {
    if (!en || !en.alive) continue;
    const pos = en.pos?.() || en.mesh?.position || null;
    if (!pos) continue;
    const dx = pos.x - center.x;
    const dz = pos.z - center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > radius || dist <= 0.0001) continue;
    const nx = dx / dist;
    const nz = dz / dist;
    const amt = Math.max(0.1, (1 - dist / radius) * (magnitude || 1));
    switch (mode) {
      case "repel":
        en.mesh.position.set(pos.x + nx * amt, pos.y, pos.z + nz * amt);
        break;
      case "attract":
        en.mesh.position.set(pos.x - nx * amt, pos.y, pos.z - nz * amt);
        break;
      case "vibrate":
        en.mesh.position.set(pos.x + (Math.random() - 0.5) * amt * 0.2, pos.y, pos.z + (Math.random() - 0.5) * amt * 0.2);
        en.slowUntil = Math.max(en.slowUntil || 0, now() + 0.3);
        en.slowFactor = Math.min(0.4, Math.max(0.1, 0.3 * amt));
        break;
      case "stagger":
        en.nextAttackReady = Math.max(en.nextAttackReady || 0, now() + 0.4 + amt * 0.4);
        en.slowUntil = Math.max(en.slowUntil || 0, now() + 0.4 + amt * 0.3);
        en.slowFactor = 0.0;
        break;
    }
  }
}

/**
 * @function emitIronPulse
 * @description Emits metallic energy pulse that pushes enemies outward.
 * @linkedSkill Iron Pulse
 * @uniquenessTag METAL_EFFECT
 */
function emitIronPulse(position, intensity = 1, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !position) return;
  // 1. Particle Core
  __metal_spawnParticles(fx, {
    center: position,
    count: Math.round(120 * intensity),
    lifetime: 0.9,
    color: 0xB4B4C8, // iron dust
    size: 0.06,
    spread: 1.0
  });
  // 2. Shader Layer
  __metal_applyShaderEffect(fx, "metalRipple", {
    center: position,
    radius: 4 + intensity * 2,
    distortion: 0.3,
    heat: 0.1,
    color: 0xFFDCA0 // warm highlights
  });
  // 3. Force Application
  __metal_applyForceToEntitiesInRadius(position, 6 + intensity * 2, intensity * 1.4, "repel", ctx.enemies || []);
  __metal_playSound("metal_clang");
}

/**
 * @function generateMagnetField
 * @description Persistent pull zone using magnetic particle flow.
 * @linkedSkill Magnet Field
 * @uniquenessTag METAL_EFFECT
 */
function generateMagnetField(center, radius = 6, duration = 4, intensity = 1, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !center) return;
  // 1. Particle Core (orbiting sparks)
  for (let i = 0; i < 3; i++) {
    __metal_spawnParticles(fx, {
      center: center.clone().add(new THREE.Vector3(0, 0.6 + i * 0.2, 0)),
      count: 50,
      lifetime: 0.8 + i * 0.2,
      color: 0xFFDCA0,
      size: 0.05,
      spread: Math.max(1.0, radius * 0.4)
    });
  }
  // 2. Shader Layer (magnetic distortion disc)
  __metal_applyShaderEffect(fx, "magnetField", { center, radius, duration });
  // 3. Force Application (continuous attract)
  __metal_applyForceToEntitiesInRadius(center, radius, 0.5 + intensity * 0.6, "attract", ctx.enemies || []);
  __metal_playSound("magnetic_hum");
  // Maintain subtle pulses during duration
  try { fx.spawnRingPulse(center, Math.max(4, radius * 0.8), 0x88AAFF, 0.5, 1.0, 0.45); } catch (_) {}
}

/**
 * @function generateSparkTrail
 * @description Trail of glowing metal sparks during movement.
 * @linkedSkill Steel Dash
 * @uniquenessTag METAL_EFFECT
 */
function generateSparkTrail(from, to, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !from || !to) return;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = from.clone().lerp(to, t);
    __metal_applyShaderEffect(fx, "sparkTrail", { center: p });
    try { fx.spawnRingPulse(p, 0.9, 0xFFA64D, 0.18, 0.35, 0.4); } catch (_) {}
  }
  __metal_playSound("spark");
}

/**
 * @function emitEchoResonance
 * @description Expanding soundwave ring with vibrating distortion.
 * @linkedSkill Echo Slam
 * @uniquenessTag METAL_EFFECT
 */
function emitEchoResonance(center, intensity = 1, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !center) return;
  // 1. Particle Core: resonance waves
  __metal_spawnParticles(fx, {
    center: center.clone().add(new THREE.Vector3(0, 0.4, 0)),
    count: 80,
    lifetime: 0.7,
    color: 0xAAB0C8,
    size: 0.05,
    spread: 1.2
  });
  // 2. Shader Layer: metal ripple
  __metal_applyShaderEffect(fx, "metalRipple", { center, radius: 5 + intensity * 2 });
  // 3. Force: stagger + vibrate
  __metal_applyForceToEntitiesInRadius(center, 7 + intensity * 2, 1.0 * intensity, "stagger", ctx.enemies || []);
  __metal_applyForceToEntitiesInRadius(center, 7 + intensity * 2, 0.4 * intensity, "vibrate", ctx.enemies || []);
  __metal_playSound("resonance_boom");
}

/**
 * @function launchMetalShard
 * @description Fast projectile made of molten metal, leaves spark trail.
 * @linkedSkill Blade Storm
 * @uniquenessTag METAL_EFFECT
 */
function launchMetalShard(from, to, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !from || !to) return;
  const color = 0xC0C8D8; // polished steel
  try {
    fx.spawnFireball(from, to, {
      color,
      size: 0.34,
      speed: 42,
      trail: true,
      onComplete: (hitPos) => {
        try {
          fx.spawnStrike(hitPos, 1.0, 0xFFDCA0);
          fx.spawnHitDecal(hitPos, 0xFFDCA0);
          fx.spawnArcNoisePath(from.clone().add(new THREE.Vector3(0,0.8,0)), hitPos.clone().add(new THREE.Vector3(0,0.8,0)), 0xFFDCA0, 0.08, 2);
        } catch (_) {}
      }
    });
  } catch (_) {}
  __metal_playSound("metal_clang");
}

/**
 * @function forgeTitanSkin
 * @description Chrome overlay; temporary damage reduction visual.
 * @linkedSkill Titan Skin
 * @uniquenessTag METAL_EFFECT
 */
function forgeTitanSkin(entity, duration = 6, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !entity) return;
  try { fx.spawnShieldBubble(entity, 0xD0D8E8, duration, 1.9); } catch (_) {}
  __metal_applyShaderEffect(fx, "forgeGlow", { center: entity.pos?.() || entity.mesh?.position || new THREE.Vector3(), radius: 2.5, duration });
  // Apply defensive state if provided
  try {
    entity.defensePct = Math.max(entity.defensePct || 0, 0.4);
    entity.defenseUntil = now() + duration;
  } catch (_) {}
  __metal_playSound("forge_rumble");
}

/**
 * @function launchMagneticLance
 * @description Beam of electromagnetic energy; pierces enemies.
 * @linkedSkill Magnetic Lance
 * @uniquenessTag METAL_EFFECT
 */
function launchMagneticLance(from, to, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !from || !to) return;
  const beamColor = 0x88AAFF;
  try {
    fx.spawnBeam(from, to, beamColor, 0.16);
    fx.spawnFireStreamAuto(from, to, 0x9EC4FF, 0.1);
  } catch (_) {}
  // Minor attraction towards beam line
  const center = from.clone().add(to).multiplyScalar(0.5);
  __metal_applyForceToEntitiesInRadius(center, 6, 0.5, "attract", ctx.enemies || []);
  __metal_playSound("beam");
}

/**
 * @function invokeIronboundForm
 * @description Overhaul visual; constant spark emissions.
 * @linkedSkill Ironbound Form (Ultimate)
 * @uniquenessTag METAL_EFFECT
 */
function invokeIronboundForm(player, duration = 8, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !player) return;
  // Opening forge glow + ring
  const pos = player.pos?.() || player.mesh?.position || new THREE.Vector3();
  __metal_applyShaderEffect(fx, "forgeGlow", { center: pos, radius: 3.0, duration });
  try { fx.spawnRingPulse(pos, 3.2, 0xFFA64D, 0.55, 1.2, 0.5); } catch (_) {}
  // Orbiting sparks around player
  try { fx.spawnOrbitingOrbs(player, 0xFFDCA0, { count: 8, radius: 1.4, duration: Math.min(1.6, duration * 0.25), size: 0.18, rate: 5.0 }); } catch (_) {}
  // Defensive and damage buff hooks (if player supports them)
  try {
    player.defensePct = Math.max(player.defensePct || 0, 0.35);
    player.defenseUntil = now() + duration;
    player.atkSpeedMul = Math.max(player.atkSpeedMul || 1, 1.1);
    player.atkSpeedUntil = now() + duration;
  } catch (_) {}
  __metal_playSound("aura_on");
}

/**
 * @function summonForgeCore
 * @description Creates massive molten explosion + magnetic burst.
 * @linkedSkill Forge Core (Ultimate)
 * @uniquenessTag METAL_EFFECT
 */
function summonForgeCore(center, intensity = 1, ctx = {}) {
  const fx = ctx.fx;
  if (!fx || !center) return;
  // 1. Particle Core — molten burst
  __metal_spawnParticles(fx, {
    center: center.clone().add(new THREE.Vector3(0, 0.6, 0)),
    count: 160,
    lifetime: 1.0,
    color: 0xE6B478,
    size: 0.07,
    spread: 1.6
  });
  // 2. Shader Layers — forge glow + ripple
  __metal_applyShaderEffect(fx, "forgeGlow", { center, radius: 4.5, duration: 0.6 });
  __metal_applyShaderEffect(fx, "metalRipple", { center, radius: 7.0, duration: 0.5 });
  // 3. Force — initial repel, then core pull (single-step approximation)
  __metal_applyForceToEntitiesInRadius(center, 7 + intensity * 2, 1.4 * intensity, "repel", ctx.enemies || []);
  __metal_applyForceToEntitiesInRadius(center, 11 + intensity * 3, 0.8 * intensity, "attract", ctx.enemies || []);
  // Flair rings
  try {
    fx.spawnRingPulse(center, 5.2, 0xFFA64D, 0.5, 1.0, 0.5);
    fx.spawnRingPulse(center, 7.2, 0x9EC4FF, 0.55, 1.15, 0.55);
    fx.spawnStrike(center, 2.0, 0xE6B478);
  } catch (_) {}
  __metal_playSound("boom");
}

// Export surface for God of Metal effects
export const MetalEffects = {
  emitIronPulse,
  generateMagnetField,
  generateSparkTrail,
  emitEchoResonance,
  launchMetalShard,
  forgeTitanSkin,
  launchMagneticLance,
  invokeIronboundForm,
  summonForgeCore
};
