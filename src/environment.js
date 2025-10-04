import * as THREE from "../vendor/three/build/three.module.js";
import { makeNoiseTexture, createSeededRNG, seededRange } from "./utils.js";
import { WORLD, storageKey } from "./constants.js";
import { createHouse, createGreekTemple, createVilla, createGreekColumn, createCypressTree, createOliveTree, createGreekStatue, createObelisk } from "./meshes.js";
import { placeStructures } from "./structures.js";

/**
 * initEnvironment(scene, options)
 * - Adds a simple themed environment: scattered trees, rocks, flowers, a small village,
 *   optional water pool and toggleable rain.
 *
 * Returns an object with:
 *  - update(t, dt)  -> call each frame to animate rain / water
 *  - toggleRain(enabled)
 *
 * Implementation notes:
 * - Uses simple low-poly primitives (fast, no external assets).
 * - Uses WORLD.groundSize as placement bounds by default.
 */
export function initEnvironment(scene, options = {}) {
  const cfg = Object.assign(
    {
      // denser defaults for a richer environment (Phase A tuned)
      treeCount: 160,
      rockCount: 80,
      flowerCount: 300,
      villageCount: 2,
      villageRadius: 12,
      enableWater: true,
      waterRadius: 22,
      enableRain: true,
      rainCount: 800,
      seed: Date.now(),
    },
    options
  );

  // Quality preset scaling for environment complexity
  try { cfg.quality = cfg.quality || (JSON.parse(localStorage.getItem(storageKey("renderPrefs")) || "{}").quality || "high"); } catch (_) { cfg.quality = cfg.quality || "high"; }
  const __q = cfg.quality;
  // Scale prop counts based on quality unless explicitly overridden by options
  if (__q === "medium") {
    cfg.treeCount = Math.floor(cfg.treeCount * 0.6);
    cfg.rockCount = Math.floor(cfg.rockCount * 0.6);
    cfg.flowerCount = Math.floor(cfg.flowerCount * 0.5);
    cfg.villageCount = Math.max(1, Math.floor(cfg.villageCount * 0.8));
    cfg.rainCount = Math.floor(cfg.rainCount * 0.6);
  } else if (__q === "low") {
    cfg.treeCount = Math.floor(cfg.treeCount * 0.35);
    cfg.rockCount = Math.floor(cfg.rockCount * 0.45);
    cfg.flowerCount = Math.floor(cfg.flowerCount * 0.35);
    cfg.villageCount = 1;
    cfg.enableWater = false;
    cfg.rainCount = Math.floor(cfg.rainCount * 0.33);
  }
  // If chunking is enabled, delegate world props/structures to chunk manager
  try {
    if (WORLD?.chunking?.enabled) {
      cfg.treeCount = 0;
      cfg.rockCount = 0;
      cfg.flowerCount = 0;
      cfg.villageCount = 0;
    }
  } catch (_) {}
  // Road segments based on quality
  const __roadSegs = __q === "low" ? 36 : (__q === "medium" ? 80 : 140);
  // Whether to add light sources on houses (skip on low, dim on medium)
  const __houseLights = __q === "high" ? "full" : (__q === "medium" ? "dim" : "none");
  // Fireflies density factor
  const __fireflyMul = __q === "low" ? 0.25 : (__q === "medium" ? 0.5 : 1);
  // Dynamic light budget to cap per-frame lighting cost
  const __lightBudget = (__q === "low") ? 0 : (__q === "medium" ? 6 : 10);
  let __lightBudgetLeft = __lightBudget;
  function acquireLight(n = 1) {
    if (__lightBudgetLeft >= n) { __lightBudgetLeft -= n; return true; }
    return false;
  }

  const root = new THREE.Group();
  root.name = "environment";
  scene.add(root);
  const rng = createSeededRNG(cfg.seed);

  // atmospheric fog tuned for earth/stone theme
  scene.fog = scene.fog || new THREE.FogExp2(0x23221f, 0.0009);

  // Ambient & directional light to match earth/stone theme (complements existing lights)
  const ambient = new THREE.AmbientLight(0x2d2a26, 0.72);
  root.add(ambient);

  // directional light tuned for a natural earthy sun (soft)
  const sun = new THREE.DirectionalLight(0xcaa36b, 0.36);
  sun.position.set(60, 80, -40);
  sun.castShadow = false;
  root.add(sun);

  // Ground detail subtle overlay (tile noise material)
  const detailTex = makeNoiseTexture(256);
  detailTex.wrapS = detailTex.wrapT = THREE.RepeatWrapping;
  detailTex.repeat.set(12, 12);

  const groundOverlay = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(40, Math.min(300, WORLD.groundSize * 0.2)), 64),
    new THREE.MeshStandardMaterial({
      map: detailTex,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  groundOverlay.rotation.x = -Math.PI / 2;
  groundOverlay.position.y = 0.01;
  root.add(groundOverlay);

  // Helpers to place items within bounds
  const half = WORLD.groundSize * 0.5 - 6;
  function randomPosInBounds() {
    return new THREE.Vector3(
      (Math.random() * 2 - 1) * half,
      0,
      (Math.random() * 2 - 1) * half
    );
  }
  function seededRandomPosInBounds() {
    return new THREE.Vector3(
      (rng() * 2 - 1) * half,
      0,
      (rng() * 2 - 1) * half
    );
  }

  // Cache of objects that sway to avoid traversing full scene graph every frame
  const swayObjs = [];
  // Water placeholder (declared early so update() can reference it safely)
  let water = null;

  // ----------------
  // Primitive props
  // ----------------
  function createTree() {
    const g = new THREE.Group();

    const h = 1.6 + Math.random() * 1.2;
    const trunkGeo = new THREE.CylinderGeometry(0.12 * (0.85 + Math.random() * 0.6), 0.12 * (0.85 + Math.random() * 0.6), h * 0.45, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1a12 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = h * 0.225;
    trunk.castShadow = true;
    g.add(trunk);

    const foliageGeo = new THREE.ConeGeometry(h * 0.6, h * 0.9, 8);
    // shift foliage color toward mossy green to match earth theme
    const hueBase = 0.28 + (Math.random() - 0.5) * 0.06;
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hueBase, 0.45 + Math.random() * 0.15, 0.22 + Math.random() * 0.09)
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = h * 0.9;
    foliage.castShadow = true;
    g.add(foliage);

    // small sway params used by update() to animate subtle motion
    g.userData.swayPhase = Math.random() * Math.PI * 2;
    g.userData.swayAmp = 0.004 + Math.random() * 0.01;
    // register for per-frame sway updates
    swayObjs.push(g);

    g.scale.setScalar(0.9 + Math.random() * 0.8);
    return g;
  }

  function createRock() {
    const s = 0.6 + Math.random() * 1.4;
    const geo = new THREE.DodecahedronGeometry(s, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a3f35 });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    m.castShadow = true;
    return m;
  }

  function createFlower() {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24), new THREE.MeshStandardMaterial({ color: 0x4a2a1a }));
    stem.position.y = 0.12;
    g.add(stem);
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshStandardMaterial({ color: 0xcaa36b, emissive: 0x8c7455 }));
    petal.position.y = 0.28;
    g.add(petal);
    g.scale.setScalar(0.9 + Math.random() * 0.6);
    return g;
  }

  // Forest cluster generator - denser cluster of trees
  function createForest(center = new THREE.Vector3(0,0,0), radius = 8, count = 30) {
    const fg = new THREE.Group();
    for (let i=0;i<count;i++) {
      const t = createTree();
      const a = Math.random()*Math.PI*2;
      const r = Math.random()*radius;
      t.position.set(center.x + Math.cos(a)*r, 0, center.z + Math.sin(a)*r);
      t.rotateY(Math.random()*Math.PI*2);
      fg.add(t);
    }
    return fg;
  }

  // Scatter props via InstancedMesh batching (reduce draw calls significantly)
  // Trees: trunk + foliage instanced
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3f35 });
  const foliageGeo = new THREE.ConeGeometry(1, 1, 8);
  const foliageMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28, 0.45, 0.27) });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, cfg.treeCount);
  const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, cfg.treeCount);
  trunkInst.castShadow = true; trunkInst.receiveShadow = true;
  foliageInst.castShadow = true; foliageInst.receiveShadow = true;

  // Rocks
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3a2520 });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, cfg.rockCount);
  rockInst.castShadow = true; rockInst.receiveShadow = true;

  // Flowers (stems + petals)
  const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 1);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a });
  const petalGeo = new THREE.SphereGeometry(1, 6, 6);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xcaa36b, emissive: 0x8c7455 });
  const stemInst = new THREE.InstancedMesh(stemGeo, stemMat, cfg.flowerCount);
  const petalInst = new THREE.InstancedMesh(petalGeo, petalMat, cfg.flowerCount);

  const _m4 = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();

  // Store per-tree base transforms for lightweight sway updates
  const treeBases = new Array(cfg.treeCount);
  // Sway stride by quality (0 disables)
  const __instSwayStride = (__q === "high" ? 2 : (__q === "medium" ? 4 : 0));
  let __swayTick = 0;

  for (let i = 0; i < cfg.treeCount; i++) {
    const p = randomPosInBounds();
    const rotY = Math.random() * Math.PI * 2;
    const baseH = 1.6 + Math.random() * 1.2;
    const trunkH = baseH * 0.45;
    const foliageH = baseH * 0.9;
    const trunkXZ = 0.85 + Math.random() * 0.4;
    const foliageXZ = baseH * 0.6;

    // Trunk
    _p.set(p.x, trunkH * 0.5, p.z);
    _q.setFromEuler(new THREE.Euler(0, rotY, 0));
    _s.set(trunkXZ, trunkH, trunkXZ);
    _m4.compose(_p, _q, _s);
    trunkInst.setMatrixAt(i, _m4);

    // Foliage (lies above trunk)
    _p.set(p.x, trunkH + foliageH * 0.5, p.z);
    _q.setFromEuler(new THREE.Euler(0, rotY, 0));
    _s.set(foliageXZ, foliageH, foliageXZ);
    _m4.compose(_p, _q, _s);
    foliageInst.setMatrixAt(i, _m4);

    treeBases[i] = {
      pos: new THREE.Vector3(p.x, 0, p.z),
      rotY,
      trunkH,
      foliageH,
      trunkXZ,
      foliageXZ,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: 0.004 + Math.random() * 0.01
    };
  }
  trunkInst.instanceMatrix.needsUpdate = true;
  foliageInst.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < cfg.rockCount; i++) {
    const p = randomPosInBounds();
    const s = 0.7 + Math.random() * 1.2;
    const rx = Math.random() * Math.PI;
    const ry = Math.random() * Math.PI;
    const rz = Math.random() * Math.PI;
    _p.set(p.x, 0.02, p.z);
    _q.setFromEuler(new THREE.Euler(rx, ry, rz));
    _s.set(s, s, s);
    _m4.compose(_p, _q, _s);
    rockInst.setMatrixAt(i, _m4);
  }
  rockInst.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < cfg.flowerCount; i++) {
    const p = randomPosInBounds();
    // Stem ~0.24 height
    _p.set(p.x, 0.12, p.z);
    _q.set(0, 0, 0, 1);
    _s.set(1, 0.24, 1);
    _m4.compose(_p, _q, _s);
    stemInst.setMatrixAt(i, _m4);
    // Petal ~0.08 radius sphere at y ~0.28
    _p.set(p.x, 0.28, p.z);
    _q.set(0, 0, 0, 1);
    _s.set(0.08, 0.08, 0.08);
    _m4.compose(_p, _q, _s);
    petalInst.setMatrixAt(i, _m4);
  }
  stemInst.instanceMatrix.needsUpdate = true;
  petalInst.instanceMatrix.needsUpdate = true;

  root.add(trunkInst, foliageInst, rockInst, stemInst, petalInst);

  // Forest clusters merged into instanced scatter for performance (draw call reduction).

  // (removed old straight cross roads; replaced with curved, connected network below)

  // ----------------
  // Village generator (simple clustering of houses)
  function generateVillage(center = new THREE.Vector3(0, 0, 0), count = 6, radius = 8) {
    const vgroup = new THREE.Group();
    vgroup.name = "village";
    for (let i = 0; i < count; i++) {
      try {
        const house = createHouse();
        const ang = Math.random() * Math.PI * 2;
        const r = radius * (0.3 + Math.random() * 0.9);
        house.position.set(center.x + Math.cos(ang) * r, 0, center.z + Math.sin(ang) * r);
        house.rotation.y = Math.random() * Math.PI * 2;
        // small variant: scale slightly
        const sc = 0.9 + Math.random() * 0.5;
        house.scale.setScalar(sc);

        // Add a warm lantern and small emissive bulb near each house to match village ambiance
        let __hasLanternLight = false;
        if (__houseLights !== "none" && acquireLight(1)) {
          __hasLanternLight = true;
          const intensity = __houseLights === "dim" ? 0.4 : 0.9;
          const dist = __houseLights === "dim" ? 4 : 6;
          const decay = 2;
          const lanternLight = new THREE.PointLight(0xcaa36b, intensity, dist, decay);
          lanternLight.position.set(0.6, 0.8, 0.6);
          lanternLight.castShadow = false;
          house.add(lanternLight);
        }

        const lanternBulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshStandardMaterial({ emissive: 0xcaa36b, emissiveIntensity: (__houseLights === "none" ? 0.9 : 1.2), color: 0x663300, roughness: 0.7 })
        );
        lanternBulb.position.set(0.6, 0.8, 0.6);
        house.add(lanternBulb);
        if (typeof __hasLanternLight !== "undefined" && !__hasLanternLight) {
          lanternBulb.material.emissiveIntensity = (__houseLights === "none" ? 1.2 : 1.4);
        }

        // small ground decoration near house entrance
        const peb = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.22, 0),
          new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.95 })
        );
        peb.position.set(0.9, 0.02, 0.2);
        peb.scale.setScalar(0.8 + Math.random() * 0.6);
        house.add(peb);

        vgroup.add(house);
      } catch (e) {
        // fallback safety
      }
    }
    root.add(vgroup);
    return vgroup;
  }

  // create villages and collect their centers so structures avoid them
  const villages = [];
  const villageCenters = [];
  for (let i = 0; i < cfg.villageCount; i++) {
    const c = seededRandomPosInBounds();
    villages.push(generateVillage(c, 4 + Math.floor(Math.random() * 6), cfg.villageRadius));
    villageCenters.push(c);
  }

  if (!WORLD?.chunking?.enabled) {
    try {
      placeStructures({
        rng,
        seededRange,
        root,
        villageCenters,
        water,
        cfg,
        __q,
        acquireLight,
        createGreekTemple,
        createVilla,
        createGreekColumn,
        createCypressTree,
        createOliveTree,
        createGreekStatue,
        createObelisk,
        pickPos: (minVillage = 12, minWater = 10, minBetween = 10, maxTries = 60) => {
          let tries = maxTries;
          while (tries-- > 0) {
            const p = seededRandomPosInBounds();
            if (p) return p;
          }
          return seededRandomPosInBounds();
        }
      });
    } catch (e) {
      console.warn("Extra structures generation failed", e);
    }
  }

  // (structures were moved to src/environment/structures.js - handled above)

  // ----------------
  // Water pool (optional)
  // ----------------
  if (cfg.enableWater) {
    const geo = new THREE.CircleGeometry(cfg.waterRadius, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7ec1c7,
      metalness: 0.12,
      roughness: 0.45,
      transparent: true,
      opacity: 0.9,
    });
    water = new THREE.Mesh(geo, mat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.02, -Math.max(20, WORLD.groundSize * 0.15));
    water.receiveShadow = false;
    root.add(water);
  }

  // ----------------
  // Rain particle system (toggleable)
  // ----------------
  const rain = {
    enabled: cfg.enableRain,
    points: null,
    velocities: null,
  };

  function createRain(count = cfg.rainCount) {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * half;
      const y = 10 + Math.random() * 20;
      const z = (Math.random() * 2 - 1) * half;
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities[i] = 10 + Math.random() * 10;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x7ec1c7, size: 0.08, transparent: true, opacity: 0.8 });
    const pts = new THREE.Points(geom, mat);
    pts.name = "rain";
    root.add(pts);
    rain.points = pts;
    rain.velocities = velocities;
  }

  if (cfg.enableRain) createRain(cfg.rainCount);

  // ----------------
  // Update loop (animate water & rain)
  // ----------------
  let __lastSwayT = 0;
  // Rain adaptivity and stride
  const __baseRainCount = cfg.rainCount;
  let __rainStride = (__q === "high" ? 1 : (__q === "medium" ? 2 : 3));
  let __rainFrame = 0;
  let __rainDownscaled = false;
  let __lastRainAdaptT = 0;

  function update(t, dt) {
    // simple water shimmer: slightly change rotation/scale or material roughness
    if (water && water.material) {
      const m = water.material;
      m.emissive = m.emissive || new THREE.Color(0x8b0000);
      m.emissiveIntensity = 0.02 + Math.sin(t * 0.8) * 0.02;
      // gentle animated offset if material map exists
      if (m.map) {
        m.map.offset.x = Math.sin(t * 0.12) * 0.0015;
        m.map.offset.y = Math.cos(t * 0.09) * 0.0015;
      }
    }

    // Instanced foliage sway: update a subset per frame based on quality
    const doSway = (__instSwayStride > 0) && ((__q === "high") || (__q === "medium" && (t - __lastSwayT) > 0.12));
    if (doSway && foliageInst && Array.isArray(treeBases)) {
      __lastSwayT = t;
      const startIdx = __swayTick % __instSwayStride;
      for (let i = startIdx; i < treeBases.length; i += __instSwayStride) {
        const b = treeBases[i]; if (!b) continue;
        const zRot = Math.sin(t + b.swayPhase) * b.swayAmp;
        // Recompose foliage matrix with extra Z rotation while preserving Y orientation
        _p.set(b.pos.x, b.trunkH + b.foliageH * 0.5, b.pos.z);
        _q.setFromEuler(new THREE.Euler(zRot, b.rotY, 0));
        _s.set(b.foliageXZ, b.foliageH, b.foliageXZ);
        _m4.compose(_p, _q, _s);
        foliageInst.setMatrixAt(i, _m4);
      }
      foliageInst.instanceMatrix.needsUpdate = true;
      __swayTick++;
    }

    if (rain.enabled && rain.points) {
      __rainFrame++;
      if ((__rainFrame % __rainStride) === 0) {
        const pos = rain.points.geometry.attributes.position.array;
        for (let i = 0; i < rain.velocities.length; i++) {
          pos[i * 3 + 1] -= rain.velocities[i] * dt;
          if (pos[i * 3 + 1] < 0.2) {
            pos[i * 3 + 0] = (Math.random() * 2 - 1) * half;
            pos[i * 3 + 1] = 12 + Math.random() * 20;
            pos[i * 3 + 2] = (Math.random() * 2 - 1) * half;
          }
        }
        rain.points.geometry.attributes.position.needsUpdate = true;
      }
      // Adapt rain density/stride based on FPS (throttled ~1.2s)
      const nowMs = performance.now();
      if (nowMs - __lastRainAdaptT > 1200) {
        __lastRainAdaptT = nowMs;
        try {
          const fps = (window.__perfMetrics && window.__perfMetrics.fps) || 60;
          if (!__rainDownscaled && fps < 35) {
            setRainCount(Math.floor(__baseRainCount * 0.6));
            __rainDownscaled = true;
            __rainStride = Math.min(3, __rainStride + 1);
          } else if (__rainDownscaled && fps > 70) {
            setRainCount(__baseRainCount);
            __rainDownscaled = false;
            __rainStride = (__q === "high" ? 1 : (__q === "medium" ? 2 : 3));
          }
        } catch (_) {}
      }
    }
  }

  function toggleRain(enabled) {
    rain.enabled = !!enabled;
    if (rain.enabled && !rain.points) createRain(cfg.rainCount);
    if (rain.points) rain.points.visible = rain.enabled;
  }

  // Adjust rain particle count live (recreate points)
  function setRainCount(count) {
    const n = Math.max(0, Math.floor(count || 0));
    cfg.rainCount = n;
    // Remove old points if any
    if (rain.points) {
      try { root.remove(rain.points); } catch (_) {}
      try { rain.points.geometry.dispose?.(); } catch (_) {}
      rain.points = null;
      rain.velocities = null;
    }
    if (rain.enabled && n > 0) {
      createRain(n);
      if (rain.points) rain.points.visible = true;
    }
  }

  // Convenience levels: 0=low, 1=medium, 2=high
  function setRainLevel(level) {
    const lvl = Math.max(0, Math.min(2, parseInt(level, 10) || 0));
    const map = [300, 900, 1800];
    setRainCount(map[lvl]);
  }

  // Expose a small API and return
  return {
    root,
    update,
    toggleRain,
    setRainCount,
    setRainLevel,
    addVillage: (center, n, r) => generateVillage(center, n, r),
  };
}
