/**
 * Dragon Ville Picnic — 2D hatch-and-shoo demo (Soft PASS art).
 */
const WORLD = { w: 1280, h: 720 };

const ASSET_PATHS = {
  backgrounds: {
    park: "assets/backgrounds/picnic-tree.png",
    hatch: "assets/backgrounds/snow-field.png",
    socket: "assets/backgrounds/socket-space.png",
    home: "assets/backgrounds/campsite.png",
  },
  hero: { src: "assets/characters/undercover-princess.png", cols: 4 },
  bird: { src: "assets/characters/bird.png", cols: 4 },
  dragons: {
    purple: { src: "assets/characters/purple-fox-dragon.png", cols: 4 },
    pink: { src: "assets/characters/pink-bunny-dragon.png", cols: 4 },
    yellow: { src: "assets/characters/yellow-lightning-dragon.png", cols: 4 },
    blue: { src: "assets/characters/blue-princess-dragon.png", cols: 4 },
  },
  elements: {
    egg: "assets/elements/dragon-egg.png",
    picnic: "assets/elements/picnic.png",
    gift: "assets/elements/gift.png",
    cake: "assets/elements/cake.png",
    fries: "assets/elements/fries.png",
    tray: "assets/elements/tray.png",
    portal: "assets/elements/portal.png",
  },
};

const PLACES = {
  park: { name: "Picnic tree park", bg: "park" },
  hatch: { name: "Snow hatch field", bg: "hatch" },
  socket: { name: "Socket space", bg: "socket" },
  home: { name: "Campsite home", bg: "home" },
};

const stage = document.getElementById("stage");
const ctx = stage.getContext("2d");
const placeNameEl = document.getElementById("place-name");
const crumbsEl = document.getElementById("crumbs");
const promptEl = document.getElementById("prompt");
const onboardingEl = document.getElementById("onboarding");
const loadingEl = document.getElementById("loading");
const finishEl = document.getElementById("finish");
const restartBtn = document.getElementById("restart-btn");
const touchEl = document.getElementById("touch");
const stickEl = document.getElementById("stick");
const stickKnobEl = document.getElementById("stick-knob");
const actionBtn = document.getElementById("action-btn");
const shooBtn = document.getElementById("shoo-btn");
const goalEggsEl = document.getElementById("goal-eggs");
const goalFoodEl = document.getElementById("goal-food");
const goalGiftEl = document.getElementById("goal-gift");

const keys = { w: false, a: false, s: false, d: false, e: false, f: false };
const analog = { x: 0, y: 0 };
const sprites = {};
const backgrounds = {};

const state = {
  place: "park",
  started: false,
  won: false,
  player: { x: 640, y: 520, facing: 1, h: 150 },
  bird: { x: 980, y: 380, h: 72, shooTimer: 0 },
  giftSafe: true,
  portalOpen: false,
  eggs: [
    { id: "purple", x: 280, y: 420, hatched: false },
    { id: "pink", x: 520, y: 460, hatched: false },
    { id: "yellow", x: 760, y: 420, hatched: false },
    { id: "blue", x: 1000, y: 460, hatched: false },
  ],
  dragons: [],
  food: [
    { id: "cake", x: 180, y: 500, onBlanket: false },
    { id: "fries", x: 1050, y: 520, onBlanket: false },
    { id: "tray", x: 920, y: 560, onBlanket: false },
  ],
  blanket: { x: 520, y: 560, w: 240, h: 120 },
  gift: { x: 600, y: 500, h: 88 },
  portal: { x: 1120, y: 360, h: 160, active: false },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function chromaAndTrim(canvas) {
  const cctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const data = cctx.getImageData(0, 0, width, height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > 238 && d[i + 1] > 238 && d[i + 2] > 238) d[i + 3] = 0;
  }
  cctx.putImageData(data, 0, 0);

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
  const cctx = c.getContext("2d");
  cctx.drawImage(img, cellW * index, y0, cellW, cellH, 0, 0, c.width, c.height);
  cctx.clearRect(0, c.height * 0.88, c.width, c.height * 0.12);
  return chromaAndTrim(c);
}

function cutProp(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d").drawImage(img, 0, 0);
  return chromaAndTrim(c);
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function eggCount() {
  return state.eggs.filter((e) => e.hatched).length;
}

function foodOnBlanket() {
  return state.food.filter((f) => f.onBlanket).length;
}

function refreshGoals() {
  const eggs = eggCount();
  const food = foodOnBlanket();
  goalEggsEl.textContent = `Eggs ${eggs}/4`;
  goalFoodEl.textContent = `Food ${food}/3`;
  goalGiftEl.textContent = state.giftSafe ? "Gift safe" : "Bird has gift!";
  goalEggsEl.classList.toggle("done", eggs >= 4);
  goalFoodEl.classList.toggle("done", food >= 3);
  goalGiftEl.classList.toggle("done", state.giftSafe);
}

function checkPortalReady() {
  const ready = eggCount() >= 4 && foodOnBlanket() >= 3 && state.giftSafe;
  state.portalOpen = ready;
  state.portal.active = ready && state.place === "park";
  return ready;
}

function setPrompt(text) {
  if (text) {
    promptEl.textContent = text;
    promptEl.hidden = false;
  } else {
    promptEl.hidden = true;
  }
}

function setPlace(id) {
  if (!PLACES[id] || state.won) return;
  state.place = id;
  placeNameEl.textContent = PLACES[id].name;
  [...crumbsEl.querySelectorAll("span")].forEach((el) => {
    el.setAttribute("aria-current", el.dataset.place === id ? "true" : "false");
  });
  if (id === "park") {
    state.player.x = 640;
    state.player.y = 520;
  } else if (id === "hatch") {
    state.player.x = 640;
    state.player.y = 540;
  } else if (id === "socket") {
    state.player.x = 200;
    state.player.y = 520;
  } else if (id === "home") {
    state.player.x = 640;
    state.player.y = 520;
    state.won = true;
    finishEl.hidden = false;
  }
  setPrompt(null);
}

function tryTravel() {
  const { x, y } = state.player;
  if (state.place === "park" && x > WORLD.w - 80) {
    if (state.portalOpen) setPlace("socket");
    else setPrompt("Hatch, food, and gift first!");
    return;
  }
  if (state.place === "hatch" && x < 80) {
    setPlace("park");
    return;
  }
  if (state.place === "socket" && x > WORLD.w - 80) {
    setPlace("home");
  }
}

function hatchNearestEgg() {
  if (state.place !== "hatch") return;
  let best = null;
  let bestD = 9999;
  for (const egg of state.eggs) {
    if (egg.hatched) continue;
    const d = dist(state.player.x, state.player.y, egg.x, egg.y);
    if (d < bestD) {
      bestD = d;
      best = egg;
    }
  }
  if (!best || bestD > 120) return;
  best.hatched = true;
  state.dragons.push({
    kind: best.id,
    x: best.x,
    y: best.y - 20,
    h: 110,
  });
  refreshGoals();
  checkPortalReady();
}

function mindMoveFood(dt) {
  if (state.place !== "park") return;
  const blanket = state.blanket;
  const bx = blanket.x + blanket.w / 2;
  const by = blanket.y + blanket.h / 2;
  for (const item of state.food) {
    if (item.onBlanket) continue;
    const d = dist(state.player.x, state.player.y, item.x, item.y);
    if (d > 130) continue;
    const pull = 220 * dt;
    item.x += ((bx - item.x) / Math.max(d, 1)) * pull;
    item.y += ((by - item.y) / Math.max(d, 1)) * pull;
    if (dist(item.x, item.y, bx, by) < 70) {
      item.onBlanket = true;
      item.x = bx + (Math.random() - 0.5) * 40;
      item.y = by + (Math.random() - 0.5) * 20;
      refreshGoals();
      checkPortalReady();
    }
  }
}

function updateBird(dt) {
  if (state.place !== "park" || state.won) return;
  if (state.bird.shooTimer > 0) {
    state.bird.shooTimer -= dt;
    state.bird.x += 180 * dt;
    if (state.bird.x > WORLD.w + 40) state.bird.x = WORLD.w + 40;
    return;
  }
  const gx = state.gift.x;
  const gy = state.gift.y - state.gift.h / 2;
  const d = dist(state.bird.x, state.bird.y, gx, gy);
  const speed = 85;
  state.bird.x += ((gx - state.bird.x) / Math.max(d, 1)) * speed * dt;
  state.bird.y += ((gy - state.bird.y) / Math.max(d, 1)) * speed * dt;
  if (d < 36) {
    state.giftSafe = false;
    refreshGoals();
    checkPortalReady();
    setPrompt("F — shoo the bird! No theft!");
  }
}

function shooBird() {
  if (state.place !== "park") return;
  const d = dist(state.player.x, state.player.y, state.bird.x, state.bird.y);
  if (d > 200 && state.giftSafe) return;
  state.bird.shooTimer = 2.4;
  state.bird.x = Math.min(state.bird.x + 20, WORLD.w - 40);
  if (!state.giftSafe) {
    state.giftSafe = true;
    refreshGoals();
    checkPortalReady();
    setPrompt(null);
  }
}

function updatePlayer(dt) {
  let mx = 0;
  let my = 0;
  if (keys.w) my -= 1;
  if (keys.s) my += 1;
  if (keys.a) mx -= 1;
  if (keys.d) mx += 1;
  mx += analog.x;
  my += analog.y;
  const len = Math.hypot(mx, my);
  if (len > 0.05) {
    if (!state.started) {
      state.started = true;
      onboardingEl.hidden = true;
    }
    const speed = 280;
    state.player.x += (mx / len) * speed * dt;
    state.player.y += (my / len) * speed * dt;
    if (mx > 0.1) state.player.facing = 1;
    if (mx < -0.1) state.player.facing = -1;
  }
  state.player.x = Math.max(60, Math.min(WORLD.w - 60, state.player.x));
  state.player.y = Math.max(280, Math.min(WORLD.h - 40, state.player.y));
  tryTravel();
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  stage.width = Math.floor(window.innerWidth * dpr);
  stage.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBackground() {
  const bg = backgrounds[PLACES[state.place].bg];
  if (!bg) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / WORLD.w, vh / WORLD.h);
  const dw = WORLD.w * scale;
  const dh = WORLD.h * scale;
  const ox = (vw - dw) / 2;
  const oy = (vh - dh) / 2;
  ctx.drawImage(bg, ox, oy, dw, dh);
}

function worldToScreen(wx, wy) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / WORLD.w, vh / WORLD.h);
  const dw = WORLD.w * scale;
  const dh = WORLD.h * scale;
  const ox = (vw - dw) / 2;
  const oy = (vh - dh) / 2;
  return { x: ox + wx * scale, y: oy + wy * scale, scale };
}

function drawWorldSprite(canvas, wx, wy, height, flip = false) {
  const p = worldToScreen(wx, wy);
  drawSprite(canvas, p.x, p.y, height * p.scale, flip);
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();

  if (state.place === "park") {
    drawWorldSprite(sprites.picnic, state.blanket.x + state.blanket.w / 2, state.blanket.y, 130);
    drawWorldSprite(sprites.gift, state.gift.x, state.gift.y, state.gift.h);
    for (const item of state.food) {
      drawWorldSprite(sprites[item.id], item.x, item.y, 72);
    }
    if (state.portal.active) {
      drawWorldSprite(sprites.portal, state.portal.x, state.portal.y, state.portal.h);
    } else {
      ctx.save();
      const p = worldToScreen(state.portal.x, state.portal.y);
      ctx.globalAlpha = 0.45;
      drawSprite(sprites.portal, p.x, p.y, state.portal.h * p.scale);
      ctx.restore();
    }
    drawWorldSprite(sprites.bird, state.bird.x, state.bird.y, state.bird.h);
  }

  if (state.place === "hatch") {
    for (const egg of state.eggs) {
      if (!egg.hatched) drawWorldSprite(sprites.egg, egg.x, egg.y, 80);
    }
  }

  for (const d of state.dragons) {
    drawWorldSprite(sprites[`dragon-${d.kind}`], d.x, d.y, d.h);
  }

  drawWorldSprite(
    sprites.heroWalk,
    state.player.x,
    state.player.y,
    state.player.h,
    state.player.facing < 0
  );
}

function drawSprite(canvas, x, y, height, flip = false) {
  if (!canvas) return;
  const w = height * (canvas.width / canvas.height);
  ctx.save();
  ctx.translate(x, y);
  if (flip) {
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, -w / 2, -height, w, height);
  } else {
    ctx.drawImage(canvas, -w / 2, -height, w, height);
  }
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.won) {
    updatePlayer(dt);
    updateBird(dt);
    if (keys.e) mindMoveFood(dt);
    if (keys.f) shooBird();
  }
  render();
  requestAnimationFrame(frame);
}

function resetGame() {
  state.won = false;
  state.started = false;
  state.place = "park";
  state.player.x = 640;
  state.player.y = 520;
  state.bird.x = 980;
  state.bird.y = 380;
  state.bird.shooTimer = 0;
  state.giftSafe = true;
  state.portalOpen = false;
  state.portal.active = false;
  state.eggs.forEach((e) => {
    e.hatched = false;
  });
  state.dragons = [];
  state.food.forEach((f) => {
    f.onBlanket = false;
    if (f.id === "cake") {
      f.x = 180;
      f.y = 500;
    } else if (f.id === "fries") {
      f.x = 1050;
      f.y = 520;
    } else {
      f.x = 920;
      f.y = 560;
    }
  });
  finishEl.hidden = true;
  onboardingEl.hidden = false;
  setPlace("park");
  refreshGoals();
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);

  const bgEntries = await Promise.all(
    Object.entries(ASSET_PATHS.backgrounds).map(async ([key, src]) => {
      const img = await loadImage(src);
      return [key, img];
    })
  );
  bgEntries.forEach(([k, img]) => {
    backgrounds[k] = img;
  });

  const heroImg = await loadImage(ASSET_PATHS.hero.src);
  sprites.heroWalk = cutCell(heroImg, ASSET_PATHS.hero.cols, 1);

  const birdImg = await loadImage(ASSET_PATHS.bird.src);
  sprites.bird = cutCell(birdImg, ASSET_PATHS.bird.cols, 0);

  for (const [kind, spec] of Object.entries(ASSET_PATHS.dragons)) {
    const img = await loadImage(spec.src);
    sprites[`dragon-${kind}`] = cutCell(img, spec.cols, 0);
  }

  for (const [id, src] of Object.entries(ASSET_PATHS.elements)) {
    const img = await loadImage(src);
    sprites[id] = cutProp(img);
  }

  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  if ("ontouchstart" in window) touchEl.hidden = false;
  refreshGoals();
  setPlace("park");
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || e.key === "ArrowUp") keys.w = true;
  if (k === "s" || e.key === "ArrowDown") keys.s = true;
  if (k === "a" || e.key === "ArrowLeft") keys.a = true;
  if (k === "d" || e.key === "ArrowRight") keys.d = true;
  if (k === "e") keys.e = true;
  if (k === "f") keys.f = true;
  if (k === "e" && !e.repeat) hatchNearestEgg();
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || e.key === "ArrowUp") keys.w = false;
  if (k === "s" || e.key === "ArrowDown") keys.s = false;
  if (k === "a" || e.key === "ArrowLeft") keys.a = false;
  if (k === "d" || e.key === "ArrowRight") keys.d = false;
  if (k === "e") keys.e = false;
  if (k === "f") keys.f = false;
});

crumbsEl.addEventListener("click", (e) => {
  const span = e.target.closest("[data-place]");
  if (!span) return;
  const map = { park: "park", hatch: "hatch", socket: "socket", home: "home" };
  const id = map[span.dataset.place];
  if (id === "socket" && !state.portalOpen) {
    setPrompt("Finish the picnic first!");
    return;
  }
  if (id === "home" && !state.won && state.place !== "home") {
    setPrompt("Walk through the portal chain!");
    return;
  }
  setPlace(id);
});

restartBtn.addEventListener("click", resetGame);

let stickId = null;

function stickMove(clientX, clientY) {
  const rect = stickEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const max = 42;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    dx = (dx / len) * max;
    dy = (dy / len) * max;
  }
  stickKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;
  analog.x = dx / max;
  analog.y = dy / max;
}

stickEl.addEventListener("pointerdown", (e) => {
  stickId = e.pointerId;
  stickEl.setPointerCapture(stickId);
  stickMove(e.clientX, e.clientY);
});

stickEl.addEventListener("pointermove", (e) => {
  if (e.pointerId !== stickId) return;
  stickMove(e.clientX, e.clientY);
});

function releaseStick(e) {
  if (e.pointerId !== stickId) return;
  stickId = null;
  analog.x = 0;
  analog.y = 0;
  stickKnobEl.style.transform = "";
}

stickEl.addEventListener("pointerup", releaseStick);
stickEl.addEventListener("pointercancel", releaseStick);

actionBtn.addEventListener("pointerdown", () => {
  keys.e = true;
  hatchNearestEgg();
});
actionBtn.addEventListener("pointerup", () => {
  keys.e = false;
});
shooBtn.addEventListener("pointerdown", () => {
  keys.f = true;
  shooBird();
});
shooBtn.addEventListener("pointerup", () => {
  keys.f = false;
});

boot().catch((err) => {
  loadingEl.textContent = "Could not load picnic art.";
  console.error(err);
});
