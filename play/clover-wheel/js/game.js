/**
 * Clover-wheel Race — one neighborhood loop, Greenness Queen vs 小花.
 * Crayon sprites stay billboards. The road is the only 3D mesh that matters.
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
const ACCEL_RATE = 2.6;
const DECEL_RATE = 4.2;
const CAM_HEIGHT = 1.92;
const CAM_LOOK_Y = 0.74;
const RIVAL_SPEED = 14.2;
const RIVAL_RIDER_H = 3.55;
/** Small deck under 小花's stance (not full prop scale). */
const RIVAL_SKATE_H = 0.58;

const view = document.getElementById("view");
const lapEl = document.getElementById("lap");
const placeEl = document.getElementById("place");
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

const player = { u: 0, lat: -0.8, speed: 0, spin: 0, group: new THREE.Group() };
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
  const WHEEL_SOFT_NEXT_SCALE = 0.6;
  const QUEEN_ON_WHEEL_FRAC = 0.6;
  const wheelW = Math.round(queenW * 3.05 * WHEEL_SOFT_NEXT_SCALE);
  const wheelH = Math.round((wheel.height / wheel.width) * wheelW);
  const queenDrawW = Math.round(wheelW * QUEEN_ON_WHEEL_FRAC);
  const queenDrawH = Math.round((queenH / queenW) * queenDrawW);
  const padX = 36;
  const padTop = 22;
  const wheelOverlap = wheelH * 0.17;
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
  const angle = 0.27;
  const size = Math.ceil(Math.hypot(src.width, src.height) * 1.08);
  const stage = document.createElement("canvas");
  stage.width = size;
  stage.height = size;
  const ctx = stage.getContext("2d");
  ctx.translate(size / 2, size / 2);
  ctx.rotate(angle);
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
  if (!player.rider || !player.queenPoses) return;
  const { stand, riding, wave } = player.queenPoses;
  const h = player.riderH;
  if (finished) setSpriteTexture(player.rider, wave, h);
  else if (!started) setSpriteTexture(player.rider, stand, h);
  else setSpriteTexture(player.rider, riding, player.rideH);
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
}

function buildWorld(textures) {
  buildRoad();
  addSidePage(textures.neighborhood, 0.18, 4.6);
  addSidePage(textures.neighborhood, 0.68, 4.2);
  addSidePage(textures.mall, 0.42, 4.4);
  addSidePage(textures.mall, 0.9, 4.2);
  for (let i = 0; i < 8; i++) {
    const s = sample(i / 8 + 0.05);
    tree(s.x - s.rx * 11, s.z - s.rz * 11);
  }
  const scooter = makeSprite(textures.scooter, 1.6);
  const spot = sample(0.22);
  scooter.position.set(spot.x + spot.rx * 8, 0, spot.z + spot.rz * 8);
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
  racer.fx = s.fx;
  racer.fz = s.fz;
}

function onRoad(lat) {
  return Math.abs(lat) <= ROAD_HALF;
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
  rival.group.scale.setScalar(1);
  placeRacer(player);
  placeRacer(rival);
  const startFrame = sample(player.u);
  camForward.fx = startFrame.fx;
  camForward.fz = startFrame.fz;
  updateQueenPose();
  updateCamera(0);
  updateRivalReadability();
  updateHud();
}

function updateHud() {
  const lap = Math.min(LAPS, Math.floor(player.u) + 1);
  lapEl.textContent = `Lap ${lap} / ${LAPS}`;
  placeEl.textContent = player.u + 0.01 >= rival.u ? "1st" : "2nd";
}

function updateRace(dt) {
  const ix = steerInput();
  if (ix !== 0 || keys.boost) startRace();
  if (!started || finished) return;
  raceTime += dt;
  player.lat = Math.max(-LAT_MAX, Math.min(LAT_MAX, player.lat + ix * 6.6 * dt));
  const grip = onRoad(player.lat) ? 1 : 0.42;
  const target = keys.boost ? BASE_SPEED * BOOST_MUL * grip : 0;
  const rate = keys.boost ? ACCEL_RATE : DECEL_RATE;
  player.speed += (target - player.speed) * Math.min(1, rate * dt);
  player.u += (player.speed * dt) / TRACK_LEN;
  player.spin += player.speed * dt * 0.35;

  rival.lat = Math.sin(raceTime * 0.42 + 0.6) * 0.75;
  rival.u += (RIVAL_SPEED * dt) / TRACK_LEN;
  rival.spin += RIVAL_SPEED * dt * 0.28;

  if (player.u >= LAPS) {
    player.u = LAPS;
    endRace();
  }
}

function updateCamera(dt) {
  const s = sample(player.u);
  const blend = dt > 0 ? 1 - Math.exp(-4.2 * dt) : 1;
  camForward.fx += (s.fx - camForward.fx) * blend;
  camForward.fz += (s.fz - camForward.fz) * blend;
  const fLen = Math.hypot(camForward.fx, camForward.fz) || 1;
  camForward.fx /= fLen;
  camForward.fz /= fLen;

  const px = player.group.position.x;
  const pz = player.group.position.z;
  const desired = new THREE.Vector3(px - camForward.fx * 6.8, CAM_HEIGHT, pz - camForward.fz * 6.8);
  if (dt > 0) camera.position.lerp(desired, 1 - Math.exp(-4.8 * dt));
  else camera.position.copy(desired);

  const aheadX = px + camForward.fx * 5.6;
  const aheadZ = pz + camForward.fz * 5.6;
  let lookX = aheadX;
  let lookZ = aheadZ;
  if (player.u + 0.012 < rival.u) {
    const gap = rival.u - player.u;
    const t = THREE.MathUtils.clamp(gap * 10, 0.22, 0.52);
    lookX = THREE.MathUtils.lerp(aheadX, rival.group.position.x, t);
    lookZ = THREE.MathUtils.lerp(aheadZ, rival.group.position.z, t);
  }
  camera.lookAt(lookX, CAM_LOOK_Y, lookZ);
}

function updateRivalReadability() {
  const dx = player.group.position.x - rival.group.position.x;
  const dz = player.group.position.z - rival.group.position.z;
  const alongTrack = dx * rival.fx + dz * rival.fz;
  const sep = Math.hypot(dx, dz);
  const camDist = rival.group.position.distanceTo(camera.position);
  const aheadBoost = alongTrack < -1.5 ? 0.24 : 0;
  let scale = 1.18 + (camDist - 8) * 0.058 + aheadBoost;
  if (alongTrack < -1.5 && sep < 22) {
    scale = Math.max(scale, 1.95 + (22 - sep) * 0.055);
  }
  rival.group.scale.setScalar(THREE.MathUtils.clamp(scale, 1.18, 2.85));
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
  placeRacer(player);
  placeRacer(rival);
  updateRivalReadability();
  updateSidePages();
  if (rival.board?.userData.spins) rival.board.material.rotation = rival.spin;
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

  const jobs = {
    queenStand: "assets/characters/greenness-queen-stand.png",
    queenWave: "assets/characters/greenness-queen-wave.png",
    xiaohuaSkate: "assets/characters/xiaohua-sunglasses-skate.png",
    wheel: "assets/elements/clover-wheel.png",
    skate: "assets/elements/skateboard.png",
    scooter: "assets/elements/scooter.png",
    neighborhood: "assets/backgrounds/neighborhood.png",
    mall: "assets/backgrounds/mall-city.png",
  };
  const imgs = {};
  await Promise.all(
    Object.entries(jobs).map(async ([key, src]) => {
      imgs[key] = await loadImage(src);
    })
  );

  const queenStandCanvas = cutFull(imgs.queenStand);
  const queenStand = canvasTexture(queenStandCanvas);
  const queenRidingCanvas = composeQueenOnCloverWheel(queenStandCanvas, cutFull(imgs.wheel));
  const queenRiding = canvasTexture(queenRidingCanvas);
  const queenWave = canvasTexture(cutFull(imgs.queenWave));
  const textures = {
    queenStand,
    queenRiding,
    queenWave,
    xiaohua: canvasTexture(cutFull(imgs.xiaohuaSkate)),
    wheel: canvasTexture(cutFull(imgs.wheel)),
    skate: canvasTexture(cutFull(imgs.skate)),
    skateDeck: canvasTexture(makeLevelSkateDeck(imgs.skate)),
    scooter: canvasTexture(cutFull(imgs.scooter)),
    neighborhood: imageTexture(imgs.neighborhood),
    mall: imageTexture(imgs.mall),
  };

  const riderH = 3.15;
  const rideH = 5.35;
  const you = mountRider(player.group, textures.queenStand, textures.wheel, riderH, 2.85, 0.34, false);
  const her = mountRider(
    rival.group,
    textures.xiaohua,
    textures.skateDeck,
    RIVAL_RIDER_H,
    RIVAL_SKATE_H,
    0.74,
    false
  );
  you.rider.userData.cast = "greenness-queen-on-clover-wheel";
  her.rider.userData.cast = "xiaohua-sunglasses-skate";
  her.board.userData.cast = "skateboard";
  you.board.visible = false;
  her.board.visible = true;
  her.board.position.y = 0.13;
  her.board.material.rotation = 0;
  const deckImg = textures.skateDeck.image;
  const deckW = RIVAL_SKATE_H * (deckImg.width / deckImg.height) * 0.82;
  her.board.scale.set(deckW, RIVAL_SKATE_H, 1);
  const deckTopY = her.board.position.y + RIVAL_SKATE_H * 0.5;
  her.rider.position.y = deckTopY - RIVAL_RIDER_H * 0.125;
  player.board = null;
  rival.board = her.board;
  player.rider = you.rider;
  player.riderH = riderH;
  player.rideH = rideH;
  player.queenPoses = { stand: queenStand, riding: queenRiding, wave: queenWave };
  rival.rider = her.rider;
  window.__cloverWheelRacerCast = () => ({
    player: started && !finished ? player.rider.userData.cast : "greenness-queen",
    rival: rival.rider.userData.cast,
    rivalVehicle: "skateboard",
  });
  buildWorld(textures);
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
