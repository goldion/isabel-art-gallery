/**
 * Hammer Studio — Soft Next ops room.
 * Cool gallery palette, moodboard v3 war-room cards, lane idle+walk sheets.
 * Title is Hammer Studio only. Waiting Go is the one warm glow.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  wall: 0xd5dee8,
  wallSide: 0xc9d4df,
  floor: 0xd7dee6,
  frame: 0xb7c5d1,
  board: 0xf4f7fb,
  card: 0xfbfcfe,
  ink: "#243044",
  lane: 0x4e93c8,
  laneGlow: 0x9aefff,
  waiting: 0xfff1c2,
  waitingGlow: 0xffd56a,
  art: 0xf59312,
  dev: 0xf93498,
  tester: 0xfd690f,
  cto: 0x13b7a2,
  assistant: 0x1e86fc,
  cfo: 0x8f59f9,
  governess: 0x14c16f,
  mainBot: 0x000000,
  mainBadge: 0xf59312,
  wood: 0xe7d3b4,
  desk: 0xb4c0cb,
};

const STATIONS = [
  { id: "pick", label: "Pick", icon: "pick" },
  { id: "soft-pass", label: "Soft PASS", icon: "pass" },
  { id: "waiting-go", label: "Waiting Go", icon: "wait", active: true },
  { id: "tip", label: "Tip", icon: "tip" },
  { id: "smoke", label: "Smoke", icon: "smoke" },
  { id: "done", label: "Done", icon: "done" },
];

const DESK_Z = 1.85;
const BACK_Z = -2.35;

const LANE_DESKS = [
  { id: "art", role: "Art", mark: "heart", shape: "heart", color: COLORS.art, x: -4.7, z: DESK_Z },
  { id: "developer", role: "Developer", mark: "hex", shape: "hex", color: COLORS.dev, x: -1.55, z: DESK_Z },
  { id: "tester", role: "Tester", sub: "Marketing", mark: "square", shape: "square", color: COLORS.tester, x: 1.55, z: DESK_Z },
  { id: "cto", role: "CTO", mark: "cloud", shape: "cloud", color: COLORS.cto, x: 4.7, z: DESK_Z },
];

const OFF_LANE = [
  { id: "assistant", role: "Assistant", sub: "Admin", mark: "square", shape: "square", color: COLORS.assistant, x: -4.7, z: BACK_Z },
  { id: "cfo", role: "CFO", sub: "Expense", mark: "drop", shape: "teardrop", color: COLORS.cfo, x: -1.55, z: BACK_Z },
  { id: "governess", role: "Governess", mark: "star", shape: "star", color: COLORS.governess, x: 1.55, z: BACK_Z },
  { id: "main", role: "Main", sub: "Bot", mark: "blob", shape: "blob", color: COLORS.mainBot, x: 4.7, z: BACK_Z },
];

const ALL_DESKS = [...LANE_DESKS, ...OFF_LANE];

const SHEET_PATHS = {
  art: "assets/characters/art-walk-idle-sheet.png",
  developer: "assets/characters/developer-walk-idle-sheet.png",
  tester: "assets/characters/tester-walk-idle-sheet.png",
  cto: "assets/characters/cto-walk-idle-sheet.png",
};

const HOME_POS = new THREE.Vector3(0.2, 7.4, 15.6);
const HOME_TARGET = new THREE.Vector3(0.1, 1.8, -0.3);
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BODY_H = 1.48;
const SEAT_Y = 0.06;
const FLOOR_Y = 0.02;
const WALK_SPEED = 1.15;
const FLOOR_BOX = { minX: -6.4, maxX: 6.4, minZ: -4.2, maxZ: 4.8 };
const LOOP = [
  [-4.05, 2.35],
  [-2.1, 2.85],
  [0.15, 3.3],
  [2.35, 2.85],
  [4.15, 2.35],
  [3.15, 3.45],
  [0.4, 3.7],
  [-2.4, 3.45],
  [-4.2, 2.9],
];

const view = document.getElementById("view");
const loadingEl = document.getElementById("loading");
const hintEl = document.getElementById("hint");

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.wall);
scene.fog = new THREE.Fog(COLORS.wall, 30, 54);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
const introFrom = HOME_POS.clone().add(new THREE.Vector3(0.35, 0.85, 1.8));
camera.position.copy(REDUCE_MOTION ? HOME_POS : introFrom);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setClearColor(COLORS.wall, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
view.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.78;
controls.panSpeed = 0.45;
controls.screenSpacePanning = true;
controls.minDistance = 4.8;
controls.maxDistance = 32;
controls.minPolarAngle = 0.72;
controls.maxPolarAngle = 1.38;
controls.minAzimuthAngle = -0.72;
controls.maxAzimuthAngle = 0.58;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.12;
controls.enabled = REDUCE_MOTION;

scene.add(new THREE.HemisphereLight(0xeaf2f8, 0x93a3b3, 0.96));
const sun = new THREE.DirectionalLight(0xf5f8fb, 0.78);
sun.position.set(4.5, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 36;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
sun.shadow.bias = -0.0004;
scene.add(sun);
sun.target.position.set(1.2, 0, 0.4);
scene.add(sun.target);

const world = new THREE.Group();
scene.add(world);

const glows = [];
const laneAnimators = [];
const deskGroups = [];
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let focusedId = null;
let introT = REDUCE_MOTION ? 1 : 0;
let resumeAt = Infinity;
let resetJob = null;
let pointerDown = null;
let lastClick = 0;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0,
    ...opts,
  });
}

function roundPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function textPlane(lines, w, h, opts = {}) {
  const tex = canvasTexture(opts.width || 512, opts.height || 128, (ctx, width, height) => {
    if (opts.bg) {
      roundPath(ctx, 6, 6, width - 12, height - 12, opts.radius || 24);
      ctx.fillStyle = opts.bg;
      ctx.fill();
    }
    ctx.fillStyle = opts.fill || COLORS.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const list = Array.isArray(lines) ? lines : [lines];
    const fontSize = opts.fontSize || 48;
    ctx.font = `800 ${fontSize}px Nunito, Trebuchet MS, Segoe UI, sans-serif`;
    if (list.length === 1) {
      ctx.fillText(list[0], width / 2, height / 2 + 2);
    } else {
      list.forEach((line, i) => {
        const size = i === 0 ? fontSize : Math.round(fontSize * 0.62);
        ctx.font = `800 ${size}px Nunito, Trebuchet MS, Segoe UI, sans-serif`;
        ctx.fillStyle = i === 0 ? opts.fill || COLORS.ink : "#5c6b7a";
        ctx.fillText(line, width / 2, height * (0.38 + i * 0.3));
      });
    }
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
}

function drawMark(ctx, mark, s = 1) {
  ctx.beginPath();
  if (mark === "heart") {
    ctx.moveTo(0, 12 * s);
    ctx.bezierCurveTo(-28 * s, -6 * s, -8 * s, -28 * s, 0, -8 * s);
    ctx.bezierCurveTo(8 * s, -28 * s, 28 * s, -6 * s, 0, 12 * s);
  } else if (mark === "hex") {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      const x = Math.cos(a) * 22 * s;
      const y = Math.sin(a) * 22 * s;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (mark === "tablet") {
    roundPath(ctx, -16 * s, -22 * s, 32 * s, 44 * s, 8 * s);
  } else if (mark === "cloud") {
    ctx.arc(-8 * s, 4 * s, 12 * s, 0, Math.PI * 2);
    ctx.arc(10 * s, 2 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(0, -8 * s, 11 * s, 0, Math.PI * 2);
  } else if (mark === "square") {
    roundPath(ctx, -18 * s, -18 * s, 36 * s, 36 * s, 10 * s);
  } else if (mark === "drop") {
    ctx.moveTo(0, -24 * s);
    ctx.bezierCurveTo(22 * s, -6 * s, 16 * s, 18 * s, 0, 22 * s);
    ctx.bezierCurveTo(-16 * s, 18 * s, -22 * s, -6 * s, 0, -24 * s);
  } else if (mark === "star") {
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 22 * s : 8 * s;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (mark === "blob") {
    ctx.arc(-2 * s, 2 * s, 16 * s, 0, Math.PI * 2);
  }
  ctx.fill();
}

function nameplateTexture(title, sub, mark, color) {
  return canvasTexture(512, 196, (ctx, w, h) => {
    roundPath(ctx, 12, 16, w - 24, h - 32, 32);
    ctx.fillStyle = "#f7f9fb";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(90, 108, 124, 0.28)";
    ctx.stroke();
    ctx.save();
    ctx.translate(92, h / 2 - 2);
    ctx.fillStyle = color;
    drawMark(ctx, mark, 1.85);
    if (mark === "tablet") {
      ctx.fillStyle = "#fff8ee";
      roundPath(ctx, -9, -12, 18, 22, 3);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = COLORS.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (sub) {
      ctx.font = "800 62px Nunito, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(title, 310, 74);
      ctx.font = "700 34px Nunito, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillStyle = "#5c6b7a";
      ctx.fillText(sub, 310, 124);
    } else {
      ctx.font = "800 68px Nunito, Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText(title, 310, h / 2 - 2);
    }
  });
}

function stationIconTexture(icon) {
  return canvasTexture(256, 256, (ctx) => {
    const disc = (fill, stroke) => {
      ctx.beginPath();
      ctx.arc(128, 128, 108, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    };
    if (icon === "pick") {
      const g = ctx.createRadialGradient(100, 96, 20, 128, 128, 110);
      g.addColorStop(0, "#f4f7fa");
      g.addColorStop(1, "#b7c2cc");
      disc(g, "#8b98a6");
      ctx.fillStyle = "#6d7c8c";
      roundPath(ctx, 92, 78, 72, 96, 10);
      ctx.fill();
      ctx.fillStyle = "#e8eef3";
      roundPath(ctx, 104, 96, 48, 8, 3);
      ctx.fill();
      roundPath(ctx, 104, 114, 48, 8, 3);
      ctx.fill();
      roundPath(ctx, 104, 132, 32, 8, 3);
      ctx.fill();
    } else if (icon === "pass") {
      disc("#6fbf73", "#3f8f4d");
      ctx.strokeStyle = "#f4fff4";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(78, 132);
      ctx.lineTo(114, 168);
      ctx.lineTo(184, 92);
      ctx.stroke();
    } else if (icon === "tip") {
      const g = ctx.createRadialGradient(104, 100, 10, 128, 128, 108);
      g.addColorStop(0, "#ffe7a4");
      g.addColorStop(1, "#e2b04a");
      disc(g, "#b8882e");
      ctx.fillStyle = "#fff6d8";
      ctx.beginPath();
      ctx.arc(128, 128, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c4922e";
      ctx.beginPath();
      ctx.moveTo(128, 92);
      ctx.lineTo(146, 128);
      ctx.lineTo(128, 118);
      ctx.lineTo(110, 128);
      ctx.closePath();
      ctx.fill();
    } else if (icon === "smoke") {
      disc("#d5dde4", "#8ea0ae");
      ctx.strokeStyle = "#607484";
      ctx.fillStyle = "#9eb0be";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(108, 168);
      ctx.lineTo(148, 168);
      ctx.lineTo(138, 118);
      ctx.lineTo(118, 118);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.ellipse(128, 96, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (icon === "done") {
      disc("#7eb6e6", "#4d86b8");
      ctx.fillStyle = "#f7fbff";
      ctx.beginPath();
      ctx.arc(104, 138, 26, 0, Math.PI * 2);
      ctx.arc(146, 134, 32, 0, Math.PI * 2);
      ctx.arc(124, 112, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + h - rr);
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  s.lineTo(x + rr, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  return s;
}

function roundedCard(w, h, d, r, material) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth: d,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

function floorTexture() {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#d7dee6";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(150, 166, 182, 0.45)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 32 + 0.5);
      ctx.lineTo(256, i * 32 + 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(186, 198, 210, 0.7)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo((i % 2) * 40, i * 32);
      ctx.lineTo((i % 2) * 40, i * 32 + 32);
      ctx.stroke();
    }
  });
}

function crayonTexture(kind) {
  const rand = mulberry32(kind.length * 97 + kind.charCodeAt(0) * 13);
  return canvasTexture(320, 240, (ctx) => {
    ctx.fillStyle = "#f6f8fb";
    ctx.fillRect(0, 0, 320, 240);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(150, 170, 190, ${0.04 + rand() * 0.08})`;
      ctx.fillRect(rand() * 320, rand() * 240, 3, 2);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (kind === "sun") {
      ctx.fillStyle = "#f0c14d";
      ctx.beginPath();
      ctx.arc(230, 54, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7dbe6a";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.quadraticCurveTo(160, 140, 320, 190);
      ctx.stroke();
      ctx.strokeStyle = "#6ea4cc";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(40, 150);
      ctx.lineTo(70, 90);
      ctx.lineTo(96, 150);
      ctx.stroke();
    } else if (kind === "flower") {
      ctx.strokeStyle = "#6ea37a";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(160, 210);
      ctx.quadraticCurveTo(150, 120, 160, 80);
      ctx.stroke();
      ctx.fillStyle = "#f08b78";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(160 + Math.cos(a) * 28, 78 + Math.sin(a) * 22, 16, 10, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f0c14d";
      ctx.beginPath();
      ctx.arc(160, 78, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "house") {
      ctx.fillStyle = "#8eb4d4";
      ctx.fillRect(90, 110, 140, 90);
      ctx.fillStyle = "#f08b78";
      ctx.beginPath();
      ctx.moveTo(78, 114);
      ctx.lineTo(160, 58);
      ctx.lineTo(244, 114);
      ctx.fill();
      ctx.fillStyle = "#f4f7fb";
      ctx.fillRect(142, 150, 32, 50);
    } else {
      ctx.fillStyle = "#7eb6e6";
      ctx.beginPath();
      ctx.arc(70, 50, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0c14d";
      starPath(ctx, 230, 70, 22, 10);
      ctx.fill();
      ctx.strokeStyle = "#9caf88";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(20, 190);
      ctx.quadraticCurveTo(160, 150, 300, 200);
      ctx.stroke();
    }
  });
}

function starPath(ctx, x, y, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sheet failed: ${url}`));
    img.src = url;
  });
}

function keySheet(image) {
  const w = image.width;
  const h = image.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const cols = 4;
  const colW = Math.floor(w / cols);
  const alpha = new Uint8Array(w * h);

  for (let c = 0; c < cols; c++) {
    const x0 = c * colW;
    const x1 = x0 + colW;
    let prev = [186, 196, 208];
    const rowBg = new Array(h);
    for (let y = 0; y < h; y++) {
      let rs = 0;
      let gs = 0;
      let bs = 0;
      let n = 0;
      const sample = (x) => {
        const i = (y * w + x) * 4;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        if (Math.max(r, g, b) - Math.min(r, g, b) < 42) {
          rs += r;
          gs += g;
          bs += b;
          n += 1;
        }
      };
      for (let x = x0 + 2; x < x0 + 16; x++) sample(x);
      for (let x = x1 - 16; x < x1 - 2; x++) sample(x);
      if (n >= 4) prev = [rs / n, gs / n, bs / n];
      rowBg[y] = prev;
    }
    for (let y = 0; y < h; y++) {
      const [br, bg, bb] = rowBg[y];
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        const dist = Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb);
        let a = 255;
        if (dist < 34) a = 0;
        else if (dist < 54) a = ((dist - 34) / 20) * 255;
        alpha[y * w + x] = a;
      }
    }
  }

  const frames = [];
  let cropTop = h;
  let cropBot = 0;
  for (let c = 0; c < cols; c++) {
    const x0 = c * colW;
    const x1 = x0 + colW;
    const counts = new Int16Array(h);
    for (let y = 0; y < h; y++) {
      let n = 0;
      for (let x = x0; x < x1; x += 2) if (alpha[y * w + x] > 40) n += 1;
      counts[y] = n;
    }
    const segs = [];
    let start = -1;
    for (let y = 0; y <= h; y++) {
      const on = y < h && counts[y] > 12;
      if (on && start < 0) start = y;
      if (!on && start >= 0) {
        segs.push([start, y - 1]);
        start = -1;
      }
    }
    const merged = [];
    for (const seg of segs) {
      if (merged.length && seg[0] - merged[merged.length - 1][1] < 14) {
        merged[merged.length - 1][1] = seg[1];
      } else merged.push(seg.slice());
    }
    let best = null;
    let bestScore = -1;
    for (const seg of merged) {
      if (seg[1] - seg[0] < 50) continue;
      let mass = 0;
      for (let y = seg[0]; y <= seg[1]; y++) mass += counts[y];
      if (mass > bestScore) {
        bestScore = mass;
        best = seg;
      }
    }
    const bodyTop = best ? best[0] : 0;
    const bodyBot = best ? best[1] : h - 1;
    for (let y = bodyBot + 3; y < h; y++) {
      for (let x = x0; x < x1; x++) alpha[y * w + x] = 0;
    }
    const y0 = bodyTop + (bodyBot - bodyTop) * 0.22;
    const y1 = bodyTop + (bodyBot - bodyTop) * 0.62;
    let sx = 0;
    let sn = 0;
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (let x = x0; x < x1; x++) {
        if (alpha[y * w + x] > 80) {
          sx += x;
          sn += 1;
        }
      }
    }
    frames.push({
      bodyTop,
      bodyBot,
      centerX: sn ? sx / sn : (x0 + x1) / 2,
    });
    cropTop = Math.min(cropTop, bodyTop);
    cropBot = Math.max(cropBot, bodyBot + 1);
  }

  for (let p = 0; p < w * h; p++) d[p * 4 + 3] = alpha[p];
  ctx.putImageData(img, 0, 0);
  cropTop = Math.max(0, cropTop - 6);
  cropBot = Math.min(h, cropBot + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  return { tex, frames, cropTop, cropBot, colW, w, h };
}

function frameSlice(sheet, col) {
  const clone = sheet.tex.clone();
  const vTop = 1 - sheet.cropTop / sheet.h;
  const vBot = 1 - sheet.cropBot / sheet.h;
  clone.repeat.set(sheet.colW / sheet.w, vTop - vBot);
  clone.offset.set((col * sheet.colW) / sheet.w, vBot);
  clone.needsUpdate = true;
  return clone;
}

function applyAnchor(sprite, sheet, col) {
  const frame = sheet.frames[col];
  const cropH = sheet.cropBot - sheet.cropTop;
  const centerX = (frame.centerX - col * sheet.colW) / sheet.colW;
  const footFromBottom = (sheet.cropBot - (frame.bodyBot + 1)) / cropH;
  sprite.center.set(THREE.MathUtils.clamp(centerX, 0.2, 0.8), THREE.MathUtils.clamp(footFromBottom, 0, 0.2));
}

function seatVector(desk) {
  return new THREE.Vector3(desk.x, SEAT_Y, desk.z - 0.95);
}

function standVector(desk) {
  const side = desk.x >= 0 ? 1.7 : -1.7;
  return new THREE.Vector3(desk.x + side, FLOOR_Y, desk.z - 0.95);
}

function deskIndex(desk) {
  return ALL_DESKS.findIndex((item) => item.id === desk.id);
}

function lanesFor(index) {
  const angle = (index / ALL_DESKS.length) * Math.PI * 2;
  return {
    laneX: Math.cos(angle) * 0.95,
    laneZ: Math.sin(angle) * 0.55,
  };
}

function loopVector(index, lanes = { laneX: 0, laneZ: 0 }) {
  const p = LOOP[index % LOOP.length];
  return new THREE.Vector3(p[0] + lanes.laneX, FLOOR_Y, p[1] + lanes.laneZ);
}

function makeLaneAnimator(sheet, desk) {
  const frames = [0, 1, 2, 3].map((i) => frameSlice(sheet, i));
  const cropH = sheet.cropBot - sheet.cropTop;
  const displayH = BODY_H;
  const displayW = displayH * (sheet.colW / cropH);
  const material = new THREE.SpriteMaterial({
    map: frames[0],
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.02,
  });
  const ghostMat = material.clone();
  ghostMat.opacity = 0;
  const sprite = new THREE.Sprite(material);
  const ghost = new THREE.Sprite(ghostMat);
  sprite.scale.set(displayW, displayH, 1);
  ghost.scale.set(displayW, displayH, 1);
  applyAnchor(sprite, sheet, 0);
  ghost.center.copy(sprite.center);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 18),
    new THREE.MeshBasicMaterial({ color: 0x667484, transparent: true, opacity: 0, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;

  const anchor = new THREE.Group();
  anchor.userData.deskId = desk.id;
  anchor.add(sprite);
  anchor.add(ghost);
  anchor.add(shadow);
  world.add(anchor);

  const index = deskIndex(desk);
  const seat = seatVector(desk);
  const stand = standVector(desk);
  const lanes = lanesFor(index);
  const startWalking = index % 2 === 0;
  const wp = (index * 3) % LOOP.length;
  if (startWalking) anchor.position.copy(loopVector(wp, lanes));
  else anchor.position.copy(seat);

  return {
    id: desk.id,
    anchor,
    sprite,
    ghost,
    shadow,
    sheet,
    frames,
    displayW,
    displayH,
    phase: index * 0.9,
    seat,
    stand,
    state: startWalking ? "wander" : "work",
    stateT: startWalking ? 0.4 : index * 0.2,
    wp: (wp + 1) % LOOP.length,
    wanderLeft: 7 + index,
    from: new THREE.Vector3(),
    frame: 0,
    frameTimer: 0,
    fadeT: 1,
    fadeFrom: 0,
    mode: startWalking ? "walk" : "idle",
    workDur: 5.2 + (index % 4) * 0.45,
    kind: "sheet",
    sitLift: 0.5,
    floorLift: FLOOR_Y,
    ...lanes,
  };
}

function makeMeshAnimator(desk) {
  const body = shapeMesh(desk.shape, desk.color);
  body.scale.setScalar(1.35);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 18),
    new THREE.MeshBasicMaterial({ color: 0x667484, transparent: true, opacity: 0, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  const anchor = new THREE.Group();
  anchor.userData.deskId = desk.id;
  anchor.add(body);
  anchor.add(shadow);
  world.add(anchor);

  const index = deskIndex(desk);
  const seat = seatVector(desk);
  const stand = standVector(desk);
  const startWalking = index % 2 === 0;
  if (startWalking) {
    anchor.position.copy(randomFloorPoint());
    anchor.position.y = 0.58;
  } else anchor.position.copy(seat);

  return {
    id: desk.id,
    anchor,
    sprite: null,
    ghost: null,
    mesh: body,
    shadow,
    displayW: 1,
    displayH: 1,
    phase: index * 0.85,
    seat,
    stand,
    state: startWalking ? "wander" : "work",
    stateT: startWalking ? 0.3 : 0.15,
    goal: startWalking ? randomFloorPoint() : null,
    wanderLeft: startWalking ? 4 + (index % 3) : 0,
    from: new THREE.Vector3(),
    frame: 0,
    frameTimer: 0,
    fadeT: 1,
    fadeFrom: 0,
    mode: startWalking ? "walk" : "idle",
    workDur: 5.6 + (index % 4) * 0.4,
    kind: "mesh",
    sitLift: 1.05,
    floorLift: 0.58,
  };
}

function showFrame(bot, index) {
  if (bot.frame === index && bot.fadeT >= 1) return;
  bot.fadeFrom = bot.frame;
  bot.fadeT = 0;
  bot.frame = index;
  bot.sprite.material.map = bot.frames[index];
  bot.ghost.material.map = bot.frames[bot.fadeFrom];
  bot.ghost.material.opacity = 1;
  bot.sprite.material.opacity = 0;
  applyAnchor(bot.sprite, bot.sheet, index);
  applyAnchor(bot.ghost, bot.sheet, bot.fadeFrom);
}

function smooth(t) {
  const k = THREE.MathUtils.clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
}

function faceMove(bot, dx, dz) {
  if (!bot.sprite) {
    if (bot.mesh) bot.mesh.rotation.y = Math.abs(dx) > 0.02 ? (dx > 0 ? -0.55 : 0.55) : 0;
    return;
  }
  let facing = 1;
  if (Math.abs(dx) > Math.abs(dz) * 0.55 && Math.abs(dx) > 0.015) facing = Math.sign(dx);
  const w = bot.displayW * facing;
  bot.sprite.scale.set(w, bot.displayH, 1);
  bot.ghost.scale.set(w, bot.displayH, 1);
}

function playClip(bot, walking, dt) {
  bot.mode = walking ? "walk" : "idle";
  if (!bot.sprite) return;
  bot.frameTimer += dt;
  const interval = walking ? 0.13 : 0.46;
  const inWalk = bot.frame >= 2;
  if (walking !== inWalk) {
    showFrame(bot, walking ? 2 : 0);
    bot.frameTimer = 0;
  } else if (bot.frameTimer >= interval) {
    bot.frameTimer = 0;
    if (walking) showFrame(bot, bot.frame === 2 ? 3 : 2);
    else showFrame(bot, bot.frame === 0 ? 1 : 0);
  }
  if (bot.fadeT < 1) {
    bot.fadeT = Math.min(1, bot.fadeT + dt / 0.14);
    bot.sprite.material.opacity = bot.fadeT;
    bot.ghost.material.opacity = 1 - bot.fadeT;
  }
}

function plantShadow(bot, onFloor) {
  const shadow = bot.shadow;
  shadow.position.y = FLOOR_Y + 0.012 - bot.anchor.position.y;
  shadow.material.opacity = onFloor ? 0.32 : 0;
}

function beginLeave(bot) {
  bot.state = "leave";
  bot.stateT = 0;
  bot.from.copy(bot.anchor.position);
}

function pointBlocked(x, z) {
  for (const desk of ALL_DESKS) {
    const dx = x - desk.x;
    const dz = z - (desk.z + 0.35);
    if (dx * dx + dz * dz < 1.05 * 1.05) return true;
  }
  return false;
}

function randomFloorPoint(from) {
  for (let i = 0; i < 18; i++) {
    const x = FLOOR_BOX.minX + Math.random() * (FLOOR_BOX.maxX - FLOOR_BOX.minX);
    const z = FLOOR_BOX.minZ + Math.random() * (FLOOR_BOX.maxZ - FLOOR_BOX.minZ);
    const far = !from || Math.hypot(x - from.x, z - from.z) > 1.4;
    if (far && !pointBlocked(x, z)) return new THREE.Vector3(x, FLOOR_Y, z);
  }
  return new THREE.Vector3(0.2, FLOOR_Y, 3.4);
}

function beginWander(bot) {
  bot.state = "wander";
  bot.stateT = 0;
  bot.wanderLeft = 4 + Math.floor(Math.random() * 4);
  bot.goal = randomFloorPoint(bot.anchor.position);
}

function beginReturn(bot) {
  if (bot.state === "return" || bot.state === "work") return;
  bot.state = "return";
  bot.stateT = 0;
  bot.returnPhase = "toStand";
  bot.from.copy(bot.anchor.position);
}

function moveToward(bot, target, dt) {
  const pos = bot.anchor.position;
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  const step = Math.min(WALK_SPEED * dt, dist);
  pos.x += (dx / dist) * step;
  pos.z += (dz / dist) * step;
  faceMove(bot, dx, dz);
  return dist - step;
}

function updateLaneAnimators(dt, elapsed) {
  for (const bot of laneAnimators) {
    const focused = bot.id === focusedId;
    if (focused && bot.state !== "work" && bot.state !== "return") beginReturn(bot);

    if (bot.state === "work") {
      const bob = Math.sin(elapsed * 2.05 + bot.phase) * 0.012;
      bot.anchor.position.set(bot.seat.x, bot.sitLift + bob, bot.seat.z);
      faceMove(bot, 0, 1);
      if (bot.sprite) {
        const sitH = bot.displayH * 0.86;
        bot.sprite.scale.y = sitH;
        bot.ghost.scale.y = sitH;
      }
      playClip(bot, false, dt);
      plantShadow(bot, false);
      bot.stateT += dt;
      if (!focused && bot.stateT > bot.workDur) beginLeave(bot);
      continue;
    }

    if (bot.state === "leave") {
      const k = smooth(Math.min(1, bot.stateT / 0.9));
      bot.anchor.position.lerpVectors(bot.from, bot.stand, k);
      bot.anchor.position.y = THREE.MathUtils.lerp(bot.sitLift, bot.floorLift, k);
      faceMove(bot, bot.stand.x - bot.seat.x, bot.stand.z - bot.seat.z);
      playClip(bot, k > 0.35, dt);
      plantShadow(bot, k > 0.45);
      bot.stateT += dt;
      if (k >= 1) beginWander(bot);
      continue;
    }

    if (bot.state === "wander") {
      if (!bot.goal) bot.goal = randomFloorPoint(bot.anchor.position);
      const left = moveToward(bot, bot.goal, dt);
      const bob = Math.abs(Math.sin(elapsed * 8 + bot.phase)) * 0.06;
      bot.anchor.position.y = bot.floorLift + bob;
      playClip(bot, true, dt);
      plantShadow(bot, true);
      if (left < 0.12) {
        bot.wanderLeft -= 1;
        if (bot.wanderLeft <= 0) beginReturn(bot);
        else bot.goal = randomFloorPoint(bot.anchor.position);
      }
      continue;
    }

    if (bot.state === "return") {
      if (bot.returnPhase === "toStand") {
        const left = moveToward(bot, bot.stand, dt);
        bot.anchor.position.y = bot.floorLift + Math.abs(Math.sin(elapsed * 10 + bot.phase)) * 0.05;
        playClip(bot, true, dt);
        plantShadow(bot, true);
        if (left < 0.07) {
          bot.returnPhase = "sit";
          bot.stateT = 0;
          bot.from.copy(bot.anchor.position);
        }
      } else {
        const k = smooth(Math.min(1, bot.stateT / 0.85));
        bot.anchor.position.lerpVectors(bot.from, bot.seat, k);
        bot.anchor.position.y = THREE.MathUtils.lerp(bot.floorLift, bot.sitLift, k);
        faceMove(bot, 0, -1);
        playClip(bot, k < 0.55, dt);
        plantShadow(bot, k < 0.4);
        bot.stateT += dt;
        if (k >= 1) {
          bot.state = "work";
          bot.stateT = 0;
          bot.anchor.position.copy(bot.seat);
        }
      }
    }
  }
}

function buildRoom() {
  const floorMat = mat(COLORS.floor);
  floorMat.map = floorTexture();
  floorMat.map.wrapS = THREE.RepeatWrapping;
  floorMat.map.wrapT = THREE.RepeatWrapping;
  floorMat.map.repeat.set(5, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 8.2), mat(COLORS.wall));
  back.position.set(0, 4.1, -5.85);
  back.receiveShadow = true;
  world.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(18, 8.2), mat(COLORS.wallSide));
  left.rotation.y = Math.PI / 2;
  left.position.set(-11.6, 4.1, 1.2);
  world.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(18, 8.2), mat(COLORS.wallSide));
  right.rotation.y = -Math.PI / 2;
  right.position.set(11.6, 4.1, 1.2);
  world.add(right);

  const sign = roundedCard(7.5, 1.02, 0.05, 0.18, mat(0xeef3f8));
  sign.position.set(-0.2, 5.18, -5.74);
  world.add(sign);
  const title = textPlane("Hammer Studio", 7.1, 0.78, {
    fontSize: 118,
    width: 1200,
    height: 200,
    fill: "#1b2836",
  });
  title.position.set(-0.2, 5.18, -5.68);
  world.add(title);

  const cornice = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 0.12), mat(0xb4c0cc));
  cornice.position.set(0, 6.45, -5.76);
  world.add(cornice);
}

function buildLaneRug() {
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat(COLORS.lane));
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(4.65, 1, 2.45);
  rug.position.set(0, 0.02, 1.35);
  rug.receiveShadow = true;
  world.add(rug);

  const pts = [];
  const xArm = 3.25;
  const zBack = 1.42;
  const zFront = 2.42;
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let x;
    let z;
    if (t < 0.18) {
      const u = t / 0.18;
      x = -xArm;
      z = zBack + (zFront - zBack) * u;
    } else if (t > 0.82) {
      const u = (t - 0.82) / 0.18;
      x = xArm;
      z = zFront + (zBack - zFront) * u;
    } else {
      const u = (t - 0.18) / 0.64;
      const a = Math.PI * (1 - u);
      x = Math.cos(a) * xArm;
      z = zFront + Math.sin(a) * 0.62;
    }
    pts.push(new THREE.Vector3(x, 0.04, z));
  }
  const glowMat = new THREE.MeshBasicMaterial({
    color: COLORS.laneGlow,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xf3fdff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glow = ribbon(pts, 0.34, glowMat);
  const core = ribbon(pts, 0.07, coreMat);
  world.add(glow);
  world.add(core);
  glows.push({ kind: "lane", material: glowMat });
}

function ribbon(points, width, material) {
  const positions = [];
  const indices = [];
  const half = width / 2;
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * half;
    const nz = (dx / len) * half;
    const p = points[i];
    positions.push(p.x + nx, p.y, p.z + nz, p.x - nx, p.y, p.z - nz);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

function buildWarBoard() {
  const board = new THREE.Group();
  board.position.set(-0.2, 2.88, -5.58);
  board.name = "war-board";

  const outer = roundedCard(11.7, 3.35, 0.12, 0.22, mat(COLORS.frame));
  outer.position.z = -0.06;
  outer.castShadow = true;
  board.add(outer);

  const inner = roundedCard(11.2, 2.9, 0.08, 0.18, mat(COLORS.board));
  inner.position.z = 0.04;
  board.add(inner);

  const cardW = 1.58;
  const gap = 0.16;
  const total = STATIONS.length * cardW + (STATIONS.length - 1) * gap;
  const start = -total / 2 + cardW / 2;

  STATIONS.forEach((st, i) => {
    const card = new THREE.Group();
    const tall = st.active ? 2.05 : 1.82;
    card.position.set(start + i * (cardW + gap), st.active ? 0.04 : -0.02, 0.14);

    const bodyMat = st.active
      ? mat(COLORS.waiting, { emissive: COLORS.waitingGlow, emissiveIntensity: 0.72, roughness: 0.6 })
      : mat(COLORS.card, { roughness: 0.9 });
    const body = roundedCard(cardW, tall, 0.08, 0.16, bodyMat);
    body.castShadow = true;
    card.add(body);
    if (st.active) glows.push({ kind: "wait", material: bodyMat });

    if (st.active) {
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(cardW + 0.28, tall + 0.28),
        new THREE.MeshBasicMaterial({
          color: COLORS.waitingGlow,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        }),
      );
      halo.position.z = -0.05;
      card.add(halo);
      glows.push({ kind: "wait-halo", material: halo.material, opacityBase: 0.28 });
      const lamp = new THREE.PointLight(0xffe1a3, 0.42, 2.4, 2);
      lamp.position.set(0, 0.1, 0.45);
      card.add(lamp);
    } else {
      const badge = new THREE.Mesh(
        new THREE.CircleGeometry(0.34, 28),
        new THREE.MeshBasicMaterial({ map: stationIconTexture(st.icon) }),
      );
      badge.position.set(0, 0.28, 0.05);
      card.add(badge);
    }

    const label = textPlane(st.label, cardW * 0.92, st.active ? 0.48 : 0.34, {
      fontSize: st.label.length > 8 ? 40 : 48,
      width: 512,
      height: 128,
      fill: st.active ? "#6a5420" : COLORS.ink,
    });
    label.position.set(0, st.active ? -0.05 : -0.58, 0.06);
    card.add(label);
    board.add(card);
  });

  world.add(board);
}

function buildDesk(desk) {
  const group = new THREE.Group();
  group.position.set(desk.x, 0, desk.z);
  group.userData.deskId = desk.id;
  group.name = `desk-${desk.id}`;

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.72, 0.82), mat(COLORS.desk));
  body.position.y = 0.36;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.1, 0.96), mat(COLORS.wood, { roughness: 0.68 }));
  top.position.y = 0.77;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const lock = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.055, 0.03),
    mat(desk.color, { emissive: desk.color, emissiveIntensity: 0.18 }),
  );
  lock.position.set(0, 0.58, 0.42);
  group.add(lock);

  const plateTex = nameplateTexture(desk.role, desk.sub, desk.mark, `#${desk.color.toString(16).padStart(6, "0")}`);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.42),
    new THREE.MeshBasicMaterial({ map: plateTex, transparent: true, depthWrite: false }),
  );
  plate.position.set(0, 0.32, 0.43);
  group.add(plate);

  const chair = new THREE.Group();
  chair.position.set(0, 0, -0.95);
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.52), mat(0xd7e0e8));
  chairSeat.position.set(0, 0.46, 0);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.72, 0.08), mat(0xc5d0dc));
  chairBack.position.set(0, 0.86, -0.28);
  const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.42, 10), mat(0xb3bec8));
  chairLeg.position.set(0, 0.22, 0);
  chair.add(chairSeat, chairBack, chairLeg);
  group.add(chair);
  addDeskProps(group, desk.color);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.78, 40),
    new THREE.MeshBasicMaterial({
      color: desk.color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.84;
  group.add(ring);
  glows.push({ kind: "desk", id: desk.id, material: ring.material });

  world.add(group);
  deskGroups.push(group);
  return { ...desk, group };
}

const EYE_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });

function addGrokEyes(parent, { y = 0, z = 0.28, spread = 0.12, radius = 0.075 } = {}) {
  const eyes = new THREE.Group();
  for (const ex of [-spread, spread]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), EYE_MAT);
    eye.scale.set(1.25, 0.92, 0.55);
    eye.position.set(ex, y, z);
    eyes.add(eye);
  }
  parent.add(eyes);
  return eyes;
}

function flatShape(shape, depth, material) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}

function shapeMesh(shape, color) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color });
  if (shape === "heart") {
    const heart = new THREE.Shape();
    heart.moveTo(0, -0.46);
    heart.bezierCurveTo(0.42, -0.12, 0.58, 0.16, 0.26, 0.34);
    heart.bezierCurveTo(0.1, 0.46, 0.02, 0.24, 0, 0.14);
    heart.bezierCurveTo(-0.02, 0.24, -0.1, 0.46, -0.26, 0.34);
    heart.bezierCurveTo(-0.58, 0.16, -0.42, -0.12, 0, -0.46);
    g.add(flatShape(heart, 0.36, m));
    addGrokEyes(g, { y: 0.08, z: 0.24, spread: 0.12, radius: 0.07 });
  } else if (shape === "hex") {
    const hex = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      const px = Math.cos(a) * 0.4;
      const py = Math.sin(a) * 0.4;
      if (i === 0) hex.moveTo(px, py);
      else hex.lineTo(px, py);
    }
    hex.closePath();
    g.add(flatShape(hex, 0.38, m));
    addGrokEyes(g, { y: 0.02, z: 0.26, spread: 0.12, radius: 0.07 });
  } else if (shape === "cloud") {
    const puffs = [
      [0, 0.02, 0, 0.3],
      [-0.24, -0.06, 0.02, 0.2],
      [0.24, -0.04, 0.02, 0.22],
      [0.02, 0.2, -0.02, 0.18],
    ];
    for (const [x, y, z, r] of puffs) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m);
      puff.position.set(x, y, z);
      puff.castShadow = true;
      g.add(puff);
    }
    addGrokEyes(g, { y: 0.02, z: 0.28, spread: 0.1, radius: 0.065 });
  } else if (shape === "square") {
    g.add(roundedCard(0.7, 0.7, 0.46, 0.18, m));
    addGrokEyes(g, { y: 0.02, z: 0.3, spread: 0.14, radius: 0.075 });
  } else if (shape === "teardrop") {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = (t - 0.38) * 0.9;
      const r = Math.sin(Math.PI * t) * 0.34 * (0.4 + 0.75 * (1 - t));
      pts.push(new THREE.Vector2(Math.max(r, 0.02), y));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 22), m);
    body.castShadow = true;
    g.add(body);
    addGrokEyes(g, { y: -0.02, z: 0.28, spread: 0.1, radius: 0.065 });
  } else if (shape === "star") {
    const star = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 0.48 : 0.16;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) star.moveTo(px, py);
      else star.lineTo(px, py);
    }
    star.closePath();
    g.add(flatShape(star, 0.28, m));
    addGrokEyes(g, { y: 0.02, z: 0.2, spread: 0.1, radius: 0.06 });
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 18), m);
    body.scale.set(1.12, 1.02, 1.02);
    body.castShadow = true;
    g.add(body);
    addGrokEyes(g, { y: 0.02, z: 0.34, spread: 0.11, radius: 0.07 });
    const badge = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 10),
      new THREE.MeshBasicMaterial({ color: COLORS.mainBadge }),
    );
    badge.position.set(0.28, 0.26, 0.16);
    g.add(badge);
  }
  return g;
}

const STUDIO_ART = [
  { url: "../../07_comics/converted/cover-isabel-art.png", aspect: 864 / 1152, x: -7.15, y: 3.9 },
  { url: "../../10_game_assets/characters/isabel.png", aspect: 1280 / 720, x: 6.55, y: 4.15 },
  { url: "../../10_game_assets/characters/maisie.png", aspect: 1280 / 720, x: 8.55, y: 3.85 },
  { url: "../../10_game_assets/characters/lotus-dragon.png", aspect: 1280 / 720, x: 10.5, y: 4.15 },
];

function loadStudioTexture(url) {
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addDeskProps(group, color) {
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.32), mat(0xf7f9fb));
  paper.position.set(-0.42, 0.84, -0.08);
  const paper2 = paper.clone();
  paper2.position.set(-0.38, 0.865, -0.05);
  paper2.rotation.y = 0.15;
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 12), mat(color, { roughness: 0.45 }));
  mug.position.set(0.48, 0.9, -0.18);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.16, 10), mat(0xc5d0da));
  cup.position.set(0.18, 0.92, -0.22);
  for (const [dx, h] of [[-0.02, 0.1], [0, 0.13], [0.02, 0.08]]) {
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 6), mat(0x5b6b7c));
    pen.position.set(0.18 + dx, 1.02, -0.22);
    group.add(pen);
  }
  group.add(paper, paper2, mug, cup);
}

function addBookcase(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const carcass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.65, 0.38), mat(0xb7c3ce));
  carcass.position.y = 0.82;
  carcass.castShadow = true;
  g.add(carcass);
  const spines = [0xf59312, 0xf93498, 0xfd690f, 0x13b7a2, 0x1e86fc, 0x8f59f9, 0x14c16f, 0x8aa4bc];
  spines.forEach((color, i) => {
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.22), mat(color, { roughness: 0.7 }));
    const row = Math.floor(i / 4);
    const col = i % 4;
    book.position.set(-0.55 + col * 0.28, 0.42 + row * 0.55, 0.06);
    g.add(book);
  });
  world.add(g);
}

function addFloorLamp(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 10), mat(0x9aa8b4));
  pole.position.y = 0.85;
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.28, 16),
    mat(0xf4f7fb, { emissive: 0xd5e4f2, emissiveIntensity: 0.45 }),
  );
  shade.position.y = 1.72;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.06, 12), mat(0xb7c3ce));
  foot.position.y = 0.03;
  g.add(pole, shade, foot);
  world.add(g);
}

function addClock() {
  const g = new THREE.Group();
  g.position.set(4.35, 5.55, -5.7);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), mat(0xc5d0da));
  rim.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.02, 24),
    new THREE.MeshBasicMaterial({ color: 0xf7f9fb }),
  );
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.03;
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.02), mat(0x243044));
  hand.position.set(0, 0.05, 0.05);
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), mat(0x243044));
  hand2.position.set(0.04, 0, 0.05);
  g.add(rim, face, hand, hand2);
  world.add(g);
}

function addFileCabinet(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.15, 0.48), mat(0xaeb8c4));
  body.position.y = 0.58;
  body.castShadow = true;
  g.add(body);
  for (const y of [0.28, 0.62, 0.96]) {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.28, 0.04), mat(0xd5dee6));
    drawer.position.set(0, y, 0.24);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), mat(0x8aa0b0));
    pull.position.set(0, y, 0.27);
    g.add(drawer, pull);
  }
  world.add(g);
}

function buildDecor() {
  addPlant(-6.3, 3.4, 1.05);
  addPlant(6.4, 3.5, 0.9);
  addPlant(-6.5, -3.6, 0.8);
  addBookcase(-8.4, -5.35);
  addBookcase(8.6, -5.35);
  addFloorLamp(-6.9, 1.2);
  addFloorLamp(6.9, 1.1);
  addClock();
  addFileCabinet(6.7, -4.5);
  addFileCabinet(-6.7, -4.5);
  for (const piece of STUDIO_ART) {
    hangPicture(piece.x, piece.y, -5.68, 0, loadStudioTexture(piece.url), piece.aspect);
  }
}

function addPlant(x, z, scale) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 16), mat(0xb7c3ce));
  pot.position.y = 0.21;
  pot.castShadow = true;
  g.add(pot);
  const leaf = mat(0x6ea37a);
  for (let i = 0; i < 6; i++) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), leaf);
    const a = (i / 6) * Math.PI * 2;
    blob.position.set(Math.cos(a) * 0.1, 0.52 + (i % 3) * 0.1, Math.sin(a) * 0.1);
    g.add(blob);
  }
  world.add(g);
}

function hangPicture(x, y, z, rotY, tex, aspect = 1.4) {
  const maxW = 1.9;
  const maxH = 1.55;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.06), mat(0xc5d0da));
  frame.castShadow = true;
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  art.position.z = 0.04;
  group.add(frame, art);
  world.add(group);
}

function setFocus(id) {
  focusedId = focusedId === id ? null : id;
  if (hintEl) {
    hintEl.textContent = focusedId
      ? `${labelFor(focusedId)} desk · double-click to reset the view`
      : "Drag to look · scroll to zoom · click a desk";
  }
}

function labelFor(id) {
  const desk = ALL_DESKS.find((d) => d.id === id);
  return desk ? desk.role : id;
}

function pickDesk(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(deskGroups.concat(laneAnimators.map((bot) => bot.anchor)), true);
  if (!hits.length) {
    if (focusedId) setFocus(focusedId);
    return;
  }
  let obj = hits[0].object;
  while (obj && !obj.userData.deskId) obj = obj.parent;
  if (obj && obj.userData.deskId) setFocus(obj.userData.deskId);
}

function hoverDesk(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(deskGroups.concat(laneAnimators.map((bot) => bot.anchor)), true).length > 0;
  renderer.domElement.classList.toggle("is-desk", hit);
}

function framedView() {
  const aspect = camera.aspect || 1;
  if (aspect < 0.95) {
    return {
      pos: new THREE.Vector3(2.15, 7.6, 17.4),
      target: new THREE.Vector3(2.05, 2.3, 0.05),
      fov: 76,
    };
  }
  return { pos: HOME_POS.clone(), target: HOME_TARGET.clone(), fov: 48 };
}

function beginReset() {
  const frame = framedView();
  resetJob = {
    t: 0,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: frame.pos,
    toTarget: frame.target,
  };
  controls.autoRotate = false;
}

function resize() {
  const w = view.clientWidth || window.innerWidth;
  const h = view.clientHeight || window.innerHeight;
  camera.aspect = w / Math.max(h, 1);
  const frame = framedView();
  camera.fov = frame.fov;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function updateGlows(dt, elapsed) {
  const pulse = 0.5 + Math.sin(elapsed * 2.15) * 0.5;
  for (const item of glows) {
    if (item.kind === "wait") item.material.emissiveIntensity = 0.48 + pulse * 0.42;
    else if (item.kind === "wait-halo") item.material.opacity = item.opacityBase + pulse * 0.28;
    else if (item.kind === "lane") item.material.opacity = 0.26 + pulse * 0.2;
    else if (item.kind === "desk") {
      const target = item.id === focusedId ? 0.92 : 0;
      item.material.opacity += (target - item.material.opacity) * Math.min(1, dt * 8);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (introT < 1) {
    introT = Math.min(1, introT + dt / 1.45);
    const k = smooth(introT);
    const frame = framedView();
    camera.fov = frame.fov;
    camera.updateProjectionMatrix();
    camera.position.lerpVectors(introFrom, frame.pos, k);
    controls.target.copy(frame.target);
    if (introT >= 1) {
      controls.enabled = true;
      controls.autoRotate = false;
      resumeAt = elapsed + (REDUCE_MOTION ? Infinity : 12);
      controls.update();
    }
  } else if (resetJob) {
    resetJob.t = Math.min(1, resetJob.t + dt / 0.55);
    const k = smooth(resetJob.t);
    camera.position.lerpVectors(resetJob.fromPos, resetJob.toPos, k);
    controls.target.lerpVectors(resetJob.fromTarget, resetJob.toTarget, k);
    if (resetJob.t >= 1) {
      resetJob = null;
      controls.enabled = true;
      controls.update();
    }
  } else {
    if (elapsed > resumeAt) {
      controls.autoRotate = !REDUCE_MOTION;
      resumeAt = Infinity;
    }
    controls.update();
  }

  updateGlows(dt, elapsed);
  updateLaneAnimators(dt, elapsed);
  renderer.render(scene, camera);
}

function bindInput() {
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY, t: performance.now() };
    el.classList.add("is-dragging");
    if (introT < 1) introT = 1;
    resetJob = null;
  });
  el.addEventListener("pointerup", (event) => {
    el.classList.remove("is-dragging");
    if (!pointerDown) return;
    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    pointerDown = null;
    if (dx * dx + dy * dy > 25) return;
    const now = performance.now();
    if (now - lastClick < 320) {
      lastClick = 0;
      beginReset();
      return;
    }
    lastClick = now;
    pickDesk(event);
  });
  el.addEventListener("pointermove", (event) => {
    if (!pointerDown) hoverDesk(event);
  });
  el.addEventListener("pointerleave", () => {
    el.classList.remove("is-desk");
    el.classList.remove("is-dragging");
  });
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    resumeAt = Infinity;
    resetJob = null;
  });
  controls.addEventListener("end", () => {
    resumeAt = clock.getElapsedTime() + 10;
  });
}

async function readyFonts() {
  if (!document.fonts) return;
  await Promise.race([
    document.fonts.load("800 64px Nunito").catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1400)),
  ]);
}

async function init() {
  await readyFonts();
  buildRoom();
  buildLaneRug();
  buildWarBoard();
  const desks = ALL_DESKS.map((desk) => buildDesk(desk));
  buildDecor();
  resize();
  window.addEventListener("resize", resize);
  bindInput();

  for (const desk of desks) laneAnimators.push(makeMeshAnimator(desk));

  loadingEl.classList.add("hidden");
  document.body.dataset.room = laneAnimators.length === ALL_DESKS.length ? "ready" : "partial";
  window.__hammer = {
    get bots() {
      return laneAnimators.map((b) => ({
        id: b.id,
        x: Number(b.anchor.position.x.toFixed(3)),
        y: Number(b.anchor.position.y.toFixed(3)),
        z: Number(b.anchor.position.z.toFixed(3)),
        state: b.state,
        mode: b.mode,
        frame: b.frame,
      }));
    },
    get focused() {
      return focusedId;
    },
    focus: setFocus,
  };
  animate();
}

init();
