/**
 * Hammer Studio — Soft Next ops room (Soft PASS moodboard v3).
 * Static war-room board + desk avatars for v1.
 * TODO(soft-next): wire live Soft PASS status from JSON or Worker when cheap.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  cream: 0xf5edd8,
  creamDark: 0xe8dcc4,
  wood: 0xc9a66b,
  woodLight: 0xdfc99a,
  laneMat: 0xf0e6cc,
  laneGlow: 0xffc857,
  pick: 0xe8c98a,
  softPass: 0xb8d4a8,
  waitingGo: 0xffb84d,
  tip: 0xa8c4e8,
  smoke: 0xe8b8c4,
  done: 0xb8e8c8,
  art: 0xffd54f,
  dev: 0xc84da8,
  tester: 0xf4a698,
  cto: 0x67c4e8,
  assistant: 0x9caf88,
  cfo: 0x8b7ec8,
  governess: 0xe8c547,
  mainBot: 0x2a2a2a,
};

const STATIONS = [
  { id: "pick", label: "Pick", color: COLORS.pick },
  { id: "soft-pass", label: "Soft PASS", color: COLORS.softPass },
  { id: "waiting-go", label: "Waiting Go", color: COLORS.waitingGo, active: true },
  { id: "tip", label: "Tip", color: COLORS.tip },
  { id: "smoke", label: "Smoke", color: COLORS.smoke },
  { id: "done", label: "Done", color: COLORS.done },
];

const LANE_DESKS = [
  { role: "Art", shape: "heart", color: COLORS.art, x: -2.2, z: 0.6 },
  { role: "Developer", shape: "hex", color: COLORS.dev, x: -2.2, z: -1.4 },
  { role: "Tester · Marketing", shape: "tablet", color: COLORS.tester, x: 2.2, z: 0.6 },
  { role: "CTO", shape: "cloud", color: COLORS.cto, x: 2.2, z: -1.4 },
];

const OFF_LANE = [
  { role: "Assistant · Admin", shape: "square", color: COLORS.assistant, x: 6.2, z: 1.2 },
  { role: "CFO · Expense Tracker", shape: "teardrop", color: COLORS.cfo, x: 7.4, z: 0.2 },
  { role: "Governess", shape: "star", color: COLORS.governess, x: 6.2, z: -0.8 },
  { role: "Main Bot · Admin", shape: "blob", color: COLORS.mainBot, x: 7.4, z: -1.6 },
];

const view = document.getElementById("view");
const loadingEl = document.getElementById("loading");

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.cream);
scene.fog = new THREE.Fog(COLORS.cream, 28, 52);

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

scene.add(new THREE.HemisphereLight(0xfff8ee, 0xc4a574, 0.95));
const sun = new THREE.DirectionalLight(0xfff4e0, 0.75);
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

const loungeLight = new THREE.PointLight(0xfff0d8, 0.35, 12);
loungeLight.position.set(7, 4, 0);
scene.add(loungeLight);

const world = new THREE.Group();
scene.add(world);

const glowMeshes = [];
const clock = new THREE.Clock();

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
    ...opts,
  });
}

function makeTextTexture(text, { width = 512, height = 128, fontSize = 48, fill = "#3d3229", bg = null } = {}) {
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

function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 22), mat(COLORS.woodLight));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  const wallMat = mat(COLORS.cream);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), wallMat);
  back.position.set(0, 5, -11);
  world.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-14, 5, 0);
  world.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), mat(COLORS.creamDark));
  right.rotation.y = -Math.PI / 2;
  right.position.set(14, 5, 0);
  world.add(right);

  const title = textPlane("Hammer Studio", 8, 1.4, { fontSize: 72, width: 1024, height: 180 });
  title.position.set(0, 8.2, -10.92);
  world.add(title);
}

function buildLaneMat() {
  const matGeo = new THREE.PlaneGeometry(7.2, 4.8);
  const lane = new THREE.Mesh(matGeo, mat(COLORS.laneMat));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(0, 0.02, -0.4);
  lane.receiveShadow = true;
  world.add(lane);

  const glowMat = mat(COLORS.laneGlow, { emissive: COLORS.laneGlow, emissiveIntensity: 0.55 });
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

function buildWarBoard() {
  const board = new THREE.Group();
  board.position.set(0, 5.2, -10.5);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(11.2, 3.4, 0.2), mat(COLORS.wood));
  frame.castShadow = true;
  board.add(frame);

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 2.8), mat(0xfaf6ec));
  surface.position.z = 0.11;
  board.add(surface);

  const header = textPlane("Soft PASS", 2.4, 0.45, { fontSize: 40, width: 480, height: 96 });
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

    const label = textPlane(st.label, cardW * 0.92, 0.32, {
      fontSize: st.label.length > 10 ? 22 : 28,
      width: 256,
      height: 64,
      fill: "#4a4038",
    });
    label.position.set(0, -0.72, 0.08);
    card.add(label);

    if (st.active) {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(cardW + 0.35, 1.7),
        mat(COLORS.waitingGo, { emissive: COLORS.waitingGo, emissiveIntensity: 0.9, transparent: true, opacity: 0.35 }),
      );
      glow.position.z = -0.08;
      card.add(glow);
      glowMeshes.push(glow);

      const waitLight = new THREE.PointLight(0xffc857, 1.2, 4);
      waitLight.position.set(0, 0.3, 0.5);
      card.add(waitLight);

      const pack = new THREE.Group();
      pack.position.set(0.35, -0.35, 0.22);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.32), mat(0xc9a66b));
      box.castShadow = true;
      pack.add(box);
      const packLabel = textPlane("Soft PASS", 0.38, 0.18, { fontSize: 18, width: 200, height: 48, fill: "#5a4a38" });
      packLabel.position.set(0, 0.01, 0.17);
      pack.add(packLabel);
      card.add(pack);
    }

    if (st.id === "soft-pass") {
      const seal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24),
        mat(0x6b8f5e, { emissive: 0x4a7040, emissiveIntensity: 0.2 }),
      );
      seal.rotation.x = Math.PI / 2;
      seal.position.set(0.45, 0.25, 0.1);
      card.add(seal);
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
    case "heart": {
      const s = new THREE.Shape();
      const x = 0;
      const y = 0;
      s.moveTo(x, y + 0.25);
      s.bezierCurveTo(x, y + 0.25, x - 0.25, y, x - 0.25, y - 0.1);
      s.bezierCurveTo(x - 0.25, y - 0.35, x, y - 0.45, x, y - 0.55);
      s.bezierCurveTo(x, y - 0.45, x + 0.25, y - 0.35, x + 0.25, y - 0.1);
      s.bezierCurveTo(x + 0.25, y, x, y + 0.25, x, y + 0.25);
      body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }), m);
      body.scale.set(1.8, 1.8, 1);
      body.rotation.z = Math.PI;
      break;
    }
    case "hex":
      body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 6), m);
      break;
    case "tablet":
      body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.28), m);
      break;
    case "cloud": {
      body = new THREE.Group();
      const parts = [
        [0, 0.1, 0.32],
        [-0.28, 0, 0.24],
        [0.28, 0, 0.24],
        [0, -0.08, 0.28],
      ];
      for (const [px, py, r] of parts) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
        p.position.set(px, py, 0);
        body.add(p);
      }
      break;
    }
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

function buildDesk(role, botShape, botColor, x, z, dimmer = false) {
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
    fill: "#faf6ec",
  });
  label.position.set(0, 0.52, 0.48);
  label.rotation.x = -0.08;
  desk.add(label);

  const bot = shapeMesh(botShape, botColor);
  bot.position.y = 1.15;
  if (dimmer) bot.scale.multiplyScalar(0.92);
  desk.add(bot);

  if (dimmer) {
    desk.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissiveIntensity !== undefined) {
        o.material = o.material.clone();
        o.material.emissiveIntensity *= 0.65;
      }
    });
  }

  world.add(desk);
  return desk;
}

function buildOffLaneLounge() {
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), mat(0xd8d0c4));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(6.8, 0.015, -0.2);
  world.add(rug);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.2), mat(COLORS.wood));
  shelf.position.set(6.8, 0.5, -2.2);
  world.add(shelf);

  OFF_LANE.forEach((b, i) => {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.45, 12), mat(COLORS.creamDark));
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
      fill: "#6a6258",
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

function resize() {
  const w = view.clientWidth;
  const h = view.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function init() {
  buildRoom();
  buildLaneMat();
  buildWarBoard();
  LANE_DESKS.forEach((d) => buildDesk(d.role, d.shape, d.color, d.x, d.z, false));
  buildOffLaneLounge();
  buildDecor();

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
  const t = clock.getElapsedTime();
  const pulse = 0.45 + Math.sin(t * 2.2) * 0.2;
  for (const m of glowMeshes) {
    if (m.material.emissiveIntensity !== undefined) {
      m.material.emissiveIntensity = pulse + 0.35;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

init();
