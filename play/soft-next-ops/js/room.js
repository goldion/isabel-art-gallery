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
  art: 0xf0c14d,
  dev: 0xe25b86,
  tester: 0xf27d62,
  cto: 0x7ec8ef,
  assistant: 0xb7d0a6,
  cfo: 0x8b7ec8,
  governess: 0xe8c547,
  mainBot: 0x2a2a2a,
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

const LANE_DESKS = [
  { id: "art", role: "Art", mark: "heart", color: COLORS.art, sheet: "art", x: -3.15 },
  { id: "developer", role: "Developer", mark: "hex", color: COLORS.dev, sheet: "developer", x: -1.05 },
  { id: "tester", role: "Tester", sub: "Marketing", mark: "tablet", color: COLORS.tester, sheet: "tester", x: 1.05 },
  { id: "cto", role: "CTO", mark: "cloud", color: COLORS.cto, sheet: "cto", x: 3.15 },
];

const OFF_LANE = [
  { id: "assistant", role: "Assistant", sub: "Admin", shape: "square", color: COLORS.assistant, x: 4.72 },
  { id: "cfo", role: "CFO", sub: "Expense", shape: "teardrop", color: COLORS.cfo, x: 5.72 },
  { id: "governess", role: "Governess", shape: "star", color: COLORS.governess, x: 6.72 },
  { id: "main", role: "Main", sub: "Bot", shape: "blob", color: COLORS.mainBot, x: 7.72 },
];

const SHEET_PATHS = {
  art: "assets/characters/art-walk-idle-sheet.png",
  developer: "assets/characters/developer-walk-idle-sheet.png",
  tester: "assets/characters/tester-walk-idle-sheet.png",
  cto: "assets/characters/cto-walk-idle-sheet.png",
};

const DESK_Z = 0.78;
const LOUNGE_Z = 0.82;
const HOME_POS = new THREE.Vector3(2.05, 4.4, 10.85);
const HOME_TARGET = new THREE.Vector3(1.7, 2.9, -0.7);
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PACE = [
  { mode: "idle", x: 0, dur: 2.15 },
  { mode: "walk", x: 0.26, dur: 0.82 },
  { mode: "idle", x: 0.26, dur: 0.22 },
  { mode: "walk", x: -0.26, dur: 1.12 },
  { mode: "idle", x: -0.26, dur: 0.18 },
  { mode: "walk", x: 0, dur: 0.78 },
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
const loungeBobs = [];
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

function makeLaneAnimator(sheet, desk) {
  const frames = [0, 1, 2, 3].map((i) => frameSlice(sheet, i));
  const cropH = sheet.cropBot - sheet.cropTop;
  const displayH = 1.22;
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

  const anchor = new THREE.Group();
  anchor.position.set(0, 0.93, 0.06);
  anchor.add(sprite);
  anchor.add(ghost);
  desk.group.add(anchor);

  return {
    id: desk.id,
    anchor,
    sprite,
    ghost,
    sheet,
    frames,
    displayW,
    displayH,
    phase: LANE_DESKS.findIndex((d) => d.id === desk.id) * 0.73,
    step: 0,
    stepT: LANE_DESKS.findIndex((d) => d.id === desk.id) * 0.37,
    fromX: 0,
    x: 0,
    frame: 0,
    frameTimer: 0,
    fadeT: 1,
    fadeFrom: 0,
    mode: "idle",
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

function updateLaneAnimators(dt, elapsed) {
  for (const bot of laneAnimators) {
    const focused = bot.id === focusedId;
    const speed = focused ? 1.45 : 1;
    const step = PACE[bot.step];
    const dur = step.mode === "idle" ? step.dur * (focused ? 0.55 : 1) : step.dur / speed;
    bot.stepT += dt;
    const k = smooth(bot.stepT / dur);
    bot.x = THREE.MathUtils.lerp(bot.fromX, step.x, step.mode === "walk" ? k : 1);
    if (bot.stepT >= dur) {
      bot.fromX = step.x;
      bot.x = step.x;
      bot.step = (bot.step + 1) % PACE.length;
      bot.stepT = 0;
    }
    const live = PACE[bot.step];
    bot.mode = live.mode;
    const facing = live.mode === "walk" && Math.abs(live.x - bot.fromX) > 0.02
      ? Math.sign(live.x - bot.fromX) || 1
      : Math.sign(bot.sprite.scale.x) || 1;
    const bob = live.mode === "walk"
      ? Math.sin(elapsed * 11 + bot.phase) * 0.035
      : Math.sin(elapsed * 2.1 + bot.phase) * 0.02;
    bot.anchor.position.x = bot.x;
    bot.anchor.position.y = 0.93 + bob;
    bot.anchor.position.z = 0.06 + Math.sin(elapsed * 1.3 + bot.phase) * 0.015;
    const w = bot.displayW * facing;
    bot.sprite.scale.set(w, bot.displayH, 1);
    bot.ghost.scale.set(w, bot.displayH, 1);

    bot.frameTimer += dt;
    const interval = live.mode === "walk" ? 0.14 : 0.42;
    const wantWalk = live.mode === "walk";
    const inWalk = bot.frame >= 2;
    if (wantWalk !== inWalk) {
      showFrame(bot, wantWalk ? 2 : 0);
      bot.frameTimer = 0;
    } else if (bot.frameTimer >= interval) {
      bot.frameTimer = 0;
      if (wantWalk) showFrame(bot, bot.frame === 2 ? 3 : 2);
      else showFrame(bot, bot.frame === 0 ? 1 : 0);
    }
    if (bot.fadeT < 1) {
      bot.fadeT = Math.min(1, bot.fadeT + dt / 0.12);
      bot.sprite.material.opacity = bot.fadeT;
      bot.ghost.material.opacity = 1 - bot.fadeT;
    }
  }
}

function updateLounge(elapsed) {
  for (const bot of loungeBobs) {
    bot.position.y = bot.userData.baseY + Math.sin(elapsed * 1.4 + bot.userData.phase) * 0.018;
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
  group.position.set(desk.x, 0, DESK_Z);
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

function addBotFace(parent, scale = 1) {
  const face = new THREE.Group();
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.42 * scale, 0.26 * scale, 0.05 * scale),
    mat(0x1a1a1a, { emissive: 0x101820, emissiveIntensity: 0.35 }),
  );
  face.add(screen);
  const eyeMat = mat(0x7ad7f5, { emissive: 0x5ec8f0, emissiveIntensity: 0.85 });
  for (const ex of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 10, 10), eyeMat);
    eye.position.set(ex * scale, 0.02 * scale, 0.04 * scale);
    face.add(eye);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.07 * scale, 0.012 * scale, 6, 14, Math.PI),
    eyeMat,
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.06 * scale, 0.04 * scale);
  face.add(smile);
  parent.add(face);
  return face;
}

function shapeMesh(shape, color) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.7 });
  let body;
  if (shape === "square") {
    body = roundedCard(0.58, 0.58, 0.42, 0.12, m);
  } else if (shape === "teardrop") {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const y = (t - 0.42) * 0.78;
      const r = Math.sin(Math.PI * t) * 0.28 * (0.55 + 0.55 * (1 - t));
      pts.push(new THREE.Vector2(Math.max(r, 0.02), y));
    }
    body = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), m);
  } else if (shape === "star") {
    const star = new THREE.Shape();
    const outer = 0.38;
    const inner = 0.16;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) star.moveTo(px, py);
      else star.lineTo(px, py);
    }
    star.closePath();
    body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(star, { depth: 0.22, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }),
      m,
    );
    body.position.z = -0.11;
  } else {
    body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), m);
    body.scale.set(1.18, 0.92, 1.02);
  }
  body.castShadow = true;
  g.add(body);
  const face = addBotFace(g, shape === "blob" ? 0.85 : 0.95);
  face.position.z = shape === "star" ? 0.16 : 0.2;
  if (shape === "teardrop") face.position.y = 0.02;
  return g;
}

function buildOffLaneLounge() {
  const lounge = new THREE.Group();
  lounge.name = "lounge";
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.15, 2.15), mat(0xd0d8de));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(6.22, 0.018, LOUNGE_Z);
  rug.receiveShadow = true;
  lounge.add(rug);

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.02, 40),
    mat(0xb7c4ce),
  );
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(2.15, 1.12, 1);
  rim.position.set(6.22, 0.022, LOUNGE_Z);
  lounge.add(rim);

  OFF_LANE.forEach((b, i) => {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.28, 18), mat(0xaeb9c4));
    base.position.set(b.x, 0.14, LOUNGE_Z);
    base.castShadow = true;
    lounge.add(base);

    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.16, 18),
      mat(b.color, { roughness: 0.75 }),
    );
    cushion.position.set(b.x, 0.34, LOUNGE_Z);
    cushion.castShadow = true;
    lounge.add(cushion);

    const bot = shapeMesh(b.shape, b.color);
    bot.position.set(b.x, 0.72, LOUNGE_Z);
    bot.scale.setScalar(0.82);
    bot.userData.baseY = bot.position.y;
    bot.userData.phase = i * 0.8;
    lounge.add(bot);
    loungeBobs.push(bot);

    const tag = textPlane(b.sub ? [b.role, b.sub] : b.role, 0.92, b.sub ? 0.36 : 0.24, {
      fontSize: b.role.length > 8 ? 36 : 44,
      width: 384,
      height: b.sub ? 160 : 96,
      fill: COLORS.ink,
      bg: "#f7f9fb",
      radius: 28,
    });
    tag.position.set(b.x, 0.16, LOUNGE_Z + 0.46);
    lounge.add(tag);
  });

  world.add(lounge);
}

function buildDecor() {
  addPlant(-5.15, -0.4, 1.05);
  addPlant(4.55, -1.35, 0.85);
  hangPicture(6.7, 4.55, -5.68, 0, crayonTexture("sun"));
  hangPicture(8.05, 4.32, -5.68, 0, crayonTexture("flower"));
  hangPicture(9.35, 4.55, -5.68, 0, crayonTexture("house"));
  hangPicture(-6.55, 4.48, -5.68, 0, crayonTexture("night"));
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

function hangPicture(x, y, z, rotY, tex) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.98, 0.06), mat(0xc5d0da));
  frame.castShadow = true;
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, 0.78),
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
  const desk = LANE_DESKS.find((d) => d.id === id);
  return desk ? desk.role : id;
}

function pickDesk(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(deskGroups, true);
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
  const hit = raycaster.intersectObjects(deskGroups, true).length > 0;
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
  updateLounge(elapsed);
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
  const desks = LANE_DESKS.map((desk) => buildDesk(desk));
  buildOffLaneLounge();
  buildDecor();
  resize();
  window.addEventListener("resize", resize);
  bindInput();

  try {
    const loaded = {};
    await Promise.all(
      Object.entries(SHEET_PATHS).map(async ([key, url]) => {
        loaded[key] = keySheet(await loadImage(url));
      }),
    );
    for (const desk of desks) {
      const sheet = loaded[desk.sheet];
      if (sheet) laneAnimators.push(makeLaneAnimator(sheet, desk));
    }
  } catch (err) {
    console.error(err);
  }

  loadingEl.classList.add("hidden");
  document.body.dataset.room = laneAnimators.length === LANE_DESKS.length ? "ready" : "partial";
  window.__hammer = {
    get bots() {
      return laneAnimators.map((b) => ({
        id: b.id,
        x: Number(b.anchor.position.x.toFixed(3)),
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
