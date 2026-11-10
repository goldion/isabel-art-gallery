/**
 * Hammer Studio — Soft Next ops room.
 * Blue studio walls and board, war-room cards, free-walking Grok bots.
 * Title is Hammer Studio only. Active station glow follows live Soft PASS gate.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  wall: 0xd7eefc,
  wallSide: 0xc9e4f8,
  floor: 0xe3eef6,
  frame: 0x5b96d6,
  board: 0xe7f3fc,
  card: 0xf7fbff,
  ink: "#243044",
  lane: 0x3a8ec4,
  laneGlow: 0x7ee7ff,
  waiting: 0xfff0c4,
  waitingGlow: 0xffc84a,
  art: 0xf59312,
  dev: 0xf93498,
  tester: 0xfd690f,
  cto: 0x13b7a2,
  assistant: 0x1e86fc,
  cfo: 0x8f59f9,
  governess: 0x14c16f,
  other: 0x8899a6,
  mainBot: 0x000000,
  mainBadge: 0xf59312,
  wood: 0xc49a6c,
  desk: 0x8f5e32,
  plant: 0x3a8f4a,
  pot: 0xc87850,
  trim: 0x6d94c0,
};

const STATION_TINTS = {
  pick: 0xf4f7fb,
  "soft-pass": 0xe7f6ea,
  "waiting-go": 0xfff6dc,
  tip: 0xe5f3fb,
  smoke: 0xfdeceb,
  done: 0xe7f8f0,
};

const DESK_CUP_ACCENTS = {
  art: 0x2eb8b8,
  developer: 0xf0957a,
  tester: 0xf5c518,
  cto: 0x3ab8c8,
};

const GATE_STAGES = ["pick", "soft-pass", "waiting-go", "tip", "smoke", "done"];
const GATE_BOT_IDS = ["art", "developer", "tester"];
const GATE_BOT_STATUSES = ["idle", "cooking", "waiting-go", "smoking"];
const GATE_API =
  (typeof window !== "undefined" && window.__SOFT_PASS_GATE_URL) ||
  "https://soft-pass-gate.isabel-art-goldion.workers.dev";
const GATE_STATIC = new URL("../gate-status.json", import.meta.url).href;
const GATE_POLL_MS = 12_000;

/** Seat glow from Worker `bots` — not ambient walker animation. */
const BOT_SEAT_GLOW = {
  idle: { ring: 0, emissive: 0.12, tint: null },
  cooking: { ring: 0.78, emissive: 0.58, tint: COLORS.waitingGlow },
  "waiting-go": { ring: 0.88, emissive: 0.65, tint: COLORS.waitingGlow },
  smoking: { ring: 0.72, emissive: 0.5, tint: 0xf0a8a0 },
};

const STATIONS = [
  { id: "pick", label: "Pick", icon: "pick" },
  { id: "soft-pass", label: "Soft PASS", icon: "pass" },
  { id: "waiting-go", label: "Waiting Go", icon: "wait" },
  { id: "tip", label: "Tip", icon: "tip" },
  { id: "smoke", label: "Smoke", icon: "smoke" },
  { id: "done", label: "Done", icon: "done" },
];

const DESK_Z = 2.45;
const BACK_Z = -2.15;
const COL_X = [-6.35, -2.15, 2.15, 6.35];

const LANE_DESKS = [
  { id: "art", role: "Art", mark: "heart", shape: "heart", color: COLORS.art, x: COL_X[0], z: DESK_Z },
  { id: "developer", role: "Developer", mark: "hex", shape: "hex", color: COLORS.dev, x: COL_X[1], z: DESK_Z },
  { id: "tester", role: "Tester", sub: "Marketing", mark: "wedge", shape: "wedge", color: COLORS.tester, x: COL_X[2], z: DESK_Z },
  { id: "cto", role: "CTO", mark: "cloud", shape: "cloud", color: COLORS.cto, x: COL_X[3], z: DESK_Z },
];

const OFF_LANE = [
  { id: "assistant", role: "Assistant", sub: "Admin", mark: "square", shape: "square", color: COLORS.assistant, x: COL_X[0], z: BACK_Z },
  { id: "cfo", role: "CFO", sub: "Expense", mark: "drop", shape: "teardrop", color: COLORS.cfo, x: COL_X[1], z: BACK_Z },
  { id: "governess", role: "Governess", mark: "star", shape: "star", color: COLORS.governess, x: COL_X[2], z: BACK_Z },
  { id: "main", role: "Main", sub: "Bot", mark: "blob", shape: "blob", color: COLORS.mainBot, x: COL_X[3], z: BACK_Z },
  { id: "other", role: "Other", sub: "Unmapped", mark: "blob", shape: "blob", color: COLORS.other, x: 0, z: -3.55 },
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
const FLOOR_BOX = { minX: -9.6, maxX: 9.6, minZ: -4.55, maxZ: 6.6 };
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
camera.lookAt(HOME_TARGET);

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

scene.add(new THREE.HemisphereLight(0xf4f9ff, 0xc9ddf0, 1.42));
const sun = new THREE.DirectionalLight(0xffffff, 1.08);
const fill = new THREE.DirectionalLight(0xe7f3ff, 0.38);
fill.position.set(-9, 7, 3);
scene.add(fill);
sun.position.set(4.5, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 36;
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -14;
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
let gateStageId = "pick";
let gateBots = { art: "idle", developer: "idle", tester: "idle" };
let gateUsage = null;
/** Last-known desk share map when Worker `usage` is absent (fallback). */
let lastKnownWeekShare = null;
/** Desk ids that receive a weekly usage bar (admin usage maps to main). */
const USAGE_DESK_IDS = [
  "art",
  "developer",
  "tester",
  "cto",
  "assistant",
  "main",
  "cfo",
  "governess",
  "other",
];
function usageRowToDeskId(rowId) {
  const id = String(rowId ?? "").trim();
  if (id === "admin") return "main";
  if (USAGE_DESK_IDS.includes(id)) return id;
  return "other";
}

function gateSeatLocked(botId) {
  const status = gateBots[botId];
  return status === "cooking" || status === "waiting-go" || status === "smoking";
}
let warBoardGroup = null;
let gatePollTimer = null;
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

function drawController(ctx) {
  ctx.fillStyle = "#14171a";
  ctx.beginPath();
  ctx.moveTo(39, 2.2);
  ctx.bezierCurveTo(24, 2.2, 16.2, 5.2, 11.2, 10.2);
  ctx.bezierCurveTo(7.2, 14.2, 5.2, 18.4, 4.6, 24.2);
  ctx.lineTo(3.6, 35.6);
  ctx.bezierCurveTo(3.1, 39.6, 2.2, 42.4, 2.2, 45.6);
  ctx.bezierCurveTo(2.2, 50.8, 6.2, 54.2, 11, 54.2);
  ctx.bezierCurveTo(15.6, 54.2, 17.8, 51.2, 17.8, 47.2);
  ctx.bezierCurveTo(17.8, 43.2, 21.4, 40.8, 27.2, 40.8);
  ctx.bezierCurveTo(32.2, 40.8, 34.6, 42.6, 39, 42.6);
  ctx.bezierCurveTo(43.4, 42.6, 45.8, 40.8, 50.8, 40.8);
  ctx.bezierCurveTo(56.6, 40.8, 60.2, 43.2, 60.2, 47.2);
  ctx.bezierCurveTo(60.2, 51.2, 62.4, 54.2, 67, 54.2);
  ctx.bezierCurveTo(71.8, 54.2, 75.8, 50.8, 75.8, 45.6);
  ctx.bezierCurveTo(75.8, 42.4, 74.9, 39.6, 74.4, 35.6);
  ctx.lineTo(73.4, 24.2);
  ctx.bezierCurveTo(72.8, 18.4, 70.8, 14.2, 66.8, 10.2);
  ctx.bezierCurveTo(61.8, 5.2, 54, 2.2, 39, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8899a6";
  roundPath(ctx, 18.8, 7.4, 6.2, 17.4, 2.1);
  ctx.fill();
  roundPath(ctx, 12.2, 13, 19.4, 6.2, 2.1);
  ctx.fill();
  ctx.fillStyle = "#67757f";
  ctx.beginPath();
  ctx.arc(27.6, 34.6, 5.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(49.6, 34.6, 5.8, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, y, color] of [
    [55.4, 8.8, "#ffcc4d"],
    [48.5, 15.7, "#50a5e6"],
    [62.4, 15.7, "#dd2e44"],
    [55.5, 22.6, "#77b255"],
  ]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function controllerMarkTexture() {
  return canvasTexture(390, 280, (ctx) => {
    ctx.scale(5, 5);
    drawController(ctx);
  });
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
  } else if (mark === "wedge") {
    ctx.moveTo(0, -22 * s);
    ctx.lineTo(18 * s, 16 * s);
    ctx.lineTo(-18 * s, 16 * s);
    ctx.closePath();
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
    ctx.fillStyle = "#fff8ee";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(139, 90, 43, 0.22)";
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
      g.addColorStop(0, "#fff0e4");
      g.addColorStop(1, "#e8b898");
      disc(g, "#c48a62");
      ctx.fillStyle = "#8b5a2b";
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
      disc("#7ed492", "#3f8f4a");
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
    } else if (icon === "wait") {
      disc("#fff4cc", "#e8c84a");
      ctx.fillStyle = "#c4922e";
      roundPath(ctx, 108, 118, 40, 44, 8);
      ctx.fill();
      ctx.fillStyle = "#fff8dc";
      ctx.beginPath();
      ctx.arc(128, 102, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5c842";
      ctx.beginPath();
      ctx.arc(128, 104, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (icon === "smoke") {
      disc("#f0c4c0", "#d88888");
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
      disc("#8ee8c8", "#3fbf8f");
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
    ctx.fillStyle = "#e3eef6";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(90, 124, 158, 0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 32 + 0.5);
      ctx.lineTo(256, i * 32 + 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(110, 146, 178, 0.45)";
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
    ctx.fillStyle = "#fff6e8";
    ctx.fillRect(0, 0, 320, 240);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(200, 160, 120, ${0.05 + rand() * 0.09})`;
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

function chairZ(desk) {
  return desk.id === "cfo" ? 1.18 : 0.95;
}

function seatVector(desk) {
  return new THREE.Vector3(desk.x, SEAT_Y, desk.z - chairZ(desk));
}

function standVector(desk) {
  const side = desk.x >= 0 ? 1.7 : -1.7;
  return new THREE.Vector3(desk.x + side, FLOOR_Y, desk.z - chairZ(desk));
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
  const body = shapeMesh(desk.shape, desk.color, desk.id);
  body.scale.setScalar(1.35);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 18),
    new THREE.MeshBasicMaterial({ color: 0x667484, transparent: true, opacity: 0, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  const anchor = new THREE.Group();
  anchor.userData.deskId = desk.id;
  const bubble = new THREE.Sprite(
    new THREE.SpriteMaterial({
      transparent: true,
      depthWrite: false,
    }),
  );
  bubble.center.set(0.5, 0);
  bubble.position.set(0.05, weekShare(desk.id) == null ? 1.22 : 1.55, 0);
  bubble.scale.set(1.35, 0.58, 1);
  bubble.visible = false;
  const tokenBar = new THREE.Sprite(
    new THREE.SpriteMaterial({
      transparent: true,
      depthWrite: false,
    }),
  );
  tokenBar.center.set(0.5, 0.5);
  tokenBar.position.set(0, 1.18, 1.15);
  tokenBar.scale.set(1.42, 0.4, 1);
  tokenBar.material.depthTest = false;
  tokenBar.renderOrder = 12;
  tokenBar.visible = false;
  anchor.add(body);
  anchor.add(shadow);
  anchor.add(bubble);
  anchor.add(tokenBar);
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
    bubble,
    bubbleLine: "",
    tokenBar,
    tokenPct: -1,
    color: desk.color,
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

const BOT_RADIUS = 0.55;

function deskObstacles() {
  const list = [];
  for (const desk of ALL_DESKS) {
    list.push({ x: desk.x, z: desk.z, r: 0.98 });
    list.push({ x: desk.x, z: desk.z - chairZ(desk), r: 0.58 });
  }
  return list;
}

function hitsSolid(x, z) {
  for (const block of deskObstacles()) {
    if (Math.hypot(x - block.x, z - block.z) < block.r + BOT_RADIUS * 0.72) return true;
  }
  return false;
}

function pointBlocked(x, z) {
  return hitsSolid(x, z);
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
  bot.detour = null;
  bot.returnMisses = 0;
  resetProgress(bot);
  bot.goal = randomFloorPoint(bot.anchor.position);
}

function beginReturn(bot) {
  if (bot.state === "return" || bot.state === "work") return;
  bot.state = "return";
  bot.stateT = 0;
  bot.returnPhase = "toStand";
  bot.detour = null;
  bot.returnMisses = 0;
  resetProgress(bot);
  bot.from.copy(bot.anchor.position);
}

function resetProgress(bot) {
  bot.bestRemain = null;
  bot.progressT = 0;
}

function insideFloor(x, z) {
  return x >= FLOOR_BOX.minX && x <= FLOOR_BOX.maxX && z >= FLOOR_BOX.minZ && z <= FLOOR_BOX.maxZ;
}

function canStep(x, z) {
  return insideFloor(x, z) && !hitsSolid(x, z);
}

function detourPoint(bot, target) {
  const pos = bot.anchor.position;
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz) || 1;
  const px = -dz / dist;
  const pz = dx / dist;
  const side = bot.detourSide || 1;
  bot.detourSide = -side;
  for (const mag of [1.6, 2.4, 1.0]) {
    const x = pos.x + px * mag * side;
    const z = pos.z + pz * mag * side;
    if (canStep(x, z)) return new THREE.Vector3(x, FLOOR_Y, z);
  }
  return new THREE.Vector3(0.2, FLOOR_Y, 3.3);
}

function moveToward(bot, target, dt) {
  const pos = bot.anchor.position;
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  const step = Math.min(WALK_SPEED * dt, dist);
  const nx = pos.x + (dx / dist) * step;
  const nz = pos.z + (dz / dist) * step;
  let moved = false;
  if (canStep(nx, nz)) {
    pos.x = nx;
    pos.z = nz;
    moved = true;
  } else if (canStep(nx, pos.z)) {
    pos.x = nx;
    moved = true;
  } else if (canStep(pos.x, nz)) {
    pos.z = nz;
    moved = true;
  } else {
    const steer = Math.atan2(dz, dx);
    for (const turn of [0.85, -0.85, 1.7, -1.7]) {
      const sx = pos.x + Math.cos(steer + turn) * step;
      const sz = pos.z + Math.sin(steer + turn) * step;
      if (canStep(sx, sz)) {
        pos.x = sx;
        pos.z = sz;
        moved = true;
        break;
      }
    }
  }
  const remain = Math.hypot(target.x - pos.x, target.z - pos.z);
  if (moved && (bot.bestRemain == null || remain < bot.bestRemain - 0.004)) {
    bot.bestRemain = remain;
    bot.progressT = 0;
  } else {
    bot.progressT = (bot.progressT || 0) + dt;
  }
  faceMove(bot, dx, dz);
  return remain;
}

const bubbleCache = new Map();

function bubbleTexture(text, color = 0) {
  const accent = color === 0 ? "#3a3a3a" : cssHex(color);
  const key = `${color}:${text}`;
  const cached = bubbleCache.get(key);
  if (cached) return cached;
  const tex = canvasTexture(640, 220, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundPath(ctx, 18, 14, w - 36, h - 58, 40);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 8;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 24, h - 52);
    ctx.lineTo(w * 0.5, h - 12);
    ctx.lineTo(w * 0.5 + 24, h - 52);
    ctx.closePath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 6;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 68;
    ctx.font = `800 ${size}px Nunito, Trebuchet MS, sans-serif`;
    while (ctx.measureText(text).width > w - 88 && size > 42) {
      size -= 4;
      ctx.font = `800 ${size}px Nunito, Trebuchet MS, sans-serif`;
    }
    ctx.fillText(text, w / 2, (h - 48) / 2 + 4);
  });
  bubbleCache.set(key, tex);
  return tex;
}

function workflowLine(bot) {
  const seat = gateBots[bot.id];
  if (!seat || seat === "idle") return "";
  if (seat === "cooking") {
    if (bot.id === "art") return "Packing";
    if (bot.id === "developer") return "Tipping";
    return "Cooking";
  }
  if (seat === "waiting-go") return "Waiting Go";
  if (seat === "smoking") return "Smoking";
  return "";
}

function bubbleLine(bot) {
  const workflow = workflowLine(bot);
  if (workflow) return workflow;
  if (bot.calledBack && bot.state === "return") return "On my way";
  return "";
}

function syncBubble(bot) {
  if (!bot.bubble) return;
  const line = bubbleLine(bot);
  if (line === bot.bubbleLine) return;
  bot.bubbleLine = line;
  if (!line) {
    bot.bubble.visible = false;
    return;
  }
  bot.bubble.visible = true;
  bot.bubble.material.map = bubbleTexture(line, bot.color ?? 0);
  bot.bubble.material.needsUpdate = true;
  const width = THREE.MathUtils.clamp(0.62 + line.length * 0.09, 1.1, 2.2);
  bot.bubble.scale.set(width, 0.58, 1);
}

const tokenBarCache = new Map();

/** Static fallback when Worker `usage` is absent (CFO schema v1 desk ids). */
const GROK_WEEK_SHARE = {
  art: 8,
  developer: 17,
  tester: 9,
  cto: 13,
  assistant: 25,
  main: 0,
  cfo: 0,
  governess: 0,
  other: 0,
};

function weekShareMap() {
  if (gateUsage?.bots && Array.isArray(gateUsage.bots)) {
    const map = Object.fromEntries(USAGE_DESK_IDS.map((id) => [id, 0]));
    let otherExtra = 0;
    for (const row of gateUsage.bots) {
      const rawId = String(row?.id ?? "").trim();
      const pct = Number(row?.sharePct);
      if (!Number.isFinite(pct)) continue;
      const rounded = Math.round(pct);
      if (rawId === "other") {
        map.other = rounded;
        continue;
      }
      const deskId = usageRowToDeskId(rawId);
      if (deskId === "other") otherExtra += rounded;
      else map[deskId] = rounded;
    }
    map.other += otherExtra;
    lastKnownWeekShare = { ...map };
    return map;
  }
  if (lastKnownWeekShare) return { ...lastKnownWeekShare };
  return { ...GROK_WEEK_SHARE };
}

function weekShare(id) {
  const share = weekShareMap()[id];
  return Number.isFinite(share) ? share : null;
}

function cssHex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function tokenBarTexture(share, color) {
  const fillPct = Math.max(0, Math.min(100, Math.round(share)));
  const key = `${color}:${share}:${fillPct}`;
  const cached = tokenBarCache.get(key);
  if (cached) return cached;
  const fill = color === 0 ? "#3a3a3a" : cssHex(color);
  const label = color === 0 ? "#f4f7fb" : cssHex(color);
  const tex = canvasTexture(480, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const trackW = 286;
    roundPath(ctx, 8, 22, trackW, 52, 26);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fill();
    const fillW = fillPct <= 0 ? 0 : Math.max(18, (trackW - 12) * (fillPct / 100));
    if (fillW > 0) {
      roundPath(ctx, 14, 28, fillW, 40, 20);
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.font = "800 40px Nunito, Trebuchet MS, sans-serif";
    const text = `${share}%`;
    const textW = ctx.measureText(text).width;
    roundPath(ctx, trackW + 16, 18, textW + 28, 60, 22);
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.fill();
    ctx.fillStyle = label;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, trackW + 30, 48);
  });
  tokenBarCache.set(key, tex);
  return tex;
}

function syncTokenBar(bot) {
  if (!bot.tokenBar) return;
  const share = weekShare(bot.id);
  if (bot.state !== "work" || share == null) {
    bot.tokenBar.visible = false;
    bot.tokenPct = -1;
    return;
  }
  bot.tokenBar.visible = true;
  if (share === bot.tokenPct) return;
  bot.tokenPct = share;
  bot.tokenBar.material.map = tokenBarTexture(share, bot.color);
  bot.tokenBar.material.needsUpdate = true;
}

function updateLaneAnimators(dt, elapsed) {
  for (const bot of laneAnimators) {
    syncBubble(bot);
    syncTokenBar(bot);
    const focused = bot.id === focusedId;
    const seatLocked = gateSeatLocked(bot.id);
    if (focused && bot.state !== "work") {
      bot.calledBack = true;
      if (bot.state !== "return") beginReturn(bot);
    }
    if (seatLocked && (bot.state === "wander" || bot.state === "leave")) {
      beginReturn(bot);
    }

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
      if (!focused && !seatLocked && bot.stateT > bot.workDur) beginLeave(bot);
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
      if (!bot.goal || bot.progressT > 0.65) {
        if (bot.goal) bot.stalls = (bot.stalls || 0) + 1;
        resetProgress(bot);
        bot.goal = bot.stalls > 2
          ? new THREE.Vector3(0.2, FLOOR_Y, 3.3)
          : randomFloorPoint(bot.anchor.position);
        if (bot.stalls > 2) bot.stalls = 0;
      }
      const left = moveToward(bot, bot.goal, dt);
      const bob = Math.abs(Math.sin(elapsed * 8 + bot.phase)) * 0.06;
      bot.anchor.position.y = bot.floorLift + bob;
      playClip(bot, true, dt);
      plantShadow(bot, true);
      if (left < 0.12) {
        bot.wanderLeft -= 1;
        resetProgress(bot);
        if (bot.wanderLeft <= 0) beginReturn(bot);
        else bot.goal = randomFloorPoint(bot.anchor.position);
      }
      continue;
    }

    if (bot.state === "return") {
      if (bot.returnPhase === "toStand") {
        if (bot.progressT > 0.8) {
          resetProgress(bot);
          bot.returnMisses = (bot.returnMisses || 0) + 1;
          if (bot.returnMisses >= 3) {
            bot.returnPhase = "sit";
            bot.stateT = 0;
            bot.detour = null;
            bot.from.copy(bot.anchor.position);
          } else {
            bot.detour = detourPoint(bot, bot.stand);
          }
        }
        if (bot.returnPhase === "toStand") {
          const left = moveToward(bot, bot.detour || bot.stand, dt);
          bot.anchor.position.y = bot.floorLift + Math.abs(Math.sin(elapsed * 10 + bot.phase)) * 0.05;
          playClip(bot, true, dt);
          plantShadow(bot, true);
          if (bot.detour && left < 0.28) {
            bot.detour = null;
            resetProgress(bot);
          } else if (!bot.detour && left < 0.08) {
            bot.returnPhase = "sit";
            bot.stateT = 0;
            bot.returnMisses = 0;
            bot.from.copy(bot.anchor.position);
          }
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
          bot.calledBack = false;
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

  const sign = roundedCard(8.6, 1.28, 0.05, 0.2, mat(0xd7e8f8));
  sign.position.set(0.15, 5.22, -5.74);
  world.add(sign);
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.08),
    new THREE.MeshBasicMaterial({ map: controllerMarkTexture(), transparent: true, depthWrite: false }),
  );
  logo.position.set(-3.15, 5.22, -5.68);
  world.add(logo);
  const title = textPlane("Hammer Studio", 5.8, 0.78, {
    fontSize: 112,
    width: 1200,
    height: 200,
    fill: "#1b2836",
  });
  title.position.set(0.85, 5.22, -5.66);
  world.add(title);

  const cornice = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 0.12), mat(COLORS.trim));
  cornice.position.set(0, 6.45, -5.76);
  world.add(cornice);
}

function buildLaneRug() {
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat(COLORS.lane));
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(7.5, 1, 2.05);
  rug.position.set(0, 0.02, DESK_Z + 0.35);
  rug.receiveShadow = true;
  world.add(rug);

  const pts = [];
  const xArm = 5.55;
  const zBack = DESK_Z - 0.35;
  const zFront = DESK_Z + 0.85;
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
    opacity: 0.48,
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

function purgeGateGlows() {
  for (let i = glows.length - 1; i >= 0; i--) {
    if (glows[i].gate) glows.splice(i, 1);
  }
}

function disposeGroup(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}

function normalizeGateStage(stage) {
  const id = String(stage || "").trim();
  return GATE_STAGES.includes(id) ? id : null;
}

function defaultBotsForStage(stage) {
  const idle = () => Object.fromEntries(GATE_BOT_IDS.map((id) => [id, "idle"]));
  switch (stage) {
    case "soft-pass":
      return { art: "cooking", developer: "idle", tester: "idle" };
    case "waiting-go":
      return { art: "waiting-go", developer: "waiting-go", tester: "idle" };
    case "tip":
      return { art: "idle", developer: "cooking", tester: "idle" };
    case "smoke":
      return { art: "idle", developer: "idle", tester: "smoking" };
    default:
      return idle();
  }
}

function normalizeGateBots(raw, stage) {
  const base = defaultBotsForStage(stage);
  if (!raw || typeof raw !== "object") return base;
  for (const id of GATE_BOT_IDS) {
    const s = String(raw[id] ?? "").trim();
    if (GATE_BOT_STATUSES.includes(s)) base[id] = s;
  }
  return base;
}

function gateBotsChanged(next) {
  return GATE_BOT_IDS.some((id) => gateBots[id] !== next[id]);
}

function applyGateSeatStatus(bots) {
  gateBots = { ...bots };
  for (const item of glows) {
    if (item.kind !== "desk" || !GATE_BOT_IDS.includes(item.id)) continue;
    const status = gateBots[item.id] || "idle";
    const spec = BOT_SEAT_GLOW[status] || BOT_SEAT_GLOW.idle;
    item.seatStatus = status;
    item.ringTarget = spec.ring;
    if (spec.tint) item.material.color.setHex(spec.tint);
    else if (item.baseColor != null) item.material.color.setHex(item.baseColor);
    const group = deskGroups.find((g) => g.userData.deskId === item.id);
    const lock = group?.userData.seatLock;
    if (lock?.material) {
      const em = spec.emissive ?? 0.12;
      lock.material.emissiveIntensity = em;
      if (spec.tint && status !== "idle") {
        lock.material.emissive.setHex(spec.tint);
      } else if (group.userData.seatBaseColor != null) {
        lock.material.emissive.setHex(group.userData.seatBaseColor);
      }
    }
  }
  for (const bot of laneAnimators) {
    if (!gateSeatLocked(bot.id)) continue;
    if (bot.state === "wander" || bot.state === "leave") beginReturn(bot);
    else if (bot.state === "work") bot.stateT = 0;
  }
}

function normalizeGateUsage(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw;
}

function usageDigestChanged(next) {
  if (!next && !gateUsage) return false;
  if (!next || !gateUsage) return true;
  const keys = ["weeklyUsedPct", "resetsAt", "period", "updatedAt"];
  if (keys.some((k) => String(next[k] ?? "") !== String(gateUsage[k] ?? ""))) return true;
  const a = JSON.stringify(next.bots ?? null);
  const b = JSON.stringify(gateUsage.bots ?? null);
  return a !== b;
}

function syncUsageHud() {
  const el = document.getElementById("usage-meter");
  if (!el) return;
  const pct = gateUsage?.weeklyUsedPct;
  const resets = gateUsage?.resetsAt ?? gateUsage?.resetsAtLocal;
  if (pct == null && !resets) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  const parts = [];
  if (Number.isFinite(Number(pct))) parts.push(`${Math.round(Number(pct))}% this week`);
  if (resets) {
    const when = String(resets).replace(/([T\s]\d{2}:\d{2}).*/, "$1");
    parts.push(`resets ${when}`);
  }
  el.textContent = parts.join(" · ");
  el.hidden = !parts.length;
}

function applyGateUsage(usage) {
  const next = normalizeGateUsage(usage);
  const changed = usageDigestChanged(next);
  gateUsage = next;
  if (changed) {
    tokenBarCache.clear();
    syncUsageHud();
    for (const bot of laneAnimators) syncTokenBar(bot);
  }
}

async function loadGateStage() {
  const sources = [
    { url: GATE_API, label: "worker" },
    { url: GATE_STATIC, label: "static" },
  ];
  for (const { url, label } of sources) {
    try {
      const res = await fetch(url, { cache: "no-store", credentials: "omit" });
      if (!res.ok) continue;
      const data = await res.json();
      const stage = normalizeGateStage(data?.stage);
      if (!stage) continue;
      const bots = normalizeGateBots(data?.bots, stage);
      const usageKnown = Object.prototype.hasOwnProperty.call(data, "usage");
      const usage = usageKnown ? normalizeGateUsage(data.usage) : undefined;
      return { stage, bots, usage, usageKnown, source: data.source || label };
    } catch {
      /* try next source */
    }
  }
  return {
    stage: gateStageId,
    bots: normalizeGateBots(gateBots, gateStageId),
    usage: undefined,
    usageKnown: false,
    source: "default",
  };
}

function applyGateSnapshot({ stage, bots, usage, usageKnown }) {
  let boardDirty = false;
  if (stage && stage !== gateStageId) {
    gateStageId = stage;
    buildWarBoard(gateStageId);
    boardDirty = true;
  }
  const nextBots = normalizeGateBots(bots, gateStageId);
  if (boardDirty || gateBotsChanged(nextBots)) applyGateSeatStatus(nextBots);
  if (usageKnown) applyGateUsage(usage);
}

function startGatePolling() {
  const tick = async () => {
    applyGateSnapshot(await loadGateStage());
  };
  tick();
  if (gatePollTimer) clearInterval(gatePollTimer);
  gatePollTimer = setInterval(tick, GATE_POLL_MS);
}

function buildWarBoard(activeId = gateStageId) {
  const active = normalizeGateStage(activeId) || gateStageId;
  gateStageId = active;

  if (warBoardGroup) {
    world.remove(warBoardGroup);
    disposeGroup(warBoardGroup);
    purgeGateGlows();
  }

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
    const isActive = st.id === active;
    const card = new THREE.Group();
    const tall = isActive ? 2.05 : 1.82;
    card.position.set(start + i * (cardW + gap), isActive ? 0.04 : -0.02, 0.14);

    const idleTint = STATION_TINTS[st.id] || COLORS.card;
    const bodyMat = isActive
      ? mat(COLORS.waiting, { emissive: COLORS.waitingGlow, emissiveIntensity: 0.72, roughness: 0.6 })
      : mat(idleTint, { roughness: 0.82 });
    const body = roundedCard(cardW, tall, 0.08, 0.16, bodyMat);
    body.castShadow = true;
    card.add(body);
    if (isActive) glows.push({ kind: "wait", material: bodyMat, gate: true });

    if (isActive) {
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
      glows.push({ kind: "wait-halo", material: halo.material, opacityBase: 0.28, gate: true });
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

    const label = textPlane(st.label, cardW * 0.98, isActive ? 0.62 : 0.52, {
      fontSize: st.label.length > 8 ? 64 : 84,
      width: 768,
      height: 200,
      fill: isActive ? "#6a5420" : COLORS.ink,
    });
    label.position.set(0, isActive ? -0.08 : -0.62, 0.07);
    card.add(label);
    board.add(card);
  });

  world.add(board);
  warBoardGroup = board;
}

function buildDesk(desk) {
  const group = new THREE.Group();
  group.position.set(desk.x, 0, desk.z);
  group.userData.deskId = desk.id;
  group.name = `desk-${desk.id}`;
  const isOffLane = !LANE_DESKS.some((d) => d.id === desk.id);
  const woodBody = isOffLane ? 0x7a4f28 : COLORS.desk;
  const woodTop = isOffLane ? 0xa87a50 : COLORS.wood;

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.72, 0.82), mat(woodBody, { roughness: 0.78 }));
  body.position.y = 0.36;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.1, 0.96), mat(woodTop, { roughness: 0.62 }));
  top.position.y = 0.77;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const lock = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.055, 0.03),
    mat(desk.color, { emissive: desk.color, emissiveIntensity: isOffLane ? 0.08 : 0.22 }),
  );
  lock.position.set(0, 0.58, 0.42);
  group.add(lock);
  group.userData.seatLock = lock;
  group.userData.seatBaseColor = desk.color;

  const plateTex = nameplateTexture(desk.role, desk.sub, desk.mark, `#${desk.color.toString(16).padStart(6, "0")}`);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.42),
    new THREE.MeshBasicMaterial({ map: plateTex, transparent: true, depthWrite: false }),
  );
  plate.position.set(0, 0.32, 0.43);
  group.add(plate);

  const chair = new THREE.Group();
  const chairBackZ = desk.id === "cfo" ? -0.72 : -0.28;
  chair.position.set(0, 0, -chairZ(desk));
  const chairTone = isOffLane ? 0xc8b8a8 : 0xdccab4;
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.52), mat(chairTone));
  chairSeat.position.set(0, 0.46, 0);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.72, 0.08), mat(chairTone, { roughness: 0.85 }));
  chairBack.position.set(0, 0.86, chairBackZ);
  const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.42, 10), mat(COLORS.trim));
  chairLeg.position.set(0, 0.22, 0);
  chair.add(chairSeat, chairBack, chairLeg);
  group.add(chair);
  addDeskProps(group, desk.color, desk.id, isOffLane);

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
  glows.push({
    kind: "desk",
    id: desk.id,
    material: ring.material,
    baseColor: desk.color,
    seatStatus: "idle",
    ringTarget: 0,
  });

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

function flatShape(shape, depth, material, bevel = 0.03) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geo.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}

function basicMat(color) {
  return new THREE.MeshBasicMaterial({ color });
}

function heldProp(deskId) {
  if (deskId === "main") return null;
  const g = new THREE.Group();
  g.name = "held";
  const silver = basicMat(0xd5d8de);
  const black = basicMat(0x1b1f24);
  if (deskId === "art") {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.28, 8), basicMat(0xc48a4a));
    handle.rotation.z = 0.7;
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8), silver);
    ferrule.rotation.z = 0.7;
    ferrule.position.set(0.08, 0.11, 0);
    const bristle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.07, 8), basicMat(0x3a2a22));
    bristle.rotation.z = 0.7;
    bristle.position.set(0.12, 0.16, 0);
    const paint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), basicMat(0xe23b2f));
    paint.position.set(0.145, 0.19, 0);
    g.add(handle, ferrule, bristle, paint);
    g.position.set(0.4, -0.1, 0.3);
  } else if (deskId === "developer") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.15), silver);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.01), silver);
    lid.position.set(0, 0.07, -0.07);
    lid.rotation.x = -0.45;
    const display = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.1, 0.006), black);
    display.position.set(0, 0.07, -0.078);
    display.rotation.x = -0.45;
    g.add(base, lid, display);
    g.position.set(0.38, -0.18, 0.34);
    g.rotation.y = 0.05;
    return g;
  } else if (deskId === "tester") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 18), basicMat(0x243044));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.064, 18), basicMat(0xd7f6ff));
    lens.position.z = 0.01;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 6), basicMat(0x243044));
    handle.position.y = -0.12;
    g.add(ring, lens, handle);
    g.position.set(0.36, -0.18, 0.3);
  } else if (deskId === "cto") {
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02), basicMat(0xffe56a));
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.01), basicMat(0x13b7a2));
    line.position.set(0, 0.02, 0.012);
    g.add(note, line);
    g.position.set(0.38, -0.12, 0.34);
  } else if (deskId === "assistant") {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.02), basicMat(0xfff8ee));
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.024), silver);
    clip.position.set(0, 0.08, 0.012);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.01, 0.01), basicMat(0x8aa0b4));
    line.position.set(0, 0.01, 0.014);
    g.add(board, clip, line);
    g.position.set(0.38, -0.04, 0.34);
  } else if (deskId === "cfo") {
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.012), basicMat(0xb7d7a8));
    bill.rotation.z = -0.2;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.008), basicMat(0x2f6b45));
    band.rotation.z = -0.2;
    band.position.z = 0.008;
    g.add(bill, band);
    g.position.set(0.4, -0.14, 0.4);
  } else if (deskId === "governess") {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.19, 0.04), basicMat(0x128a52));
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.018), basicMat(0xfff8ee));
    pages.position.z = 0.02;
    g.add(cover, pages);
    g.position.set(0.38, -0.04, 0.28);
  }
  g.rotation.y = -0.18;
  return g;
}

function shapeMesh(shape, color, deskId) {
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
  } else if (shape === "wedge") {
    const wedge = new THREE.Shape();
    wedge.moveTo(0, 0.52);
    wedge.lineTo(0.44, -0.36);
    wedge.lineTo(-0.44, -0.36);
    wedge.closePath();
    g.add(flatShape(wedge, 0.42, m, 0.012));
    addGrokEyes(g, { y: -0.04, z: 0.26, spread: 0.12, radius: 0.078 });
  } else if (shape === "square") {
    g.add(roundedCard(0.7, 0.7, 0.46, 0.18, m));
    addGrokEyes(g, { y: 0.02, z: 0.3, spread: 0.14, radius: 0.075 });
  } else if (shape === "teardrop") {
    const pts = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = 0.48 - t * 0.96;
      let r;
      if (t < 0.62) {
        const u = t / 0.62;
        r = Math.pow(Math.sin(u * Math.PI * 0.5), 0.9) * 0.4;
      } else {
        const u = (t - 0.62) / 0.38;
        r = Math.cos(u * Math.PI * 0.5) * 0.4;
      }
      if (i === 0 || i === steps) r = 0;
      pts.push(new THREE.Vector2(r, y));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), m);
    body.castShadow = true;
    g.add(body);
    addGrokEyes(g, { y: 0.02, z: 0.34, spread: 0.11, radius: 0.07 });
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
  }
  if (deskId) {
    const held = heldProp(deskId);
    if (held) g.add(held);
  }
  return g;
}

const STUDIO_ART = [
  { url: "../../07_comics/converted/cover-isabel-art.png", aspect: 864 / 1152, x: -10.05, y: 3.95 },
  { url: "../../10_game_assets/characters/isabel.png", aspect: 1280 / 720, x: -7.7, y: 3.95 },
  { url: "../../10_game_assets/characters/maisie.png", aspect: 1280 / 720, x: 7.35, y: 3.95 },
  { url: "../../10_game_assets/demo/fruit-catcher.png", aspect: 1, x: 10.05, y: 3.95 },
];

function loadStudioTexture(url) {
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function prop(mesh) {
  mesh.castShadow = true;
  return mesh;
}

function addDeskProps(group, color, deskId) {
  const wood = mat(0xe7c89a, { roughness: 0.6 });
  const paper = mat(0xfff8ee, { roughness: 0.85 });
  const ink = mat(0x243044);
  if (deskId === "art") {
    const box = prop(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.22), mat(color)));
    box.position.set(-0.42, 0.94, -0.12);
    group.add(box);
    for (const [dx, c] of [[-0.08, 0xf93498], [0, 0x1e86fc], [0.08, 0x14c16f]]) {
      const crayon = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 6), mat(c)));
      crayon.position.set(-0.42 + dx, 1.08, -0.12);
      group.add(crayon);
    }
    const palette = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), wood));
    palette.position.set(0.12, 0.86, -0.08);
    group.add(palette);
    const pencil = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), mat(0x8a5a32)));
    pencil.rotation.z = 0.7;
    pencil.position.set(0.42, 0.96, -0.05);
    group.add(pencil);
  } else if (deskId === "developer") {
    const aluminum = mat(0xd7dbe2, { roughness: 0.32, metalness: 0.2 });
    const foot = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.02, 16), aluminum));
    foot.position.set(0, 0.84, -0.04);
    const neck = prop(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.03), aluminum));
    neck.position.set(0, 0.92, -0.04);
    const shell = prop(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.028), aluminum));
    shell.position.set(0, 1.12, -0.08);
    const glass = prop(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 0.008), mat(0x1b2430)));
    glass.position.set(0, 1.12, -0.098);
    const mug = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 12), mat(color)));
    mug.position.set(0.48, 0.9, 0.12);
    group.add(foot, neck, shell, glass, mug);
  } else if (deskId === "tester") {
    const pad = prop(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.4), paper));
    pad.position.set(-0.2, 0.85, -0.02);
    const calc = prop(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.26), mat(0x2c3540)));
    calc.position.set(0.36, 0.86, -0.02);
    const calcScreen = prop(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.07), mat(0xc6ddd0)));
    calcScreen.position.set(0.36, 0.885, -0.08);
    for (const [dx, dz] of [[-0.045, 0.02], [0, 0.02], [0.045, 0.02], [-0.045, 0.07], [0, 0.07], [0.045, 0.07]]) {
      const key = prop(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.03), mat(0x8fd0c4)));
      key.position.set(0.36 + dx, 0.885, -0.02 + dz);
      group.add(key);
    }
    group.add(pad, calc, calcScreen);
  } else if (deskId === "cto") {
    const board = prop(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.28), mat(0xf7e27a)));
    board.position.set(-0.16, 0.86, -0.06);
    for (const [dx, dz, c] of [[-0.08, 0.04, 0xf93498], [0.06, -0.02, 0x1e86fc], [0.02, 0.08, 0x14c16f]]) {
      const note = prop(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.1), mat(c)));
      note.position.set(-0.16 + dx, 0.89, -0.06 + dz);
      group.add(note);
    }
    const mug = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 12), mat(color)));
    mug.position.set(0.4, 0.9, -0.08);
    group.add(board, mug);
  } else if (deskId === "assistant") {
    const clip = prop(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.36), paper));
    clip.position.set(0, 0.86, -0.04);
    const clasp = prop(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.06), mat(0x8aa0b0)));
    clasp.position.set(0, 0.9, -0.18);
    group.add(clip, clasp);
  } else if (deskId === "cfo") {
    const ledger = prop(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.26), mat(0xf3efe4)));
    ledger.position.set(-0.16, 0.86, -0.04);
    for (let i = 0; i < 3; i++) {
      const coin = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 14), mat(0xf5c518)));
      coin.position.set(0.34, 0.85 + i * 0.03, -0.06);
      group.add(coin);
    }
    group.add(ledger);
  } else if (deskId === "governess") {
    const book = prop(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.34), mat(color)));
    book.position.set(-0.1, 0.86, -0.02);
    const star = prop(new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), mat(0xf5c518)));
    star.position.set(0.32, 0.92, -0.02);
    group.add(book, star);
  } else if (deskId === "other") {
    const tray = prop(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), mat(color)));
    tray.position.set(0, 0.86, -0.04);
    const tag = prop(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.02), mat(0xfff8ee)));
    tag.position.set(0, 0.92, -0.18);
    group.add(tray, tag);
  } else {
    const tile = prop(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.28), mat(0x2a2a2a)));
    tile.position.set(0, 0.86, -0.04);
    const star = prop(new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), mat(COLORS.mainBadge)));
    star.position.set(0, 0.94, -0.04);
    group.add(tile, star);
  }
}

function addBookcase(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const carcass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.65, 0.38), mat(COLORS.desk));
  carcass.position.y = 0.82;
  carcass.castShadow = true;
  g.add(carcass);
  const spines = [COLORS.art, COLORS.dev, COLORS.tester, COLORS.cto, COLORS.assistant, COLORS.cfo, COLORS.governess, 0x2eb8b8];
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
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 10), mat(COLORS.trim));
  pole.position.y = 0.85;
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.28, 16),
    mat(0xfff5e8, { emissive: 0xffe8c8, emissiveIntensity: 0.52 }),
  );
  shade.position.y = 1.72;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.06, 12), mat(COLORS.desk));
  foot.position.y = 0.03;
  g.add(pole, shade, foot);
  world.add(g);
}

function addClock() {
  const g = new THREE.Group();
  g.position.set(6.85, 5.55, -5.7);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), mat(COLORS.trim));
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
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.15, 0.48), mat(COLORS.desk));
  body.position.y = 0.58;
  body.castShadow = true;
  g.add(body);
  for (const y of [0.28, 0.62, 0.96]) {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.28, 0.04), mat(0xdcc4a4));
    drawer.position.set(0, y, 0.24);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), mat(COLORS.trim));
    pull.position.set(0, y, 0.27);
    g.add(drawer, pull);
  }
  world.add(g);
}

function buildDecor() {
  addPlant(-10.3, 5.5, 1.05);
  addPlant(10.3, 5.4, 0.9);
  addPlant(-10.2, -4.35, 0.8);
  addBookcase(-10.15, -5.45);
  addBookcase(10.15, -5.45);
  addFloorLamp(-10.35, 0.15);
  addFloorLamp(10.35, 0.35);
  addClock();
  addFileCabinet(10.35, -3.7);
  addFileCabinet(-10.35, -3.7);
  for (const piece of STUDIO_ART) {
    hangPicture(piece.x, piece.y, -5.68, 0, loadStudioTexture(piece.url), piece.aspect);
  }
}

function addPlant(x, z, scale) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 16), mat(COLORS.pot));
  pot.position.y = 0.21;
  pot.castShadow = true;
  g.add(pot);
  const leaf = mat(COLORS.plant, { roughness: 0.72 });
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
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.06), mat(COLORS.trim));
  frame.castShadow = true;
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  art.position.z = 0.04;
  group.add(frame, art);
  world.add(group);
}

const ROOM_HINT = "Drag to look · scroll to zoom · click a desk to call the bot back · double-click to reset the camera";

function setFocus(id) {
  focusedId = focusedId === id ? null : id;
  if (!hintEl) return;
  if (!focusedId) {
    hintEl.textContent = ROOM_HINT;
    hintEl.style.color = "";
    return;
  }
  const desk = ALL_DESKS.find((item) => item.id === focusedId);
  const share = weekShare(focusedId);
  const shareBit = share == null ? "" : ` · ${share}% this week`;
  hintEl.textContent = `${labelFor(focusedId)} desk${shareBit} · bot coming back · double-click to reset the camera`;
  hintEl.style.color = !desk || desk.color === 0 ? "" : cssHex(desk.color);
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
    else if (item.kind === "lane") item.material.opacity = 0.36 + pulse * 0.24;
    else if (item.kind === "desk") {
      const live = item.seatStatus && item.seatStatus !== "idle";
      if (live) {
        const base = item.ringTarget ?? 0.7;
        item.material.opacity = base * (0.62 + pulse * 0.38);
      } else {
        const target = item.id === focusedId ? 0.92 : 0;
        item.material.opacity += (target - item.material.opacity) * Math.min(1, dt * 8);
      }
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
    camera.lookAt(controls.target);
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
    camera.lookAt(controls.target);
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

function releaseIntro() {
  if (introT >= 1 && controls.enabled) return;
  introT = 1;
  resetJob = null;
  controls.enabled = true;
  controls.update();
}

function bindInput() {
  const el = renderer.domElement;
  el.addEventListener("pointerdown", releaseIntro, true);
  el.addEventListener("wheel", releaseIntro, { capture: true, passive: true });
  el.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY, t: performance.now() };
    el.classList.add("is-dragging");
    releaseIntro();
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
  const gate = await loadGateStage();
  gateStageId = gate.stage;
  gateBots = normalizeGateBots(gate.bots, gateStageId);
  if (gate.usageKnown) applyGateUsage(gate.usage);
  buildRoom();
  buildLaneRug();
  buildWarBoard(gateStageId);
  const desks = ALL_DESKS.map((desk) => buildDesk(desk));
  applyGateSeatStatus(gateBots);
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
        bubble: b.bubbleLine || "",
        share: weekShare(b.id),
        bar: Boolean(b.tokenBar && b.tokenBar.visible),
        mode: b.mode,
        frame: b.frame,
      }));
    },
    get focused() {
      return focusedId;
    },
    focus: setFocus,
    get gateStage() {
      return gateStageId;
    },
    get gateBots() {
      return { ...gateBots };
    },
    refreshGate: async () => {
      const next = await loadGateStage();
      applyGateSnapshot(next);
      return { stage: gateStageId, bots: { ...gateBots }, usage: gateUsage };
    },
    get gateUsage() {
      return gateUsage ? { ...gateUsage } : null;
    },
  };
  startGatePolling();
  animate();
}

init();
