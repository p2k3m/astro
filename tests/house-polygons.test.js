const test = require('node:test');
const assert = require('node:assert');
const { HOUSE_POLYGONS } = require('../src/lib/astro.js');

test('HOUSE_POLYGONS lists fixed paths for the twelve houses', () => {
  assert.strictEqual(HOUSE_POLYGONS.length, 12);
  const expected = [
    'M50 0 L25 25 L50 50 L75 25 Z',
    'M50 0 L0 50 L25 25 Z',
    'M25 25 L50 50 L0 50 Z',
    'M0 50 L25 25 L50 50 L25 75 Z',
    'M0 50 L25 75 L50 100 Z',
    'M25 75 L50 50 L50 100 Z',
    'M50 100 L75 75 L50 50 L25 75 Z',
    'M50 100 L100 50 L75 75 Z',
    'M75 75 L50 50 L100 50 Z',
    'M100 50 L75 25 L50 50 L75 75 Z',
    'M100 50 L50 0 L75 25 Z',
    'M75 25 L50 50 L50 0 Z',
  ];
  assert.deepStrictEqual(
    HOUSE_POLYGONS.map((p) => p.d),
    expected
  );
});
