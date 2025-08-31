const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 positions', async () => {
  const res = await computePositions('1982-12-01T03:50+05:30', 26.15216, 85.89707);
  assert.strictEqual(res.ascSign, 7);
  assert.deepStrictEqual(
    res.signInHouse.slice(1),
    [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
  );
  assert.strictEqual(res.signInHouse[1], res.ascSign);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const expected = {
    sun: 2,
    moon: 8,
    mercury: 8,
    venus: 7,
    mars: 6,
    jupiter: 2,
    saturn: 1,
    rahu: 9,
    ketu: 3,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }

  const expectedRetro = {
    sun: false,
    moon: false,
    mars: false,
    venus: false,
    mercury: true,
    jupiter: true,
    saturn: true,
    rahu: true,
    ketu: true,
  };
  for (const [name, retro] of Object.entries(expectedRetro)) {
    assert.strictEqual(planets[name].retro, retro, `${name} retrograde`);
  }
});
