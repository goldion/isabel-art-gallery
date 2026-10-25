/**
 * Queen Team-Up — polished lily-pad pond jumper.
 * Pick three friends, hop the pond, join the mermaid, beat Gugu,
 * then the show becomes a bubble bath.
 */
const H = 540;
const WORLD_W = 2360;
const WATER_Y = 438;

const GRAVITY = 1680;
const JUMP_V = -700;
const MAX_FALL = 920;
const RUN_ACCEL = 2400;
const MAX_RUN = 290;
const COYOTE = 0.12;
const JUMP_BUFFER = 0.14;

const PADS = [
  { x: 0, y: 392, w: 260, h: 28, bank: true },
  { x: 340, y: 368, w: 170, h: 22 },
  { x: 580, y: 340, w: 164, h: 22 },
  { x: 810, y: 372, w: 170, h: 22, lotus: true },
  { x: 1040, y: 334, w: 186, h: 24, mermaid: true, lotus: true },
  { x: 1290, y: 366, w: 164, h: 22 },
  { x: 1520, y: 328, w: 164, h: 22 },
  { x: 1750, y: 360, w: 164, h: 22, lotus: true },
  { x: 1970, y: 310, w: 270, h: 26, gugu: true },
];

const ROSTER = [
  { id: "mermaid", name: "Mermaid", element: "water", src: "assets/characters/mermaid.png", cols: 4, rows: 1, col: 1, row: 0, label: true },
  { id: "sea-queen", name: "Sea queen", element: "water", src: "assets/characters/sea-queen.png", cols: 2, rows: 2, col: 0, row: 0 },
  { id: "sky-queen", name: "Sky queen", element: "air", src: "assets/characters/sky-queen.png", cols: 2, rows: 2, col: 0, row: 0 },
  { id: "plant-queen", name: "Plant queen", element: "plant", src: "assets/characters/plant-queen.png", cols: 4, rows: 1, col: 0, row: 0, label: true },
  { id: "dancing-queen", name: "Dancing queen", element: "air", src: "assets/characters/dancing-queen.png", cols: 3, rows: 2, col: 2, row: 0, label: true },
  { id: "teddy", name: "Teddy", element: "plant", src: "assets/characters/teddy.png", cols: 4, rows: 2, col: 0, row: 0, label: true },
];

const stage = document.getElementById("stage");
const ctx = stage.getContext("2d");

const keys = { left: false, right: false };
const images = {};
const sprites = {};

let team = [];
let player = null;
let mermaid = null;
let gugu = null;
let camX = 0;
let state = "title";
let joined = false;
let guguDown = false;
let lastPad = PADS[0];
let bannerTimer = 0;
let showTimer = 0;
let jumpBuffer = 0;
let jumpHeld = false;
let splashes = [];
let time = 0;
let won = false;

function $(id) {
  return document.getElementById(id);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function isPaper(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx > 232 && mx - mn < 22;
}

function chromaAndTrim(canvas) {
  const cctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const data = cctx.getImageData(0, 0, width, height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (isPaper(d[i], d[i + 1], d[i + 2])) d[i + 3] = 0;
  }
  cctx.putImageData(data, 0, 0);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (d[(y * width + x) * 4 + 3] > 16) {
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

function cutCell(img, cols, col, rows, row, label) {
  const cellW = img.width / cols;
  const rowH = img.height / rows;
  const insetX = cellW * 0.02;
  const y0 = rowH * row + rowH * 0.04;
  const cellH = rowH * (label ? 0.78 : 0.9);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.floor(cellW - insetX * 2));
  c.height = Math.max(1, Math.floor(cellH));
  const cctx = c.getContext("2d");
  cctx.drawImage(img, cellW * col + insetX, y0, c.width, cellH, 0, 0, c.width, c.height);
  if (label) cctx.clearRect(0, c.height * 0.76, c.width, c.height * 0.24);
  return chromaAndTrim(c);
}

function cutProp(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d").drawImage(img, 0, 0);
  return chromaAndTrim(c);
}

function viewScale() {
  return window.innerHeight / H;
}

function viewWorldWidth() {
  return window.innerWidth / viewScale();
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  stage.width = Math.floor(window.innerWidth * dpr);
  stage.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function who(id) {
  return ROSTER.find((r) => r.id === id);
}

function hint(text) {
  $("hint").textContent = text;
}

function showBanner(text, seconds) {
  const el = $("banner");
  el.textContent = text;
  el.classList.remove("hidden");
  bannerTimer = seconds;
}

function hide(id) {
  $(id).classList.add("hidden");
}

function show(id) {
  $(id).classList.remove("hidden");
}

function renderLives() {
  const box = $("lives");
  box.replaceChildren();
  team.forEach((id, n) => {
    const img = document.createElement("img");
    img.src = sprites[id].toDataURL();
    img.alt = n === 0 ? `${who(id).name}, you` : `${who(id).name}, life`;
    if (n === 0) img.classList.add("you");
    box.appendChild(img);
  });
}

function refreshRoster() {
  document.querySelectorAll(".card").forEach((card) => {
    const order = team.indexOf(card.dataset.id);
    card.classList.toggle("picked", order >= 0);
    const role = card.querySelector(".role");
    role.textContent = order === 0 ? "You jump" : order > 0 ? "Extra life" : "";
  });
  $("btn-pond").disabled = team.length !== 3;
}

function buildRoster() {
  const box = $("roster");
  box.replaceChildren();
  ROSTER.forEach((r) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.dataset.id = r.id;
    const img = document.createElement("img");
    img.src = sprites[r.id].toDataURL();
    img.alt = "";
    const name = document.createElement("span");
    name.className = "who";
    name.textContent = `${r.name} · ${r.element}`;
    const role = document.createElement("span");
    role.className = "role";
    b.append(img, name, role);
    b.addEventListener("click", () => togglePick(r.id));
    box.appendChild(b);
  });
}

function togglePick(id) {
  const i = team.indexOf(id);
  if (i >= 0) team.splice(i, 1);
  else if (team.length < 3) team.push(id);
  refreshRoster();
}

function spawnPlayer() {
  const lead = who(team[0]);
  const bank = PADS[0];
  player = {
    x: 70,
    y: bank.y,
    w: 48,
    h: 78,
    vx: 0,
    vy: 0,
    onGround: true,
    coyote: 0,
    jumpCut: false,
    face: 1,
    squash: 1,
    sprite: sprites[lead.id],
    id: lead.id,
    safe: 0.35,
  };
  const mPad = PADS.find((p) => p.mermaid);
  mermaid = { x: mPad.x + mPad.w * 0.55, y: mPad.y, w: 54, h: 86 };
  const gPad = PADS.find((p) => p.gugu);
  gugu = {
    x: gPad.x + 40,
    y: gPad.y,
    w: 70,
    h: 78,
    vx: 78,
    pad: gPad,
  };
  joined = false;
  guguDown = false;
  lastPad = bank;
  camX = 0;
  splashes = [];
  jumpBuffer = 0;
}

function startPond() {
  spawnPlayer();
  state = "play";
  won = false;
  hide("screen-pick");
  show("hud");
  hide("finish");
  hide("banner");
  $("touch").classList.add("play-touch");
  renderLives();
  hint("Jump the pads. Don’t fall in.");
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function bodyBox(actor) {
  return { x: actor.x - actor.w / 2, y: actor.y - actor.h, w: actor.w, h: actor.h };
}

function tryJump() {
  if (!player.onGround && player.coyote <= 0) return;
  player.vy = JUMP_V;
  player.onGround = false;
  player.coyote = 0;
  player.jumpCut = false;
  player.squash = 1.14;
  jumpBuffer = 0;
}

function splashBurst(x) {
  for (let i = 0; i < 10; i++) {
    splashes.push({
      x: x + (Math.random() - 0.5) * 36,
      y: WATER_Y,
      vx: (Math.random() - 0.5) * 140,
      vy: -80 - Math.random() * 160,
      life: 0.45 + Math.random() * 0.25,
    });
  }
}

function splash() {
  if (player.safe > 0) return;
  splashBurst(player.x);
  if (team.length <= 1) {
    endGame(false);
    return;
  }
  team.pop();
  player.x = lastPad.x + lastPad.w * 0.45;
  player.y = lastPad.y - 4;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.safe = 0.45;
  renderLives();
  showBanner("Splash!", 0.9);
  hint("A friend fainted. Jump from the last pad.");
}

function beatGugu() {
  if (guguDown) return;
  guguDown = true;
  player.vy = -460;
  hide("fight");
  showBanner("Gugu down!", 1.1);
  showTimer = 1.15;
}

function cast(element) {
  if (state !== "play" || guguDown) return;
  const near = Math.abs(player.x - gugu.x) < 170 && Math.abs(player.y - gugu.y) < 120;
  if (!near) return;
  if (element === "water") {
    beatGugu();
    return;
  }
  player.vx = player.x < gugu.x ? -340 : 340;
  player.vy = -280;
  player.onGround = false;
  showBanner("Not that one!", 0.7);
}

function endGame(didWin) {
  state = "end";
  won = didWin;
  hide("hud");
  hide("fight");
  hide("banner");
  $("touch").classList.remove("play-touch");
  const finish = $("finish");
  finish.classList.remove("hidden", "win", "lose");
  finish.classList.add(didWin ? "win" : "lose");
  $("end-title").textContent = didWin ? "The end!" : "Try again";
  $("end-text").textContent = didWin
    ? "The show is cancelled — mascara pen. Bubble bath and water guns instead!"
    : "The pond is full size. Jump the pads. Water beats Gugu.";
}

function physics(dt) {
  if (keys.left) player.vx -= RUN_ACCEL * dt;
  if (keys.right) player.vx += RUN_ACCEL * dt;
  if (!keys.left && !keys.right) player.vx *= Math.pow(0.78, dt * 60);
  player.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, player.vx));
  if (player.vx > 12) player.face = 1;
  if (player.vx < -12) player.face = -1;

  if (player.onGround) player.coyote = COYOTE;
  else player.coyote = Math.max(0, player.coyote - dt);
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  if (jumpBuffer > 0) tryJump();

  if (!jumpHeld && player.vy < -180 && !player.jumpCut) {
    player.vy *= 0.72;
    player.jumpCut = true;
  }
  if (player.onGround) player.jumpCut = false;

  if (!player.onGround) player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);
  const prevBottom = player.y;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = Math.max(36, Math.min(WORLD_W - 36, player.x));

  player.onGround = false;
  if (player.vy >= 0) {
    for (const pad of PADS) {
      const left = player.x - player.w * 0.28;
      const right = player.x + player.w * 0.28;
      const landed =
        prevBottom <= pad.y + 12 &&
        player.y >= pad.y &&
        right > pad.x + 8 &&
        left < pad.x + pad.w - 8;
      if (landed) {
        if (!player.onGround) player.squash = 0.78;
        player.y = pad.y;
        player.vy = 0;
        player.onGround = true;
        lastPad = pad;
      }
    }
  }

  player.squash += (1 - player.squash) * Math.min(1, dt * 10);
  player.safe = Math.max(0, player.safe - dt);

  if (!player.onGround && player.y > WATER_Y) {
    splash();
    if (state !== "play") return;
  }

  const mBox = { x: mermaid.x - 36, y: mermaid.y - 90, w: 72, h: 90 };
  if (!joined && overlaps(bodyBox(player), mBox)) {
    joined = true;
    if (!team.includes("mermaid")) {
      team.push("mermaid");
      renderLives();
    }
    showBanner("YAY! Join our team!", 1.5);
    hint("Gugu is ahead. He is fire. Water, or jump on his head.");
  }

  if (!guguDown) {
    gugu.x += gugu.vx * dt;
    const minX = gugu.pad.x + 46;
    const maxX = gugu.pad.x + gugu.pad.w - 46;
    if (gugu.x < minX || gugu.x > maxX) gugu.vx *= -1;
    gugu.x = Math.max(minX, Math.min(maxX, gugu.x));
    gugu.y = gugu.pad.y;
    const head =
      player.vy > 40 &&
      prevBottom < gugu.y - gugu.h + 28 &&
      player.y >= gugu.y - gugu.h + 10 &&
      Math.abs(player.x - gugu.x) < 48;
    if (head) beatGugu();
  }

  const nearGugu =
    !guguDown && Math.abs(player.x - gugu.x) < 160 && Math.abs(player.y - gugu.y) < 110;
  $("fight").classList.toggle("hidden", !nearGugu);

  if (guguDown) {
    showTimer -= dt;
    if (showTimer <= 0) beginShow();
  }
}

function beginShow() {
  state = "show";
  showTimer = 2.5;
  hide("hud");
  hide("fight");
  $("touch").classList.remove("play-touch");
  showBanner("Cancelled! Mascara pen.", 2.5);
}

function stepSplashes(dt) {
  splashes.forEach((p) => {
    p.life -= dt;
    p.vy += 700 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  });
  splashes = splashes.filter((p) => p.life > 0);
}

function followCamera(dt) {
  const viewW = viewWorldWidth();
  const look = player.face * 70;
  const target = player.x - viewW * 0.38 + look;
  const max = Math.max(0, WORLD_W - viewW);
  const clamped = Math.max(0, Math.min(max, target));
  camX += (clamped - camX) * Math.min(1, dt * 5);
}

function drawCover(img, parallax) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / img.width, vh / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const shift = parallax % dw;
  const y = (vh - dh) / 2;
  for (let x = -shift - dw; x < vw + dw; x += dw) {
    ctx.drawImage(img, x, y, dw, dh);
  }
}

function drawSpriteFeet(canvas, worldX, feetY, height, flip, squash = 1) {
  if (!canvas) return;
  const s = viewScale();
  const h = height * s * squash;
  const w = height * (canvas.width / canvas.height) * s * (1 / squash);
  const x = (worldX - camX) * s;
  const y = feetY * s;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(canvas, -w / 2, -h, w, h);
  ctx.restore();
}

function drawPond() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const s = viewScale();
  drawCover(images.pond, camX * 0.22);

  const waterTop = WATER_Y * s;
  const grad = ctx.createLinearGradient(0, waterTop - 30, 0, vh);
  grad.addColorStop(0, "rgba(125, 196, 214, 0)");
  grad.addColorStop(0.25, "rgba(110, 186, 210, 0.28)");
  grad.addColorStop(1, "rgba(64, 140, 176, 0.45)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, waterTop - 20, vw, vh);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const y = waterTop + 18 + i * 22;
    for (let x = 0; x <= vw; x += 8) {
      const wave = Math.sin(x * 0.03 + time * 2.2 + i) * 3;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawPads() {
  const s = viewScale();
  for (const pad of PADS) {
    const x = (pad.x - camX) * s;
    const y = pad.y * s;
    const w = pad.w * s;
    if (pad.bank) {
      const hill = 56 * s;
      ctx.fillStyle = "#b7d98a";
      ctx.strokeStyle = "#2a221c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y + hill);
      ctx.quadraticCurveTo(x + 10, y + 6, x + 28, y);
      ctx.lineTo(x + w - 28, y);
      ctx.quadraticCurveTo(x + w - 10, y + 6, x + w, y + hill);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      for (let i = 22; i < w - 16; i += 16) {
        ctx.moveTo(x + i, y + 1);
        ctx.lineTo(x + i - 4, y - 11);
        ctx.moveTo(x + i, y + 1);
        ctx.lineTo(x + i + 5, y - 13);
      }
      ctx.stroke();
    } else {
      const lily = sprites.lily;
      const lw = w + 18;
      const lh = lw * 0.58;
      ctx.drawImage(lily, x - 9, y - lh * 0.16, lw, lh);
    }
    if (pad.lotus) {
      const lotus = sprites.lotus;
      const lh = 70 * s;
      const lw = lh * (lotus.width / lotus.height);
      ctx.drawImage(lotus, x + w * 0.62 - lw / 2, y - lh * 0.78, lw, lh);
    }
  }
}

function drawActors() {
  if (mermaid && !team.includes("mermaid")) {
    drawSpriteFeet(sprites.mermaid, mermaid.x, mermaid.y, 92, false);
  } else if (mermaid && joined) {
    drawSpriteFeet(sprites.mermaid, mermaid.x, mermaid.y, 92, false);
  }

  if (gugu && !guguDown) {
    const near = Math.abs(player.x - gugu.x) < 150;
    const pose = near ? sprites.guguRoar : sprites.gugu;
    drawSpriteFeet(pose, gugu.x, gugu.y, 84, gugu.vx < 0);
  } else if (gugu && state === "play") {
    drawSpriteFeet(sprites.guguFly, gugu.x, gugu.y - 24, 76, true, 0.9);
  }

  team.slice(1).forEach((id, i) => {
    const bob = Math.sin(time * 6 + i) * 4;
    const sx = player.x - 46 - i * 34;
    const sy = player.onGround ? player.y + bob : player.y + 10;
    ctx.save();
    ctx.globalAlpha = 0.92;
    drawSpriteFeet(sprites[id], sx, sy, 52, false);
    ctx.restore();
  });

  const shadowW = 28 * viewScale() * (player.onGround ? 1 : 0.7);
  ctx.save();
  ctx.fillStyle = "rgba(42, 34, 28, 0.18)";
  ctx.beginPath();
  ctx.ellipse((player.x - camX) * viewScale(), player.y * viewScale() + 4, shadowW, shadowW * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const stretch = player.vy < -80 ? 1.08 : player.squash;
  drawSpriteFeet(player.sprite, player.x, player.y, 84, player.face < 0, stretch);
}

function drawSplashes() {
  const s = viewScale();
  splashes.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = "#8fd4ea";
    ctx.beginPath();
    ctx.arc((p.x - camX) * s, p.y * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawLineup(groundY, height) {
  const ids = team.slice();
  const gap = 78;
  const start = window.innerWidth / 2 - ((ids.length - 1) * gap * viewScale()) / 2;
  ids.forEach((id, i) => {
    const screenX = start + i * gap * viewScale();
    const worldX = screenX / viewScale() + camX;
    drawSpriteFeet(sprites[id], worldX, groundY, height, false, 0.92);
  });
}

function drawShow() {
  camX = 0;
  drawCover(images.stage, 0);
  drawSpriteFeet(sprites.director, viewWorldWidth() * 0.72, 430, 210, false);
  drawLineup(460, 120);
}

function drawEnd() {
  camX = 0;
  if (won) {
    drawCover(images.bath, 0);
    drawLineup(400, 110);
  } else {
    drawPond();
    drawPads();
  }
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (state === "show") {
    drawShow();
    return;
  }
  if (state === "end") {
    drawEnd();
    return;
  }
  drawPond();
  if (state === "play" || player) drawPads();
  if (state === "play" && player) {
    drawActors();
    drawSplashes();
  }
}

function frame(now) {
  const dt = Math.min(0.033, (now - (frame.last || now)) / 1000);
  frame.last = now;
  time += dt;

  if (state === "play" && player) {
    physics(dt);
    followCamera(dt);
    stepSplashes(dt);
  } else if (state === "show") {
    showTimer -= dt;
    if (showTimer <= 0) endGame(true);
  }

  if (bannerTimer > 0) {
    bannerTimer -= dt;
    if (bannerTimer <= 0) hide("banner");
  }
  render();
  requestAnimationFrame(frame);
}

function resetToPick() {
  team = [];
  player = null;
  state = "pick";
  won = false;
  hide("finish");
  hide("hud");
  hide("banner");
  hide("fight");
  $("touch").classList.remove("play-touch");
  show("screen-pick");
  refreshRoster();
}

function useCoarsePointer() {
  const coarse = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  document.body.classList.toggle("coarse", coarse);
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  useCoarsePointer();

  const jobs = [
    loadImage("assets/backgrounds/full-pond.png").then((img) => (images.pond = img)),
    loadImage("assets/backgrounds/bubble-bath.png").then((img) => (images.bath = img)),
    loadImage("assets/backgrounds/stage.png").then((img) => (images.stage = img)),
    loadImage("assets/elements/lily-pad.png").then((img) => (images.lily = img)),
    loadImage("assets/elements/lotus.png").then((img) => (images.lotus = img)),
    loadImage("assets/characters/gugu.png").then((img) => (images.gugu = img)),
    loadImage("assets/characters/star-director.png").then((img) => (images.director = img)),
  ];
  for (const r of ROSTER) {
    jobs.push(loadImage(r.src).then((img) => (images[r.id] = img)));
  }
  await Promise.all(jobs);

  sprites.lily = cutProp(images.lily);
  sprites.lotus = cutProp(images.lotus);
  sprites.director = cutProp(images.director);
  sprites.gugu = cutCell(images.gugu, 4, 0, 1, 0, true);
  sprites.guguFly = cutCell(images.gugu, 4, 1, 1, 0, true);
  sprites.guguRoar = cutCell(images.gugu, 4, 2, 1, 0, true);
  ROSTER.forEach((r) => {
    sprites[r.id] = cutCell(images[r.id], r.cols, r.col, r.rows, r.row, r.label);
    if (r.id === "mermaid") sprites.mermaid = sprites[r.id];
  });

  buildRoster();
  hide("loading");
  requestAnimationFrame(frame);
}

function pressJump() {
  if (!jumpHeld) {
    jumpHeld = true;
    jumpBuffer = JUMP_BUFFER;
  }
}

function releaseJump() {
  jumpHeld = false;
}

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    pressJump();
    e.preventDefault();
  }
  if (state === "play" && !e.repeat) {
    if (e.code === "Digit1") cast("air");
    if (e.code === "Digit2") cast("water");
    if (e.code === "Digit3") cast("plant");
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") releaseJump();
});

function hold(btn, down, up) {
  const on = (e) => {
    e.preventDefault();
    btn.setPointerCapture(e.pointerId);
    down();
  };
  const off = (e) => {
    e.preventDefault();
    up();
  };
  btn.addEventListener("pointerdown", on);
  btn.addEventListener("pointerup", off);
  btn.addEventListener("pointercancel", off);
}

hold($("t-left"), () => (keys.left = true), () => (keys.left = false));
hold($("t-right"), () => (keys.right = true), () => (keys.right = false));
hold($("t-jump"), pressJump, releaseJump);

document.querySelectorAll("#fight button").forEach((b) => {
  b.addEventListener("click", () => cast(b.dataset.el));
});

$("btn-start").addEventListener("click", () => {
  hide("screen-title");
  show("screen-pick");
  state = "pick";
});

$("btn-pond").addEventListener("click", startPond);
$("btn-again").addEventListener("click", resetToPick);

boot().catch((err) => {
  $("loading").textContent = "Could not load Queen Team-Up art.";
  console.error(err);
});
