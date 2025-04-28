export function clearAndDrawImageCentered(canvas, image, offsetX, offsetY, width, height) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = (canvas.width - width) / 2;
    const centerY = (canvas.height - height) / 2;
    ctx.drawImage(image, centerX + offsetX, centerY + offsetY, width, height);
  }
  
  export function pickColorAtCursor(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const pixel = ctx.getImageData(x, y, 1, 1).data;
  
    return {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      a: pixel[3],
      x: Math.round(x),
      y: Math.round(y),
    };
  }
  