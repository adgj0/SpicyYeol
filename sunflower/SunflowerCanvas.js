function createSunflowerCanvas(stage, moodIdx, size) {
  const canvas = document.createElement("canvas");
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  drawSunflower(ctx, size / 2, size / 2, stage, moodIdx, size * 0.42);
  return canvas;
}

function refreshCanvas(canvas, stage, moodIdx) {
  const size = canvas.width;
  const ctx  = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  drawSunflower(ctx, size / 2, size / 2, stage, moodIdx, size * 0.42);
}
