const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 signInHouse sequence', async () => {
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const expected = [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  assert.deepStrictEqual(result.signInHouse, expected);
});
