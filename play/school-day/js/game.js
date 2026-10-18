/**
 * School day — 2D classroom + hallway stroll (Soft PASS art).
 */
const WORLD = { w: 1280, h: 720 };

const ASSET_PATHS = {
  backgrounds: {
    classroom: "assets/backgrounds/classroom.png",
    hallway: "assets/backgrounds/school-hallway.png",
  },
  walkers: {
    isabel: { src: "assets/characters/isabel.png", cols: 4, label: "Isabel" },
    maisie: { src: "assets/characters/maisie.png", cols: 4, label: "Maisie" },
    max: { src: "assets/characters/max.png", cols: 4, label: "Max" },
    harvey: { src: "assets/characters/harvey.png", cols: 4, label: "Harvey" },
    zhuoheng: { src: "assets/characters/zhuoheng.png", cols: 4, label: "卓衡" },
    teacher: { src: "assets/characters/teacher.png", cols: 4, label: "Teacher" },
    "mr-lun": { src: "assets/characters/mr-lun.png", cols: 4, label: "Mr. Lun" },
  },
  npc: {
    "school-girl": { src: "assets/characters/school-girl.png", cols: 4, label: "School girl" },
    janitor: { src: "assets/characters/janitor.png", cols: 4, label: "Janitor" },
  },
};

const CAST_IDS = Object.keys(ASSET_PATHS.walkers);

const PLACES = {
  classroom: { name: "Classroom", bg: "classroom" },
  hallway: { name: "School hallway", bg: "hallway" },
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
const goalWalkerEl = document.getElementById("goal-walker");
const goalVisitEl = document.getElementById("goal-visit");
const goalFriendsEl = document.getElementById("goal-friends");

const keys = { w: false, a: false, s: false, d: false, e: false };
const analog = { x: 0, y: 0 };
const sprites = {};
const backgrounds = {};

const state = {
  phase: "cast",
  castIndex: 0,
  walkerId: null,
  place: "classroom",
  started: false,
  won: false,
  player: { x: 640, y: 520, facing: 1, h: 150 },
  visited: { classroom: false, hallway: false },
  met: { "school-girl": false, janitor: false },
  schoolGirl: { x: 920, y: 520, h: 140, facing: -1 },
  janitor: { x: 300, y: 520, h: 150, facing: 1 },
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

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function visitCount() {
  return Object.values(state.visited).filter(Boolean).length;
}

function friendsMet() {
  return Object.values(state.met).filter(Boolean).length;
}

function dayComplete() {
  return visitCount() >= 2 && friendsMet() >= 2;
}

function refreshGoals() {
  if (state.phase === "cast") {
    const id = CAST_IDS[state.castIndex];
    goalWalkerEl.textContent = `Walker: ${ASSET_PATHS.walkers[id].label}`;
    goalVisitEl.textContent = "Places — pick first!";
    goalFriendsEl.textContent = "Friends — after pick";
    goalWalkerEl.classList.remove("done");
    goalVisitEl.classList.remove("done");
    goalFriendsEl.classList.remove("done");
    return;
  }
  const label = state.walkerId ? ASSET_PATHS.walkers[state.walkerId].label : "Walker";
  goalWalkerEl.textContent = label;
  goalWalkerEl.classList.add("done");
  const visits = visitCount();
  goalVisitEl.textContent = `Places ${visits}/2`;
  goalVisitEl.classList.toggle("done", visits >= 2);
  const friends = friendsMet();
  goalFriendsEl.textContent = `Friends ${friends}/2`;
  goalFriendsEl.classList.toggle("done", friends >= 2);
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
    if (dayComplete()) {
      setPrompt("School day complete — E to head home!");
    }
  }
  if (id === "classroom") {
    state.player.x = 640;
    state.player.y = 520;
  } else if (id === "hallway") {
    state.player.x = 640;
    state.player.y = 520;
  }
}

function cycleCast(dir) {
  if (state.phase !== "cast") return;
  state.castIndex = (state.castIndex + dir + CAST_IDS.length) % CAST_IDS.length;
  refreshGoals();
  setPrompt("E — pick this walker!");
}

function confirmWalker() {
  if (state.phase !== "cast") return;
  state.walkerId = CAST_IDS[state.castIndex];
  state.phase = "play";
  state.started = true;
  onboardingEl.hidden = true;
  state.visited.classroom = true;
  state.player.x = 420;
  state.player.y = 520;
  refreshGoals();
  setPrompt("Say hi to the school girl (E) — walk right to the hallway!");
}

function tryTravel() {
  if (state.phase !== "play" || state.won) return;
  const { x } = state.player;
  if (state.place === "classroom" && x > WORLD.w - 70) {
    setPlace("hallway");
    setPrompt("Find the janitor and press E to say hi!");
    return;
  }
  if (state.place === "hallway" && x < 70) {
    setPlace("classroom");
    if (!state.met["school-girl"]) {
      setPrompt("Say hi to the school girl (E)!");
    } else if (dayComplete()) {
      setPrompt("School day complete — E to head home!");
    }
  }
}

function tryMeetNpc() {
  if (state.phase !== "play" || state.won) return;
  if (state.place === "classroom" && !state.met["school-girl"]) {
    const d = dist(state.player.x, state.player.y, state.schoolGirl.x, state.schoolGirl.y);
    if (d > 200) {
      setPrompt("Walk closer to the school girl!");
      return;
    }
    state.met["school-girl"] = true;
    refreshGoals();
    if (dayComplete()) {
      setPrompt("School day complete — E to head home!");
    } else {
      setPrompt("Hi! Walk off the right edge to visit the hallway.");
    }
    return;
  }
  if (state.place === "hallway" && !state.met.janitor) {
    const d = dist(state.player.x, state.player.y, state.janitor.x, state.janitor.y);
    if (d > 200) {
      setPrompt("Walk closer to the janitor!");
      return;
    }
    state.met.janitor = true;
    refreshGoals();
    if (dayComplete()) {
      setPrompt("School day complete — E to head home!");
    } else {
      setPrompt("Thanks for keeping the halls shiny! Visit the classroom too.");
    }
  }
}

function tryFinishDay() {
  if (state.phase !== "play" || state.won || !dayComplete()) return;
  state.won = true;
  finishEl.hidden = false;
  setPrompt(null);
}

function interact() {
  if (state.phase === "cast") {
    confirmWalker();
    return;
  }
  if (dayComplete()) {
    tryFinishDay();
    return;
  }
  tryMeetNpc();
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
  state.player.y = Math.max(300, Math.min(WORLD.h - 40, state.player.y));
  tryTravel();
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  stage.width = Math.floor(window.innerWidth * dpr);
  stage.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBackground() {
  const bgKey = state.phase === "cast" ? "classroom" : PLACES[state.place].bg;
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

function currentWalkerSprite() {
  const id = state.phase === "cast" ? CAST_IDS[state.castIndex] : state.walkerId;
  return sprites[`walker-${id}`];
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();

  if (state.place === "classroom" && state.phase === "play" && !state.won) {
    drawWorldSprite(
      sprites["npc-school-girl"],
      state.schoolGirl.x,
      state.schoolGirl.y,
      state.schoolGirl.h,
      state.schoolGirl.facing < 0
    );
  }

  if (state.place === "hallway" && state.phase === "play" && !state.won) {
    drawWorldSprite(
      sprites["npc-janitor"],
      state.janitor.x,
      state.janitor.y,
      state.janitor.h,
      state.janitor.facing < 0
    );
  }

  if (state.phase === "cast") {
    drawWorldSprite(currentWalkerSprite(), 640, 470, 210);
    ctx.save();
    ctx.fillStyle = "rgba(244, 239, 227, 0.82)";
    ctx.fillRect(0, window.innerHeight * 0.72, window.innerWidth, window.innerHeight * 0.28);
    ctx.fillStyle = "#2a221c";
    ctx.font = "800 18px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("A / D — pick your walker · E — start!", window.innerWidth / 2, window.innerHeight * 0.78);
    ctx.restore();
  } else if (!state.won) {
    drawWorldSprite(
      currentWalkerSprite(),
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
  state.walkerId = null;
  state.won = false;
  state.started = false;
  state.visited = { classroom: false, hallway: false };
  state.met = { "school-girl": false, janitor: false };
  state.player.x = 640;
  state.player.y = 520;
  finishEl.hidden = true;
  onboardingEl.hidden = false;
  setPlace("classroom", { markVisit: false });
  refreshGoals();
  setPrompt("A / D — pick your walker, then E!");
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

  for (const [id, spec] of Object.entries(ASSET_PATHS.walkers)) {
    const img = await loadImage(spec.src);
    sprites[`walker-${id}`] = cutCell(img, spec.cols, 1);
  }

  for (const [id, spec] of Object.entries(ASSET_PATHS.npc)) {
    const img = await loadImage(spec.src);
    sprites[`npc-${id}`] = cutCell(img, spec.cols, 1);
  }

  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  if ("ontouchstart" in window) touchEl.hidden = false;
  setPlace("classroom", { markVisit: false });
  refreshGoals();
  setPrompt("A / D — pick your walker, then E!");
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
  loadingEl.textContent = "Could not load School day art.";
  console.error(err);
});
