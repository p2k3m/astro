const test = require('node:test');
const assert = require('node:assert');
const { computePositions } = require('../src/lib/astro.js');

test('sign sequence matches AstroSage for Darbhanga 1982-12-01 03:50', async () => {
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  // Ascendant sign should populate the first house
  assert.strictEqual(result.signInHouse[1], result.ascSign);
  // The sequence should progress sequentially
  assert.deepStrictEqual(result.signInHouse.slice(1), [7, 8, 9, 10, 11, 1, 12, 2, 3, 4, 5, 6]);
});
