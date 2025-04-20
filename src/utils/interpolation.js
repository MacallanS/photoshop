export function nearestNeighborResize(imageData, newWidth, newHeight) {
  const src = imageData;
  const dst = new ImageData(newWidth, newHeight);

  const xRatio = src.width / newWidth;
  const yRatio = src.height / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);

      const srcIndex = (srcY * src.width + srcX) * 4;
      const dstIndex = (y * newWidth + x) * 4;

      for (let i = 0; i < 4; i++) {
        dst.data[dstIndex + i] = src.data[srcIndex + i];
      }
    }
  }

  return dst;
}

export function bilinearResize(imageData, newWidth, newHeight) {
  const src = imageData;
  const dst = new ImageData(newWidth, newHeight);

  const xRatio = src.width / newWidth;
  const yRatio = src.height / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const gx = x * xRatio;
      const gy = y * yRatio;

      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const x1 = Math.min(x0 + 1, src.width - 1);
      const y1 = Math.min(y0 + 1, src.height - 1);

      const dx = gx - x0;
      const dy = gy - y0;

      const i00 = (y0 * src.width + x0) * 4;
      const i10 = (y0 * src.width + x1) * 4;
      const i01 = (y1 * src.width + x0) * 4;
      const i11 = (y1 * src.width + x1) * 4;

      const dstIndex = (y * newWidth + x) * 4;

      for (let i = 0; i < 4; i++) {
        const top = src.data[i00 + i] * (1 - dx) + src.data[i10 + i] * dx;
        const bottom = src.data[i01 + i] * (1 - dx) + src.data[i11 + i] * dx;
        dst.data[dstIndex + i] = top * (1 - dy) + bottom * dy;
      }
    }
  }

  return dst;
}
