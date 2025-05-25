export function applyKernelFilter(image, kernel) {
  const width = image.width;
  const height = image.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);

  const kSize = Math.sqrt(kernel.length);
  const half = Math.floor(kSize / 2);

  const padded = ctx.createImageData(width + 2 * half, height + 2 * half);

  for (let y = 0; y < height + 2 * half; y++) {
    for (let x = 0; x < width + 2 * half; x++) {
      const px = Math.min(width - 1, Math.max(0, x - half));
      const py = Math.min(height - 1, Math.max(0, y - half));
      const srcIdx = (py * width + px) * 4;
      const dstIdx = (y * (width + 2 * half) + x) * 4;
      for (let c = 0; c < 4; c++) {
        padded.data[dstIdx + c] = srcData.data[srcIdx + c];
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const ix = x + kx;
          const iy = y + ky;
          const idx = (iy * (width + 2 * half) + ix) * 4;
          const kVal = kernel[ky * kSize + kx];
          r += padded.data[idx] * kVal;
          g += padded.data[idx + 1] * kVal;
          b += padded.data[idx + 2] * kVal;
        }
      }
      const i = (y * width + x) * 4;
      dstData.data[i] = Math.min(255, Math.max(0, r));
      dstData.data[i + 1] = Math.min(255, Math.max(0, g));
      dstData.data[i + 2] = Math.min(255, Math.max(0, b));
      dstData.data[i + 3] = srcData.data[i + 3]; 
    }
  }

  ctx.putImageData(dstData, 0, 0);

  return new Promise((resolve) => {
    const out = new Image();
    out.onload = () => resolve(out);
    out.src = canvas.toDataURL();
  });
}
