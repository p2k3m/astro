const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 matches AstroSage', async () => {
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(am.ascSign, 0);
  const planets = Object.fromEntries(am.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.sun.house, 8);
  assert.strictEqual(planets.moon.house, 2);
});

test('Darbhanga 1982-12-01 15:50 matches AstroSage', async () => {
  const pm = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897);
  assert.strictEqual(pm.ascSign, 6);
  const planets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.sun.house, 2);
  assert.strictEqual(planets.moon.house, 8);
});
