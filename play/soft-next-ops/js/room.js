/**
 * Hammer Studio — Soft Next ops room (Soft PASS moodboard v3).
 * Cool gallery palette · Soft PASS war-room board · lane avatars idle+walk.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  wall: 0xc8d0d8,
  wallSide: 0xbfc8d2,
  floor: 0xd6dce4,
  wood: 0x8a949e,
  woodLight: 0x9aa4ae,
  laneMat: 0x6ba3c9,
  laneGlow: 0x7ec8e8,
  paper: 0xeef1f4,
  waitingGlow: 0xffd966,
  pick: 0xa7f3d0,
  softPass: 0xd1d5db,
  waitingGo: 0xc7d2fe,
  tip: 0xa5b4fc,
  smoke: 0xa7f3d0,
  done: 0xd1d5db,
  art: 0xffd54f,
  dev: 0xd946b5,
  tester: 0xf4a698,
  cto: 0x67c4e8,
  assistant: 0x9caf88,
  cfo: 0x8b7ec8,
  governess: 0xe8c547,
  mainBot: 0x2a2a2a,
};

const STATIONS = [
  { id: "pick", label: "Pick", color: COLORS.pick, icon: "clipboard" },
  { id: "soft-pass", label: "Soft PASS", color: COLORS.softPass, icon: "stamp" },
  { id: "waiting-go", label: "Waiting Go", color: COLORS.waitingGo, icon: "bulb", active: true },
  { id: "tip", label: "Tip", color: COLORS.tip, icon: "crate" },
  { id: "smoke", label: "Smoke", color: COLORS.smoke, icon: "flask" },
  { id: "done", label: "Done", color: COLORS.done, icon: "ribbon" },
];

const LANE_DESKS = [
  { role: "Art", sheet: "art", x: -2.2, z: 0.6, phase: 0 },
  { role: "Developer", sheet: "developer", x: -2.2, z: -1.4, phase: 0.7 },
  { role: "Tester · Marketing", sheet: "tester", x: 2.2, z: 0.6, phase: 1.4 },
  { role: "CTO", sheet: "cto", x: 2.2, z: -1.4, phase: 2.1 },
];

const OFF_LANE = [
  { role: "Assistant · Admin", shape: "square", color: COLORS.assistant, x: 6.2, z: 1.2 },
  { role: "CFO · Expense Tracker", shape: "teardrop", color: COLORS.cfo, x: 7.4, z: 0.2 },
  { role: "Governess", shape: "star", color: COLORS.governess, x: 6.2, z: -0.8 },
  { role: "Main Bot · Admin", shape: "blob", color: COLORS.mainBot, x: 7.4, z: -1.6 },
];

const SHEET_PATHS = {
  art: "assets/characters/art-walk-idle-sheet.png",
  developer: "assets/characters/developer-walk-idle-sheet.png",
  tester: "assets/characters/tester-walk-idle-sheet.png",
  cto: "assets/characters/cto-walk-idle-sheet.png",
};

const FRAME_COLS = 4;
const FRAME_ASPECT = 320 / 720;

const view = document.getElementById("view");
const loadingEl = document.getElementById("loading");

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.wall);
scene.fog = new THREE.Fog(COLORS.wall, 28, 52);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
camera.position.set(0, 7.5, 13.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
view.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.2, -1);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minPolarAngle = Math.PI * 0.12;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

scene.add(new THREE.HemisphereLight(0xe8eef4, 0x8898a8, 0.92));
const sun = new THREE.DirectionalLight(0xf0f4f8, 0.72);
sun.position.set(4, 14, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -14;
scene.add(sun);

const loungeLight = new THREE.PointLight(0xc8dce8, 0.32, 12);
loungeLight.position.set(7, 4, 0);
scene.add(loungeLight);

const world = new THREE.Group();
scene.add(world);

const glowMeshes = [];
const laneAnimators = [];
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
    ...opts,
  });
}

function makeTextTexture(text, { width = 512, height = 128, fontSize = 48, fill = "#2a3440", bg = null } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = fill;
  ctx.font = `bold ${fontSize}px Trebuchet MS, Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function textPlane(text, w, h, opts = {}) {
  const tex = makeTextTexture(text, opts);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  return mesh;
}

function frameSlice(baseTex, col) {
  const clone = baseTex.clone();
  clone.wrapS = THREE.ClampToEdgeWrapping;
  clone.wrapT = THREE.ClampToEdgeWrapping;
  clone.repeat.set(1 / FRAME_COLS, 1);
  clone.offset.set(col / FRAME_COLS, 0);
  clone.needsUpdate = true;
  return clone;
}

function loadSheet(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, resolve, undefined, reject);
  });
}

function makeLaneAnimator(baseTex, homeX, homeZ, phaseOffset) {
  const frames = [0, 1, 2, 3].map((i) => frameSlice(baseTex, i));
  const material = new THREE.SpriteMaterial({
    map: frames[0],
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const height = 1.42;
  sprite.scale.set(height * FRAME_ASPECT, height, 1);
  sprite.center.set(0.5, 0);
  sprite.position.set(homeX, 0.98, homeZ);

  world.add(sprite);

  return {
    sprite,
    frames,
    homeX,
    homeZ,
    x: homeX,
    z: homeZ,
    phaseOffset,
    mode: "idle",
    frame: 0,
    frameTimer: 0,
    moveTimer: phaseOffset,
  };
}

function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 22), mat(COLORS.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  const wallMat = mat(COLORS.wall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), wallMat);
  back.position.set(0, 5, -11);
  world.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-14, 5, 0);
  world.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), mat(COLORS.wallSide));
  right.rotation.y = -Math.PI / 2;
  right.position.set(14, 5, 0);
  world.add(right);

  const title = textPlane("Hammer Studio", 8, 1.4, { fontSize: 72, width: 1024, height: 180 });
  title.position.set(0, 8.2, -10.92);
  world.add(title);
}

function buildLaneMat() {
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.8), mat(COLORS.laneMat));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(0, 0.02, -0.4);
  lane.receiveShadow = true;
  world.add(lane);

  const glowMat = mat(COLORS.laneGlow, { emissive: COLORS.laneGlow, emissiveIntensity: 0.45 });
  const stripW = 7.4;
  const stripD = 0.12;
  for (const [x, z, rw, rd] of [
    [0, 2.0, stripW, stripD],
    [0, -2.8, stripW, stripD],
    [-3.5, -0.4, stripD, 4.6],
    [3.5, -0.4, stripD, 4.6],
  ]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), glowMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.03, z);
    world.add(strip);
    glowMeshes.push(strip);
  }
}

function addCardIcon(card, icon, cardColor) {
  const g = new THREE.Group();
  g.position.set(0, 0.15, 0.14);
  const accent = mat(0x5a6470);
  switch (icon) {
    case "clipboard": {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.06), mat(COLORS.paper));
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), accent);
      clip.position.y = 0.26;
      g.add(board, clip);
      break;
    }
    case "stamp": {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), mat(0x6b8f5e));
      handle.position.y = 0.12;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 16), mat(0x4a7040));
      g.add(handle, pad);
      break;
    }
    case "bulb": {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        mat(COLORS.waitingGlow, { emissive: COLORS.waitingGlow, emissiveIntensity: 0.65 }),
      );
      bulb.position.y = 0.22;
      g.add(bulb);
      break;
    }
    case "crate": {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.28), mat(0xb8956a));
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 3), mat(0x5b8fd4));
      arrow.rotation.z = -Math.PI / 2;
      arrow.position.set(0.22, 0, 0);
      g.add(box, arrow);
      break;
    }
    case "flask": {
      const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.36, 10), mat(cardColor));
      flask.position.y = -0.02;
      const steam = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        mat(0xeef1f4, { transparent: true, opacity: 0.75 }),
      );
      steam.position.y = 0.28;
      steam.scale.set(1.2, 0.7, 1);
      g.add(flask, steam);
      break;
    }
    case "ribbon": {
      const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 20), mat(0x6b8f5e));
      const check = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI * 1.2),
        mat(0xeef1f4, { emissive: 0xcccccc, emissiveIntensity: 0.2 }),
      );
      check.rotation.z = Math.PI * 0.15;
      g.add(medal, check);
      break;
    }
    default:
      break;
  }
  card.add(g);
}

function buildWarBoard() {
  const board = new THREE.Group();
  board.position.set(0, 5.2, -10.5);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(11.2, 3.4, 0.2), mat(COLORS.wood));
  frame.castShadow = true;
  board.add(frame);

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 2.8), mat(COLORS.paper));
  surface.position.z = 0.11;
  board.add(surface);

  const header = textPlane("Soft PASS", 2.4, 0.45, { fontSize: 40, width: 480, height: 96, fill: "#3a4550" });
  header.position.set(0, 1.05, 0.12);
  board.add(header);

  const cardW = 1.45;
  const startX = -((STATIONS.length - 1) * (cardW + 0.18)) / 2;
  STATIONS.forEach((st, i) => {
    const card = new THREE.Group();
    card.position.set(startX + i * (cardW + 0.18), -0.15, 0.15);

    const body = new THREE.Mesh(new THREE.BoxGeometry(cardW, 1.35, 0.12), mat(st.color));
    body.castShadow = true;
    card.add(body);

    addCardIcon(card, st.icon, st.color);

    const label = textPlane(st.label, cardW * 0.92, 0.32, {
      fontSize: st.label.length > 10 ? 22 : 28,
      width: 256,
      height: 64,
      fill: "#3a4550",
    });
    label.position.set(0, -0.72, 0.08);
    card.add(label);

    if (st.active) {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(cardW + 0.28, 1.55),
        mat(COLORS.waitingGlow, {
          emissive: COLORS.waitingGlow,
          emissiveIntensity: 0.85,
          transparent: true,
          opacity: 0.32,
        }),
      );
      glow.position.z = -0.08;
      card.add(glow);
      glowMeshes.push(glow);

      const waitLight = new THREE.PointLight(0xffd966, 0.95, 2.8);
      waitLight.position.set(0, 0.3, 0.45);
      card.add(waitLight);

      const pack = new THREE.Group();
      pack.position.set(0.35, -0.35, 0.22);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.32), mat(COLORS.woodLight));
      box.castShadow = true;
      pack.add(box);
      const packLabel = textPlane("Soft PASS", 0.38, 0.18, { fontSize: 18, width: 200, height: 48, fill: "#3a4550" });
      packLabel.position.set(0, 0.01, 0.17);
      pack.add(packLabel);
      card.add(pack);
    }

    board.add(card);
  });

  world.add(board);
}

function addBotFace(parent, scale = 1) {
  const face = new THREE.Group();
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.55 * scale, 0.32 * scale, 0.06 * scale),
    mat(0x1a1a1a, { emissive: 0x111111, emissiveIntensity: 0.3 }),
  );
  screen.position.y = 0.12 * scale;
  face.add(screen);

  const eyeMat = mat(0x7dd3fc, { emissive: 0x5ec8f0, emissiveIntensity: 0.8 });
  for (const ex of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 8, 8), eyeMat);
    eye.position.set(ex * scale, 0.14 * scale, 0.04 * scale);
    face.add(eye);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.08 * scale, 0.012 * scale, 6, 12, Math.PI),
    eyeMat,
  );
  smile.rotation.x = Math.PI;
  smile.position.set(0, 0.04 * scale, 0.04 * scale);
  face.add(smile);

  parent.add(face);
  return face;
}

function shapeMesh(shape, color) {
  const g = new THREE.Group();
  let body;
  const m = mat(color);
  switch (shape) {
    case "square":
      body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.4), m);
      break;
    case "teardrop":
      body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), m);
      body.scale.set(0.85, 1.15, 0.75);
      break;
    case "star": {
      const star = new THREE.Shape();
      const outer = 0.42;
      const inner = 0.18;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) star.moveTo(px, py);
        else star.lineTo(px, py);
      }
      star.closePath();
      body = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 0.28, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), m);
      break;
    }
    case "blob":
      body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), mat(color));
      body.scale.set(1.1, 0.75, 0.95);
      break;
    default:
      body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), m);
  }
  if (body) {
    body.castShadow = true;
    g.add(body);
  }
  addBotFace(g, 0.9);
  return g;
}

function buildDesk(role, x, z) {
  const desk = new THREE.Group();
  desk.position.set(x, 0, z);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 1.0), mat(COLORS.woodLight));
  top.position.y = 0.85;
  top.castShadow = true;
  top.receiveShadow = true;
  desk.add(top);

  const leg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.9), mat(COLORS.wood));
  leg.position.y = 0.425;
  leg.castShadow = true;
  desk.add(leg);

  const label = textPlane(role, 1.45, 0.28, {
    fontSize: role.length > 12 ? 20 : 26,
    width: 512,
    height: 80,
    fill: "#eef1f4",
  });
  label.position.set(0, 0.52, 0.48);
  label.rotation.x = -0.08;
  desk.add(label);

  world.add(desk);
}

function buildOffLaneLounge() {
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), mat(0xc8d0d8));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(6.8, 0.015, -0.2);
  world.add(rug);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.2), mat(COLORS.wood));
  shelf.position.set(6.8, 0.5, -2.2);
  world.add(shelf);

  OFF_LANE.forEach((b) => {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.45, 12), mat(COLORS.wallSide));
    stool.position.set(b.x, 0.225, b.z);
    stool.castShadow = true;
    world.add(stool);

    const bot = shapeMesh(b.shape, b.color);
    bot.position.set(b.x, 0.75, b.z);
    bot.scale.multiplyScalar(0.78);
    bot.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = o.material.clone();
        if (o.material.emissiveIntensity !== undefined) o.material.emissiveIntensity *= 0.5;
        o.material.color.multiplyScalar(0.88);
      }
    });
    world.add(bot);

    const tag = textPlane(b.role.split(" · ")[0], 1.1, 0.22, {
      fontSize: 18,
      width: 320,
      height: 56,
      fill: "#5a6470",
    });
    tag.position.set(b.x, 0.05, b.z + 0.55);
    tag.rotation.x = -Math.PI / 2;
    world.add(tag);
  });
}

function buildDecor() {
  const plant = new THREE.Group();
  plant.position.set(-5.5, 0, -3);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 10), mat(COLORS.wood));
  pot.position.y = 0.25;
  plant.add(pot);
  const leafMat = mat(0x6b9f5e);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), leafMat);
    leaf.position.set(Math.sin(i) * 0.15, 0.65 + i * 0.08, Math.cos(i) * 0.15);
    plant.add(leaf);
  }
  world.add(plant);

  for (const [px, pz] of [
    [12, -4],
    [12, 3],
  ]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.06), mat(COLORS.wood));
    frame.position.set(px, 4.5, pz);
    world.add(frame);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.72), mat(0xa8d4a0));
    art.position.set(px, 4.5, pz - 0.04);
    world.add(art);
  }
}

function updateLaneAnimators(dt) {
  for (const bot of laneAnimators) {
    bot.moveTimer += dt;
    bot.frameTimer += dt;

    if (bot.mode === "idle" && bot.moveTimer > 2.6 + bot.phaseOffset * 0.35) {
      bot.mode = "walk";
      bot.moveTimer = 0;
      bot.targetX = bot.homeX + (Math.random() - 0.5) * 1.1;
      bot.targetZ = bot.homeZ + (Math.random() - 0.5) * 0.75;
    }

    if (bot.mode === "walk") {
      const dx = bot.targetX - bot.x;
      const dz = bot.targetZ - bot.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.04) {
        bot.mode = "idle";
        bot.x = bot.homeX;
        bot.z = bot.homeZ;
        bot.frame = 0;
      } else {
        const speed = 0.85 * dt;
        bot.x += (dx / dist) * speed;
        bot.z += (dz / dist) * speed;
      }
      if (bot.frameTimer > 0.11) {
        bot.frameTimer = 0;
        bot.frame = bot.frame === 2 ? 3 : 2;
      }
    } else if (bot.frameTimer > 0.38) {
      bot.frameTimer = 0;
      bot.frame = bot.frame === 0 ? 1 : 0;
    }

    bot.sprite.material.map = bot.frames[bot.frame];
    bot.sprite.material.needsUpdate = true;
    bot.sprite.position.set(bot.x, 0.98, bot.z);
  }
}

function resize() {
  const w = view.clientWidth;
  const h = view.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

async function init() {
  buildRoom();
  buildLaneMat();
  buildWarBoard();
  LANE_DESKS.forEach((d) => buildDesk(d.role, d.x, d.z));
  buildOffLaneLounge();
  buildDecor();

  try {
    const entries = await Promise.all(
      Object.entries(SHEET_PATHS).map(async ([key, url]) => {
        const tex = await loadSheet(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return [key, tex];
      }),
    );
    const loaded = Object.fromEntries(entries);
    for (const desk of LANE_DESKS) {
      const base = loaded[desk.sheet];
      if (base) laneAnimators.push(makeLaneAnimator(base, desk.x, desk.z, desk.phase));
    }
  } catch (err) {
    console.error("Lane avatar sheets failed to load", err);
  }

  resize();
  window.addEventListener("resize", resize);

  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });
  controls.addEventListener("end", () => {
    controls.autoRotate = true;
  });

  loadingEl.classList.add("hidden");
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();
  const pulse = 0.38 + Math.sin(t * 2.0) * 0.12;
  for (const m of glowMeshes) {
    if (m.material.emissiveIntensity !== undefined) {
      const isWaiting = m.material.color?.getHex?.() === COLORS.waitingGlow;
      m.material.emissiveIntensity = isWaiting ? pulse + 0.55 : pulse + 0.22;
    }
  }

  updateLaneAnimators(dt);
  controls.update();
  renderer.render(scene, camera);
}

init();
