function drawSplashes(s) {
  splashes.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = "#8fd4ea";
    ctx.beginPath();
    ctx.arc((p.x - camX) * s, p.y * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}
