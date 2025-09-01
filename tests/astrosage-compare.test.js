const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 matches AstroSage', async () => {
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(am.ascSign, 7);
  assert.strictEqual(am.signInHouse[1], am.ascSign);
  assert.strictEqual(am.signInHouse[6], 12);
  assert.strictEqual(am.signInHouse[7], 1);

  const planets = Object.fromEntries(am.planets.map((p) => [p.name, p]));
  const expected = {
    sun: 2,
    moon: 8,
    mars: 2,
    mercury: 2,
    jupiter: 3,
    venus: 2,
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
  assert.strictEqual(pm.signInHouse[1], pm.ascSign);
  assert.strictEqual(pm.signInHouse[6], 7);
  assert.strictEqual(pm.signInHouse[7], 8);

  const planets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  const expected = {
    sun: 8,
    moon: 2,
    mars: 12,
    mercury: 1,
    jupiter: 7,
    venus: 1,
    saturn: 6,
    rahu: 3,
    ketu: 9,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});

test('Darbhanga 1982-12-01 03:50 sign sequence matches AstroSage', async () => {
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const expected = [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  assert.deepStrictEqual(am.signInHouse, expected);
});
