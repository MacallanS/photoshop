export function downloadImage(image, format = 'png') {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataURL = canvas.toDataURL(mime);

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `image.${format}`;
  link.click();
}

export function downloadGb7(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, image.width, image.height);

  const buffer = new ArrayBuffer(4 + 4 + 4 + imgData.data.length);
  const view = new DataView(buffer);

  view.setUint32(0, image.width, true);
  view.setUint32(4, image.height, true);
  view.setUint32(8, 8, true); // depth = 8

  const data = new Uint8Array(buffer, 12);
  data.set(imgData.data);

  const blob = new Blob([buffer], { type: 'application/octet-stream' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'image.gb7';
  link.click();
}
