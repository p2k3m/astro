const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Darbhanga 1982-07-12 03:50 positions', async () => {
  const res = await computePositions('1982-07-12T03:50+05:30', 26.15216, 85.89707);
  assert.strictEqual(res.ascSign, 2);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.moon.house, 9);
});
