/**
 * Dragon Flight — chase-cam corridor through Isabel's sky, earth, and sea cities.
 */
import * as THREE from "three";

const ZONE_LEN = 88;
const FINISH_Z = ZONE_LEN * 3 + 8;
const RING_RADIUS = 2.2;
const BASE_SPEED = 11;
const BOOST_MUL = 1.7;

const ZONES = [
  { id: "sky", name: "天龍城", start: 0, sky: 0xe8eef6, fog: 0xd5deea, ground: 0x8eb56a },
  { id: "earth", name: "地龍城", start: ZONE_LEN, sky: 0xf3e6d4, fog: 0xe4d3bf, ground: 0xc4a574 },
  { id: "sea", name: "海龍城", start: ZONE_LEN * 2, sky: 0x4d8ec8, fog: 0x3d7ab0, ground: 0x1f5f8a },
];

const RINGS = [
  { z: 18, x: 0, y: 5.2, color: 0xff6b9d },
  { z: 34, x: -2.4, y: 5.8, color: 0xffe066 },
  { z: 50, x: 2.2, y: 4.8, color: 0x6ec8ff },
  { z: 68, x: -1.2, y: 6.4, color: 0xff6b9d },
  { z: 100, x: 2.6, y: 5.2, color: 0xffe066 },
  { z: 116, x: -2.0, y: 6.0, color: 0x6ec8ff },
  { z: 134, x: 0.4, y: 4.6, color: 0xff6b9d },
  { z: 152, x: 2.0, y: 6.6, color: 0xffe066 },
  { z: 188, x: -2.2, y: 5.4, color: 0x6ec8ff },
  { z: 206, x: 1.8, y: 6.2, color: 0xff6b9d },
  { z: 224, x: -1.0, y: 5.0, color: 0xffe066 },
  { z: 244, x: 0, y: 5.8, color: 0x6ec8ff },
];

const view = document.getElementById("view");
const placeNameEl = document.getElementById("place-name");
const crumbsEl = document.getElementById("crumbs");
const ringsEl = document.getElementById("rings");
const speedEl = document.getElementById("speed");
const onboardingEl = document.getElementById("onboarding");
const loadingEl = document.getElementById("loading");
const finishEl = document.getElementById("finish");
const finishLineEl = document.getElementById("finish-line");
const restartBtn = document.getElementById("restart-btn");
const touchEl = document.getElementById("touch");
const stickEl = document.getElementById("stick");
const stickKnobEl = document.getElementById("stick-knob");
const boostBtn = document.getElementById("boost-btn");

const keys = { up: false, down: false, left: false, right: false, boost: false };
const analog = { x: 0, y: 0 };
const textures = {};
const poses = {};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
view.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff4e8, 0x6d8f9c, 1.05));
const sun = new THREE.DirectionalLight(0xfff8e8, 0.85);
sun.position.set(6, 18, -8);
scene.add(sun);

const world = new THREE.Group();
const player = new THREE.Group();
scene.add(world);
scene.add(player);

const clock = new THREE.Clock();
const ringMeshes = [];
const sparkPool = [];
const billboards = [];
let dragonFly;
let started = false;
let finished = false;
let collected = 0;
let flightTime = 0;
let vx = 0;
let vy = 0;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, ...opts });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function chromaAndTrim(canvas) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    if (min > 168) d[i + 3] = 0;
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

function cutGrid(img, cols, rows, col, row) {
  const cellW = img.width / cols;
  const cellH = img.height / rows;
  const padX = cellW * 0.06;
  const padY = cellH * 0.06;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(cellW - padX * 2));
  c.height = Math.max(1, Math.floor(cellH - padY * 2));
  c.getContext("2d").drawImage(
    img,
    cellW * col + padX,
    cellH * row + padY,
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
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function spriteMat(tex) {
  return new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.2,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
}

function makeBillboard(tex, height) {
  const img = tex.image;
  const w = height * (img.width / img.height);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, height), spriteMat(tex));
  mesh.position.y = height / 2;
  mesh.rotation.y = Math.PI;
  return mesh;
}

function addSideArt(tex, x, z, height) {
  const mesh = makeBillboard(tex, height);
  mesh.position.set(x, 0, z);
  world.add(mesh);
  billboards.push(mesh);
  return mesh;
}

function mountain(x, z, h, color) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.55, h, 7), mat(color));
  m.position.set(x, h * 0.5, z);
  world.add(m);
}

function cloud(x, y, z, s) {
  const c = new THREE.Mesh(
    new THREE.SphereGeometry(s, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, fog: true })
  );
  c.scale.set(1.6, 0.7, 1);
  c.position.set(x, y, z);
  world.add(c);
}

function seaPlant(x, z, h, color) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 6), mat(0x1a4d73));
  stem.position.y = h / 2;
  g.add(stem);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), mat(color));
  bulb.position.y = h;
  g.add(bulb);
  world.add(g);
}

function buildWorld() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(48, FINISH_Z + 40), mat(ZONES[0].ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, FINISH_Z / 2);
  world.add(ground);

  const earthPatch = new THREE.Mesh(new THREE.PlaneGeometry(48, ZONE_LEN + 4), mat(ZONES[1].ground));
  earthPatch.rotation.x = -Math.PI / 2;
  earthPatch.position.set(0, 0.02, ZONE_LEN * 1.5);
  world.add(earthPatch);

  const seaPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(48, ZONE_LEN + 20),
    new THREE.MeshStandardMaterial({ color: ZONES[2].ground, flatShading: true, transparent: true, opacity: 0.92 })
  );
  seaPatch.rotation.x = -Math.PI / 2;
  seaPatch.position.set(0, 0.04, ZONE_LEN * 2.55);
  world.add(seaPatch);

  addSideArt(textures.hills, -13.5, 22, 4.2);
  addSideArt(textures.sky, 13.5, 44, 4.4);
  addSideArt(textures.sky, -13.5, 70, 4.2);
  addSideArt(textures.earth, 13.5, 110, 4.4);
  addSideArt(textures.earth, -13.5, 138, 4.2);
  addSideArt(textures.earth, 13.5, 160, 4.2);
  addSideArt(textures.sea, -13.5, 198, 4.4);
  addSideArt(textures.sea, 13.5, 226, 4.2);
  addSideArt(textures.sea, -13.5, 250, 4.2);

  mountain(-16, 28, 5.2, 0x7aa35c);
  mountain(16, 48, 6.4, 0x6b9450);
  mountain(-16.5, 64, 4.6, 0x88b56a);
  const flag = makeBillboard(textures.flag, 2.4);
  flag.position.set(-16, 5.2, 28);
  world.add(flag);
  billboards.push(flag);
  cloud(-8, 11, 20, 1.4);
  cloud(8, 12.5, 40, 1.8);
  cloud(-7, 13, 58, 1.2);

  mountain(-16.5, 108, 5.8, 0xb08958);
  mountain(16.5, 132, 7.0, 0x9a7348);
  mountain(-16, 148, 5.0, 0xc4a574);
  const castle = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 3.2), mat(0xc9b089));
  castle.position.set(16, 7.2, 132);
  world.add(castle);
  const keep = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.4), mat(0xb89a70));
  keep.position.set(16, 10.1, 132);
  world.add(keep);
  const spring = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 16),
    new THREE.MeshStandardMaterial({ color: 0x7ec8e8, flatShading: true, transparent: true, opacity: 0.8 })
  );
  spring.rotation.x = -Math.PI / 2;
  spring.position.set(-11, 0.08, 118);
  world.add(spring);

  seaPlant(-12, 196, 3.2, 0x3aa0d8);
  seaPlant(-11, 208, 4.4, 0x5ec4e8);
  seaPlant(11.5, 214, 3.8, 0x2f88c0);
  seaPlant(12.2, 232, 5.1, 0x4eb4dc);
  seaPlant(-12.4, 242, 3.5, 0x3aa0d8);
  seaPlant(11.4, 252, 4.0, 0x5ec4e8);

  const skyGirl = makeBillboard(poses.skyGirl, 2.6);
  skyGirl.position.set(11.5, 0, 36);
  world.add(skyGirl);
  billboards.push(skyGirl);
  const earthGirl = makeBillboard(poses.earthGirl, 2.4);
  earthGirl.position.set(-11.5, 0, 124);
  world.add(earthGirl);
  billboards.push(earthGirl);
  const seaGirl = makeBillboard(poses.seaGirl, 2.5);
  seaGirl.position.set(11.8, 0.2, 220);
  world.add(seaGirl);
  billboards.push(seaGirl);

  for (const spec of RINGS) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(RING_RADIUS, 0.16, 8, 28),
      new THREE.MeshBasicMaterial({ color: spec.color })
    );
    ring.position.set(spec.x, spec.y, spec.z);
    ring.userData = { ...spec, got: false };
    world.add(ring);
    ringMeshes.push(ring);
  }
}

function spawnSparks(x, y, z, color) {
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), new THREE.MeshBasicMaterial({ color }));
    p.position.set(x, y, z);
    p.userData.v = new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
    p.userData.life = 0.45;
    scene.add(p);
    sparkPool.push(p);
  }
}

function resetRun() {
  player.position.set(0, 5.2, 2);
  player.rotation.set(0, 0, 0);
  vx = 0;
  vy = 0;
  collected = 0;
  flightTime = 0;
  finished = false;
  started = false;
  for (const ring of ringMeshes) {
    ring.userData.got = false;
    ring.visible = true;
    ring.scale.set(1, 1, 1);
  }
  finishEl.hidden = true;
  onboardingEl.hidden = false;
  updateHud();
}

function zoneAt(z) {
  if (z >= ZONE_LEN * 2) return ZONES[2];
  if (z >= ZONE_LEN) return ZONES[1];
  return ZONES[0];
}

function updateHud() {
  const zone = zoneAt(player.position.z);
  placeNameEl.textContent = zone.name;
  crumbsEl.querySelectorAll("[data-zone]").forEach((el) => {
    if (el.getAttribute("data-zone") === zone.id) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
  });
  ringsEl.textContent = `Rings ${collected} / ${RINGS.length}`;
  const mul = keys.boost ? BOOST_MUL : 1;
  speedEl.textContent = `Speed ${mul.toFixed(1)}×`;
}

function startFlying() {
  if (started || finished) return;
  started = true;
  onboardingEl.hidden = true;
}

function endFlight() {
  finished = true;
  started = false;
  const t = flightTime.toFixed(1);
  finishLineEl.textContent = `${collected} of ${RINGS.length} rings · ${t}s`;
  finishEl.hidden = false;
}

function steer(dt) {
  let ix = -analog.x;
  let iy = analog.y;
  if (keys.left) ix += 1;
  if (keys.right) ix -= 1;
  if (keys.up) iy += 1;
  if (keys.down) iy -= 1;
  if (ix !== 0 || iy !== 0) startFlying();
  const acc = 22;
  vx += ix * acc * dt;
  vy += iy * acc * dt;
  vx *= 1 - Math.min(1, 4.2 * dt);
  vy *= 1 - Math.min(1, 4.2 * dt);
  const max = 9;
  vx = Math.max(-max, Math.min(max, vx));
  vy = Math.max(-max, Math.min(max, vy));
}

function movePlayer(dt) {
  if (!started || finished) return;
  flightTime += dt;
  const speed = BASE_SPEED * (keys.boost ? BOOST_MUL : 1);
  player.position.x += vx * dt;
  player.position.y += vy * dt;
  player.position.z += speed * dt;
  player.position.x = Math.max(-7.5, Math.min(7.5, player.position.x));
  player.position.y = Math.max(1.8, Math.min(11.5, player.position.y));
  player.rotation.z = vx * 0.05;
  player.rotation.x = vy * 0.02;
  if (dragonFly) {
    const boostScale = keys.boost ? 1.06 : 1;
    dragonFly.scale.setScalar(boostScale);
  }
  if (player.position.z >= FINISH_Z) endFlight();
}

function checkRings() {
  if (!started) return;
  const p = player.position;
  for (const ring of ringMeshes) {
    if (p.z - ring.position.z > 1.6) {
      ring.visible = false;
      continue;
    }
    if (ring.userData.got) continue;
    const dz = p.z - ring.position.z;
    if (dz < -1.2 || dz > 1.4) continue;
    const dx = p.x - ring.position.x;
    const dy = p.y - ring.position.y;
    if (dx * dx + dy * dy < RING_RADIUS * RING_RADIUS) {
      ring.userData.got = true;
      ring.visible = false;
      collected += 1;
      spawnSparks(ring.position.x, ring.position.y, ring.position.z, ring.userData.color);
    }
  }
}

function updateCamera(dt) {
  const p = player.position;
  const target = new THREE.Vector3(p.x * 0.35, p.y + 1.8, p.z - 9.5);
  camera.position.lerp(target, 1 - Math.pow(0.0008, dt));
  camera.lookAt(p.x, p.y + 0.3, p.z + 12);
}

function updateZoneLook() {
  const zone = zoneAt(player.position.z);
  scene.background = new THREE.Color(zone.sky);
  scene.fog = new THREE.Fog(zone.fog, 22, zone.id === "sea" ? 96 : 82);
}

function updateSparks(dt) {
  for (let i = sparkPool.length - 1; i >= 0; i--) {
    const p = sparkPool[i];
    p.userData.life -= dt;
    p.position.addScaledVector(p.userData.v, dt);
    if (p.userData.life <= 0) {
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      sparkPool.splice(i, 1);
    }
  }
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
  if (k === "w" || k === "arrowup") keys.up = down;
  if (k === "s" || k === "arrowdown") keys.down = down;
  if (k === "a" || k === "arrowleft") keys.left = down;
  if (k === "d" || k === "arrowright") keys.right = down;
  if (k === "shift") keys.boost = down;
  if (down && (k === " " || k === "enter")) {
    e.preventDefault();
    if (finished) resetRun();
    else startFlying();
  }
}

function bindStick() {
  if (window.matchMedia("(pointer: coarse)").matches) touchEl.hidden = false;
  let active = false;
  const setFromEvent = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (t.clientX - cx) / (rect.width / 2);
    let dy = (t.clientY - cy) / (rect.height / 2);
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }
    analog.x = dx;
    analog.y = -dy;
    stickKnobEl.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
    startFlying();
  };
  const end = () => {
    active = false;
    analog.x = 0;
    analog.y = 0;
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
  });
  boostBtn.addEventListener("pointerup", () => {
    keys.boost = false;
  });
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  steer(dt);
  movePlayer(dt);
  checkRings();
  updateCamera(dt);
  updateZoneLook();
  updateSparks(dt);
  updateHud();
  for (const ring of ringMeshes) {
    if (!ring.userData.got) ring.rotation.z += dt * 1.4;
  }
  for (const board of billboards) {
    board.visible = board.position.z > player.position.z + 2;
  }
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
    if (!started && !finished) startFlying();
  });
  bindStick();

  const jobs = {
    playerFly: "assets/characters/blue-princess-dragon-fly.png",
    skyGirl: "assets/characters/sky-dragon-girl.png",
    earthGirl: "assets/characters/earth-dragon-girl.png",
    seaGirl: "assets/characters/sea-dragon-girl.png",
    sky: "assets/backgrounds/sky-dragon-city.png",
    earth: "assets/backgrounds/earth-dragon-city.png",
    sea: "assets/backgrounds/sea-dragon-city.png",
    hills: "assets/backgrounds/dragon-city-hills.png",
    flag: "assets/elements/flag.png",
  };
  const imgs = {};
  await Promise.all(
    Object.entries(jobs).map(async ([key, src]) => {
      imgs[key] = await loadImage(src);
    })
  );

  poses.playerFly = canvasTexture(cutFull(imgs.playerFly));
  poses.skyGirl = canvasTexture(cutGrid(imgs.skyGirl, 2, 2, 1, 0));
  poses.earthGirl = canvasTexture(cutGrid(imgs.earthGirl, 2, 2, 0, 1));
  poses.seaGirl = canvasTexture(cutGrid(imgs.seaGirl, 2, 2, 1, 0));
  textures.sky = imageTexture(imgs.sky);
  textures.earth = imageTexture(imgs.earth);
  textures.sea = imageTexture(imgs.sea);
  textures.hills = imageTexture(imgs.hills);
  textures.flag = canvasTexture(cutFull(imgs.flag));

  dragonFly = makeBillboard(poses.playerFly, 3.25);
  dragonFly.position.y = 0;
  player.add(dragonFly);
  buildWorld();
  resetRun();
  camera.position.set(0, 7.2, -8);
  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  clock.getDelta();
  tick();
}

boot().catch((err) => {
  loadingEl.textContent = "Could not load 龍城 art.";
  console.error(err);
});
