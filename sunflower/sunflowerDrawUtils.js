function drawFace(ctx, cx, cy, r, mood) {
  const eyeOff = r * 0.32;
  const eyeY   = cy - r * 0.12;

  ctx.fillStyle = "#FFF";
  ctx.beginPath(); ctx.arc(cx - eyeOff, eyeY, r * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + eyeOff, eyeY, r * 0.15, 0, Math.PI * 2); ctx.fill();

  if (mood === 3) {
    ctx.fillStyle = "#412402";
    ctx.beginPath(); ctx.ellipse(cx - eyeOff, eyeY, r * 0.1, r * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + eyeOff, eyeY, r * 0.1, r * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#412402"; ctx.lineWidth = r * 0.1; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy + r * 0.35); ctx.lineTo(cx + r * 0.3, cy + r * 0.35); ctx.stroke();
    ctx.strokeStyle = "rgba(64,147,200,0.7)"; ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.moveTo(cx - eyeOff, eyeY + r * 0.15); ctx.lineTo(cx - eyeOff + r * 0.05, eyeY + r * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + eyeOff, eyeY + r * 0.15); ctx.lineTo(cx + eyeOff + r * 0.05, eyeY + r * 0.4); ctx.stroke();
    return;
  }

  ctx.fillStyle = "#412402";
  const eyeW = mood === 0 ? r * 0.12 : r * 0.1;
  const eyeH = mood === 0 ? r * 0.15 : r * 0.12;
  ctx.beginPath(); ctx.ellipse(cx - eyeOff, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + eyeOff, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = "#412402"; ctx.lineWidth = r * 0.1; ctx.lineCap = "round";
  if (mood === 0) {
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.3, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.fillStyle = "#E24B4A";
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.28, r * 0.18, 0, Math.PI); ctx.fill();
  } else if (mood === 1) {
    ctx.beginPath(); ctx.moveTo(cx - r * 0.28, cy + r * 0.3); ctx.lineTo(cx + r * 0.28, cy + r * 0.3); ctx.stroke();
    ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.moveTo(cx - eyeOff - r * 0.12, eyeY - r * 0.22); ctx.lineTo(cx - eyeOff + r * 0.1, eyeY - r * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + eyeOff + r * 0.12, eyeY - r * 0.22); ctx.lineTo(cx + eyeOff - r * 0.1, eyeY - r * 0.1); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.22, r * 0.28, Math.PI + 0.2, -0.2); ctx.stroke();
    ctx.strokeStyle = "rgba(64,147,200,0.6)"; ctx.lineWidth = r * 0.1;
    ctx.beginPath(); ctx.moveTo(cx - eyeOff, eyeY + eyeH); ctx.lineTo(cx - eyeOff + r * 0.03, eyeY + r * 0.38); ctx.stroke();
  }
}

function drawFlowerHead(ctx, cx, cy, r, mood, stage) {
  if (stage === 3) {
    ctx.fillStyle = "#FAEEDA";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#EF9F27"; ctx.lineWidth = 1.5; ctx.stroke();
    drawFace(ctx, cx, cy, r * 0.7, mood);
    return;
  }
  const petalN = 12;
  for (let i = 0; i < petalN; i++) {
    const angle = (i / petalN) * Math.PI * 2;
    ctx.fillStyle = "#EF9F27";
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(angle) * r * 0.85, cy + Math.sin(angle) * r * 0.85, r * 0.28, r * 0.18, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#BA7517"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#633806";
  for (let i = 0; i < petalN * 2; i++) {
    const a = (i / (petalN * 2)) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.3, cy + Math.sin(a) * r * 0.3, r * 0.05, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#412402"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.fill();
  drawFace(ctx, cx, cy, r * 0.38, mood);
}

function drawSunflower(ctx, cx, cy, stage, mood, r) {
  if (stage === 0) {
    ctx.fillStyle = "#9E7A4A";
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r * 0.25, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#639922";
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.4, cy - r * 0.5, cx + r * 0.5, cy + r * 0.1, cx + r * 0.1, cy + r * 0.2);
    ctx.fill();
    drawFace(ctx, cx + r * 0.15, cy - r * 0.05, r * 0.22, mood);
    return;
  }
  ctx.strokeStyle = "#639922"; ctx.lineWidth = r * 0.12; ctx.lineCap = "round";
  const stemH = stage === 1 ? r * 0.5 : stage === 2 ? r * 0.8 : r;
  ctx.beginPath(); ctx.moveTo(cx, cy + r * 0.55); ctx.lineTo(cx, cy + r * 0.55 - stemH); ctx.stroke();
  ctx.fillStyle = "#97C459";
  if (stage >= 1) { ctx.beginPath(); ctx.ellipse(cx + r * 0.3, cy, r * 0.22, r * 0.14,  Math.PI * 0.3,  0, Math.PI * 2); ctx.fill(); }
  if (stage >= 2) { ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy, r * 0.22, r * 0.13, -Math.PI * 0.3, 0, Math.PI * 2); ctx.fill(); }
  const faceOffsets = [0, -r * 0.15, -r * 0.35, -r * 0.42, -r * 0.42];
  const headRadii   = [0,  r * 0.28,  r * 0.32,  r * 0.3,   r * 0.38];
  drawFlowerHead(ctx, cx, cy + faceOffsets[stage], headRadii[stage], mood, stage);
}
