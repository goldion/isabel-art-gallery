import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const WORLD_W = 60;
const WORLD_H = 45;
const SPAWN_INTERVAL_MIN = 800;
const SPAWN_INTERVAL_MAX = 1200;
const PLAYER_SCALE = 1.45;
const BASKET_RADIUS = 1.1;
const BASKET_REACH_X = 3.4;
const BASKET_CATCH_HALF_H = 0.35;
const PLAYER_HALF_W = (BASKET_REACH_X + BASKET_RADIUS) * PLAYER_SCALE + 0.5;
const GROUND_Y = -19.8;
const SKY_TOP = 0xa8d4f0;
const SKY_HORIZON = 0xc9e6f5;
const FOG_COLOR = 0xb0cfc0;
const FOG_NEAR = 48;
const FOG_FAR = 96;

const FRUIT_TYPES = [
  { name: "apple", color: 0xe74c3c },
  { name: "orange", color: 0xf39c12 },
  { name: "banana", color: 0xf1c40f },
  { name: "grape", color: 0x9b59b6 },
  { name: "pear", color: 0xa8c84a },
  { name: "pineapple", color: 0xf4c430 },
];

const BOMB = { name: "bomb", color: 0x2c2c2c };
const RAINBOW_CAN = { name: "rainbow_can", color: 0xffffff };
const BOMB_SPAWN_CHANCE = 0.065;
const RAINBOW_CAN_SPAWN_CHANCE = 0.28;
const BOMB_GRACE_SECONDS = 30;
const FALL_SPEED_TIME_RAMP = 0.1;
const FALL_SPEED_RAMP_SECONDS = 90;
const BOMB_LATE_RAMP_BONUS = 0.075;
const BOMB_LATE_RAMP_END_SECONDS = 110;
const RAINBOW_BOMB_BOOST_DELAY_SECONDS = 14;
const SPEED_BOOST_MULTIPLIER = 1.5;
const SPAWN_RATE_BOOST_PER_CAN = 3.0;
const SPAWN_BURST_COUNT = 2;
const BOMB_CHANCE_BOOST_PER_CAN = 0.045;
const MAX_BOMB_CHANCE = 0.25;
const GAME_DURATION = 120;
const BEST_SCORE_KEY = "fruitCatcherBestScore";
const MUTE_KEY = "fruitCatcherMuted";

// QA-only: ?qa=timeout starts near the end; Shift+T jumps timer during a run.
const QA_TIMEOUT_MODE = new URLSearchParams(window.location.search).get("qa") === "timeout";
const QA_TIME_REMAINING = 5;

const container = document.getElementById("canvas-wrapper");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const timerEl = document.getElementById("timer");
const gameOverEl = document.getElementById("game-over");
const gameOverTitleEl = document.getElementById("game-over-title");
const gameOverSubtitleEl = document.getElementById("game-over-subtitle");
const finalScoreEl = document.getElementById("final-score");
const finalBestScoreEl = document.getElementById("final-best-score");
const restartBtn = document.getElementById("restart-btn");
const pauseOverlayEl = document.getElementById("pause-overlay");
const resumeBtn = document.getElementById("resume-btn");
const onboardingEl = document.getElementById("onboarding");
const rainbowTipEl = document.getElementById("rainbow-tip");
const muteBtn = document.getElementById("mute-btn");
const legendBtn = document.getElementById("legend-btn");
const legendOverlayEl = document.getElementById("legend-overlay");
const legendBackdropBtn = legendOverlayEl.querySelector(".legend-backdrop");
const onboardingLegendBtn = document.getElementById("onboarding-legend-btn");
const pauseLegendBtn = document.getElementById("pause-legend-btn");

let audioCtx = null;
let muted = loadMutedPreference();

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY_TOP);
scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

const camera = new THREE.OrthographicCamera(
  -WORLD_W / 2,
  WORLD_W / 2,
  WORLD_H / 2,
  -WORLD_H / 2,
  0.1,
  200
);
camera.position.set(0, 0, 50);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.pointerEvents = "none";
container.appendChild(labelRenderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xfff8e8, 0.95);
sun.position.set(8, 20, 30);
scene.add(sun);

const worldGroup = new THREE.Group();
const treesGroup = new THREE.Group();
const itemsGroup = new THREE.Group();
const effectsGroup = new THREE.Group();
const playerGroup = new THREE.Group();
worldGroup.add(treesGroup, itemsGroup, effectsGroup, playerGroup);
scene.add(worldGroup);

let forestTrees = [];
let fruits = [];
let particles = [];
let explosions = [];
let floatTexts = [];
let score = 0;
let bestScore = loadBestScore();
let paused = false;
let legendOpen = false;
let pausedForLegend = false;
let gameOver = false;
let showGameOverOverlay = false;
let gameOverDelay = 0;
let gameStarted = false;
let rainbowTipShown = false;
let rainbowTipTimer = 0;
let fallSpeedMultiplier = 1;
let spawnRateMultiplier = 1;
let bombChanceBonus = 0;
let deferredBombBonus = 0;
let pendingRainbowBombBoosts = 0;
let rainbowBombBoostTimer = 0;
let timeLeft = GAME_DURATION;
let lastFrameTime = 0;
let playerX = 0;
let mouseX = 0;
let lastSpawn = 0;
let nextSpawnDelay = randomSpawnDelay();
let playerBaskets = [];

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, ...opts });
}

function randomSpawnDelay() {
  const min = SPAWN_INTERVAL_MIN / spawnRateMultiplier;
  const max = SPAWN_INTERVAL_MAX / spawnRateMultiplier;
  return min + Math.random() * (max - min);
}

function getViewHalfWidth() {
  return (camera.right - camera.left) / 2;
}

function resizeRenderer() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
  const aspect = w / h;
  const viewH = WORLD_H;
  const viewW = WORLD_H * aspect;
  camera.left = -viewW / 2;
  camera.right = viewW / 2;
  camera.top = viewH / 2;
  camera.bottom = -viewH / 2;
  camera.updateProjectionMatrix();
}

function pointerToWorldX(clientX) {
  const rect = container.getBoundingClientRect();
  const ndc = ((clientX - rect.left) / rect.width) * 2 - 1;
  return ndc * getViewHalfWidth();
}

function createSky() {
  const w = WORLD_W + 20;
  const h = WORLD_H + 10;
  const geo = new THREE.PlaneGeometry(w, h, 1, 24);
  const top = new THREE.Color(SKY_TOP);
  const horizon = new THREE.Color(SKY_HORIZON);
  const colors = [];
  const positions = geo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const t = (y + h * 0.5) / h;
    const c = horizon.clone().lerp(top, t);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })
  );
  sky.position.set(0, 1, -22);
  scene.add(sky);
}

function createClouds() {
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.32,
    fog: false,
  });
  const clouds = new THREE.Group();
  const placements = [
    { x: -14, y: 14, z: -18, sx: 5.5, sy: 2.2 },
    { x: 8, y: 17, z: -19, sx: 4.2, sy: 1.8 },
    { x: 18, y: 11, z: -17, sx: 3.8, sy: 1.5 },
  ];
  for (const p of placements) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), cloudMat);
    cloud.scale.set(p.sx, p.sy, 1.2);
    cloud.position.set(p.x, p.y, p.z);
    clouds.add(cloud);
  }
  scene.add(clouds);
}

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_W + 10, 12),
    mat(0x2d5f28)
  );
  ground.position.y = GROUND_Y - 5;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_W + 10, 2),
    mat(0x3d7a35)
  );
  strip.position.y = GROUND_Y - 0.5;
  worldGroup.add(strip);
}

function createTree(data) {
  const group = new THREE.Group();
  group.position.x = data.x;
  const trunkMat = mat(data.layer === 0 ? 0x3d2817 : 0x5c4033, {
    transparent: true,
    opacity: data.layer === 0 ? 0.55 : 0.95,
  });
  const leafMat = mat(data.layer === 0 ? 0x1a4d2e : 0x2d7a45, {
    transparent: true,
    opacity: data.layer === 0 ? 0.55 : 0.95,
  });

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(data.trunkW * 0.04, data.trunkW * 0.05, data.trunkH * 0.1, 8),
    trunkMat
  );
  trunk.position.y = GROUND_Y + data.trunkH * 0.05;
  group.add(trunk);

  const crownY = GROUND_Y + data.trunkH * 0.1 + data.crownR * 0.04;
  const clusters = [
    [0, 0, 1],
    [-0.45, -0.05, 0.85],
    [0.45, -0.05, 0.85],
    [-0.3, 0.12, 0.7],
    [0.3, 0.12, 0.7],
  ];
  for (const [ox, oy, scale] of clusters) {
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(data.crownR * 0.05 * scale, 10, 10),
      leafMat
    );
    foliage.position.set(ox * data.crownR * 0.05, crownY + oy * data.crownR * 0.05, data.layer === 0 ? -1 : 0);
    group.add(foliage);
  }

  for (const dot of data.fruitDots) {
    const berry = new THREE.Mesh(
      new THREE.SphereGeometry(dot.r * 0.04, 6, 6),
      mat(dot.color)
    );
    berry.position.set(dot.ox * 0.04, crownY + dot.oy * 0.04, 0.2);
    group.add(berry);
  }

  treesGroup.add(group);
  data.mesh = group;
  data.crownCenter = {
    x: data.x,
    y: crownY + data.crownR * 0.02,
    r: data.crownR * 0.05,
  };
  return data;
}

function generateFruitDots() {
  const dots = [];
  const count = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    dots.push({
      ox: (Math.random() - 0.5) * 50,
      oy: (Math.random() - 0.5) * 35,
      color: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)].color,
      r: 4 + Math.random() * 3,
    });
  }
  return dots;
}

function generateForest() {
  while (treesGroup.children.length) {
    const child = treesGroup.children[0];
    treesGroup.remove(child);
    child.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  forestTrees = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.4 ? 0 : 1;
      const trunkH = (layer === 0 ? 128 : 168) + Math.random() * 32;
      forestTrees.push(
          createTree({
              x: (i / (count - 1)) * (WORLD_W - 8) - (WORLD_W - 8) / 2 + (Math.random() - 0.5) * 2,
              trunkW: 16 + Math.random() * 20,
              trunkH,
              crownR: (layer === 0 ? 148 : 208) + Math.random() * 44,
              layer,
              fruitDots: generateFruitDots(),
          })
      );
  }
}

function createFruitMesh(type, radius) {
  const group = new THREE.Group();
  const r = radius * 0.08;

  if (type.name === "bomb") {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(r * 1.18, 0.07, 8, 24),
      mat(0xff5252, { emissive: 0xff1744, emissiveIntensity: 0.35 })
    );
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 12),
      mat(0x1a1a1a, { emissive: 0x330000, emissiveIntensity: 0.15 })
    );
    group.add(body);

    const skullMark = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.28, 8, 8),
      mat(0xff5252, { emissive: 0xff1744, emissiveIntensity: 0.5 })
    );
    skullMark.position.set(0, r * 0.15, r * 0.88);
    group.add(skullMark);

    const fuse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.42, 6),
      mat(0xff9800, { emissive: 0xff6d00, emissiveIntensity: 0.4 })
    );
    fuse.position.y = r + 0.22;
    group.add(fuse);

    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      mat(0xffeb3b, { emissive: 0xffea00, emissiveIntensity: 0.85 })
    );
    spark.position.y = r + 0.48;
    group.add(spark);
  } else if (type.name === "rainbow_can") {
    const colors = [0xff0000, 0xff8800, 0xffdd00, 0x00cc44, 0x0088ff, 0xaa44ff];
    const h = r * 1.6;
    colors.forEach((color, i) => {
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.75, r * 0.75, h / colors.length, 16, 1, true),
        mat(color)
      );
      stripe.position.y = -h / 2 + (i + 0.5) * (h / colors.length);
      group.add(stripe);
    });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.12, 16), mat(0xbbbbbb));
    lid.position.y = h / 2 + 0.06;
    group.add(lid);
  } else if (type.name === "banana") {
    const banana = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), mat(type.color));
    banana.scale.set(1.5, 0.7, 0.8);
    banana.rotation.z = 0.4;
    group.add(banana);
  } else if (type.name === "grape") {
    const offsets = [[0, 0], [-0.25, 0.2], [0.25, 0.2], [-0.15, -0.2], [0.15, -0.2]];
    for (const [ox, oy] of offsets) {
      const g = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 8, 8), mat(type.color));
      g.position.set(ox, oy, 0);
      group.add(g);
    }
  } else if (type.name === "pear") {
    const pear = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), mat(type.color));
    pear.scale.set(0.85, 1.15, 0.85);
    group.add(pear);
  } else if (type.name === "pineapple") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), mat(type.color));
    body.scale.set(0.85, 1.1, 0.85);
    group.add(body);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), mat(0x3d8b37));
      leaf.position.set(Math.cos(i) * 0.15, r + 0.15, Math.sin(i) * 0.08);
      leaf.rotation.x = 0.4;
      leaf.rotation.y = i;
      group.add(leaf);
    }
  } else {
    group.add(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), mat(type.color)));
  }

  return group;
}

function createBasketProfileShape(r, lipY, floorY) {
  const outer = new THREE.Shape();
  outer.moveTo(-r * 0.96, lipY);
  outer.lineTo(r * 0.96, lipY);
  outer.lineTo(r * 0.84, lipY - r * 0.18);
  outer.lineTo(r * 0.68, lipY - r * 0.42);
  outer.lineTo(r * 0.52, floorY + r * 0.08);
  outer.lineTo(r * 0.44, floorY);
  outer.lineTo(0, floorY - r * 0.04);
  outer.lineTo(-r * 0.44, floorY);
  outer.lineTo(-r * 0.52, floorY + r * 0.08);
  outer.lineTo(-r * 0.68, lipY - r * 0.42);
  outer.lineTo(-r * 0.84, lipY - r * 0.18);
  outer.closePath();

  const cavity = new THREE.Path();
  cavity.moveTo(-r * 0.72, lipY - r * 0.04);
  cavity.lineTo(r * 0.72, lipY - r * 0.04);
  cavity.lineTo(r * 0.58, lipY - r * 0.24);
  cavity.lineTo(r * 0.46, lipY - r * 0.52);
  cavity.lineTo(r * 0.36, floorY + r * 0.04);
  cavity.lineTo(0, floorY);
  cavity.lineTo(-r * 0.36, floorY + r * 0.04);
  cavity.lineTo(-r * 0.46, lipY - r * 0.52);
  cavity.lineTo(-r * 0.58, lipY - r * 0.24);
  cavity.closePath();
  outer.holes.push(cavity);

  return outer;
}

function createBasketCavityShape(r, lipY, floorY) {
  const cavity = new THREE.Shape();
  cavity.moveTo(-r * 0.72, lipY - r * 0.04);
  cavity.lineTo(r * 0.72, lipY - r * 0.04);
  cavity.lineTo(r * 0.58, lipY - r * 0.24);
  cavity.lineTo(r * 0.46, lipY - r * 0.52);
  cavity.lineTo(r * 0.36, floorY + r * 0.04);
  cavity.lineTo(0, floorY);
  cavity.lineTo(-r * 0.36, floorY + r * 0.04);
  cavity.lineTo(-r * 0.46, lipY - r * 0.52);
  cavity.lineTo(-r * 0.58, lipY - r * 0.24);
  cavity.closePath();
  return cavity;
}

function createBasket(basketMat, rimMat) {
  const basket = new THREE.Group();
  const r = BASKET_RADIUS;
  const wallHeight = r * 0.82;
  const lipY = 0.12;
  const floorY = lipY - wallHeight;
  const rimTopY = lipY + r * 0.18;
  const innerCavityMat = mat(0x231808);
  const shellDepth = 0.42;

  // Counter holder pitch so the extruded U profile (XY) opens toward +Z / the ortho camera.
  const facade = new THREE.Group();
  facade.rotation.x = 0.18;
  basket.add(facade);

  const profile = createBasketProfileShape(r, lipY, floorY);
  const shell = new THREE.Mesh(
    new THREE.ExtrudeGeometry(profile, { depth: shellDepth, bevelEnabled: false, curveSegments: 10 }),
    basketMat
  );
  // Anchor the +Z extrusion cap on the camera-facing plane; lip spans X, walls run −Y.
  shell.position.z = -shellDepth;
  facade.add(shell);

  const cavityShape = createBasketCavityShape(r, lipY, floorY);
  const cavityBack = new THREE.Mesh(new THREE.ShapeGeometry(cavityShape), innerCavityMat);
  cavityBack.position.z = -0.03;
  facade.add(cavityBack);

  const rimBandHeight = rimTopY - lipY;
  const rimBand = new THREE.Mesh(
    new THREE.BoxGeometry(r * 1.96, rimBandHeight, shellDepth + 0.06),
    rimMat
  );
  rimBand.position.set(0, lipY + rimBandHeight / 2, 0);
  facade.add(rimBand);

  for (const sx of [-1, 1]) {
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, rimBandHeight + 0.02, shellDepth + 0.04),
      rimMat
    );
    lip.position.set(sx * r * 0.96, lipY + rimBandHeight / 2, 0);
    facade.add(lip);
  }

  // Horizontal bowl volume (opening faces +Y for fruit catch); kept separate from the camera-facing facade.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(r * 0.36, 12), innerCavityMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, floorY, 0);
  basket.add(floor);

  const innerBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.72, r * 0.38, wallHeight * 0.96, 14, 1, true),
    innerCavityMat
  );
  innerBowl.material.side = THREE.BackSide;
  innerBowl.position.y = floorY + wallHeight * 0.48;
  basket.add(innerBowl);

  const catchPoint = new THREE.Object3D();
  catchPoint.position.y = lipY;
  basket.add(catchPoint);

  return { basket, catchPoint };
}

function createPlayer() {
  playerGroup.clear();
  playerBaskets = [];

  const skin = mat(0xfdd8b5);
  const hair = mat(0x1a1008);
  const dress = mat(0xe53935);
  const sleeve = mat(0x111111);
  const bootMat = mat(0x1e3a5f);
  const pants = mat(0x3d3d6b);
  const basketMat = mat(0xc9954a);
  const basketRimMat = mat(0x8b6914);

  const body = new THREE.Group();
  body.position.y = GROUND_Y;
  body.scale.setScalar(PLAYER_SCALE);

  const legW = 0.35;
  const legSpread = 0.38;
  const bootH = 0.82;

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(legW, 1.4, 0.38), pants);
    leg.position.set(side * legSpread, 0.75, 0);
    body.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(legW + 0.06, bootH, 0.44), bootMat);
    boot.position.set(side * legSpread, bootH / 2, 0.02);
    body.add(boot);
  }

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.55, 0.75), dress);
  torso.position.y = 2.1;
  body.add(torso);

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.55, 0.8), sleeve);
  shirt.position.y = 2.65;
  body.add(shirt);

  for (const side of [-1, 1]) {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.9, 2.45, 0);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.35, 8), sleeve);
    arm.rotation.z = -side * Math.PI / 2;
    arm.position.x = side * 0.675;
    armGroup.add(arm);

    const basketHolder = new THREE.Group();
    basketHolder.position.set(side * BASKET_REACH_X, -0.05, 0.2);
    basketHolder.rotation.x = -0.18;
    armGroup.add(basketHolder);

    const { basket, catchPoint } = createBasket(basketMat, basketRimMat);
    basketHolder.add(basket);
    playerBaskets.push({ side, mesh: catchPoint });

    body.add(armGroup);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 14), skin);
  head.position.y = 3.75;
  body.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(1.02, 12, 12), hair);
  hairCap.scale.set(1.04, 0.58, 1.04);
  hairCap.position.set(0, 4.2, -0.1);
  body.add(hairCap);

  for (const side of [-1, 1]) {
    const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.52), hair);
    sweep.position.set(side * 0.22, 4.38, -0.28);
    sweep.rotation.x = -0.62;
    sweep.rotation.z = side * 0.18;
    body.add(sweep);
  }

  for (const side of [-1, 1]) {
    const bang = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 10), hair);
    bang.scale.set(0.72, 0.58, 0.52);
    bang.position.set(side * 0.58, 3.9, 0.5);
    body.add(bang);
  }

  const centerBang = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), hair);
  centerBang.scale.set(0.55, 0.42, 0.38);
  centerBang.position.set(0, 4.0, 0.56);
  body.add(centerBang);

  const ponySide = -1;
  const ponyTail = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.55, 10), hair);
  ponyTail.position.set(ponySide * 0.82, 2.72, -0.12);
  ponyTail.rotation.z = ponySide * 0.12;
  body.add(ponyTail);

  const ponyUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.55, 10), hair);
  ponyUpper.rotation.x = Math.PI / 2.15;
  ponyUpper.rotation.z = ponySide * 0.25;
  ponyUpper.position.set(ponySide * 0.78, 3.48, -0.42);
  body.add(ponyUpper);

  const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.065, 6, 12), mat(0x43a047));
  scrunchie.rotation.y = Math.PI / 2;
  scrunchie.rotation.x = Math.PI / 2.1;
  scrunchie.position.set(ponySide * 0.78, 3.62, -0.38);
  body.add(scrunchie);

  for (const side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat(0xffffff));
    eyeWhite.position.set(side * 0.32, 3.72, 0.78);
    body.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0x111111));
    pupil.position.set(side * 0.32, 3.72, 0.9);
    body.add(pupil);
  }

  playerGroup.add(body);
}

function getTimeFallSpeedBonus() {
  const elapsed = getElapsedSeconds();
  const t = Math.min(1, elapsed / FALL_SPEED_RAMP_SECONDS);
  return 1 + FALL_SPEED_TIME_RAMP * t;
}

function getBasketHitboxes() {
  return playerBaskets.map(({ mesh }) => {
    const pos = mesh.getWorldPosition(new THREE.Vector3());
    return {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      radius: BASKET_RADIUS * PLAYER_SCALE,
      halfHeight: BASKET_CATCH_HALF_H * PLAYER_SCALE,
    };
  });
}

function loadBestScore() {
  const stored = localStorage.getItem(BEST_SCORE_KEY);
  const parsed = stored === null ? 0 : Number.parseInt(stored, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function saveBestScore(value) {
  localStorage.setItem(BEST_SCORE_KEY, String(value));
}

function updateBestScoreDisplay() {
  bestScoreEl.textContent = `Best: ${bestScore}`;
}

function maybeUpdateBestScore() {
  if (score <= bestScore) return false;
  bestScore = score;
  saveBestScore(bestScore);
  updateBestScoreDisplay();
  return true;
}

function loadMutedPreference() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMutedPreference() {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}

function updateMuteButton() {
  muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  muteBtn.textContent = muted ? "Muted" : "Sound on";
  muteBtn.title = muted ? "Unmute (M)" : "Mute (M)";
}

function ensureAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone({ freq, duration = 0.1, type = "sine", peakGain = 0.1, freqEnd }) {
  if (muted) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

function playCatchSfx() {
  playTone({ freq: 520, freqEnd: 820, duration: 0.07, peakGain: 0.07 });
}

function playBombHitSfx() {
  playTone({ freq: 140, freqEnd: 55, duration: 0.16, type: "triangle", peakGain: 0.09 });
}

function playGameEndSfx(reason) {
  const ctx = ensureAudioContext();
  if (muted || !ctx) return;

  const t0 = ctx.currentTime;
  if (reason === "bomb") {
    playTone({ freq: 196, duration: 0.22, type: "sine", peakGain: 0.06, freqEnd: 130 });
    return;
  }

  const notes = [
    { freq: 392, at: 0, duration: 0.14, peakGain: 0.06 },
    { freq: 294, at: 0.13, duration: 0.2, peakGain: 0.05 },
  ];
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq, t0 + note.at);
    gain.gain.setValueAtTime(0.0001, t0 + note.at);
    gain.gain.linearRampToValueAtTime(note.peakGain, t0 + note.at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.at + note.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0 + note.at);
    osc.stop(t0 + note.at + note.duration + 0.03);
  }
}

function setMuted(nextMuted) {
  muted = nextMuted;
  saveMutedPreference();
  updateMuteButton();
}

function toggleMuted() {
  setMuted(!muted);
  if (!muted) ensureAudioContext();
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerEl.textContent = formatTime(timeLeft);
}

function getElapsedSeconds() {
  return GAME_DURATION - timeLeft;
}

function flushDeferredBombBonus() {
  if (deferredBombBonus > 0 && getElapsedSeconds() >= BOMB_GRACE_SECONDS) {
    bombChanceBonus += deferredBombBonus;
    deferredBombBonus = 0;
  }
}

function getLateBombRampBonus() {
  const elapsed = getElapsedSeconds();
  if (elapsed < BOMB_GRACE_SECONDS) return 0;
  const rampStart = BOMB_GRACE_SECONDS;
  const rampEnd = BOMB_LATE_RAMP_END_SECONDS;
  if (elapsed >= rampEnd) return BOMB_LATE_RAMP_BONUS;
  const t = (elapsed - rampStart) / (rampEnd - rampStart);
  return BOMB_LATE_RAMP_BONUS * t;
}

function getBombChance() {
  if (getElapsedSeconds() < BOMB_GRACE_SECONDS) return 0;
  flushDeferredBombBonus();
  return Math.min(
    MAX_BOMB_CHANCE,
    BOMB_SPAWN_CHANCE + bombChanceBonus + getLateBombRampBonus()
  );
}

function pickSpawnType() {
  const roll = Math.random();
  if (roll < RAINBOW_CAN_SPAWN_CHANCE) return RAINBOW_CAN;
  if (roll < RAINBOW_CAN_SPAWN_CHANCE + getBombChance()) return BOMB;
  return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
}

function spawnFruit() {
  const pool = forestTrees.filter((t) => t.layer === 1);
  const trees = pool.length ? pool : forestTrees;
  if (!trees.length) return;

  const tree = trees[Math.floor(Math.random() * trees.length)];
  const crown = tree.crownCenter;
  const type = pickSpawnType();
  const radius = type.name === "bomb" ? 16 : type.name === "rainbow_can" ? 15 : 14 + Math.random() * 6;
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * crown.r * 0.7;
  const mesh = createFruitMesh(type, radius);
  const x = crown.x + Math.cos(angle) * dist;
  const y = crown.y + Math.sin(angle) * dist * 0.35;
  mesh.position.set(x, y, 1.5);
  itemsGroup.add(mesh);

  fruits.push({
    mesh,
    x,
    y,
    z: 1.5,
    radius: radius * 0.08,
    type,
    speed: (2.2 + Math.random() * 2.2) * fallSpeedMultiplier,
    wobble: Math.random() * Math.PI * 2,
    drift: (Math.random() - 0.5) * 0.08,
  });
}

function removeFruit(index) {
  const fruit = fruits[index];
  itemsGroup.remove(fruit.mesh);
  fruit.mesh.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  fruits.splice(index, 1);
}

function addFloatText(x, y, text = "+1") {
  const div = document.createElement("div");
  div.className = "float-label";
  div.textContent = text;
  const label = new CSS2DObject(div);
  label.position.set(x, y, 2);
  effectsGroup.add(label);
  floatTexts.push({ label, life: 1 });
}

function addParticleMesh(x, y, z, radius, color, kind = "default") {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.08, 6, 6),
    mat(color, { transparent: true, opacity: 0.9 })
  );
  mesh.position.set(x, y, z);
  effectsGroup.add(mesh);
  particles.push({
    mesh,
    life: 1,
    kind,
    vx: 0,
    vy: 0,
    radius,
  });
}

function spawnExplosion(x, y) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.12, 8, 24),
    mat(0xff7722, { transparent: true, opacity: 0.9 })
  );
  ring.position.set(x, y, 2);
  effectsGroup.add(ring);
  explosions.push({ mesh: ring, life: 1, maxScale: 4.5, inner: false });

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 10, 10),
    mat(0xffeb3b, { transparent: true, opacity: 0.85 })
  );
  flash.position.set(x, y, 2.2);
  effectsGroup.add(flash);
  explosions.push({ mesh: flash, life: 1, maxScale: 2.2, inner: true });

  const colors = [0xffeb3b, 0xff9800, 0xff5722, 0xf44336, 0x795548, 0x9e9e9e];
  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 4;
    const p = {
      mesh: new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 6, 6),
        mat(colors[Math.floor(Math.random() * colors.length)])
      ),
      life: 0.8 + Math.random() * 0.4,
      kind: "explosion",
      vx: Math.cos(angle) * speed * 0.08,
      vy: Math.sin(angle) * speed * 0.08,
      radius: 1,
    };
    p.mesh.position.set(x, y, 2);
    effectsGroup.add(p.mesh);
    particles.push(p);
  }
}

function showRainbowCanTip() {
  if (rainbowTipShown) return;
  rainbowTipShown = true;
  rainbowTipEl.hidden = false;
  rainbowTipTimer = 2800;
}

function queueRainbowBombBoost() {
  pendingRainbowBombBoosts += BOMB_CHANCE_BOOST_PER_CAN;
  if (rainbowBombBoostTimer <= 0) {
    rainbowBombBoostTimer = RAINBOW_BOMB_BOOST_DELAY_SECONDS;
  }
}

function applyRainbowBombBoost() {
  if (getElapsedSeconds() < BOMB_GRACE_SECONDS) {
    deferredBombBonus += pendingRainbowBombBoosts;
  } else {
    bombChanceBonus += pendingRainbowBombBoosts;
  }
  pendingRainbowBombBoosts = 0;
}

function activateRainbowCan(x, y) {
  fallSpeedMultiplier *= SPEED_BOOST_MULTIPLIER;
  spawnRateMultiplier *= SPAWN_RATE_BOOST_PER_CAN;
  queueRainbowBombBoost();
  for (const fruit of fruits) fruit.speed *= SPEED_BOOST_MULTIPLIER;
  for (let i = 0; i < SPAWN_BURST_COUNT; i++) spawnFruit();
  nextSpawnDelay = randomSpawnDelay();

  const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00cc00, 0x0088ff, 0x8800ff];
  rainbowColors.forEach((color) => addParticleMesh(x, y, 2, 0.5 + Math.random(), color));
  addFloatText(x, y, "More!");
  showRainbowCanTip();
}

function checkCollisions() {
  const baskets = getBasketHitboxes();
  for (let i = fruits.length - 1; i >= 0; i--) {
    const fruit = fruits[i];
    const hit = baskets.some((basket) => {
      const dx = fruit.x - basket.x;
      const dy = fruit.y - basket.y;
      const dz = fruit.z - basket.z;
      const catchRadius = basket.radius + fruit.radius * 0.75;
      const verticalOk = Math.abs(dy) < basket.halfHeight + fruit.radius * 0.5;
      return verticalOk && dx * dx + dy * dy + dz * dz < catchRadius * catchRadius;
    });
    if (!hit) continue;

    if (fruit.type.name === "bomb") {
      spawnExplosion(fruit.x, fruit.y);
      playBombHitSfx();
      removeFruit(i);
      triggerGameOver("bomb");
      return;
    }

    if (fruit.type.name === "rainbow_can") {
      activateRainbowCan(fruit.x, fruit.y);
      removeFruit(i);
      continue;
    }

    score++;
    scoreEl.textContent = `Score: ${score}`;
    playCatchSfx();
    addParticleMesh(fruit.x, fruit.y, fruit.z, fruit.radius / 0.08, fruit.type.color);
    addFloatText(fruit.x, fruit.y);
    removeFruit(i);
  }
}

const GAME_OVER_COPY = {
  bomb: {
    title: "Hit a Bomb!",
    subtitle: "The fuse got you — try again.",
    titleClass: "bomb",
    delayMs: 900,
  },
  timeout: {
    title: "Time's Up!",
    subtitle: "Nice run — beat your score next time.",
    titleClass: "timeout",
    delayMs: 0,
  },
};

function setPaused(nextPaused) {
  if (!gameStarted || gameOver) return;
  if (legendOpen && nextPaused) return;
  paused = nextPaused;
  pauseOverlayEl.hidden = !paused || legendOpen;
}

function togglePause() {
  if (!gameStarted || gameOver) return;
  if (legendOpen) return;
  setPaused(!paused);
}

function setLegendOpen(nextOpen) {
  if (gameOver) return;
  if (nextOpen === legendOpen) return;

  if (nextOpen) {
    if (gameStarted && !paused) {
      pausedForLegend = true;
      paused = true;
    }
    legendOpen = true;
    legendOverlayEl.hidden = false;
    pauseOverlayEl.hidden = true;
    return;
  }

  legendOpen = false;
  legendOverlayEl.hidden = true;
  if (pausedForLegend) {
    pausedForLegend = false;
    paused = false;
  } else if (paused) {
    pauseOverlayEl.hidden = false;
  }
}

function toggleLegend() {
  setLegendOpen(!legendOpen);
}

function triggerGameOver(reason = "timeout") {
  const copy = GAME_OVER_COPY[reason] || GAME_OVER_COPY.timeout;
  gameOver = true;
  paused = false;
  pausedForLegend = false;
  legendOpen = false;
  legendOverlayEl.hidden = true;
  pauseOverlayEl.hidden = true;
  const isNewBest = maybeUpdateBestScore();
  gameOverTitleEl.textContent = copy.title;
  gameOverSubtitleEl.textContent = copy.subtitle;
  gameOverTitleEl.classList.remove("bomb", "timeout");
  gameOverTitleEl.classList.add(copy.titleClass);
  finalScoreEl.textContent = `Score: ${score}`;
  finalBestScoreEl.textContent = isNewBest ? `New best: ${bestScore}!` : `Best: ${bestScore}`;
  finalBestScoreEl.classList.toggle("new-best", isNewBest);
  const scheduleEndSfx = () => playGameEndSfx(reason);
  if (copy.delayMs > 0) {
    showGameOverOverlay = false;
    gameOverDelay = copy.delayMs;
    gameOverEl.hidden = true;
    setTimeout(scheduleEndSfx, copy.delayMs);
  } else {
    scheduleEndSfx();
    showGameOverOverlay = true;
    gameOverEl.hidden = false;
  }
}

function clearEffects() {
  for (const fruit of [...fruits]) {
    const idx = fruits.indexOf(fruit);
    if (idx >= 0) removeFruit(idx);
  }
  for (const p of particles) {
    effectsGroup.remove(p.mesh);
    p.mesh.geometry.dispose();
    p.mesh.material.dispose();
  }
  for (const ex of explosions) {
    effectsGroup.remove(ex.mesh);
    ex.mesh.geometry.dispose();
    ex.mesh.material.dispose();
  }
  for (const ft of floatTexts) {
    effectsGroup.remove(ft.label);
    ft.label.element.remove();
  }
  particles = [];
  explosions = [];
  floatTexts = [];
}

function jumpToNearTimeout() {
  if (gameOver || !gameStarted) return;
  timeLeft = QA_TIME_REMAINING;
  updateTimerDisplay();
  console.info("[QA] Timer jumped to", formatTime(QA_TIME_REMAINING));
}

function dismissOnboarding() {
  if (gameStarted) return;
  gameStarted = true;
  onboardingEl.hidden = true;
  if (QA_TIMEOUT_MODE) {
    timeLeft = QA_TIME_REMAINING;
    updateTimerDisplay();
    console.info("[QA] Timeout mode — timer starts at", formatTime(QA_TIME_REMAINING));
  }
  lastSpawn = performance.now();
}

function restartGame() {
  score = 0;
  paused = false;
  pausedForLegend = false;
  legendOpen = false;
  legendOverlayEl.hidden = true;
  pauseOverlayEl.hidden = true;
  gameOver = false;
  showGameOverOverlay = false;
  gameOverDelay = 0;
  gameStarted = false;
  rainbowTipShown = false;
  rainbowTipTimer = 0;
  clearEffects();
  scoreEl.textContent = "Score: 0";
  gameOverEl.hidden = true;
  gameOverTitleEl.textContent = "Game Over!";
  gameOverTitleEl.classList.remove("bomb", "timeout");
  gameOverSubtitleEl.textContent = "";
  finalBestScoreEl.textContent = `Best: ${bestScore}`;
  finalBestScoreEl.classList.remove("new-best");
  onboardingEl.hidden = false;
  rainbowTipEl.hidden = true;
  fallSpeedMultiplier = 1;
  spawnRateMultiplier = 1;
  bombChanceBonus = 0;
  deferredBombBonus = 0;
  pendingRainbowBombBoosts = 0;
  rainbowBombBoostTimer = 0;
  timeLeft = GAME_DURATION;
  lastFrameTime = 0;
  updateTimerDisplay();
  lastSpawn = 0;
  nextSpawnDelay = randomSpawnDelay();
}

function updateEffects(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.life -= dt * 1.8;
    const scale = ex.inner
      ? 1 + (ex.maxScale - 1) * (1 - ex.life)
      : 1 + (ex.maxScale - 1) * (1 - ex.life);
    ex.mesh.scale.setScalar(scale);
    ex.mesh.material.opacity = ex.life * (ex.inner ? 0.85 : 0.9);
    if (ex.life <= 0) {
      effectsGroup.remove(ex.mesh);
      ex.mesh.geometry.dispose();
      ex.mesh.material.dispose();
      explosions.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.kind === "explosion") {
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.vy -= 0.12 * dt;
      p.vx *= 0.98;
      p.life -= dt * 1.2;
      p.mesh.scale.multiplyScalar(0.97);
    } else {
      p.life -= dt * 2;
      p.mesh.scale.multiplyScalar(1.02);
    }
    p.mesh.material.opacity = p.life;
    if (p.life <= 0) {
      effectsGroup.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }

  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const ft = floatTexts[i];
    ft.label.position.y += dt * 2.5;
    ft.life -= dt * 1.8;
    ft.label.element.style.opacity = ft.life;
    if (ft.life <= 0) {
      effectsGroup.remove(ft.label);
      ft.label.element.remove();
      floatTexts.splice(i, 1);
    }
  }
}

function update(timestamp) {
  const rawDt = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0;
  const dt = Math.min(rawDt, 0.05);
  lastFrameTime = timestamp;

  if (gameOver) {
    updateEffects(dt);
    if (!showGameOverOverlay) {
      gameOverDelay -= dt * 1000;
      if (gameOverDelay <= 0) {
        showGameOverOverlay = true;
        gameOverEl.hidden = false;
      }
    }
    return;
  }

  if (!gameStarted) {
    const viewHalf = getViewHalfWidth();
    playerX = THREE.MathUtils.clamp(mouseX, -viewHalf + PLAYER_HALF_W, viewHalf - PLAYER_HALF_W);
    playerGroup.position.x = playerX;
    updateEffects(dt);
    return;
  }

  if (paused || legendOpen) {
    updateEffects(dt);
    return;
  }

  if (rainbowTipTimer > 0) {
    rainbowTipTimer -= dt * 1000;
    if (rainbowTipTimer <= 0) rainbowTipEl.hidden = true;
  }

  if (pendingRainbowBombBoosts > 0) {
    rainbowBombBoostTimer -= dt;
    if (rainbowBombBoostTimer <= 0) {
      applyRainbowBombBoost();
      rainbowBombBoostTimer = 0;
    }
  }

  flushDeferredBombBonus();

  timeLeft -= dt;
  updateTimerDisplay();
  if (timeLeft <= 0) {
    triggerGameOver("timeout");
    return;
  }

  if (timestamp - lastSpawn > nextSpawnDelay) {
    spawnFruit();
    lastSpawn = timestamp;
    nextSpawnDelay = randomSpawnDelay();
  }

  const viewHalf = getViewHalfWidth();
  playerX = THREE.MathUtils.clamp(mouseX, -viewHalf + PLAYER_HALF_W, viewHalf - PLAYER_HALF_W);
  playerGroup.position.x = playerX;

  for (let i = fruits.length - 1; i >= 0; i--) {
    const fruit = fruits[i];
    fruit.y -= fruit.speed * getTimeFallSpeedBonus() * dt;
    fruit.wobble += dt * 3.5;
    fruit.x += (fruit.drift + Math.sin(fruit.wobble) * 0.08) * dt * 60;
    fruit.mesh.position.set(fruit.x, fruit.y, fruit.z);
    fruit.mesh.rotation.z = Math.sin(fruit.wobble) * 0.15;
    if (fruit.y < GROUND_Y - 2) removeFruit(i);
  }

  checkCollisions();
  updateEffects(dt);
}

function animate(timestamp) {
  update(timestamp);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function init() {
  createSky();
  createClouds();
  createGround();
  generateForest();
  createPlayer();
  playerGroup.position.x = 0;
  resizeRenderer();
  updateTimerDisplay();

  window.addEventListener("resize", resizeRenderer);
  const handlePointerInput = (clientX) => {
    ensureAudioContext();
    mouseX = pointerToWorldX(clientX);
    dismissOnboarding();
  };
  container.addEventListener("mousemove", (e) => handlePointerInput(e.clientX));
  container.addEventListener("touchmove", (e) => {
    e.preventDefault();
    handlePointerInput(e.touches[0].clientX);
  }, { passive: false });
  container.addEventListener("touchstart", (e) => {
    handlePointerInput(e.touches[0].clientX);
  }, { passive: true });
  restartBtn.addEventListener("click", restartGame);
  resumeBtn.addEventListener("click", () => setPaused(false));
  muteBtn.addEventListener("click", () => toggleMuted());
  legendBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLegend();
  });
  onboardingLegendBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLegend();
  });
  pauseLegendBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLegend();
  });
  legendBackdropBtn.addEventListener("click", () => setLegendOpen(false));
  updateBestScoreDisplay();
  updateMuteButton();
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleMuted();
      if (!muted) ensureAudioContext();
      return;
    }
    if (e.code === "Escape") {
      if (legendOpen) {
        e.preventDefault();
        setLegendOpen(false);
      } else if (gameStarted && !gameOver) {
        e.preventDefault();
        togglePause();
      }
      return;
    }
    if (e.code === "KeyP") {
      if (gameStarted && !gameOver && !legendOpen) {
        e.preventDefault();
        togglePause();
      }
      return;
    }
    if (e.shiftKey && e.code === "KeyT") {
      e.preventDefault();
      jumpToNearTimeout();
    }
  });
  if (QA_TIMEOUT_MODE) {
    console.info("[QA] Fruit Catcher QA mode active (?qa=timeout). Shift+T jumps timer near end.");
  }
  requestAnimationFrame(animate);
}

init();
