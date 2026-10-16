/**
 * Spelling vs Lennon — 2D hallway spelling demo (Soft PASS art #3).
 */
const WORLD = { w: 1280, h: 720 };

const WIN_WORDS = 5;
const LOSE_MISTAKES = 3;

const ASSET_PATHS = {
  background: "assets/backgrounds/school-hallway.png",
  lennon: { src: "assets/characters/lennon.png", cols: 4 },
  walkers: {
    isabel: { src: "assets/characters/isabel.png", cols: 4, label: "Isabel" },
    maisie: { src: "assets/characters/maisie.png", cols: 4, label: "Maisie" },
    max: { src: "assets/characters/max.png", cols: 4, label: "Max" },
    harvey: { src: "assets/characters/harvey.png", cols: 4, label: "Harvey" },
    zhuoheng: { src: "assets/characters/zhuoheng.png", cols: 4, label: "卓衡" },
    teacher: { src: "assets/characters/teacher.png", cols: 4, label: "Teacher" },
    "mr-lun": { src: "assets/characters/mr-lun.png", cols: 4, label: "Mr. Lun" },
  },
};

const CAST_IDS = Object.keys(ASSET_PATHS.walkers);

const WORD_BANK = [
  { word: "cat", hint: "A small pet that says meow" },
  { word: "dog", hint: "A furry friend that wags its tail" },
  { word: "sun", hint: "Bright ball in the sky that warms us" },
  { word: "book", hint: "You read stories in this" },
  { word: "fish", hint: "Swims in water and has fins" },
  { word: "star", hint: "Twinkles in the night sky" },
  { word: "play", hint: "What kids do for fun at recess" },
  { word: "walk", hint: "Move your feet down the hallway" },
  { word: "apple", hint: "Crunchy red or green fruit" },
  { word: "happy", hint: "When you feel glad and smile" },
  { word: "school", hint: "Place where you learn and spell" },
  { word: "friend", hint: "Someone kind you like to hang out with" },
  { word: "dragon", hint: "Big magical creature that might breathe fire" },
  { word: "magic", hint: "Sparkly power in fairy tales" },
  { word: "spell", hint: "Say or write letters to make a word" },
  { word: "read", hint: "Look at words and know what they say" },
  { word: "blue", hint: "Color of the sky on a clear day" },
  { word: "tree", hint: "Tall plant with leaves and a trunk" },
  { word: "rain", hint: "Water drops falling from clouds" },
  { word: "help", hint: "When you lend a hand to someone" },
];

const stage = document.getElementById("stage");
const ctx = stage.getContext("2d");
const placeNameEl = document.getElementById("place-name");
const promptEl = document.getElementById("prompt");
const onboardingEl = document.getElementById("onboarding");
const loadingEl = document.getElementById("loading");
const finishEl = document.getElementById("finish");
const loseEl = document.getElementById("lose");
const restartBtn = document.getElementById("restart-btn");
const retryBtn = document.getElementById("retry-btn");
const touchEl = document.getElementById("touch");
const stickEl = document.getElementById("stick");
const stickKnobEl = document.getElementById("stick-knob");
const actionBtn = document.getElementById("action-btn");
const cycleBtn = document.getElementById("cycle-btn");
const goalWalkerEl = document.getElementById("goal-walker");
const goalSpellEl = document.getElementById("goal-spell");
const goalLennonEl = document.getElementById("goal-lennon");
const spellPanelEl = document.getElementById("spell-panel");
const spellHintEl = document.getElementById("spell-hint");
const wordSlotsEl = document.getElementById("word-slots");
const spellTypedEl = document.getElementById("spell-typed");
const touchLettersEl = document.getElementById("touch-letters");

const keys = { w: false, a: false, s: false, d: false, e: false };
const analog = { x: 0, y: 0 };
const sprites = {};
let background = null;

const state = {
  phase: "cast",
  castIndex: 0,
  walkerId: null,
  player: { x: 320, y: 520, facing: 1, h: 150 },
  lennon: { x: 980, y: 520, h: 165, facing: -1 },
  wordsWon: 0,
  lennonPoints: 0,
  currentWord: null,
  typed: "",
  usedWords: new Set(),
  shake: 0,
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

function setPrompt(text) {
  if (text && state.phase !== "fight") {
    promptEl.textContent = text;
    promptEl.hidden = false;
  } else if (state.phase !== "fight") {
    promptEl.hidden = true;
  } else {
    promptEl.hidden = true;
  }
}

function refreshGoals() {
  if (state.phase === "cast") {
    const id = CAST_IDS[state.castIndex];
    goalWalkerEl.textContent = `Walker: ${ASSET_PATHS.walkers[id].label}`;
    goalSpellEl.textContent = "Words — pick first!";
    goalLennonEl.textContent = "Lennon — waiting";
    goalWalkerEl.classList.remove("done");
    goalSpellEl.classList.remove("done");
    goalLennonEl.classList.remove("warn");
    return;
  }
  const label = state.walkerId ? ASSET_PATHS.walkers[state.walkerId].label : "Walker";
  goalWalkerEl.textContent = label;
  goalWalkerEl.classList.add("done");
  goalSpellEl.textContent = `Words ${state.wordsWon}/${WIN_WORDS}`;
  goalSpellEl.classList.toggle("done", state.wordsWon >= WIN_WORDS);
  goalLennonEl.textContent = `Lennon ${state.lennonPoints}/${LOSE_MISTAKES}`;
  goalLennonEl.classList.toggle("warn", state.lennonPoints >= LOSE_MISTAKES - 1);
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
  state.phase = "hallway";
  onboardingEl.hidden = true;
  state.player.x = 280;
  state.player.y = 520;
  state.player.facing = 1;
  refreshGoals();
  setPrompt("Walk to Lennon — press E when you are close!");
}

function tryStartFight() {
  if (state.phase !== "hallway") return;
  const d = dist(state.player.x, state.player.y, state.lennon.x, state.lennon.y);
  if (d > 220) {
    setPrompt("Get closer to Lennon in the hallway!");
    return;
  }
  state.phase = "fight";
  state.player.x = 360;
  state.lennon.x = 920;
  setPrompt(null);
  spellPanelEl.hidden = false;
  pickNextWord();
  refreshGoals();
}

function pickNextWord() {
  const pool = WORD_BANK.filter((w) => !state.usedWords.has(w.word));
  const choices = pool.length ? pool : WORD_BANK;
  if (pool.length === 0) state.usedWords.clear();
  const entry = choices[Math.floor(Math.random() * choices.length)];
  state.usedWords.add(entry.word);
  state.currentWord = entry;
  state.typed = "";
  renderSpellUi();
}

function renderSpellUi() {
  if (!state.currentWord) return;
  spellHintEl.textContent = state.currentWord.hint;
  wordSlotsEl.innerHTML = "";
  const letters = state.currentWord.word.length;
  for (let i = 0; i < letters; i++) {
    const el = document.createElement("span");
    el.className = "slot";
    const ch = state.typed[i];
    if (ch) {
      el.textContent = ch;
      el.classList.add("filled");
    } else if (i === state.typed.length) {
      el.classList.add("cursor");
      el.textContent = "";
    }
    wordSlotsEl.appendChild(el);
  }
  spellTypedEl.textContent =
    state.typed.length > 0 ? `Typing: ${state.typed}` : "Type each letter · Enter to submit";
}

function buildTouchLetters() {
  touchLettersEl.innerHTML = "";
  const alpha = "abcdefghijklmnopqrstuvwxyz".split("");
  for (const ch of alpha) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = ch;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      appendLetter(ch);
    });
    touchLettersEl.appendChild(btn);
  }
  const back = document.createElement("button");
  back.type = "button";
  back.className = "wide";
  back.textContent = "⌫";
  back.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    backspaceLetter();
  });
  touchLettersEl.appendChild(back);
  const go = document.createElement("button");
  go.type = "button";
  go.className = "wide";
  go.textContent = "Go!";
  go.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    submitWord();
  });
  touchLettersEl.appendChild(go);
}

function appendLetter(ch) {
  if (state.phase !== "fight" || !state.currentWord) return;
  if (state.typed.length >= state.currentWord.word.length) return;
  state.typed += ch.toLowerCase();
  renderSpellUi();
}

function backspaceLetter() {
  if (state.phase !== "fight") return;
  state.typed = state.typed.slice(0, -1);
  renderSpellUi();
}

function submitWord() {
  if (state.phase !== "fight" || !state.currentWord) return;
  const target = state.currentWord.word.toLowerCase();
  if (state.typed.length < target.length) {
    spellTypedEl.textContent = "Fill every letter first!";
    return;
  }
  if (state.typed === target) {
    state.wordsWon += 1;
    refreshGoals();
    if (state.wordsWon >= WIN_WORDS) {
      endWin();
      return;
    }
    spellTypedEl.textContent = "Correct! Next word…";
    setTimeout(pickNextWord, 450);
    return;
  }
  state.lennonPoints += 1;
  state.shake = 0.35;
  refreshGoals();
  if (state.lennonPoints >= LOSE_MISTAKES) {
    endLose();
    return;
  }
  spellTypedEl.textContent = `Not quite — it was "${target}". Try the next one!`;
  state.typed = "";
  setTimeout(pickNextWord, 700);
}

function endWin() {
  state.phase = "won";
  spellPanelEl.hidden = true;
  finishEl.hidden = false;
  setPrompt(null);
}

function endLose() {
  state.phase = "lost";
  spellPanelEl.hidden = true;
  loseEl.hidden = false;
  setPrompt(null);
}

function interact() {
  if (state.phase === "cast") {
    confirmWalker();
    return;
  }
  if (state.phase === "hallway") {
    tryStartFight();
  }
}

function updatePlayer(dt) {
  if (state.phase !== "hallway") return;
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
    const speed = 260;
    state.player.x += (mx / len) * speed * dt;
    state.player.y += (my / len) * speed * dt;
    if (mx > 0.1) state.player.facing = 1;
    if (mx < -0.1) state.player.facing = -1;
  }
  state.player.x = Math.max(80, Math.min(WORLD.w - 80, state.player.x));
  state.player.y = Math.max(300, Math.min(WORLD.h - 40, state.player.y));
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  stage.width = Math.floor(window.innerWidth * dpr);
  stage.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBackground() {
  if (!background) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / WORLD.w, vh / WORLD.h);
  const dw = WORLD.w * scale;
  const dh = WORLD.h * scale;
  const ox = (vw - dw) / 2;
  const oy = (vh - dh) / 2;
  ctx.drawImage(background, ox, oy, dw, dh);
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
    return;
  }

  if (state.phase === "hallway") {
    drawWorldSprite(sprites.lennon, state.lennon.x, state.lennon.y, state.lennon.h, true);
    drawWorldSprite(
      currentWalkerSprite(),
      state.player.x,
      state.player.y,
      state.player.h,
      state.player.facing < 0
    );
    return;
  }

  if (state.phase === "fight" || state.phase === "won" || state.phase === "lost") {
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 12 * state.shake : 0;
    drawWorldSprite(sprites.lennon, state.lennon.x + shakeX, state.lennon.y, state.lennon.h, true);
    drawWorldSprite(
      currentWalkerSprite(),
      state.player.x,
      state.player.y,
      state.player.h,
      false
    );
    drawWordCards();
  }
}

function drawWordCards() {
  const vw = window.innerWidth;
  const baseY = Math.min(window.innerHeight * 0.22, 140);
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "700 14px Trebuchet MS, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(42, 34, 28, 0.75)";
  ctx.fillText("Word cards", vw / 2, baseY - 10);

  const cardW = 56;
  const gap = 10;
  const n = 5;
  const totalW = n * cardW + (n - 1) * gap;
  let x = vw / 2 - totalW / 2;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i < state.wordsWon ? "#d4eadc" : "#fffaf3";
    ctx.strokeStyle = i < state.wordsWon ? "#2f7a4a" : "#b8a896";
    ctx.lineWidth = 2;
    const y = baseY;
    roundRect(ctx, x, y, cardW, 44, 8);
    ctx.fill();
    ctx.stroke();
    if (i < state.wordsWon) {
      ctx.fillStyle = "#2f7a4a";
      ctx.font = "800 20px Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText("✓", x + cardW / 2, y + 30);
    }
    x += cardW + gap;
  }
  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  updatePlayer(dt);
  render();
  requestAnimationFrame(frame);
}

function resetGame() {
  state.phase = "cast";
  state.castIndex = 0;
  state.walkerId = null;
  state.player.x = 320;
  state.player.y = 520;
  state.player.facing = 1;
  state.lennon.x = 980;
  state.wordsWon = 0;
  state.lennonPoints = 0;
  state.currentWord = null;
  state.typed = "";
  state.usedWords.clear();
  finishEl.hidden = true;
  loseEl.hidden = true;
  spellPanelEl.hidden = true;
  onboardingEl.hidden = false;
  placeNameEl.textContent = "School hallway";
  refreshGoals();
  setPrompt("A / D — pick your walker, then E!");
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);

  background = await loadImage(ASSET_PATHS.background);

  for (const [id, spec] of Object.entries(ASSET_PATHS.walkers)) {
    const img = await loadImage(spec.src);
    sprites[`walker-${id}`] = cutCell(img, spec.cols, 1);
  }

  const lennonImg = await loadImage(ASSET_PATHS.lennon.src);
  sprites.lennon = cutCell(lennonImg, ASSET_PATHS.lennon.cols, 2);

  loadingEl.hidden = true;
  onboardingEl.hidden = false;
  if ("ontouchstart" in window) {
    touchEl.hidden = false;
    touchLettersEl.hidden = false;
    buildTouchLetters();
  }
  refreshGoals();
  setPrompt("A / D — pick your walker, then E!");
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (state.phase === "fight") {
    if (k === "backspace") {
      e.preventDefault();
      backspaceLetter();
      return;
    }
    if (k === "enter") {
      e.preventDefault();
      submitWord();
      return;
    }
    if (k.length === 1 && /[a-z]/i.test(k)) {
      e.preventDefault();
      appendLetter(k);
      return;
    }
  }

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

restartBtn.addEventListener("click", resetGame);
retryBtn.addEventListener("click", resetGame);

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
  loadingEl.textContent = "Could not load Spelling vs Lennon art.";
  console.error(err);
});
