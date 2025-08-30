const test = require('node:test');
const assert = require('node:assert');
const { HOUSE_POLYGONS } = require('../src/lib/astro.js');

test('HOUSE_POLYGONS lists fixed paths for the twelve houses', () => {
  assert.strictEqual(HOUSE_POLYGONS.length, 12);
  const expected = [
    'M0 0 L0.5 0 L1 0 L1 0.5 L0.5 0.5 L0 0.5 Z',
    'M1 0 L0.5 0.5 L0.5 0 Z',
    'M1 0 L1 0.5 L0.5 0.5 Z',
    'M1 0 L1 0.5 L1 1 L0.5 1 L0.5 0.5 L0.5 0 Z',
    'M1 1 L0.5 0.5 L1 0.5 Z',
    'M1 1 L0.5 1 L0.5 0.5 Z',
    'M1 1 L0.5 1 L0 1 L0 0.5 L0.5 0.5 L1 0.5 Z',
    'M0 1 L0.5 0.5 L0.5 1 Z',
    'M0 1 L0 0.5 L0.5 0.5 Z',
    'M0 1 L0 0.5 L0 0 L0.5 0 L0.5 0.5 L0.5 1 Z',
    'M0 0 L0.5 0.5 L0 0.5 Z',
    'M0 0 L0.5 0 L0.5 0.5 Z',
  ];
  const pathFrom = (pts) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ') + ' Z';
  assert.deepStrictEqual(HOUSE_POLYGONS.map(pathFrom), expected);
});
