const test = require('node:test');
const assert = require('node:assert');
const { HOUSE_POLYGONS } = require('../src/lib/astro.js');

test('HOUSE_POLYGONS lists fixed paths for the twelve houses', () => {
  assert.strictEqual(HOUSE_POLYGONS.length, 12);
  const expected = [
    'M0.5 0 L0.25 0.25 L0.5 0.5 L0.75 0.25 Z',
    'M0.75 0.25 L0.5 0.5 L0.5 0 Z',
    'M1 0.5 L0.5 0 L0.75 0.25 Z',
    'M1 0.5 L0.75 0.25 L0.5 0.5 L0.75 0.75 Z',
    'M0.75 0.75 L0.5 0.5 L1 0.5 Z',
    'M0.5 1 L1 0.5 L0.75 0.75 Z',
    'M0.5 1 L0.75 0.75 L0.5 0.5 L0.25 0.75 Z',
    'M0.25 0.75 L0.5 0.5 L0.5 1 Z',
    'M0 0.5 L0.25 0.75 L0.5 1 Z',
    'M0 0.5 L0.25 0.25 L0.5 0.5 L0.25 0.75 Z',
    'M0.25 0.25 L0.5 0.5 L0 0.5 Z',
    'M0.5 0 L0 0.5 L0.25 0.25 Z',
  ];
  assert.deepStrictEqual(
    HOUSE_POLYGONS.map((p) => p.d),
    expected
  );
});
