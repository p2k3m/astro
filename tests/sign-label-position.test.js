const assert = require('node:assert');
const test = require('node:test');
const { HOUSE_POLYGONS, polygonCentroid } = require('../src/lib/astro.js');

function closestCornerClass(cx, cy) {
  const EPS = 1e-9;
  let vert;
  if (cy < 0.5 - EPS) vert = 'bottom-0';
  else if (cy > 0.5 + EPS) vert = 'top-0';
  else vert = cx < 0.5 ? 'top-0' : 'bottom-0';

  let horiz;
  if (cx < 0.5 - EPS) horiz = 'right-0';
  else if (cx > 0.5 + EPS) horiz = 'left-0';
  else horiz = cy < 0.5 ? 'right-0' : 'left-0';

  return `${vert} ${horiz}`;
}

test('sign labels positioned at AstroSage corners', () => {
  const positions = HOUSE_POLYGONS.map((poly) => {
    const { cx, cy } = polygonCentroid(poly);
    return closestCornerClass(cx, cy);
  });
  const expected = [
    'bottom-0 right-0', // 1
    'bottom-0 right-0', // 2
    'top-0 right-0', // 3
    'top-0 right-0', // 4
    'top-0 right-0', // 5
    'top-0 left-0', // 6
    'top-0 left-0', // 7
    'top-0 left-0', // 8
    'bottom-0 left-0', // 9
    'bottom-0 left-0', // 10
    'bottom-0 left-0', // 11
    'bottom-0 right-0', // 12
  ];
  assert.deepStrictEqual(positions, expected);
});
