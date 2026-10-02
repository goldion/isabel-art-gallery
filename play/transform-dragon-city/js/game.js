/**
 * Transform Dragon City — 2.5D side-scroll (Godot Now Demo web slice).
 * Single-pose crops from engine rnd/godot/transform-dragon-city art rules.
 */

const WORLD = 4000;
const FINISH = 3880;

const HEROES = [
  { id: "xiaoliang", name: "小亮" },
  { id: "xiaohua", name: "小花" },
  { id: "xiaoshan", name: "小山" },
];

const STAGES = [
  { id: "hills", name: "Hills — help! friends!", x0: 0, bg: "hills" },
  { id: "sky", name: "天龍城", x0: 900, bg: "sky" },
  { id: "earth", name: "地龍城", x0: 1800, bg: "earth" },
  { id: "sea", name: "海龍城", x0: 2700, bg: "sea" },
  { id: "jail", name: "Jail", x0: 3400, bg: "jail" },
];

const viewEl = document.getElementById("view");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hudEl = document.getElementById("hud");
const placeEl = document.getElementById("place-name");
const formEl = document.getElementById("form-name");
const livesEl = document.getElementById("lives");
const crumbsEl = document.getElementById("crumbs");
const bannerEl = document.getElementById("banner");
const promptEl = document.getElementById("prompt");
const titleEl = document.getElementById("title");
const pickEl = document.getElementById("pick");
const endEl = document.getElementById("end");
const endTextEl = document.getElementById("end-text");
const loadingEl = document.getElementById("loading");
const rosterEl = document.getElementById("roster");

const keys = { left: false, right: false, up: false, down: false, jump: false, punch: false, form: false };
const images = {};
const sprites = {};

let cssW = 960;
let cssH = 540;
let mode = "title";
let heroId = "xiaoliang";
let player;
let foes = [];
let friends = [];
let camX = 0;
let bannerT = 0;
let anim = 0;
let hintText = "";
let announced = "";

function loadImage(src, attempt = 0) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (attempt < 2) resolve(loadImage(src, attempt + 1));
      else reject(new Error(src));
    };
    img.src = attempt ? src + (src.includes("?") ? "&" : "?") + "try=" + attempt : src;
  });
}

function stageAt(x) {
  let stage = STAGES[0];
  for (const item of STAGES) if (x >= item.x0) stage = item;
  return stage;
}

function hero() {
  return HEROES.find((item) => item.id === heroId);
}

function pose() {
  return player.dragon ? sprites[heroId + "D"] : sprites[heroId + "G"];
}

function showBanner(text, frames) {
  bannerEl.textContent = text;
  bannerEl.hidden = false;
  bannerT = frames;
}

function setPrompt(text) {
  hintText = text;
  promptEl.textContent = text;
  promptEl.hidden = !text;
}

function paintLives() {
  livesEl.textContent = "♥".repeat(Math.max(0, player.hp));
  formEl.textContent = player.dragon ? "Dragon" : "Girl";
}

function paintCrumbs(id) {
  crumbsEl.querySelectorAll("[data-place]").forEach((el) => {
    if (el.getAttribute("data-place") === id) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
  });
}

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  cssW = viewEl.clientWidth;
  cssH = viewEl.clientHeight;
  canvas.width = Math.max(1, Math.floor(cssW * ratio));
  canvas.height = Math.max(1, Math.floor(cssH * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function lane() {
  return { top: cssH * 0.58, bot: cssH * 0.9 };
}

function project(x, depth, jump) {
  const band = lane();
  const foot = band.top + (band.bot - band.top) * depth - jump;
  const scale = 0.58 + depth * 0.62;
  return { sx: x - camX, foot, scale };
}

function drawCover(img) {
  const scale = Math.max(cssW / img.width, cssH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const stage = player ? stageAt(player.x) : STAGES[0];
  const parallax = mode === "play" ? camX * 0.12 : 0;
  ctx.drawImage(img, (cssW - dw) / 2 - parallax, (cssH - dh) / 2, dw, dh);
}

function drawSprite(img, sx, foot, scale, flip) {
  if (!img) return 40;
  const h = 108 * scale;
  const w = (img.width / img.height) * h;
  ctx.save();
  ctx.fillStyle = "rgba(42, 34, 28, 0.22)";
  ctx.beginPath();
  ctx.ellipse(sx + (flip ? -w * 0.35 : w * 0.35), foot - 4, Math.max(14, w * 0.28), 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  if (flip) {
    ctx.translate(sx, foot - h);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -w, 0, w, h);
  } else {
    ctx.drawImage(img, sx, foot - h, w, h);
  }
  ctx.restore();
  return w;
}

function startPlay() {
  player = {
    x: 90,
    depth: 0.72,
    vx: 0,
    jump: 0,
    vy: 0,
    face: 1,
    dragon: false,
    hp: 3,
    invuln: 0,
    punchT: 0,
    formT: 0,
  };
  foes = [
    { x: 520, depth: 0.7, min: 420, max: 700, vx: 70, patrol: 70, hp: 3, kind: "vs", hitT: 0, struck: false },
    { x: 1100, depth: 0.55, min: 980, max: 1320, vx: -80, patrol: 80, hp: 3, kind: "gugu", hitT: 0, struck: false },
    { x: 1650, depth: 0.8, min: 1500, max: 1780, vx: 75, patrol: 75, hp: 3, kind: "vs", hitT: 0, struck: false },
    { x: 2150, depth: 0.62, min: 1980, max: 2400, vx: -85, patrol: 85, hp: 4, kind: "gugu", hitT: 0, struck: false },
    { x: 2550, depth: 0.74, min: 2460, max: 2680, vx: 70, patrol: 70, hp: 3, kind: "vs", hitT: 0, struck: false },
    { x: 3050, depth: 0.58, min: 2880, max: 3280, vx: -78, patrol: 78, hp: 4, kind: "gugu", hitT: 0, struck: false },
    { x: 3680, depth: 0.7, min: 3520, max: 3860, vx: 90, patrol: 90, hp: 5, kind: "vs", hitT: 0, struck: false },
  ];
  friends = [
    { x: 1420, depth: 0.66, id: "xiaosheng", name: "小生", saved: false },
    { x: 2920, depth: 0.7, id: "xiaolian", name: "小连", saved: false },
  ];
  camX = 0;
  announced = "hills";
  mode = "play";
  titleEl.hidden = true;
  pickEl.hidden = true;
  endEl.hidden = true;
  hudEl.hidden = false;
  paintLives();
  setPrompt("help! friends!");
  showBanner("help! friends!", 90);
}

function savedCount() {
  return friends.filter((friend) => friend.saved).length;
}

function win() {
  mode = "end";
  hudEl.hidden = true;
  bannerEl.hidden = true;
  promptEl.hidden = true;
  endEl.hidden = false;
  endTextEl.textContent = hero().name + " got everyone home. Girl and dragon. The end.";
}

function respawn() {
  const stage = stageAt(player.x);
  player.x = stage.x0 + 70;
  player.jump = 0;
  player.vy = 0;
  player.vx = 0;
  player.hp = 3;
  player.invuln = 50;
  paintLives();
  showBanner("Ouch! Try this stretch again.", 70);
}

function tick(dt) {
  anim++;
  const dragon = player.dragon;
  const speed = dragon ? 280 : 210;
  const depthSpeed = 0.85;

  let ix = 0;
  let id = 0;
  if (keys.left) ix -= 1;
  if (keys.right) ix += 1;
  if (keys.up) id -= 1;
  if (keys.down) id += 1;
  player.vx = ix * speed;
  if (ix > 0) player.face = 1;
  if (ix < 0) player.face = -1;
  player.x = Math.max(40, Math.min(WORLD - 80, player.x + player.vx * dt));
  player.depth = Math.max(0.18, Math.min(1, player.depth + id * depthSpeed * dt));

  if (keys.jump && player.jump <= 0 && player.vy <= 0) player.vy = dragon ? 520 : 420;
  keys.jump = false;
  if (player.jump > 0 || player.vy > 0) {
    player.vy -= 1400 * dt;
    player.jump += player.vy * dt;
    if (player.jump <= 0) {
      player.jump = 0;
      player.vy = 0;
    }
  }

  if (player.formT > 0) player.formT -= dt;
  if (keys.form && player.formT <= 0) {
    player.dragon = !player.dragon;
    player.formT = 0.45;
    paintLives();
    showBanner(player.dragon ? "Dragon!" : "Girl!", 40);
  }
  keys.form = false;

  if (keys.punch && player.punchT <= 0 && player.jump < 70) player.punchT = 0.28;
  keys.punch = false;
  const punching = player.punchT > 0.04 && player.jump < 70;
  if (player.punchT > 0) player.punchT -= dt;
  if (player.invuln > 0) player.invuln -= dt;

  const range = dragon ? 92 : 58;
  const dmg = dragon ? 2 : 1;

  for (const foe of foes) {
    if (foe.hp <= 0) continue;
    if (foe.hitT > 0) foe.hitT -= dt;
    foe.x += foe.vx * dt;
    if (foe.x < foe.min || foe.x > foe.max) foe.vx *= -1;
    if (!(foe.hitT > 0)) {
      const dir = Math.sign(foe.vx) || 1;
      foe.vx = dir * foe.patrol;
    }
    const dx = foe.x - player.x;
    if (Math.abs(dx) < 220) {
      foe.depth += Math.sign(player.depth - foe.depth) * 0.35 * dt;
    }
    const aligned = Math.abs(foe.depth - player.depth) < 0.16;
    const inFront = player.face > 0 ? dx > 10 : dx < -10;
    if (!punching) foe.struck = false;
    if (punching && !foe.struck && aligned && inFront && Math.abs(dx) < range) {
      foe.struck = true;
      foe.hp -= dmg;
      foe.hitT = 0.22;
      foe.vx = player.face * 160;
      if (foe.hp <= 0) showBanner("Down!", 36);
    } else if (!punching && aligned && Math.abs(dx) < 42 && player.jump < 40 && player.invuln <= 0) {
      player.hp -= 1;
      player.invuln = 0.8;
      player.x -= player.face * 36;
      paintLives();
      if (player.hp <= 0) respawn();
    }
  }

  friends.forEach((friend, index) => {
    const close =
      Math.abs(player.x - friend.x) < 56 && Math.abs(player.depth - friend.depth) < 0.18;
    if (!friend.saved && close) {
      friend.saved = true;
      showBanner(friend.name + "!", 50);
      setPrompt(savedCount() === 2 ? "Jail is ahead. Get them home." : "One more friend. Keep going.");
    }
    if (friend.saved) {
      const tx = player.x - 56 - index * 36;
      friend.x += (tx - friend.x) * Math.min(1, dt * 6);
      friend.depth += (player.depth - friend.depth) * Math.min(1, dt * 6);
    }
  });

  const stage = stageAt(player.x);
  placeEl.textContent = stage.name;
  paintCrumbs(stage.id);
  if (stage.id !== announced) {
    announced = stage.id;
    if (savedCount() < 2 && player.x < FINISH - 40) setPrompt(stage.name);
  }

  if (player.x > FINISH && savedCount() === 2) win();
  else if (player.x > FINISH) {
    player.x = FINISH - 30;
    showBanner("help! friends!", 50);
    setPrompt("Go back. Rescue 小生 and 小连.");
  }

  const target = player.x - cssW * 0.32;
  camX += (target - camX) * Math.min(1, dt * 6);
  camX = Math.max(0, Math.min(Math.max(0, WORLD - cssW), camX));
}

function drawActor(img, x, depth, jump, flip, alpha) {
  const p = project(x, depth, jump);
  if (p.sx < -160 || p.sx > cssW + 160) return;
  ctx.globalAlpha = alpha;
  drawSprite(img, p.sx, p.foot, p.scale, flip);
  ctx.globalAlpha = 1;
}

function draw() {
  const stage = stageAt(player.x);
  const bg = images[stage.bg] || images.hills;
  ctx.clearRect(0, 0, cssW, cssH);
  if (bg) drawCover(bg);

  const door = project(FINISH + 30, 0.62, 0);
  if (images.tree && door.sx > -200 && door.sx < cssW + 20) {
    const w = 110 * door.scale;
    const h = 78 * door.scale;
    ctx.drawImage(images.tree, door.sx, door.foot - h, w, h);
    ctx.strokeStyle = "#d45b7a";
    ctx.lineWidth = 3;
    ctx.strokeRect(door.sx, door.foot - h, w, h);
  }

  const layers = [];
  for (const foe of foes) {
    const down = foe.hp <= 0;
    const spr =
      foe.kind === "gugu"
        ? down || foe.hitT > 0
          ? sprites.guguHit
          : sprites.gugu
        : down
          ? sprites.vsSit
          : foe.hitT > 0
            ? sprites.vsHit
            : sprites.vs;
    layers.push({
      depth: foe.depth,
      draw() {
        drawActor(spr, foe.x, foe.depth, 0, foe.vx > 0, down ? 0.4 : 1);
      },
    });
  }
  for (const friend of friends) {
    layers.push({
      depth: friend.depth,
      draw() {
        drawActor(sprites[friend.id], friend.x, friend.depth, 0, false, 1);
      },
    });
  }
  layers.push({
    depth: player.depth,
    draw() {
      const blink = player.invuln > 0 && anim % 8 < 4;
      if (blink) return;
      const p = project(player.x, player.depth, player.jump);
      const hMul = player.dragon ? 1.12 : 1;
      drawSprite(pose(), p.sx, p.foot, p.scale * hMul, player.face < 0);
      if (player.punchT > 0.12) {
        ctx.fillStyle = "rgba(212, 91, 122, 0.55)";
        ctx.beginPath();
        ctx.arc(p.sx + player.face * 54 * p.scale, p.foot - 48 * p.scale, (player.dragon ? 22 : 14) * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  });
  layers.sort((a, b) => a.depth - b.depth);
  for (const layer of layers) layer.draw();
}

function frame(prev) {
  const now = performance.now();
  const dt = Math.min(0.05, (now - prev) / 1000);
  if (mode === "play") {
    tick(dt);
    if (bannerT > 0) {
      bannerT -= 1;
      if (bannerT <= 0) bannerEl.hidden = true;
    }
    draw();
  } else if (images.hills) {
    ctx.clearRect(0, 0, cssW, cssH);
    drawCover(mode === "end" ? images.tree || images.hills : images.hills);
  }
  requestAnimationFrame(() => frame(now));
}

function onKey(event, down) {
  const code = event.code;
  if (code === "ArrowLeft" || code === "KeyA") keys.left = down;
  if (code === "ArrowRight" || code === "KeyD") keys.right = down;
  if (code === "ArrowUp" || code === "KeyW") keys.up = down;
  if (code === "ArrowDown" || code === "KeyS") keys.down = down;
  if (code === "Space") {
    if (down) keys.jump = true;
    event.preventDefault();
  }
  if (down && (code === "KeyJ" || code === "KeyK")) keys.punch = true;
  if (down && code === "KeyF") keys.form = true;
  if (down && mode === "title" && (code === "Enter" || code === "NumpadEnter")) {
    titleEl.hidden = true;
    pickEl.hidden = false;
    mode = "pick";
  }
}

function hold(id, set) {
  const button = document.getElementById(id);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    set(true);
  });
  const end = () => set(false);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointercancel", end);
  button.addEventListener("pointerleave", end);
}

function buildRoster() {
  rosterEl.innerHTML = "";
  for (const item of HEROES) {
    const button = document.createElement("button");
    button.type = "button";
    const img = document.createElement("img");
    img.src = `assets/crops/${item.id}_girl.png`;
    img.alt = item.name;
    const span = document.createElement("span");
    span.textContent = item.name;
    button.append(img, span);
    button.addEventListener("click", () => {
      heroId = item.id;
      startPlay();
    });
    rosterEl.appendChild(button);
  }
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => onKey(event, true));
window.addEventListener("keyup", (event) => onKey(event, false));
hold("t-left", (value) => (keys.left = value));
hold("t-right", (value) => (keys.right = value));
hold("t-up", (value) => (keys.up = value));
hold("t-down", (value) => (keys.down = value));
document.getElementById("t-jump").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  keys.jump = true;
});
document.getElementById("t-punch").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  keys.punch = true;
});
document.getElementById("t-form").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  keys.form = true;
});
document.getElementById("btn-start").addEventListener("click", () => {
  titleEl.hidden = true;
  pickEl.hidden = false;
  mode = "pick";
});
document.getElementById("btn-again").addEventListener("click", startPlay);

resize();

const bgBase = "assets/backgrounds";
const cropBase = "assets/crops";

Promise.all([
  loadImage(`${bgBase}/dragon-city-hills.png`).then((img) => (images.hills = img)),
  loadImage(`${bgBase}/sky-dragon-city.png`).then((img) => (images.sky = img)),
  loadImage(`${bgBase}/earth-dragon-city.png`).then((img) => (images.earth = img)),
  loadImage(`${bgBase}/sea-dragon-city.png`).then((img) => (images.sea = img)),
  loadImage(`${bgBase}/jail.png`).then((img) => (images.jail = img)),
  loadImage(`${bgBase}/treehouse.png`).then((img) => (images.tree = img)),
  loadImage(`${cropBase}/gugu.png`).then((img) => (sprites.gugu = img)),
  loadImage(`${cropBase}/gugu_hit.png`).then((img) => (sprites.guguHit = img)),
  loadImage(`${cropBase}/vs_opponent.png`).then((img) => (sprites.vs = img)),
  loadImage(`${cropBase}/vs_opponent_hit.png`).then((img) => (sprites.vsHit = img)),
  loadImage(`${cropBase}/vs_opponent_down.png`).then((img) => (sprites.vsSit = img)),
  loadImage(`${cropBase}/xiaosheng.png`).then((img) => (sprites.xiaosheng = img)),
  loadImage(`${cropBase}/xiaolian.png`).then((img) => (sprites.xiaolian = img)),
  ...HEROES.flatMap((item) => [
    loadImage(`${cropBase}/${item.id}_girl.png`).then((img) => {
      sprites[item.id + "G"] = img;
    }),
    loadImage(`${cropBase}/${item.id}_dragon.png`).then((img) => {
      sprites[item.id + "D"] = img;
    }),
  ]),
])
  .then(() => {
    buildRoster();
    loadingEl.hidden = true;
    requestAnimationFrame((now) => frame(now));
  })
  .catch((err) => {
    loadingEl.textContent = "Could not load Transform Dragon City art. " + (err && err.message ? err.message : "");
    console.error(err);
  });
