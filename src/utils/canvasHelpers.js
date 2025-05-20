export function pickColorAtCursor(canvas, event, imageWidth, imageHeight, zoom, offsetX, offsetY) {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  const scale = zoom / 100;
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const centerX = (canvas.width - drawWidth) / 2 + offsetX;
  const centerY = (canvas.height - drawHeight) / 2 + offsetY;

  const imgX = Math.floor((clickX - centerX) / scale);
  const imgY = Math.floor((clickY - centerY) / scale);

  if (imgX < 0 || imgY < 0 || imgX >= imageWidth || imgY >= imageHeight) return null;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const pixel = ctx.getImageData(clickX, clickY, 1, 1).data;

  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2],
    a: pixel[3],
    x: imgX,
    y: imgY,
  };
}
