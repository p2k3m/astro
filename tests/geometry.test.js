const test = require('node:test');
const assert = require('node:assert');
const { HOUSE_POLYGONS } = require('../src/lib/astro.js');

test('build house grid with 12 valid, non-overlapping cells', () => {
  const cells = HOUSE_POLYGONS;
  assert.strictEqual(cells.length, 12);

  const seen = new Set();
  cells.forEach((poly, idx) => {
    // ensure each vertex is finite and within bounds
    poly.forEach(([x, y]) => {
      assert.ok(Number.isFinite(x) && Number.isFinite(y), `cell ${idx} has invalid vertex`);
      assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `cell ${idx} vertex out of bounds`);
    });

    // ensure this polygon hasn't been seen before (non-overlapping)
    const key = poly.map(([x, y]) => `${x},${y}`).join(';');
    assert.ok(!seen.has(key), `cell ${idx} overlaps with another cell`);
    seen.add(key);
  });

  // TODO: extend with more adjacency checks
});
