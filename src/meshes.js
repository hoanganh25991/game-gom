import * as THREE from "../vendor/three/build/three.module.js";
import { GLTFLoader } from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import { COLOR } from "./constants.js";
import { HERO_MODEL_URL } from "./config.js";

 // Creates the GoM character mesh (placeholder geometry with optional GLTF replacement if ?model=URL).
 // Note: This function does NOT add the mesh to the scene; caller should add it.
export function createGoTMesh() {
  const root = new THREE.Group();

  // Torso
  const torsoGeo = new THREE.CapsuleGeometry(0.75, 1.25, 6, 14);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: COLOR.midEarth,
    emissive: 0x3c3f46,
    metalness: 0.2,
    roughness: 0.55,
  });
  const body = new THREE.Mesh(torsoGeo, torsoMat);
  body.castShadow = true;

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xfff5e6, emissive: 0x3c3f46, roughness: 0.45 })
  );
  head.position.y = 1.75;
  body.add(head);

  // Beard (cone)
  const beard = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.7, 16),
    new THREE.MeshStandardMaterial({ color: 0xfff5e6, emissive: 0x4a3f35, roughness: 0.4 })
  );
  beard.position.set(0, 1.35, 0.28);
  beard.rotation.x = Math.PI * 0.05;
  body.add(beard);

  // Laurel crown (thin torus)
  const crown = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.06, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xfff5e6, emissive: 0x6a8f4e, metalness: 0.4, roughness: 0.3 })
  );
  crown.position.y = 1.78;
  crown.rotation.x = Math.PI / 2;
  body.add(crown);

  // Shoulder pads
  const shoulderMat = new THREE.MeshStandardMaterial({ color: COLOR.darkEarth, emissive: 0x3c3f46, metalness: 0.35, roughness: 0.45 });
  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), shoulderMat);
  shoulderL.position.set(-0.7, 1.45, 0.1);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 0.7;
  body.add(shoulderL, shoulderR);

  // Cloak (simple plane)
  const cloak = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.4, 1, 3),
    new THREE.MeshStandardMaterial({ color: 0x23221f, emissive: 0x2d2a26, side: THREE.DoubleSide, roughness: 0.8 })
  );
  cloak.position.set(0, 1.2, -0.45);
  cloak.rotation.x = Math.PI;
  body.add(cloak);

  // Right hand earth orb (no weapon)
  const arm = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.14, 0.6, 6, 10),
    new THREE.MeshStandardMaterial({ color: COLOR.midEarth, emissive: 0x3c3f46, roughness: 0.55 })
  );
  arm.position.set(0.65, 1.3, 0.15);
  arm.rotation.z = -Math.PI * 0.25;
  // add arms to root so they remain visible in first-person (we'll hide torso separately)
  root.add(arm);

  const handAnchor = new THREE.Object3D();
  handAnchor.position.set(0.85, 1.15, 0.25);
  root.add(handAnchor);

  // left hand anchor for first-person centering (no VFX by default)
  const leftHandAnchor = new THREE.Object3D();
  leftHandAnchor.position.set(-0.85, 1.15, 0.25);
  root.add(leftHandAnchor);

  // Left hand earth orb + light (for FP two-hands effect)
  const leftFireOrb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({ color: COLOR.earth, emissive: 0x6a8f4e, emissiveIntensity: 1.2, roughness: 0.15, metalness: 0.1 })
  );
  leftHandAnchor.add(leftFireOrb);
  const leftHandLight = new THREE.PointLight(0x7ec1c7, 1.0, 18, 2);
  leftHandAnchor.add(leftHandLight);

  const fireOrb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({ color: COLOR.earth, emissive: 0x6a8f4e, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.1 })
  );
  handAnchor.add(fireOrb);

  const handLight = new THREE.PointLight(0x7ec1c7, 1.3, 20, 2);
  handAnchor.add(handLight);
  // expose for idle pulse control
  root.userData.handLight = handLight;
  root.userData.fireOrb = fireOrb;
  // expose left-hand VFX too
  root.userData.leftHandLight = leftHandLight;
  root.userData.leftFireOrb = leftFireOrb;

  // Left arm (symmetric)
  const armL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.14, 0.6, 6, 10),
    new THREE.MeshStandardMaterial({ color: COLOR.midEarth, emissive: 0x3c3f46, roughness: 0.55 })
  );
  armL.position.set(-0.65, 1.3, 0.15);
  armL.rotation.z = Math.PI * 0.25;
  root.add(armL);
  // expose arms for FP gesture animation
  root.userData.rightArm = arm;
  root.userData.leftArm = armL;

  // Biceps bulges
  const bicepR = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 14),
    new THREE.MeshStandardMaterial({ color: COLOR.midEarth, emissive: 0x3c3f46, roughness: 0.55 })
  );
  bicepR.position.set(0.55, 1.45, 0.12);
  const bicepL = bicepR.clone();
  bicepL.position.x = -0.55;
  root.add(bicepR, bicepL);

  // Tunic (waist cloth)
  const tunic = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.9, 1.0, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: COLOR.midEarth, emissive: 0x3c3f46, metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide })
  );
  tunic.position.set(0, 0.6, 0);
  body.add(tunic);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.06, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0xcaa36b, emissive: 0x6a8f4e, metalness: 0.5, roughness: 0.2 })
  );
  belt.position.y = 1.0;
  body.add(belt);

  // Hair cap
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3a2313, emissive: 0x23221f, roughness: 0.65 })
  );
  hairCap.position.set(0, 0.18, 0); // relative to head
  head.add(hairCap);

  // Small ponytail
  const pony = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a2313, emissive: 0x23221f })
  );
  pony.position.set(0, -0.2, -0.25);
  pony.rotation.x = Math.PI * 0.9;
  head.add(pony);

  // expose hand anchors for VFX and first-person view
  root.userData = root.userData || {};
  root.userData.handAnchor = handAnchor;
  root.userData.leftHandAnchor = leftHandAnchor;
  // parts to hide when entering first-person so only two hands are visible
  root.userData.fpHide = [
    body,
    head,
    cloak,
    tunic,
    belt,
    shoulderL,
    shoulderR,
    bicepR,
    bicepL,
    beard,
    crown,
    hairCap,
    pony
  ];

  // Assemble placeholder into root
  root.add(body);

  // Optional: load external GoM GLTF model (pass ?model=URL)
  if (HERO_MODEL_URL) {
    const loader = new GLTFLoader();
    loader.load(
      HERO_MODEL_URL,
      (gltf) => {
        const model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (model) {
          model.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          // Normalize model height to ~2.2 world units
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const targetHeight = 2.2;
          const s = size.y > 0 ? targetHeight / size.y : 1;
          model.scale.setScalar(s);
          model.position.set(0, 0, 0);
          root.add(model);
          // Hide placeholder body
          body.visible = false;
        }
      },
      undefined,
      (err) => {
        console.warn("Failed to load HERO_MODEL_URL:", HERO_MODEL_URL, err);
      }
    );
  }

  root.position.set(10, 1.1, 10);
  return root;
}

 // Enemy body with single eye detail
 export function createEnemyMesh(options = {}) {
   const color = options.color !== undefined ? options.color : COLOR.enemyDark;
   const eyeEmissive = options.eyeEmissive !== undefined ? options.eyeEmissive : 0x3c3f46;
 
   const geo = new THREE.CapsuleGeometry(0.6, 0.8, 4, 10);
   const mat = new THREE.MeshStandardMaterial({ color: color, emissive: 0x23221f, roughness: 0.7 });
   const mesh = new THREE.Mesh(geo, mat);
   mesh.castShadow = true;

   const eye = new THREE.Mesh(
     new THREE.SphereGeometry(0.18, 12, 12),
     new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: eyeEmissive })
   );
   eye.position.set(0, 1.2, 0.45);
   mesh.add(eye);

   return mesh;
 }

// Billboard HP bar parts to attach to enemy mesh
export function createBillboardHPBar() {
  const container = new THREE.Group();
  container.position.set(0, 2.2, 0);

  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.6 })
  );
  container.add(bg);

  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 0.1),
    new THREE.MeshBasicMaterial({ color: COLOR.hp })
  );
  fill.position.z = 0.001;
  container.add(fill);

  return { container, fill };
}

// Portal geometry; returns group and ring so caller can animate ring rotation
export function createPortalMesh(color = COLOR.portal) {
  // Outer ring (vertical gate)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.15, 16, 40),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.1,
      metalness: 0.35,
      roughness: 0.25
    })
  );

  // Inner swirl (rotating disc to feel like a gate)
  const swirl = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  swirl.position.z = 0.02;

  // Soft glow backing
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  glow.position.z = -0.02;

  // Base pedestal
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.1, 0.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x0e1e38, metalness: 0.3, roughness: 0.6 })
  );
  base.position.y = -1.1;

  // Portal group
  const group = new THREE.Group();
  group.add(ring);
  group.add(glow);
  group.add(swirl);
  group.add(base);

  // Decorative point light for aura
  const light = new THREE.PointLight(color, 0.9, 12, 2);
  light.position.set(0, 0.4, 0);
  group.add(light);

  // Expose parts for animation
  return { group, ring, swirl, glow };
}

// Simple house composed of a base and roof
export function createHouse() {
  const house = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x6f7b84, metalness: 0.6, roughness: 0.35 })
  );
  base.position.y = 1.5;
  house.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0xB87333, metalness: 0.6, roughness: 0.4 })
  );
  roof.position.y = 4.1;
  roof.rotation.y = Math.PI / 4;
  house.add(roof);

  return house;
}

// Hero overhead HP/MP dual bars (billboard). Colors use COLOR.hp and COLOR.mp.
export function createHeroOverheadBars() {
  const container = new THREE.Group();
  container.position.set(0, 2.6, 0);

  // Backboard
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.26),
    new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.5 })
  );
  container.add(bg);

  // HP (top)
  const hpFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.74, 0.1),
    new THREE.MeshBasicMaterial({ color: COLOR.hp })
  );
  hpFill.position.set(0, 0.06, 0.001);
  container.add(hpFill);

  // MP (bottom)
  const mpFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.74, 0.1),
    new THREE.MeshBasicMaterial({ color: COLOR.mp })
  );
  mpFill.position.set(0, -0.06, 0.001);
  container.add(mpFill);

  return { container, hpFill, mpFill };
}

// ====== Greek-inspired structures and varied nature props ======

export function createGreekColumn(options = {}) {
  const {
    height = 5,
    radius = 0.28,
    order = "doric", // "doric" | "ionic" | "corinthian" (visual differences are subtle here)
    color = 0x6f7b84, // Iron gray for metal theme
    roughness = 0.35,
    metalness = 0.5,
  } = options;

  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness, roughness });

  // Stylobate/plinth
  const plinthH = Math.max(0.14, height * 0.03);
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 2.2, plinthH, radius * 2.2),
    mat
  );
  plinth.position.y = plinthH / 2;
  g.add(plinth);

  // Shaft
  const shaftH = height * 0.8;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.9, radius * 0.98, shaftH, 20, 1),
    mat
  );
  shaft.position.y = plinthH + shaftH / 2;
  g.add(shaft);

  // Capital
  const capH = Math.max(0.12, height * 0.06);
  const echinus = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.15, radius * 1.1, capH * 0.55, 18, 1),
    mat
  );
  echinus.position.y = plinthH + shaftH + (capH * 0.275);
  g.add(echinus);

  const abacus = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 2.0, capH * 0.5, radius * 2.0),
    mat
  );
  abacus.position.y = plinthH + shaftH + capH * 0.8;
  g.add(abacus);

  // Simple hint for different orders (tiny top ornament)
  if (order === "ionic" || order === "corinthian") {
    const ornament = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.55, capH * 0.12, 6, 16),
      mat
    );
    ornament.position.y = abacus.position.y + capH * 0.35;
    ornament.rotation.x = Math.PI / 2;
    g.add(ornament);
  }

  return g;
}

export function createGreekTemple(options = {}) {
  const {
    cols = 6,
    rows = 10,
    colSpacingX = 2.4,
    colSpacingZ = 2.6,
    columnHeight = 5.6,
    baseMargin = 0.9,
    color = 0x6f7b84, // Iron gray for metal theme
  } = options;

  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35 });

  const width = (cols - 1) * colSpacingX;
  const depth = (rows - 1) * colSpacingZ;

  // Stylobate (base platform)
  const baseH = 0.5;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width + baseMargin * 2.2, baseH, depth + baseMargin * 2.2),
    mat
  );
  base.position.y = baseH / 2;
  g.add(base);

  // Perimeter columns
  const addCol = (x, z) => {
    const c = createGreekColumn({ height: columnHeight, radius: 0.3 + Math.random() * 0.04 });
    c.position.set(x, baseH, z);
    g.add(c);
  };

  const x0 = -width / 2;
  const z0 = -depth / 2;

  for (let i = 0; i < cols; i++) {
    const x = x0 + i * colSpacingX;
    addCol(x, z0);
    addCol(x, z0 + depth);
  }
  for (let j = 1; j < rows - 1; j++) {
    const z = z0 + j * colSpacingZ;
    addCol(x0, z);
    addCol(x0 + width, z);
  }

  // Entablature (flat beam)
  const beamH = 0.35;
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(width + baseMargin * 1.6, beamH, depth + baseMargin * 1.6),
    mat
  );
  beam.position.y = baseH + columnHeight + beamH / 2;
  g.add(beam);

  // Simple flat roof slab
  const roofH = 0.28;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + baseMargin * 2.0, roofH, depth + baseMargin * 2.0),
    mat
  );
  roof.position.y = beam.position.y + beamH / 2 + roofH / 2;
  g.add(roof);

  // Front steps hint
  const steps = new THREE.Mesh(
    new THREE.BoxGeometry((width + baseMargin * 2.2) * 0.7, baseH * 0.4, baseMargin * 1.2),
    mat
  );
  steps.position.set(0, baseH * 0.2, z0 - baseMargin * 0.6);
  g.add(steps);

  return g;
}

export function createVilla(options = {}) {
  const {
    width = 12,
    depth = 8,
    height = 4,
    colorBase = 0x6f7b84,
    colorRoof = 0xB87333,
  } = options;

  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: colorBase, metalness: 0.55, roughness: 0.4 })
  );
  base.position.y = height / 2;
  g.add(base);

  // Pyramid-like roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.6, height * 0.9, 4),
    new THREE.MeshStandardMaterial({ color: colorRoof, metalness: 0.6, roughness: 0.4 })
  );
  roof.position.y = height + (height * 0.45);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // Small porch with columns
  const porchDepth = Math.min(3.2, depth * 0.45);
  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.6, 0.3, porchDepth),
    new THREE.MeshStandardMaterial({ color: colorBase, metalness: 0.5, roughness: 0.5 })
  );
  porch.position.set(0, 0.2, depth / 2 + porchDepth * 0.5 - 0.15);
  g.add(porch);

  const colOffX = width * 0.22;
  const colZ = depth / 2 + porchDepth * 0.25;
  const c1 = createGreekColumn({ height: height * 0.85, radius: 0.18, color: 0xf4eee8 });
  c1.position.set(-colOffX, 0.3, colZ);
  const c2 = c1.clone();
  c2.position.x = colOffX;
  g.add(c1, c2);

  return g;
}

export function createCypressTree() {
  const g = new THREE.Group();

  const trunkH = 1.6 + Math.random() * 0.8;
    const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3f35 })
  );
  trunk.position.y = trunkH / 2;
  g.add(trunk);

  const levels = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < levels; i++) {
    const h = 1.0 + (levels - i) * 0.5;
      const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.4 + (levels - i) * 0.18, h, 8),
      new THREE.MeshStandardMaterial({ color: 0x6a8f4e }) // Mossy green foliage for earth theme
    );
    cone.position.y = trunkH + (i * h * 0.55);
    g.add(cone);
  }

  return g;
}

export function createOliveTree() {
  const g = new THREE.Group();

  const trunkH = 1.3 + Math.random() * 0.7;
    const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, trunkH, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a3f35 }) // Earthy trunk
  );
  trunk.position.y = trunkH / 2;
  g.add(trunk);

  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x6a8f4e }); // Mossy canopy for earth theme
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), canopyMat);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), canopyMat);
  const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), canopyMat);
  s1.position.set(0.0, trunkH + 0.2, 0.0);
  s2.position.set(-0.45, trunkH + 0.1, 0.2);
  s3.position.set(0.4, trunkH + 0.0, -0.25);
  g.add(s1, s2, s3);

  return g;
}

export function createGreekStatue(options = {}) {
  const {
    color = 0xB4B4C8 // Brushed steel for metal theme
  } = options;

  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.4 });
  const g = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.4, 1.2),
    mat
  );
  plinth.position.y = 0.2;
  g.add(plinth);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 1.6, 16),
    mat
  );
  body.position.y = 0.2 + 0.8;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), mat);
  head.position.y = body.position.y + 0.95;
  g.add(head);

  // Arms (simple hints)
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 10), mat);
  armL.position.set(-0.45, body.position.y + 0.3, 0);
  armL.rotation.z = Math.PI / 6;
  const armR = armL.clone();
  armR.position.x = 0.45;
  armR.rotation.z = -Math.PI / 6;
  g.add(armL, armR);

  return g;
}

export function createObelisk(options = {}) {
  const {
    height = 6,
    baseSize = 1.2,
    color = 0xB4B4C8 // Brushed steel for metal theme
  } = options;

  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35 });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(baseSize, 0.35, baseSize),
    mat
  );
  base.position.y = 0.175;
  g.add(base);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.6, height, 4),
    mat
  );
  shaft.position.y = 0.35 + height / 2;
  g.add(shaft);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.6, 4),
    mat
  );
  tip.position.y = 0.35 + height + 0.3;
  g.add(tip);

  return g;
}
