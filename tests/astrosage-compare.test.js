const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 matches AstroSage', async () => {
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(am.ascSign, 7);

  const planets = Object.fromEntries(am.planets.map((p) => [p.name, p]));
  const expected = {
    sun: 2,
    moon: 8,
    mars: 6,
    mercury: 7,
    jupiter: 2,
    venus: 7,
    saturn: 1,
    rahu: 9,
    ketu: 3,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});

test('Darbhanga 1982-12-01 15:50 matches AstroSage', async () => {
  const pm = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897);
  assert.strictEqual(pm.ascSign, 2);

  const planets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  const expected = {
    sun: 7,
    moon: 1,
    mars: 11,
    mercury: 12,
    jupiter: 7,
    venus: 12,
    saturn: 6,
    rahu: 2,
    ketu: 8,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});
