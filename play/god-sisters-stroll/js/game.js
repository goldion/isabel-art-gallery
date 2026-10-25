/**
 * God Sisters 3D Stroll — third-person walk through Isabel's garden, park, and pond.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ANGEL_URL = "assets/characters/isabel-angel.glb";
const ANGEL_SCALE = 1.65;
const FEET = 0.179;
const MAISIE_URL = "assets/characters/maisie-school.glb?v=15";
const MAISIE_HEIGHT = 1.68;
const MERMAID_URL = "assets/characters/mermaid-invite.glb?v=15";
const MERMAID_HEIGHT = 1.55;

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
let maisieTemplate;
let mermaidTemplate;
let mixer;
let clips = {};
let currentClip = "";
let waving = false;
let interactables = [];
let waters = [];
let pads = [];
let blockers = [];
const BODY = 0.34;
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
  blockers = [];
}

function blockCircle(x, z, r) {
  blockers.push({ x, z, r });
}

function blockBox(x, z, hx, hz) {
  blockers.push({ x, z, hx, hz });
}

function hitsBlocker(x, z) {
  for (const b of blockers) {
    const dx = x - b.x;
    const dz = z - b.z;
    if (b.hx != null) {
      if (Math.abs(dx) < b.hx + BODY && Math.abs(dz) < b.hz + BODY) return true;
    } else {
      const reach = b.r + BODY;
      if (dx * dx + dz * dz < reach * reach) return true;
    }
  }
  return false;
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
  blockCircle(x, z, 0.95 * scale);
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

function gableGeometry(width, depth, height) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function addBox(parent, w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function addBush(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const leaf = mat(0x3f8f3a);
  const puffs = [
    [0, 0.42, 0, 0.55],
    [-0.38, 0.34, 0.08, 0.38],
    [0.36, 0.32, -0.06, 0.36],
  ];
  for (const [ox, oy, oz, r] of puffs) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 8, 8), leaf);
    puff.position.set(ox * scale, oy * scale, oz * scale);
    g.add(puff);
  }
  world.add(g);
  blockCircle(x, z, 0.72 * scale);
}

function addBirdhouse(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.7, 6), mat(0x6b4226));
  post.position.y = 0.85;
  g.add(post);
  addBox(g, 0.72, 0.64, 0.56, 0xc4894a, 0, 1.95, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 4), mat(0xd24a3a));
  roof.position.y = 2.5;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), mat(0x1c140f));
  hole.position.set(0, 2.0, 0.29);
  g.add(hole);
  world.add(g);
  blockCircle(x, z, 0.4);
}

function addWindow(parent, x, y, z) {
  addBox(parent, 1.2, 1.08, 0.08, 0x6b3a22, x, y, z);
  addBox(parent, 0.96, 0.84, 0.06, 0x7eb6e0, x, y, z + 0.04);
  addBox(parent, 0.06, 0.84, 0.04, 0x6b3a22, x, y, z + 0.08);
  addBox(parent, 0.96, 0.06, 0.04, 0x6b3a22, x, y, z + 0.08);
}

function addGardenHouse(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  addBox(g, 6.6, 2.7, 4.2, 0xf0d36a, 0, 1.35, 0);
  const roof = new THREE.Mesh(gableGeometry(7.4, 5.0, 1.6), mat(0x8d4e28));
  roof.position.y = 2.7;
  g.add(roof);
  addBox(g, 1.15, 1.95, 0.12, 0x7a4a2a, 0, 0.98, 2.16);
  addBox(g, 0.1, 0.1, 0.08, 0x2a241c, 0.38, 0.95, 2.26);
  addWindow(g, -1.9, 1.72, 2.16);
  addWindow(g, 1.9, 1.72, 2.16);
  world.add(g);
  blockBox(x, z, 3.3, 2.1);
}

function addTuft(x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const green = mat(0x4e9a45);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08 * scale, 0.4 * scale, 4), green);
    blade.position.set((i - 1) * 0.12 * scale, 0.18 * scale, 0);
    blade.rotation.z = (i - 1) * 0.4;
    g.add(blade);
  }
  world.add(g);
}

function addSun(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const sunMat = mat(0xffe066, { emissive: 0xffcc33, emissiveIntensity: 0.55 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 14), sunMat));
  for (let i = 0; i < 8; i++) {
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.08), sunMat);
    const angle = (i / 8) * Math.PI * 2;
    ray.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 0);
    ray.rotation.z = angle + Math.PI / 2;
    g.add(ray);
  }
  world.add(g);
}

function addPathThrough(points) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const path = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, Math.hypot(dx, dz) + 0.4), mat(0xc4955a));
    path.position.set((a[0] + b[0]) / 2, 0.03, (a[1] + b[1]) / 2);
    path.rotation.y = Math.atan2(dx, dz);
    world.add(path);
  }
}

function addReed(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const leaf = mat(0x2f7a3a);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.9 + i * 0.12, 4), leaf);
    blade.position.set((i - 1.5) * 0.12, 0.45, (i % 2) * 0.08);
    blade.rotation.z = (i - 1.5) * 0.18;
    g.add(blade);
  }
  world.add(g);
}

function addRock(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const stone = mat(0x8d867c);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), stone);
  body.scale.set(1.3, 0.7, 1);
  body.position.y = 0.28;
  g.add(body);
  const nub = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 6), stone);
  nub.scale.set(1.1, 0.75, 0.9);
  nub.position.set(0.35, 0.22, 0.1);
  g.add(nub);
  world.add(g);
  blockCircle(x, z, 0.75);
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

const MAISIE_SHADER = /* glsl */ `
vec3 maisieEye(vec3 p, vec3 color, vec2 c) {
  vec2 d = (p.xy - c) / vec2(0.058, 0.046);
  float r = length(d);
  float browY = c.y + 0.072 - 0.004 * d.x * d.x;
  if (r > 1.2 && abs(d.x) < 0.85 && abs(p.y - browY) < 0.0045 && p.z > 0.16) {
    return vec3(0.12, 0.07, 0.08);
  }
  if (r > 1.02) return color;
  vec2 iris = (p.xy - c + vec2(0.0, 0.004)) / vec2(0.030, 0.028);
  if (length(iris) > 1.0) return vec3(0.99, 0.97, 0.95);
  vec2 pupil = (p.xy - c + vec2(0.0, 0.006)) / vec2(0.013, 0.014);
  if (length(pupil) < 1.0) {
    vec2 shine = (p.xy - c - vec2(-0.010, 0.012)) / vec2(0.006, 0.005);
    if (length(shine) < 1.0) return vec3(1.0);
    return vec3(0.08, 0.05, 0.05);
  }
  return vec3(0.42, 0.22, 0.11);
}

vec3 maisieSchool(vec3 p) {
  float t = (p.y + 0.9507954) / 1.8983955;
  vec3 skin = vec3(0.98, 0.74, 0.60);
  vec3 hair = vec3(0.09, 0.06, 0.07);
  vec3 color = skin;
  if (t < 0.058) color = vec3(0.99, 0.78, 0.14);
  else if (t < 0.395) color = vec3(0.24, 0.45, 0.86);
  else if (t < 0.63) color = vec3(0.98, 0.36, 0.55);

  float ax = p.x + 0.08;
  float bangLine = 0.622 + ax * ax * 0.7;
  bool face = p.z > 0.16 && p.y < bangLine && p.y > 0.38 && abs(ax) < 0.15;
  bool bangs = p.y > bangLine && p.z > -0.08 && abs(ax) < 0.32;
  bool tail = p.z < -0.05;
  bool sides = abs(ax) > 0.12 && abs(ax) < 0.34 && p.y > 0.40 && p.y < 0.78 && p.z > -0.08 && p.z < 0.24;
  if ((bangs || tail || sides || p.y > 0.76) && !face) color = hair;
  vec3 tieQ = (p - vec3(0.05, 0.90, -0.11)) / vec3(0.04, 0.016, 0.028);
  if (dot(tieQ, tieQ) < 1.0) color = vec3(0.98, 0.42, 0.62);
  if (t > 0.40 && t < 0.52 && (p.x < -0.22 || p.x > 0.04) && p.z > -0.02) color = skin;
  if (t > 0.32 && t < 0.43 && (p.x < -0.26 || p.x > 0.07) && p.z > 0.02) color = skin;

  if (p.z > 0.18) {
    color = maisieEye(p, color, vec2(-0.168, 0.568));
    color = maisieEye(p, color, vec2(-0.050, 0.568));
    float u = (p.x + 0.11) / 0.078;
    if (abs(u) < 1.05 && p.z > 0.23) {
      float smileY = 0.448 + 0.020 * u * u;
      float band = abs(p.y - smileY);
      if (band < 0.0075) color = vec3(0.70, 0.28, 0.32);
    }
    vec2 cheekA = (p.xy - vec2(-0.205, 0.505)) / vec2(0.032, 0.020);
    vec2 cheekB = (p.xy - vec2(-0.015, 0.505)) / vec2(0.032, 0.020);
    float blush = max(1.0 - dot(cheekA, cheekA), 1.0 - dot(cheekB, cheekB));
    if (blush > 0.0 && p.z > 0.20) color = mix(color, vec3(0.96, 0.45, 0.50), clamp(blush, 0.0, 1.0) * 0.45);
  }
  return color;
}
`;

function maisieMaterial() {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMaisiePos;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vMaisiePos = position;
float hairBack = smoothstep(-0.02, -0.10, position.z);
float hairDrop = smoothstep(0.88, 0.28, position.y);
float hairBow = hairDrop * (1.0 - hairDrop);
transformed.x += hairBack * (0.20 * hairDrop + 0.10 * hairBow);
transformed.z += hairBack * 0.14 * hairDrop;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vMaisiePos;\n${MAISIE_SHADER}`)
      .replace("#include <color_fragment>", "diffuseColor.rgb = maisieSchool(vMaisiePos);");
  };
  return material;
}

function addMaisie(x, z, who, lines) {
  const model = maisieTemplate.clone(true);
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.geometry = obj.geometry.clone();
    obj.material = maisieMaterial();
  });
  const box = new THREE.Box3().setFromObject(model);
  const scale = MAISIE_HEIGHT / Math.max(0.001, box.max.y - box.min.y);
  model.scale.setScalar(scale);
  model.position.y = -box.min.y * scale;
  const spawn = PLACES.garden.spawn;
  model.rotation.y = Math.atan2(spawn.x - x, spawn.z - z);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(model);
  world.add(g);
  blockCircle(x, z, 0.42);
  interactables.push({
    type: "npc",
    x,
    z,
    r: 2.1,
    mesh: g,
    label: `E — talk to ${who}`,
    use() {
      openTalk(who, typeof lines === "function" ? lines() : lines);
    },
  });
}

const MERMAID_SHADER = /* glsl */ `
vec3 mermaidEye(vec3 p, vec3 color, vec2 c) {
  vec2 d = (p.xy - c) / vec2(0.032, 0.048);
  float r = length(d);
  float browY = c.y + 0.064;
  if (abs(d.x) < 1.0 && abs(p.y - browY) < 0.005 && p.z > 0.12) return vec3(0.15, 0.10, 0.09);
  if (r > 1.0 || p.z < 0.12) return color;
  vec2 shine = (p.xy - c - vec2(-0.008, 0.016)) / vec2(0.008, 0.008);
  if (length(shine) < 1.0) return vec3(1.0);
  return vec3(0.07, 0.05, 0.06);
}

vec3 mermaidInvite(vec3 p) {
  float ax = p.x + 0.10;
  vec3 skin = vec3(0.99, 0.73, 0.60);
  vec3 hair = vec3(0.95, 0.89, 0.74);
  vec3 horn = vec3(0.76, 0.58, 0.38);
  vec3 cream = vec3(0.97, 0.92, 0.84);
  vec3 color = skin;

  if (p.y < 0.025 && p.x > -0.32) {
    color = cream;
    float band = fract(p.y * -12.0);
    if (band < 0.12 && p.x < 0.20) color = vec3(0.62, 0.52, 0.42);
    color = mix(color, cream, smoothstep(0.16, 0.44, p.x));
  }

  bool face = p.z > 0.0 && p.y > 0.40 && p.y < 0.76 && abs(ax) < 0.20;
  bool arm = p.y > 0.15 && p.y < 0.46 && abs(ax) > 0.16 && p.z > -0.10;
  bool bangs = p.y > 0.72 && p.y < 0.84 && p.z > -0.08 && abs(ax) < 0.24;
  bool back = p.z < -0.015 && p.y > 0.02 && p.y < 0.80 && abs(ax) < 0.36;
  bool sides = abs(ax) > 0.18 && abs(ax) < 0.34 && p.y > 0.0 && p.y < 0.78 && p.z < 0.16;
  if ((bangs || back || sides) && !face && !arm) color = hair;
  if (p.y > 0.805 && abs(ax) > 0.06 && abs(ax) < 0.32) color = horn;
  if (p.y > 0.02 && p.y < 0.30 && abs(ax) < 0.115 && !arm) color = vec3(0.10, 0.09, 0.10);

  if (face && p.z > 0.10) {
    color = mermaidEye(p, color, vec2(-0.180, 0.600));
    color = mermaidEye(p, color, vec2(-0.020, 0.600));
    float u = (p.x + 0.10) / 0.072;
    if (abs(u) < 1.05 && p.z > 0.14) {
      float smileY = 0.448 + 0.018 * u * u;
      if (abs(p.y - smileY) < 0.007) color = vec3(0.62, 0.24, 0.30);
    }
    vec2 cheekA = (p.xy - vec2(-0.210, 0.530)) / vec2(0.028, 0.018);
    vec2 cheekB = (p.xy - vec2(0.010, 0.530)) / vec2(0.028, 0.018);
    float blush = max(1.0 - dot(cheekA, cheekA), 1.0 - dot(cheekB, cheekB));
    if (blush > 0.0 && p.z > 0.14) color = mix(color, vec3(0.96, 0.48, 0.52), clamp(blush, 0.0, 1.0) * 0.40);
  }
  return color;
}
`;

function mermaidMaterial() {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\nvarying vec3 vMermaidPos;"
    ).replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvMermaidPos = position;"
    );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vMermaidPos;\n${MERMAID_SHADER}`)
      .replace("#include <color_fragment>", "diffuseColor.rgb = mermaidInvite(vMermaidPos);");
  };
  return material;
}

function addMermaid(x, z, who, lines) {
  const model = mermaidTemplate.clone(true);
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.geometry = obj.geometry.clone();
    obj.material = mermaidMaterial();
  });
  const box = new THREE.Box3().setFromObject(model);
  const scale = MERMAID_HEIGHT / Math.max(0.001, box.max.y - box.min.y);
  model.scale.setScalar(scale);
  model.position.y = 0.1 - box.min.y * scale;
  const spawn = PLACES.pond.spawn;
  model.rotation.y = Math.atan2(spawn.x - x, spawn.z - z);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(model);
  world.add(g);
  blockCircle(x, z, 0.5);
  interactables.push({
    type: "npc",
    x,
    z,
    r: 2.1,
    mesh: g,
    label: `E — talk to ${who}`,
    use() {
      openTalk(who, typeof lines === "function" ? lines() : lines);
      state.flags.mermaid = true;
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

  if (place.water) addWater(place.water);

  if (id === "garden") {
    const path = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 11.5), mat(0xc4955a));
    path.position.set(-1.1, 0.02, 2.8);
    path.rotation.y = 0.28;
    world.add(path);
    addGardenHouse(-0.2, -6.6);
    addBirdhouse(4.6, -4.8);
    addBush(-4.2, -5.4, 1.15);
    addBush(3.4, -3.6, 0.9);
    addBush(-5.6, -3.4, 0.75);
    addTree(-7.4, -6.2, 1.35);
    addTree(-7.2, -3.2, 1.15);
    addFlower(-3.4, 5.2, 0xef4d7a);
    addFlower(-5.1, 3.4, 0xf2d14a);
    addFlower(6.4, 5.6, 0xe85b3a);
    addFlower(5.1, 3.2, 0xc45ad6);
    addFlower(4.4, 5.1, 0xf2d14a);
    addFlower(7.2, -2.4, 0xef4d7a);
    addMaisie(-3.6, 2.6, "Maisie", maisieLines);
    addPortal(5.4, 6.8, "park", "fromGarden", "E — Park");
  }

  if (id === "park") {
    addPathThrough([
      [0.5, 5.4],
      [-0.5, 2.6],
      [0.55, -0.2],
      [-0.35, -3.2],
      [0.25, -6.2],
    ]);
    addTuft(-2.2, 2.4, 1);
    addTuft(1.6, 1.2, 0.8);
    addTuft(-1.8, -1.2, 0.9);
    addTuft(2.2, -3.6, 1.1);
    addTuft(-2.6, -6.2, 0.85);
    addTree(-6.4, -7.6, 1.7);
    addTree(6.6, -6.8, 1.45);
    addTree(-5.8, -2.4, 1.45);
    addTree(6.2, -1.6, 1.2);
    addTree(-2.4, 4.8, 0.85);
    addSun(4.8, 6.5, -8.2);
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
    addMermaid(0, 4.3, "Mermaid", [
      "Join our team — YAY!",
      "This is the full-size pond. Come back when you want to jump.",
    ]);
    const bank = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 8), mat(0x9bbf72));
    bank.scale.set(2.4, 0.16, 0.65);
    bank.position.set(-1.2, 0.12, -8.4);
    world.add(bank);
    addReed(-4.6, -6.4);
    addReed(-3.6, -6.8);
    addRock(-2.2, -6.6);
    addTuft(1.4, -6.8, 0.9);
    addTuft(3.2, -6.2, 0.75);
    addTuft(-6.2, -5.6, 0.7);
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
  const x = playerGroup.position.x;
  const z = playerGroup.position.z;
  const free = (px, pz) =>
    inBounds(px, pz, place.radius) &&
    !(waters.some((w) => insideEllipse(px, pz, w)) && !onPad(px, pz)) &&
    !hitsBlocker(px, pz);
  if (free(nx, nz)) {
    playerGroup.position.x = nx;
    playerGroup.position.z = nz;
  } else if (free(nx, z)) {
    playerGroup.position.x = nx;
  } else if (free(x, nz)) {
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
  const [angelGltf, maisieGltf, mermaidGltf] = await Promise.all([
    new GLTFLoader().loadAsync(ANGEL_URL),
    new GLTFLoader().loadAsync(MAISIE_URL),
    new GLTFLoader().loadAsync(MERMAID_URL),
  ]);
  maisieTemplate = maisieGltf.scene;
  maisieTemplate.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = maisieMaterial();
  });
  mermaidTemplate = mermaidGltf.scene;
  mermaidTemplate.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = mermaidMaterial();
  });
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
