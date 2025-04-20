export function parseGB7(buffer) {
  const bytes = new Uint8Array(buffer);
  const signature = String.fromCharCode(...bytes.slice(0, 4));
  if (signature !== "GB7\u001D") throw new Error("Invalid signature");

  const mask = bytes[5] !== 0;
  const width = (bytes[6] << 8) | bytes[7];
  const height = (bytes[8] << 8) | bytes[9];
  const pixelData = bytes.slice(12);

  if (pixelData.length !== width * height)
    throw new Error("Data length mismatch");

  const imgData = new ImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < width * height; i++) {
    const byte = pixelData[i];
    const gray7 = Math.floor(((byte & 0b01111111) / 127) * 255);
    const alpha = mask ? (byte >> 7) * 255 : 255;

    const j = i * 4;
    data[j] = gray7;
    data[j + 1] = gray7;
    data[j + 2] = gray7;
    data[j + 3] = alpha;
  }

  return { width, height, imgData, mask };
}
