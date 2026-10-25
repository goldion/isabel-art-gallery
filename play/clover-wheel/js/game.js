/**
 * Clover-wheel Race — one neighborhood loop, Greenness Queen vs 小花.
 * The queen, 小花, and the neighborhood are solid shapes. Hold Shift to roll.
 */
import * as THREE from "three";

const LAPS = 3;
const TRACK_A = 32;
const TRACK_B = 19;
/** Gentle radius wobble — three wide bends per lap (same period; no high-frequency kinks). */
const TRACK_WAVE_A = 0.24;
const TRACK_WAVE_B = 0.07;
const TRACK_WAVE_FREQ = 3;
const ROAD_HALF = 3.3;
const LAT_MAX = 5.4;
const BASE_SPEED = 16;
const BOOST_MUL = 1.55;
/** Hold Shift / Boost to build speed; release to stop (no idle cruise). */
const ACCEL_RATE = 1;
const DECEL_RATE = 4.2;
const TOP_SPEED = BASE_SPEED * BOOST_MUL;
const WHEEL_RADIUS = 0.72;
const RIVAL_SPEED = 14.2;
const RIVAL_RIDER_H = 3.55;
/** Small deck under 小花's stance (not full prop scale). */
const RIVAL_SKATE_H = 0.58;
/** Level deck art so wheels sit on the sprite anchor (Soft Next residual). */
const SKATE_DECK_LEVEL_RAD = 0.27;
const SKATE_DECK_WHEELS_DOWN_BIAS = 0.055;

const view = document.getElementById("view");
const lapEl = document.getElementById("lap");
const placeEl = document.getElementById("place");
const speedCaptionEl = document.getElementById("speed-caption");
const speedFillEl = document.getElementById("speed-fill");
const speedValueEl = document.getElementById("speed-value");
const speedMeterEl = document.getElementById("speed-meter");
const grassVeilEl = document.getElementById("grass-veil");
const onboardingEl = document.getElementById("onboarding");
const loadingEl = document.getElementById("loading");
const finishEl = document.getElementById("finish");
const finishLineEl = document.getElementById("finish-line");
const restartBtn = document.getElementById("restart-btn");
const touchEl = document.getElementById("touch");
const stickEl = document.getElementById("stick");
const stickKnobEl = document.getElementById("stick-knob");
const boostBtn = document.getElementById("boost-btn");

const keys = { left: false, right: false, boost: false };
const analog = { x: 0 };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc5e4f7);
scene.fog = new THREE.Fog(0xd5e8c8, 28, 90);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
view.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff6df, 0x6d8f4a, 1.05));
const sun = new THREE.DirectionalLight(0xfff8e8, 0.85);
sun.position.set(-12, 24, 8);
scene.add(sun);

const clock = new THREE.Clock();
const sprites = [];
const sidePages = [];
const camDesired = new THREE.Vector3();
const camLook = new THREE.Vector3();
const grassBits = [];
let grassSpawn = 0;
let grassCursor = 0;

const player = { u: 0, lat: -0.8, x: 0, z: 0, heading: 0, roadDist: 0, speed: 0, spin: 0, group: new THREE.Group() };
const solids = [];
const SOLID_BODY = 0.85;
const rival = { u: 0.07, lat: 1.2, spin: 0, group: new THREE.Group() };
/** Smoothed track forward vector for chase cam (avoids snapping on bends). */
const camForward = { fx: 1, fz: 0 };
scene.add(player.group, rival.group);

let started = false;
let finished = false;
let raceTime = 0;
let playerWon = false;

function trackWave(ang) {
  const f = TRACK_WAVE_FREQ * ang;
  return 1 + TRACK_WAVE_A * Math.cos(f - 0.2) + TRACK_WAVE_B * Math.sin(f + 0.85);
}

function trackPoint(ang) {
  const w = trackWave(ang);
  return { x: Math.cos(ang) * TRACK_A * w, z: Math.sin(ang) * TRACK_B * w };
}

function measureTrackLength(steps = 720) {
  let len = 0;
  let prev = trackPoint(0);
  for (let i = 1; i <= steps; i++) {
    const p = trackPoint((i / steps) * Math.PI * 2);
    len += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
  }
  return len;
}

const TRACK_LEN = measureTrackLength();

function sample(u) {
  const ang = (u % 1) * Math.PI * 2;
  const eps = 0.004;
  const p = trackPoint(ang);
  const q = trackPoint(ang + eps);
  const tx = q.x - p.x;
  const tz = q.z - p.z;
  const len = Math.hypot(tx, tz) || 1;
  const fx = tx / len;
  const fz = tz / len;
  return { x: p.x, z: p.z, fx, fz, rx: fz, rz: -fx };
}

function loadImage(src) {
  return fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(src);
      return res.blob();
    })
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => {
      const c = document.createElement("canvas");
      c.width = bitmap.width;
      c.height = bitmap.height;
      c.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
      return c;
    });
}

function chromaAndTrim(canvas) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    if (min > 210) d[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (d[(y * width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return canvas;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d").drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function cutCell(img, cols, index) {
  const cellW = img.width / cols;
  const pad = cellW * 0.08;
  const cellH = img.height * 0.63;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(cellW - pad * 2));
  c.height = Math.max(1, Math.floor(cellH));
  c.getContext("2d").drawImage(img, cellW * index + pad, 0, cellW - pad * 2, cellH, 0, 0, c.width, c.height);
  return chromaAndTrim(c);
}

function cutGridCell(img, cols, rows, col, row) {
  const cellW = img.width / cols;
  const cellH = img.height / rows;
  const padX = cellW * 0.06;
  const padY = cellH * 0.06;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(cellW - padX * 2));
  c.height = Math.max(1, Math.floor(cellH - padY * 2));
  c.getContext("2d").drawImage(
    img,
    col * cellW + padX,
    row * cellH + padY,
    cellW - padX * 2,
    cellH - padY * 2,
    0,
    0,
    c.width,
    c.height
  );
  return chromaAndTrim(c);
}

function cutFull(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d").drawImage(img, 0, 0);
  return chromaAndTrim(c);
}

/** Isabel stand on the wooden clover wheel (not the flat green disk pose). */
function composeQueenOnCloverWheel(queenCanvas, wheelCanvas) {
  const queen = chromaAndTrim(queenCanvas);
  const wheel = chromaAndTrim(wheelCanvas);
  const queenW = queen.width;
  const queenH = queen.height;
  // Soft Next: wheel scale — Art soft-check
  const WHEEL_SOFT_NEXT_SCALE = 0.4;
  const QUEEN_ON_WHEEL_FRAC = 0.7;
  const wheelW = Math.round(queenW * 3.05 * WHEEL_SOFT_NEXT_SCALE);
  const wheelH = Math.round((wheel.height / wheel.width) * wheelW);
  const queenDrawW = Math.round(wheelW * QUEEN_ON_WHEEL_FRAC);
  const queenDrawH = Math.round((queenH / queenW) * queenDrawW);
  const padX = 36;
  const padTop = 19;
  const wheelOverlap = wheelH * 0.19;
  const out = document.createElement("canvas");
  out.width = wheelW + padX * 2;
  out.height = padTop + queenDrawH + wheelH - wheelOverlap;
  const ctx = out.getContext("2d");
  const wheelX = (out.width - wheelW) / 2;
  const wheelY = out.height - wheelH;
  ctx.drawImage(wheel, wheelX, wheelY, wheelW, wheelH);
  const queenX = (out.width - queenDrawW) / 2;
  const queenY = wheelY - queenDrawH + wheelOverlap;
  ctx.drawImage(queen, queenX, queenY, queenDrawW, queenDrawH);
  return chromaAndTrim(out);
}

/** Level the crayon skate art: wheels down, deck horizontal for a billboard read. */
function makeLevelSkateDeck(img) {
  const src = chromaAndTrim(cutFull(img));
  const size = Math.ceil(Math.hypot(src.width, src.height) * 1.08);
  const stage = document.createElement("canvas");
  stage.width = size;
  stage.height = size;
  const ctx = stage.getContext("2d");
  ctx.translate(size / 2, size / 2);
  ctx.rotate(SKATE_DECK_LEVEL_RAD);
  ctx.translate(0, src.height * SKATE_DECK_WHEELS_DOWN_BIAS);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return chromaAndTrim(stage);
}

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function imageTexture(img) {
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeSprite(tex, height) {
  const img = tex.image;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(height * (img.width / img.height), height, 1);
  sprite.center.set(0.5, 0);
  sprites.push(sprite);
  return sprite;
}

function setSpriteTexture(sprite, tex, height) {
  const img = tex.image;
  sprite.material.map = tex;
  sprite.scale.set(height * (img.width / img.height), height, 1);
  sprite.material.needsUpdate = true;
}

function updateQueenPose() {
  if (!player.waveArm) return;
  player.waveArm.rotation.z = finished ? -1.15 : 0.2;
}

function buildRoad() {
  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(62, 48),
    new THREE.MeshStandardMaterial({ color: 0x7fbf57, flatShading: true })
  );
  grass.rotation.x = -Math.PI / 2;
  scene.add(grass);

  const segs = 128;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segs; i++) {
    const s = sample(i / segs);
    positions.push(
      s.x + s.rx * ROAD_HALF, 0.04, s.z + s.rz * ROAD_HALF,
      s.x - s.rx * ROAD_HALF, 0.04, s.z - s.rz * ROAD_HALF
    );
    if (i < segs) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const road = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x8d8680, flatShading: true, side: THREE.DoubleSide })
  );
  scene.add(road);

  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.08, ROAD_HALF * 2),
    new THREE.MeshBasicMaterial({ color: 0xfffaf3 })
  );
  const start = sample(0);
  line.position.set(start.x, 0.1, start.z);
  line.lookAt(start.x + start.rx, 0.1, start.z + start.rz);
  scene.add(line);
}

function addSidePage(tex, u, height) {
  const s = sample(u);
  const img = tex.image;
  const w = height * (img.width / img.height);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, height),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: true })
  );
  const out = 22;
  mesh.position.set(s.x + s.rx * out, height * 0.46, s.z + s.rz * out);
  mesh.lookAt(0, height * 0.46, 0);
  scene.add(mesh);
  sidePages.push({ mesh, u });
}

function updateSidePages() {
  for (const page of sidePages) {
    let ahead = page.u - (player.u % 1);
    ahead = ((ahead % 1) + 1) % 1;
    page.mesh.visible = ahead > 0.2;
  }
}

function tree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a5a32, flatShading: true })
  );
  trunk.position.y = 0.6;
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x3f8f3a, flatShading: true })
  );
  top.position.y = 2.2;
  g.add(trunk, top);
  g.position.set(x, 0, z);
  scene.add(g);
  solids.push({ x, z, r: 1.35 });
}

function clay(color) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 });
}

function buildHouse(wall, roofColor) {
  const g = new THREE.Group();
  const w = 3.4;
  const h = 2.5;
  const d = 2.8;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), clay(wall));
  body.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.5, 4), clay(roofColor));
  roof.position.y = h + 0.65;
  roof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.15, 0.08), clay(0x6b3a22));
  door.position.set(0, 0.58, d / 2 + 0.02);
  const glass = clay(0xc5e4f7);
  const frontWin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.06), glass);
  frontWin.position.set(0.95, 1.45, d / 2 + 0.02);
  const sideWin = new THREE.BoxGeometry(0.06, 0.55, 0.7);
  const leftWin = new THREE.Mesh(sideWin, glass);
  leftWin.position.set(-w / 2 - 0.01, 1.45, 0);
  const rightWin = new THREE.Mesh(sideWin, glass);
  rightWin.position.set(w / 2 + 0.01, 1.45, 0);
  g.add(body, roof, door, frontWin, leftWin, rightWin);
  return g;
}

function buildScooter() {
  const g = new THREE.Group();
  const metal = clay(0x4a4a4a);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 1.05), clay(0xd45b7a));
  deck.position.y = 0.22;
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), metal);
  stem.position.set(0, 0.64, 0.42);
  const bars = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.06), metal);
  bars.position.set(0, 1.05, 0.42);
  for (const z of [-0.38, 0.42]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8), metal);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.16, z);
    g.add(wheel);
  }
  g.add(deck, stem, bars);
  return g;
}

function buildCloverLeaf() {
  const g = new THREE.Group();
  const leafMat = clay(0x3f9a32);
  for (const [x, y] of [[0.16, 0], [-0.16, 0], [0, 0.16], [0, -0.1]]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), leafMat);
    leaf.position.set(x, y, 0);
    leaf.scale.set(1, 0.72, 0.45);
    g.add(leaf);
  }
  return g;
}

function buildCloverWheel() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  const wood = clay(0x8a5a32);
  const radius = WHEEL_RADIUS;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.1, 8, 28), wood);
  rim.rotation.y = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), clay(0xc4a06a));
  hub.rotation.z = Math.PI / 2;
  spin.add(rim, hub);
  const spokeLen = radius * 2 - 0.12;
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, spokeLen, 0.05), wood);
    spoke.rotation.x = (i / 6) * Math.PI;
    spin.add(spoke);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.35;
    const clover = buildCloverLeaf();
    clover.scale.setScalar(0.72);
    clover.position.set(0, Math.cos(a) * radius, Math.sin(a) * radius);
    clover.rotation.y = Math.PI / 2;
    spin.add(clover);
  }
  root.add(spin);
  root.position.y = radius;
  root.userData.spin = spin;
  return root;
}

function buildQueen() {
  const q = new THREE.Group();
  const skin = clay(0xf6e7cf);
  const green = clay(0x2f8a32);
  const lime = clay(0x9ad85a);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), skin);
  head.position.y = 1.42;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), lime);
  hair.position.set(0, 1.48, -0.02);
  hair.scale.set(1.05, 0.78, 1.08);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.22), green);
  torso.position.y = 0.98;
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.42, 7), green);
  skirt.position.y = 0.62;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.28, 5), green);
  stem.position.y = 1.78;
  q.add(head, hair, torso, skirt, stem);
  for (const side of [-1, 1]) {
    const curl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), lime);
    curl.position.set(side * 0.24, 1.28, 0.06);
    curl.scale.set(0.7, 1.1, 0.7);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), lime);
    ear.position.set(side * 0.16, 1.68, 0);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), lime);
    leaf.scale.set(1.5, 0.4, 0.55);
    leaf.position.set(side * 0.12, 1.94, 0);
    leaf.rotation.z = side * -0.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), green);
    arm.position.set(side * 0.28, 0.92, 0.04);
    arm.geometry.translate(0, -0.16, 0);
    arm.position.y += 0.16;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.48, 5), green);
    leg.position.set(side * 0.1, 0.24, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.2), green);
    foot.position.set(side * 0.1, 0.03, 0.04);
    q.add(curl, ear, leaf, arm, leg, foot);
    if (side === 1) q.userData.waveArm = arm;
  }
  const eyeMat = clay(0x16331a);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), eyeMat);
    eye.position.set(side * 0.09, 1.44, 0.24);
    q.add(eye);
  }
  q.position.y = WHEEL_RADIUS * 2;
  return q;
}

function buildXiaohua() {
  const g = new THREE.Group();
  const skin = clay(0xf6b7b4);
  const black = clay(0x1a1a1a);
  const hairMat = clay(0xf7c0c6);
  const glasses = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.35, flatShading: true });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), skin);
  head.position.y = 1.52;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), hairMat);
  hair.position.set(0, 1.58, -0.05);
  hair.scale.set(1.06, 0.78, 1.05);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.92, 4, 8), hairMat);
  tail.position.set(0, 0.98, -0.2);
  tail.rotation.x = 0.22;
  const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.48, 0.64, 8), black);
  dress.position.y = 0.88;
  g.add(head, hair, tail, dress);

  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.08), glasses);
    lens.position.set(side * 0.26, 1.54, 0.14);
    lens.rotation.y = side * 0.35;
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.46), glasses);
    temple.position.set(side * 0.34, 1.55, -0.08);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.64, 6), skin);
    leg.position.set(side * 0.13, 0.44, 0.02);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 3, 6), skin);
    arm.position.set(side * 0.34, 1.08, 0.02);
    arm.rotation.z = side * 0.12;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.24), skin);
    foot.position.set(side * 0.13, 0.18, 0.06);
    g.add(lens, temple, leg, arm, foot);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.05), glasses);
  bridge.position.set(0, 1.58, 0.26);
  g.add(bridge);
  g.scale.setScalar(1.2);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 1.25), clay(0xd7b07a));
  deck.position.y = 0.14;
  g.add(deck);
  const wheelMat = clay(0x2a2a2a);
  for (const x of [-0.2, 0.2]) {
    for (const z of [-0.4, 0.4]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.1, z);
      g.add(wheel);
    }
  }
  return g;
}

function buildWorld() {
  buildRoad();
  const walls = [0xf4e4c4, 0xf7f1e4, 0xf2d2c4, 0xe7eef5, 0xf6e3b4];
  const roofs = [0xc45b4a, 0x4a7ab5, 0x3f8f3a, 0xd45b7a, 0x8a5a32];
  for (let i = 0; i < 10; i++) {
    const s = sample(i / 10 + 0.03);
    const side = i % 2 === 0 ? 1 : -1;
    const house = buildHouse(walls[i % walls.length], roofs[i % roofs.length]);
    const dist = 11 + (i % 3) * 1.4;
    house.position.set(s.x + s.rx * side * dist, 0, s.z + s.rz * side * dist);
    house.lookAt(s.x, house.position.y + 1.2, s.z);
    house.rotateY(Math.PI);
    scene.add(house);
    solids.push({ x: house.position.x, z: house.position.z, r: 2.35 });
  }
  for (let i = 0; i < 8; i++) {
    const s = sample(i / 8 + 0.05);
    tree(s.x - s.rx * 12, s.z - s.rz * 12);
    tree(s.x + s.rx * 14, s.z + s.rz * 14);
  }
  const scooter = buildScooter();
  const spot = sample(0.22);
  scooter.position.set(spot.x + spot.rx * 9, 0, spot.z + spot.rz * 9);
  scooter.lookAt(spot.x, 0, spot.z);
  scene.add(scooter);
}

function mountRider(group, riderTex, boardTex, riderH, boardH, foot, boardSpin = true) {
  const board = makeSprite(boardTex, boardH);
  const rider = makeSprite(riderTex, riderH);
  board.position.y = 0.08;
  board.renderOrder = 2;
  rider.position.y = 0.08 + boardH * foot;
  rider.renderOrder = 4;
  board.userData.spins = boardSpin;
  group.add(board, rider);
  return { board, rider };
}

function placeRacer(racer) {
  const s = sample(racer.u);
  racer.group.position.set(s.x + s.rx * racer.lat, 0, s.z + s.rz * racer.lat);
  racer.group.rotation.y = Math.atan2(s.fx, s.fz);
  racer.fx = s.fx;
  racer.fz = s.fz;
}

function nearestOnTrack(x, z, hint) {
  let bestU = hint;
  let bestD = Infinity;
  for (let i = -12; i <= 12; i++) {
    const u = hint + i * 0.004;
    if (u < 0) continue;
    const s = sample(u);
    const d = (s.x - x) ** 2 + (s.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      bestU = u;
    }
  }
  const s = sample(bestU);
  return { u: bestU, dist: Math.sqrt(bestD), fx: s.fx, fz: s.fz };
}

function syncPlayerToRoad() {
  const s = sample(player.u);
  player.x = s.x + s.rx * player.lat;
  player.z = s.z + s.rz * player.lat;
  player.heading = Math.atan2(s.fx, s.fz);
  player.roadDist = Math.abs(player.lat);
}

function placePlayer() {
  player.group.position.set(player.x, 0, player.z);
  player.group.rotation.y = player.heading;
  player.fx = Math.sin(player.heading);
  player.fz = Math.cos(player.heading);
}

function ridingGrass() {
  return player.roadDist > ROAD_HALF;
}

function keepOutOfSolids() {
  const fx = Math.sin(player.heading);
  const fz = Math.cos(player.heading);
  for (let pass = 0; pass < 2; pass++) {
    for (const o of solids) {
      let dx = player.x - o.x;
      let dz = player.z - o.z;
      const min = o.r + SOLID_BODY;
      let d = Math.hypot(dx, dz);
      if (d >= min) continue;
      if (d < 1e-4) {
        dx = 1;
        dz = 0;
        d = 1;
      }
      const nx = dx / d;
      const nz = dz / d;
      player.x = o.x + nx * min;
      player.z = o.z + nz * min;
      const into = fx * nx + fz * nz;
      if (into < 0) player.speed *= Math.max(0, 1 + into);
    }
  }
}

function buildGrassFx() {
  const c = document.createElement("canvas");
  c.width = 48;
  c.height = 64;
  const g = c.getContext("2d");
  g.lineCap = "round";
  g.lineWidth = 4;
  const blades = [
    ["#2f7a28", 24, 62, 8, 8],
    ["#5eae3e", 24, 62, 24, 2],
    ["#9ad85a", 24, 62, 40, 10],
  ];
  for (const [color, x, y, cx, cy] of blades) {
    g.strokeStyle = color;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo((x + cx) / 2, 28, cx, cy);
    g.stroke();
  }
  const tex = canvasTexture(c);
  for (let i = 0; i < 42; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    sprite.center.set(0.5, 0);
    sprite.userData = { life: 1, age: 1, vx: 0, vy: 0, vz: 0 };
    scene.add(sprite);
    grassBits.push(sprite);
  }
}

function clearGrass() {
  grassSpawn = 0;
  for (const bit of grassBits) bit.visible = false;
}

function updateGrass(dt) {
  const spraying = started && !finished && ridingGrass() && player.speed > 2;
  if (spraying) {
    grassSpawn += (16 + player.speed * 0.85) * dt;
    const s = sample(player.u);
    while (grassSpawn >= 1) {
      grassSpawn -= 1;
      const bit = grassBits[grassCursor % grassBits.length];
      grassCursor += 1;
      const side = (Math.random() - 0.5) * 1.6;
      const back = 0.35 + Math.random() * 0.9;
      bit.visible = true;
      bit.position.set(
        player.group.position.x - s.fx * 0.4 + s.rx * side * 0.35,
        0.12,
        player.group.position.z - s.fz * 0.4 + s.rz * side * 0.35
      );
      const h = 0.55 + Math.random() * 0.7;
      bit.scale.set(h * 0.7, h, 1);
      bit.material.opacity = 1;
      bit.material.rotation = Math.random() * 0.6 - 0.3;
      bit.userData.life = 0.38 + Math.random() * 0.28;
      bit.userData.age = 0;
      bit.userData.vx = -s.fx * player.speed * 0.22 * back + s.rx * side;
      bit.userData.vy = 1.8 + Math.random() * 2.4;
      bit.userData.vz = -s.fz * player.speed * 0.22 * back + s.rz * side;
    }
  }

  for (const bit of grassBits) {
    if (!bit.visible) continue;
    const u = bit.userData;
    u.age += dt;
    u.vy -= 8.5 * dt;
    bit.position.x += u.vx * dt;
    bit.position.y += u.vy * dt;
    bit.position.z += u.vz * dt;
    const t = u.age / u.life;
    bit.material.opacity = Math.max(0, 1 - t);
    if (t >= 1 || bit.position.y < 0) bit.visible = false;
  }
}

function steerInput() {
  // Chase cam looks along the track, so +lat is screen-left.
  let ix = -analog.x;
  if (keys.left) ix += 1;
  if (keys.right) ix -= 1;
  return Math.max(-1, Math.min(1, ix));
}

function startRace() {
  if (started || finished) return;
  started = true;
  onboardingEl.hidden = true;
  updateQueenPose();
}

function endRace() {
  finished = true;
  started = false;
  const place = player.u >= rival.u ? "1st" : "2nd";
  playerWon = place === "1st";
  finishLineEl.textContent = playerWon
    ? `You beat 小花 · ${raceTime.toFixed(1)}s`
    : `小花 got there first · ${raceTime.toFixed(1)}s`;
  finishEl.hidden = false;
  updateQueenPose();
}

function resetRun() {
  player.u = 0;
  player.lat = -0.8;
  player.speed = 0;
  player.spin = 0;
  rival.u = 0.07;
  rival.lat = 1.2;
  rival.spin = 0;
  started = false;
  finished = false;
  raceTime = 0;
  playerWon = false;
  finishEl.hidden = true;
  onboardingEl.hidden = false;
  syncPlayerToRoad();
  placePlayer();
  placeRacer(rival);
  const startFrame = sample(player.u);
  camForward.fx = startFrame.fx;
  camForward.fz = startFrame.fz;
  clearGrass();
  updateQueenPose();
  updateCamera(0);
  updateHud();
}

function updateHud() {
  const lap = Math.min(LAPS, Math.floor(player.u) + 1);
  lapEl.textContent = `Lap ${lap} / ${LAPS}`;
  placeEl.textContent = player.u + 0.01 >= rival.u ? "1st" : "2nd";
  const off = ridingGrass();
  speedCaptionEl.textContent = off ? "Grass" : "Speed";
  speedValueEl.textContent = String(Math.round(player.speed));
  const pct = Math.max(0, Math.min(1, player.speed / TOP_SPEED));
  speedFillEl.style.width = `${pct * 100}%`;
  speedMeterEl.classList.toggle("boost", keys.boost && !off);
  speedMeterEl.classList.toggle("grass", off);
  grassVeilEl.classList.toggle("on", off && player.speed > 2 && (started || finished));
}

function updateRace(dt) {
  const ix = steerInput();
  if (ix !== 0 || keys.boost) startRace();
  if (!started || finished) return;
  raceTime += dt;
  const turn = 0.6 + Math.min(player.speed, TOP_SPEED) * 0.08;
  player.heading += ix * turn * dt;
  const grip = player.roadDist > ROAD_HALF ? 0.42 : 1;
  const target = keys.boost ? BASE_SPEED * BOOST_MUL * grip : 0;
  const rate = keys.boost ? ACCEL_RATE : DECEL_RATE;
  player.speed += (target - player.speed) * Math.min(1, rate * dt);
  player.x += Math.sin(player.heading) * player.speed * dt;
  player.z += Math.cos(player.heading) * player.speed * dt;
  keepOutOfSolids();
  const near = nearestOnTrack(player.x, player.z, player.u);
  player.roadDist = near.dist;
  const along = Math.sin(player.heading) * near.fx + Math.cos(player.heading) * near.fz;
  if (along > 0.35 && near.u > player.u - 0.01) player.u = Math.max(player.u, near.u);
  player.spin += (player.speed * dt) / WHEEL_RADIUS;

  rival.u += (RIVAL_SPEED * dt) / TRACK_LEN;
  rival.spin += RIVAL_SPEED * dt * 0.28;

  if (player.u >= LAPS) {
    player.u = LAPS;
    endRace();
  }
}

function updateCamera(dt) {
  const blend = dt > 0 ? 1 - Math.exp(-4.2 * dt) : 1;
  camForward.fx += (player.fx - camForward.fx) * blend;
  camForward.fz += (player.fz - camForward.fz) * blend;
  const fLen = Math.hypot(camForward.fx, camForward.fz) || 1;
  camForward.fx /= fLen;
  camForward.fz /= fLen;

  const px = player.group.position.x;
  const pz = player.group.position.z;
  camDesired.set(px - camForward.fx * 8.2, 4.8, pz - camForward.fz * 8.2);
  if (started && ridingGrass() && player.speed > 3) {
    const j = 0.09;
    camDesired.x += Math.sin(raceTime * 34) * j;
    camDesired.y += Math.abs(Math.sin(raceTime * 46)) * j * 0.55;
    camDesired.z += Math.cos(raceTime * 28) * j;
  }
  if (dt > 0) camera.position.lerp(camDesired, 1 - Math.exp(-7.5 * dt));
  else camera.position.copy(camDesired);
  camLook.set(px + camForward.fx * 1.4, 1.35, pz + camForward.fz * 1.4);
  camera.lookAt(camLook);
}

function resize() {
  const w = view.clientWidth;
  const h = view.clientHeight;
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function onKey(e, down) {
  const k = e.key.toLowerCase();
  if (k === "a" || k === "arrowleft") keys.left = down;
  if (k === "d" || k === "arrowright") keys.right = down;
  if (k === "shift") keys.boost = down;
  if (down && (k === " " || k === "enter")) {
    e.preventDefault();
    if (finished) resetRun();
    else startRace();
  }
}

function bindStick() {
  if (window.matchMedia("(pointer: coarse)").matches) touchEl.hidden = false;
  let active = false;
  const setFromEvent = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    let dx = (t.clientX - cx) / (rect.width / 2);
    dx = Math.max(-1, Math.min(1, dx));
    analog.x = dx;
    stickKnobEl.style.transform = `translate(${dx * 28}px, 0)`;
    startRace();
  };
  const end = () => {
    active = false;
    analog.x = 0;
    stickKnobEl.style.transform = "";
  };
  stickEl.addEventListener("pointerdown", (e) => {
    active = true;
    stickEl.setPointerCapture(e.pointerId);
    setFromEvent(e);
  });
  stickEl.addEventListener("pointermove", (e) => {
    if (active) setFromEvent(e);
  });
  stickEl.addEventListener("pointerup", end);
  stickEl.addEventListener("pointercancel", end);
  boostBtn.addEventListener("pointerdown", () => {
    keys.boost = true;
    startRace();
  });
  boostBtn.addEventListener("pointerup", () => {
    keys.boost = false;
  });
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateRace(dt);
  placePlayer();
  placeRacer(rival);
  if (started && !finished && ridingGrass()) {
    player.group.position.y = Math.abs(Math.sin(raceTime * 18)) * 0.14;
  }
  updateGrass(dt);
  updateSidePages();
  if (rival.board?.userData.spins) rival.board.material.rotation = rival.spin;
  if (player.wheel?.userData.spin) player.wheel.userData.spin.rotation.x = player.spin;
  if (player.queen) {
    player.queen.rotation.z = ridingGrass() && player.speed > 2 ? Math.sin(raceTime * 22) * 0.08 : 0;
  }
  updateQueenPose();
  updateCamera(dt);
  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  restartBtn.addEventListener("click", resetRun);
  view.addEventListener("pointerdown", () => {
    if (!started && !finished) startRace();
  });
  bindStick();

  const wheel = buildCloverWheel();
  const queen = buildQueen();
  player.group.add(wheel, queen);
  player.wheel = wheel;
  player.queen = queen;
  player.waveArm = queen.userData.waveArm;
  const xiaohua = buildXiaohua();
  rival.group.add(xiaohua);
  rival.rider = xiaohua;
  window.__cloverWheelRacerCast = () => ({
    player: "greenness-queen-on-clover-wheel",
    rival: "xiaohua-sunglasses-skate",
    rivalVehicle: "skateboard",
  });
  buildWorld();
  buildGrassFx();
  resetRun();
  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  clock.getDelta();
  tick();
}

boot().catch((err) => {
  loadingEl.textContent = "Could not load the neighborhood.";
  console.error(err);
});
