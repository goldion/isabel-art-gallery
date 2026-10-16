/**
 * Queen Team-Up — 2D pond / bath / stage demo (Soft PASS art #2).
 */
const WORLD = { w: 1280, h: 720 };

const ASSET_PATHS = {
  backgrounds: {
    pond: "assets/backgrounds/full-pond.png",
    bath: "assets/backgrounds/bubble-bath.png",
    stage: "assets/backgrounds/stage.png",
  },
  queens: {
    mermaid: { src: "assets/characters/mermaid.png", cols: 4, label: "Mermaid Queen" },
    sea: { src: "assets/characters/sea-queen.png", cols: 4, label: "Sea Queen" },
    sky: { src: "assets/characters/sky-queen.png", cols: 4, label: "Sky Queen" },
    plant: { src: "assets/characters/plant-queen.png", cols: 4, label: "Plant Queen" },
    dancing: { src: "assets/characters/dancing-queen.png", cols: 4, label: "Dancing Queen" },
    teddy: { src: "assets/characters/teddy.png", cols: 4, label: "Teddy Queen" },
  },
  npc: {
    gugu: { src: "assets/characters/gugu.png", cols: 4 },
    director: "assets/characters/star-director.png",
  },
  elements: {
    lily: "assets/elements/lily-pad.png",
    lotus: "assets/elements/lotus.png",
  },
};

const CAST_IDS = Object.keys(ASSET_PATHS.queens);

const PLACES = {
  pond: { name: "Pond team", bg: "pond" },
  bath: { name: "Bubble bath", bg: "bath" },
  stage: { name: "Star stage", bg: "stage" },
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
const cycleBtn = document.getElementById("cycle-btn");
const goalQueenEl = document.getElementById("goal-queen");
const goalVisitEl = document.getElementById("goal-visit");
const goalPropsEl = document.getElementById("goal-props");

const keys = { w: false, a: false, s: false, d: false, e: false };
const analog = { x: 0, y: 0 };
const sprites = {};
const backgrounds = {};

const state = {
  phase: "cast",
  castIndex: 0,
  queenId: null,
  place: "pond",
  started: false,
  won: false,
  player: { x: 640, y: 520, facing: 1, h: 150 },
  visited: { pond: false, bath: false, stage: false },
  props: {
    lily: { x: 220, y: 480, placed: false, spot: { x: 520, y: 420 } },
    lotus: { x: 1060, y: 500, placed: false, spot: { x: 760, y: 400 } },
  },
  gugu: { x: 920, y: 480, h: 130 },
  director: { x: 640, y: 380, h: 200 },
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

function visitCount() {
  return Object.values(state.visited).filter(Boolean).length;
}

function propsPlaced() {
  return Object.values(state.props).filter((p) => p.placed).length;
}

function teamReady() {
  return (
    state.queenId &&
    visitCount() >= 3 &&
    propsPlaced() >= 2
  );
}

function refreshGoals() {
  if (state.phase === "cast") {
    const q = CAST_IDS[state.castIndex];
    goalQueenEl.textContent = `Queen: ${ASSET_PATHS.queens[q].label}`;
    goalVisitEl.textContent = "Places — pick first!";
    goalPropsEl.textContent = "Lily & lotus — after pick";
    goalQueenEl.classList.remove("done");
    goalVisitEl.classList.remove("done");
    goalPropsEl.classList.remove("done");
    return;
  }
  goalQueenEl.textContent = ASSET_PATHS.queens[state.queenId].label;
  goalQueenEl.classList.add("done");
  const visits = visitCount();
  goalVisitEl.textContent = `Places ${visits}/3`;
  goalVisitEl.classList.toggle("done", visits >= 3);
  const props = propsPlaced();
  goalPropsEl.textContent = `Lily & lotus ${props}/2`;
  goalPropsEl.classList.toggle("done", props >= 2);
}

function setPrompt(text) {
  if (text) {
    promptEl.textContent = text;
    promptEl.hidden = false;
  } else {
    promptEl.hidden = true;
  }
}

function setPlace(id, { markVisit = true } = {}) {
  if (!PLACES[id] || state.won) return;
  state.place = id;
  placeNameEl.textContent = PLACES[id].name;
  [...crumbsEl.querySelectorAll("span")].forEach((el) => {
    el.setAttribute("aria-current", el.dataset.place === id ? "true" : "false");
  });
  if (markVisit && state.phase === "play") {
    state.visited[id] = true;
    refreshGoals();
  }
  if (id === "pond") {
    state.player.x = 640;
    state.player.y = 520;
  } else if (id === "bath") {
    state.player.x = 280;
    state.player.y = 520;
  } else if (id === "stage") {
    state.player.x = 420;
    state.player.y = 520;
  }
  setPrompt(null);
}

function cycleCast(dir) {
  if (state.phase !== "cast") return;
  state.castIndex = (state.castIndex + dir + CAST_IDS.length) % CAST_IDS.length;
  refreshGoals();
  setPrompt("E — pick this queen!");
}

function confirmQueen() {
  if (state.phase !== "cast") return;
  state.queenId = CAST_IDS[state.castIndex];
  state.phase = "play";
  state.started = true;
  onboardingEl.hidden = true;
  state.visited.pond = true;
  refreshGoals();
  setPrompt("Walk to the bath and stage — place lily & lotus on the pond!");
}

function tryTravel() {
  if (state.phase !== "play" || state.won) return;
  const { x } = state.player;
  if (state.place === "pond" && x > WORLD.w - 70) {
    setPlace("bath");
    return;
  }
  if (state.place === "bath" && x > WORLD.w - 70) {
    setPlace("stage");
    return;
  }
  if (state.place === "bath" && x < 70) {
    setPlace("pond");
    return;
  }
  if (state.place === "stage" && x < 70) {
    setPlace("bath");
  }
}

function placeProp() {
  if (state.phase !== "play" || state.place !== "pond") return;
  for (const item of Object.values(state.props)) {
    if (item.placed) continue;
    const d = dist(state.player.x, state.player.y, item.x, item.y);
    if (d > 130) continue;
    item.placed = true;
    item.x = item.spot.x;
    item.y = item.spot.y;
    refreshGoals();
    setPrompt(null);
    return;
  }
}

function tryTeamUp() {
  if (state.phase !== "play" || state.place !== "stage") return;
  if (!teamReady()) {
    setPrompt("Visit every place and place lily + lotus on the pond first!");
    return;
  }
  const d = dist(state.player.x, state.player.y, state.director.x, state.director.y);
  if (d > 200) return;
  state.won = true;
  finishEl.hidden = false;
  setPrompt(null);
}

function interact() {
  if (state.phase === "cast") {
    confirmQueen();
    return;
  }
  placeProp();
  tryTeamUp();
}

function updatePlayer(dt) {
  if (state.phase === "cast" || state.won) return;
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
  const bgKey = state.phase === "cast" ? "pond" : PLACES[state.place].bg;
  const bg = backgrounds[bgKey];
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

function drawWorldSprite(canvas, wx, wy, height, flip = false) {
  const p = worldToScreen(wx, wy);
  drawSprite(canvas, p.x, p.y, height * p.scale, flip);
}

function currentQueenSprite() {
  const id = state.phase === "cast" ? CAST_IDS[state.castIndex] : state.queenId;
  return sprites[`queen-${id}`];
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();

  if (state.place === "pond" || state.phase === "cast") {
    for (const [key, item] of Object.entries(state.props)) {
      const h = item.placed ? 88 : 72;
      drawWorldSprite(sprites[key], item.x, item.y, h);
    }
  }

  if (state.place === "bath" && state.phase === "play") {
    drawWorldSprite(sprites.gugu, state.gugu.x, state.gugu.y, state.gugu.h);
  }

  if (state.place === "stage" && state.phase === "play") {
    drawWorldSprite(sprites.director, state.director.x, state.director.y, state.director.h);
    if (teamReady()) {
      drawWorldSprite(sprites.gugu, 820, 500, 120);
    }
  }

  if (state.phase === "cast") {
    drawWorldSprite(currentQueenSprite(), 640, 460, 220);
    ctx.save();
    ctx.fillStyle = "rgba(247, 241, 228, 0.82)";
    ctx.fillRect(0, window.innerHeight * 0.72, window.innerWidth, window.innerHeight * 0.28);
    ctx.fillStyle = "#2a221c";
    ctx.font = "800 18px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("A / D — pick a queen · E — start!", window.innerWidth / 2, window.innerHeight * 0.78);
    ctx.restore();
  } else if (!state.won) {
    drawWorldSprite(
      currentQueenSprite(),
      state.player.x,
      state.player.y,
      state.player.h,
      state.player.facing < 0
    );
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updatePlayer(dt);
  render();
  requestAnimationFrame(frame);
}

function resetGame() {
  state.phase = "cast";
  state.castIndex = 0;
  state.queenId = null;
  state.won = false;
  state.started = false;
  state.visited = { pond: false, bath: false, stage: false };
  state.props.lily.placed = false;
  state.props.lily.x = 220;
  state.props.lily.y = 480;
  state.props.lotus.placed = false;
  state.props.lotus.x = 1060;
  state.props.lotus.y = 500;
  state.player.x = 640;
  state.player.y = 520;
  finishEl.hidden = true;
  onboardingEl.hidden = false;
  setPlace("pond", { markVisit: false });
  refreshGoals();
  setPrompt("A / D — pick your queen, then E!");
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

  for (const [id, spec] of Object.entries(ASSET_PATHS.queens)) {
    const img = await loadImage(spec.src);
    sprites[`queen-${id}`] = cutCell(img, spec.cols, 1);
  }

  const guguImg = await loadImage(ASSET_PATHS.npc.gugu.src);
  sprites.gugu = cutCell(guguImg, ASSET_PATHS.npc.gugu.cols, 0);

  const directorImg = await loadImage(ASSET_PATHS.npc.director);
  sprites.director = cutProp(directorImg);

  for (const [id, src] of Object.entries(ASSET_PATHS.elements)) {
    const img = await loadImage(src);
    sprites[id] = cutProp(img);
  }

  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  if ("ontouchstart" in window) touchEl.hidden = false;
  setPlace("pond", { markVisit: false });
  refreshGoals();
  setPrompt("A / D — pick your queen, then E!");
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || e.key === "ArrowUp") keys.w = true;
  if (k === "s" || e.key === "ArrowDown") keys.s = true;
  if (k === "a" || e.key === "ArrowLeft") {
    keys.a = true;
    if (!e.repeat && state.phase === "cast") cycleCast(-1);
  }
  if (k === "d" || e.key === "ArrowRight") {
    keys.d = true;
    if (!e.repeat && state.phase === "cast") cycleCast(1);
  }
  if (k === "e") keys.e = true;
  if (k === "e" && !e.repeat) interact();
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || e.key === "ArrowUp") keys.w = false;
  if (k === "s" || e.key === "ArrowDown") keys.s = false;
  if (k === "a" || e.key === "ArrowLeft") keys.a = false;
  if (k === "d" || e.key === "ArrowRight") keys.d = false;
  if (k === "e") keys.e = false;
});

crumbsEl.addEventListener("click", (e) => {
  const span = e.target.closest("[data-place]");
  if (!span || state.phase !== "play") return;
  setPlace(span.dataset.place);
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
  interact();
});
actionBtn.addEventListener("pointerup", () => {
  keys.e = false;
});

cycleBtn.addEventListener("pointerdown", () => {
  cycleCast(1);
});

boot().catch((err) => {
  loadingEl.textContent = "Could not load Queen Team-Up art.";
  console.error(err);
});
