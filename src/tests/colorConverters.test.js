const { rgbToXyz, xyzToLab, labToOklch, getContrast } = require('../utils/colorConverters');

const EPSILON = 0.5; // Допустимая ошибка для сравнения

function closeEnough(received, expected) {
  return Math.abs(received - expected) < EPSILON;
}

test('rgbToXyz конвертирует красный цвет', () => {
  const result = rgbToXyz({ r: 255, g: 0, b: 0 });
  expect(closeEnough(result.x, 41.24)).toBe(true);  // 0.4124 * 100
  expect(closeEnough(result.y, 21.26)).toBe(true);  // 0.2126 * 100
  expect(closeEnough(result.z, 1.93)).toBe(true);   // 0.0193 * 100
});

test('xyzToLab конвертирует XYZ в Lab', () => {
  const result = xyzToLab({ x: 41.24, y: 21.26, z: 1.93 });
  expect(closeEnough(result.l, 53.23)).toBe(true);
  expect(closeEnough(result.a, 80.10)).toBe(true);
  expect(closeEnough(result.b, 67.22)).toBe(true);
});

test('labToOklch конвертирует Lab в Oklch', () => {
  const result = labToOklch({ l: 53.24, a: 80.09, b: 67.20 });
  expect(typeof result.l).toBe('number');
  expect(typeof result.c).toBe('number');
  expect(typeof result.h).toBe('number');
  expect(result.h).toBeGreaterThanOrEqual(-180);
  expect(result.h).toBeLessThanOrEqual(180);
});

test('getContrast считает контраст', () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  const contrast = getContrast(black, white);
  expect(closeEnough(contrast, 21)).toBe(true); // Контраст черного и белого около 21
});
