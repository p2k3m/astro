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
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const expected = {
    sun: 2,
    moon: 8,
    mercury: 7,
    venus: 7,
    mars: 3,
    jupiter: 2,
    saturn: 1,
    rahu: 9,
    ketu: 3,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }

  const direct = ['sun', 'moon', 'mars', 'venus', 'mercury', 'jupiter', 'saturn'];
  for (const name of direct) {
    assert.strictEqual(planets[name].retro, false, `${name} should be direct`);
  }
});
