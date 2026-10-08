/**
 * God Sisters 3D Stroll — third-person walk through Isabel's garden, park, and pond.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ANGEL_URL = "assets/characters/isabel-angel.glb";
const ANGEL_SCALE = 1.65;
const FEET = 0.179;

const ASSETS = {
  maisie: { src: "assets/characters/maisie.png", cols: 8 },
  mermaid: { src: "assets/characters/mermaid.png", cols: 4 },
  portal: { src: "assets/elements/portal.png" },
  lily: { src: "assets/elements/lily-pad.png" },
  lotus: { src: "assets/elements/lotus.png" },
  garden: { src: "assets/backgrounds/garden.png" },
  park: { src: "assets/backgrounds/park.png" },
  pond: { src: "assets/backgrounds/full-pond.png" },
};

const PLACES = {
  garden: {
    name: "Garden",
    sky: 0xa8d4f0,
    fog: 0xb9d8ea,
    ground: 0x6fbf57,
    rim: 0x4e8f3a,
    radius: 13,
    spawn: { x: 0, z: 8.5, yaw: -0.42 },
    fromPark: { x: 2.6, z: 6.4, yaw: -Math.PI / 2 },
    water: { x: 2.2, z: 2.4, rx: 3.4, rz: 2.2 },
    backdrop: "garden",
  },
  park: {
    name: "Park",
    sky: 0xe7eef5,
    fog: 0xd5dde6,
    ground: 0xb7d08a,
    rim: 0x8eaf62,
    radius: 14,
    spawn: { x: 0, z: 6, yaw: 0 },
    fromGarden: { x: -5.2, z: 5.6, yaw: Math.PI / 2 },
    fromPond: { x: 5.2, z: 5.6, yaw: -Math.PI / 2 },
    backdrop: "park",
  },
  pond: {
    name: "Pond",
    sky: 0xd5e6f2,
    fog: 0xc5d7e4,
    ground: 0xc3d39a,
    rim: 0x8fa56a,
    radius: 14,
    spawn: { x: 0, z: 9, yaw: 0 },
    fromPark: { x: 0, z: 10, yaw: 0 },
    water: { x: 0, z: -0.4, rx: 7.2, rz: 4.6 },
    backdrop: "pond",
  },
};

const view = document.getElementById("view");
const placeNameEl = document.getElementById("place-name");
const crumbsEl = document.getElementById("crumbs");
const promptEl = document.getElementById("prompt");
const talkEl = document.getElementById("talk");
const talkWhoEl = document.getElementById("talk-who");
const talkLineEl = document.getElementById("talk-line");
const onboardingEl = document.getElementById("onboarding");
const loadingEl = document.getElementById("loading");
const fadeEl = document.getElementById("fade");
const touchEl = document.getElementById("touch");
const stickEl = document.getElementById("stick");
const stickKnobEl = document.getElementById("stick-knob");
const actionBtn = document.getElementById("action-btn");

const keys = { w: false, a: false, s: false, d: false };
const analog = { x: 0, z: 0 };
const images = {};
const poses = {};
const textures = {};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
view.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff4e4, 0x6d8f55, 1.05));
const sun = new THREE.DirectionalLight(0xfff8e8, 0.9);
sun.position.set(8, 16, 10);
scene.add(sun);

const world = new THREE.Group();
const playerGroup = new THREE.Group();
scene.add(world);
scene.add(playerGroup);

const state = {
  place: "garden",
  started: false,
  traveling: false,
  portalArmed: true,
  talking: false,
  talkQueue: [],
  talkWho: "",
  prompt: null,
  flags: { park: false, pond: false, mermaid: false },
  camYaw: 0,
  camPitch: 0.38,
  camDist: 9.5,
  dragging: false,
  lastX: 0,
  lastY: 0,
  bob: 0,
  facing: 1,
};

let angel;
let mixer;
let clips = {};
let currentClip = "";
let waving = false;
let interactables = [];
let waters = [];
let pads = [];
let clock = new THREE.Clock();

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
    if (d[i] > 238 && d[i + 1] > 238 && d[i + 2] > 238) d[i + 3] = 0;
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
  const y0 = img.height * 0.08;
  const cellH = img.height * 0.54;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(cellW));
  c.height = Math.max(1, Math.floor(cellH));
  const ctx = c.getContext("2d");
  ctx.drawImage(img, cellW * index, y0, cellW, cellH, 0, 0, c.width, c.height);
  ctx.clearRect(0, c.height * 0.88, c.width, c.height * 0.12);
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
  mesh.userData.height = height;
  return mesh;
}

function makeDecal(tex, width) {
  const img = tex.image;
  const depth = width * (img.height / img.width);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.05;
  return mesh;
}

function clearWorld() {
  while (world.children.length) {
    const child = world.children[0];
    world.remove(child);
    child.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m.map && m.map.userData && m.map.userData.disposeOnClear) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
  interactables = [];
  waters = [];
  pads = [];
}

function addTree(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.24 * scale, 1.6 * scale, 8), mat(0x7a4b2a));
  trunk.position.y = 0.8 * scale;
  g.add(trunk);
  const leafMat = mat(0x3c9a4a);
  const crowns = [
    [0, 2.1, 0, 1],
    [-0.55, 1.85, 0.15, 0.72],
    [0.5, 1.8, -0.1, 0.7],
    [0.1, 2.45, 0.2, 0.55],
  ];
  for (const [ox, oy, oz, s] of crowns) {
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.85 * scale * s, 10, 10), leafMat);
    foliage.position.set(ox * scale, oy * scale, oz * scale);
    g.add(foliage);
  }
  world.add(g);
}

function addFlower(x, z, color) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 5), mat(0x2f7a32));
  stem.position.y = 0.22;
  g.add(stem);
  const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), mat(color));
  bloom.position.y = 0.48;
  g.add(bloom);
  world.add(g);
}

function addWater(spec) {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshStandardMaterial({
      color: 0x4aa3d9,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(spec.x, 0.03, spec.z);
  water.scale.set(spec.rx, spec.rz, 1);
  world.add(water);
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.05, 40),
    mat(0x2e6f9a)
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(spec.x, 0.035, spec.z);
  rim.scale.set(spec.rx, spec.rz, 1);
  world.add(rim);
  waters.push(spec);
}

function insideEllipse(x, z, spec) {
  const dx = (x - spec.x) / spec.rx;
  const dz = (z - spec.z) / spec.rz;
  return dx * dx + dz * dz < 1;
}

function onPad(x, z) {
  return pads.some((p) => {
    const dx = x - p.x;
    const dz = z - p.z;
    return dx * dx + dz * dz < p.r * p.r;
  });
}

function inBounds(x, z, radius) {
  return x * x + z * z < radius * radius * 0.92;
}

function addBackdrop(key, radius) {
  const tex = textures[key];
  const img = tex.image;
  const aspect = img.width / img.height;
  const h = 13.5;
  const w = Math.min(h * aspect, radius * 2.4);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, fog: true })
  );
  mesh.position.set(0, h * 0.42, -radius + 0.4);
  world.add(mesh);
}

function addPortal(x, z, to, spawnKey, label) {
  const mesh = makeBillboard(textures.portal, 2.6);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(mesh);
  g.userData.billboard = mesh;
  world.add(g);
  interactables.push({
    type: "portal",
    x,
    z,
    r: 1.7,
    mesh: g,
    label,
    use() {
      travel(to, spawnKey);
    },
  });
}

function addNpc(poseTex, x, z, height, who, lines, flag) {
  const mesh = makeBillboard(poseTex, height);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(mesh);
  g.userData.billboard = mesh;
  world.add(g);
  interactables.push({
    type: "npc",
    x,
    z,
    r: 2.1,
    mesh: g,
    label: `E — talk to ${who}`,
    use() {
      openTalk(who, typeof lines === "function" ? lines() : lines);
      if (flag) state.flags[flag] = true;
    },
  });
}

function maisieLines() {
  if (state.flags.mermaid) {
    return ["You found her! YAY.", "We can hop the pads another day. For now this is our walk."];
  }
  if (state.flags.park) {
    return ["The mermaid is at the full-size pond. Keep going through the park door."];
  }
  return [
    "Isabel! God sisters?",
    "Walk to the rainbow door. The park is that way.",
    "The mermaid is waiting at the full-size pond.",
  ];
}

function buildPlace(id, spawnKey) {
  const place = PLACES[id];
  clearWorld();
  state.place = id;
  scene.background = new THREE.Color(place.sky);
  scene.fog = new THREE.Fog(place.fog, 16, 42);

  const island = new THREE.Mesh(new THREE.CircleGeometry(place.radius, 56), mat(place.ground));
  island.rotation.x = -Math.PI / 2;
  world.add(island);
  const rim = new THREE.Mesh(new THREE.RingGeometry(place.radius * 0.98, place.radius * 1.08, 56), mat(place.rim));
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = -0.02;
  world.add(rim);

  addBackdrop(place.backdrop, place.radius);
  if (place.water) addWater(place.water);

  if (id === "garden") {
    const path = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 11.5), mat(0xc4955a));
    path.position.set(-1.1, 0.02, 2.8);
    path.rotation.y = 0.28;
    world.add(path);
    addTree(-7.2, -3.2, 1.15);
    addFlower(-3.4, 5.2, 0xef4d7a);
    addFlower(-5.1, 3.4, 0xf2d14a);
    addFlower(6.4, 5.6, 0xe85b3a);
    addFlower(5.1, 3.2, 0xc45ad6);
    addFlower(4.4, 5.1, 0xf2d14a);
    addFlower(7.2, -2.4, 0xef4d7a);
    addNpc(poses.maisie.school, -3.6, 2.6, 1.7, "Maisie", maisieLines);
    addPortal(5.4, 6.8, "park", "fromGarden", "E — Park");
  }

  if (id === "park") {
    addTree(-5.8, -2.4, 1.45);
    addTree(6.2, -1.6, 1.2);
    addTree(-2.4, 4.8, 0.85);
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 12), mat(0xffe066, { emissive: 0xffcc33, emissiveIntensity: 0.4 }));
    sunMesh.position.set(8.5, 9.5, -8);
    world.add(sunMesh);
    addPortal(-8.4, 5.6, "garden", "fromPark", "E — Garden");
    addPortal(8.4, 5.6, "pond", "fromPark", "E — Pond");
  }

  if (id === "pond") {
    const lilySpots = [
      { x: 0, z: 4.1, w: 2.4 },
      { x: -3.2, z: 1.4, w: 1.9 },
      { x: 3.1, z: 1.1, w: 1.8 },
    ];
    for (const spot of lilySpots) {
      const pad = makeDecal(textures.lily, spot.w);
      pad.position.set(spot.x, 0.06, spot.z);
      pad.rotation.z = spot.x * 0.2;
      world.add(pad);
      pads.push({ x: spot.x, z: spot.z, r: spot.w * 0.5 });
    }
    const lotus = makeDecal(textures.lotus, 2.4);
    lotus.position.set(0, 0.08, -0.5);
    world.add(lotus);
    addNpc(poses.mermaid.invite, 0, 4.3, 1.55, "Mermaid", [
      "Join our team — YAY!",
      "This is the full-size pond. Come back when you want to jump.",
    ], "mermaid");
    addPortal(8.2, 6.6, "park", "fromPond", "E — Park");
  }

  const spawn = place[spawnKey] || place.spawn;
  playerGroup.position.set(spawn.x, 0, spawn.z);
  state.camYaw = spawn.yaw ?? 0;
  state.portalArmed = false;
  updateCrumbs();
  placeNameEl.textContent = place.name;
}

function updateCrumbs() {
  crumbsEl.querySelectorAll("[data-place]").forEach((el) => {
    const id = el.getAttribute("data-place");
    if (id === state.place) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
    if (state.flags[id] || id === "garden" || id === state.place) el.style.opacity = "1";
    else el.style.opacity = "0.45";
  });
}

function travel(to, spawnKey) {
  if (state.traveling) return;
  state.traveling = true;
  closeTalk();
  fadeEl.classList.add("on");
  setTimeout(() => {
    if (to === "park") state.flags.park = true;
    if (to === "pond") state.flags.pond = true;
    buildPlace(to, spawnKey);
    fadeEl.classList.remove("on");
    state.traveling = false;
    state.prompt = null;
    promptEl.hidden = true;
  }, 240);
}

function openTalk(who, lines) {
  state.talking = true;
  state.talkWho = who;
  state.talkQueue = lines.slice();
  talkWhoEl.textContent = who;
  talkLineEl.textContent = state.talkQueue.shift() || "";
  talkEl.hidden = false;
  promptEl.hidden = true;
}

function advanceTalk() {
  if (!state.talking) return;
  if (!state.talkQueue.length) {
    closeTalk();
    return;
  }
  talkLineEl.textContent = state.talkQueue.shift();
}

function closeTalk() {
  state.talking = false;
  state.talkQueue = [];
  talkEl.hidden = true;
}

function nearestInteractable() {
  const px = playerGroup.position.x;
  const pz = playerGroup.position.z;
  let best = null;
  let bestD = 99;
  for (const item of interactables) {
    const dx = px - item.x;
    const dz = pz - item.z;
    const d = Math.hypot(dx, dz);
    if (d < item.r && d < bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}

function tryUse() {
  if (state.talking) {
    advanceTalk();
    return;
  }
  const item = nearestInteractable();
  if (item) item.use();
}

function flatten(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const source = Array.isArray(obj.material) ? obj.material : [obj.material];
    const basic = source.map((mat) => {
      const emissive = mat.emissive;
      const glow = emissive && emissive.r + emissive.g + emissive.b > 0.05;
      const color = glow ? emissive.clone() : mat.color.clone();
      return new THREE.MeshBasicMaterial({
        color,
        map: mat.map || null,
        transparent: mat.transparent,
        opacity: mat.opacity,
        side: THREE.DoubleSide,
      });
    });
    obj.material = Array.isArray(obj.material) ? basic : basic[0];
  });
}

function shortName(name) {
  const parts = name.split(/[|/]/);
  return parts[parts.length - 1];
}

function playClip(name, loop) {
  const action = clips[name];
  if (!action) return;
  if (currentClip === name && action.isRunning()) return;
  for (const key of Object.keys(clips)) {
    if (key !== name) clips[key].fadeOut(0.12);
  }
  action.reset();
  action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
  action.clampWhenFinished = !loop;
  action.enabled = true;
  action.fadeIn(0.12).play();
  currentClip = name;
}

function updatePose(moving) {
  if (!angel) return;
  if (state.talking || state.traveling) {
    waving = false;
    playClip("Idle", true);
    return;
  }
  if (waving) {
    const wave = clips.Wave;
    if (wave && wave.isRunning() && !wave.paused) return;
    waving = false;
  }
  playClip(moving ? "Walk" : "Idle", true);
}

function startWave() {
  if (!clips.Wave || state.talking || state.traveling) return;
  waving = true;
  currentClip = "";
  playClip("Wave", false);
}

function movePlayer(dt) {
  if (!angel || !state.started || state.talking || state.traveling) return false;
  let ix = analog.x;
  let iz = analog.z;
  if (keys.a) ix -= 1;
  if (keys.d) ix += 1;
  if (keys.w) iz += 1;
  if (keys.s) iz -= 1;
  if (ix === 0 && iz === 0) return false;
  const len = Math.hypot(ix, iz) || 1;
  ix /= len;
  iz /= len;
  const lookX = -Math.sin(state.camYaw);
  const lookZ = -Math.cos(state.camYaw);
  const rightX = Math.cos(state.camYaw);
  const rightZ = -Math.sin(state.camYaw);
  const mx = lookX * iz + rightX * ix;
  const mz = lookZ * iz + rightZ * ix;
  const speed = 5.6;
  const nx = playerGroup.position.x + mx * speed * dt;
  const nz = playerGroup.position.z + mz * speed * dt;
  const place = PLACES[state.place];
  const waterHit = waters.some((w) => insideEllipse(nx, nz, w));
  if (inBounds(nx, nz, place.radius) && !(waterHit && !onPad(nx, nz))) {
    playerGroup.position.x = nx;
    playerGroup.position.z = nz;
  }
  const face = Math.atan2(mx, mz);
  const turn = face - angel.rotation.y;
  const wrapped = Math.atan2(Math.sin(turn), Math.cos(turn));
  angel.rotation.y += wrapped * (1 - Math.exp(-14 * dt));
  return true;
}

function updateCamera() {
  const px = playerGroup.position.x;
  const pz = playerGroup.position.z;
  const dist = state.camDist;
  const pitch = state.camPitch;
  const yaw = state.camYaw;
  camera.position.set(
    px + Math.sin(yaw) * Math.cos(pitch) * dist,
    1.35 + Math.sin(pitch) * dist,
    pz + Math.cos(yaw) * Math.cos(pitch) * dist
  );
  camera.lookAt(px, 1.15, pz);
}

function faceBillboards() {
  const camX = camera.position.x;
  const camZ = camera.position.z;
  world.traverse((obj) => {
    const sprite = obj.userData && obj.userData.billboard;
    if (!sprite) return;
    sprite.rotation.y = Math.atan2(camX - obj.position.x, camZ - obj.position.z);
  });
}

function updatePrompt() {
  if (state.talking || state.traveling || !state.started) {
    promptEl.hidden = true;
    return;
  }
  const item = nearestInteractable();
  if (!item) {
    promptEl.hidden = true;
    state.prompt = null;
    state.portalArmed = true;
    return;
  }
  if (item.type === "portal") {
    const d = Math.hypot(playerGroup.position.x - item.x, playerGroup.position.z - item.z);
    if (!state.portalArmed) {
      if (d > item.r * 1.2) state.portalArmed = true;
    } else if (d < 1.15) {
      item.use();
      return;
    }
  }
  state.prompt = item;
  promptEl.textContent = item.label;
  promptEl.hidden = false;
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
  if (k === "w" || k === "arrowup") keys.w = down;
  if (k === "s" || k === "arrowdown") keys.s = down;
  if (k === "a" || k === "arrowleft") keys.a = down;
  if (k === "d" || k === "arrowright") keys.d = down;
  if (down && (k === "e" || k === " ")) {
    e.preventDefault();
    tryUse();
  }
  if (down && k === "f") {
    e.preventDefault();
    startWalking();
    startWave();
  }
  if (down && e.shiftKey && (k === "1" || k === "2" || k === "3")) {
    const map = { 1: ["garden", "spawn"], 2: ["park", "spawn"], 3: ["pond", "spawn"] };
    travel(map[k][0], map[k][1]);
  }
  if (down && (keys.w || keys.a || keys.s || keys.d)) startWalking();
}

function startWalking() {
  if (state.started) return;
  state.started = true;
  onboardingEl.hidden = true;
}

function bindPointer() {
  view.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.camYaw -= dx * 0.005;
    state.camPitch = Math.min(1.05, Math.max(0.12, state.camPitch + dy * 0.004));
  });
  view.addEventListener("pointerup", () => {
    state.dragging = false;
  });
  view.addEventListener("pointerleave", () => {
    state.dragging = false;
  });
  view.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      state.camDist = Math.min(16, Math.max(5.5, state.camDist + e.deltaY * 0.01));
    },
    { passive: false }
  );
}

function bindStick() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    touchEl.hidden = false;
  }
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
    analog.z = -dy;
    stickKnobEl.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
    startWalking();
  };
  const end = () => {
    active = false;
    analog.x = 0;
    analog.z = 0;
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
  actionBtn.addEventListener("click", (e) => {
    e.preventDefault();
    tryUse();
  });
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const moving = movePlayer(dt);
  updatePose(moving);
  if (mixer) mixer.update(dt);
  updateCamera();
  faceBillboards();
  updatePrompt();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  talkEl.addEventListener("click", advanceTalk);
  bindPointer();
  bindStick();

  const jobs = Object.entries(ASSETS).map(async ([key, spec]) => {
    const img = await loadImage(spec.src);
    images[key] = img;
    if (spec.cols) {
      poses[key] = {};
      if (key === "maisie") {
        poses.maisie.school = canvasTexture(cutCell(img, spec.cols, 0));
      } else if (key === "mermaid") {
        poses.mermaid.invite = canvasTexture(cutCell(img, spec.cols, 1));
      }
    } else if (key === "garden" || key === "park" || key === "pond") {
      textures[key] = imageTexture(img);
    } else {
      textures[key] = canvasTexture(cutFull(img));
    }
  });
  const angelGltf = await new GLTFLoader().loadAsync(ANGEL_URL);
  angel = angelGltf.scene;
  flatten(angel);
  angel.scale.setScalar(ANGEL_SCALE);
  angel.position.y = -FEET * ANGEL_SCALE;
  playerGroup.add(angel);
  mixer = new THREE.AnimationMixer(angel);
  mixer.addEventListener("finished", (event) => {
    if (event.action === clips.Wave) waving = false;
  });
  for (const clip of angelGltf.animations) {
    clips[shortName(clip.name)] = mixer.clipAction(clip);
  }
  playClip("Idle", true);

  await Promise.all(jobs);

  buildPlace("garden", "spawn");
  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  clock.getDelta();
  tick();
}

boot().catch((err) => {
  loadingEl.textContent = "Could not load Isabel art.";
  console.error(err);
});
