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

  const expectedDMS = {
    sun: { deg: 14, min: 46, sec: 28 },
    moon: { deg: 13, min: 16, sec: 59 },
    mercury: { deg: 29, min: 13, sec: 15 },
    venus: { deg: 10, min: 2, sec: 30 },
    mars: { deg: 8, min: 19, sec: 13 },
    jupiter: { deg: 25, min: 3, sec: 25 },
    saturn: { deg: 29, min: 14, sec: 20 },
    rahu: { deg: 11, min: 53, sec: 18 },
    ketu: { deg: 11, min: 53, sec: 18 },
  };
  for (const [name, exp] of Object.entries(expectedDMS)) {
    const p = planets[name];
    assert.strictEqual(p.deg, exp.deg, `${name} deg`);
    assert.strictEqual(p.min, exp.min, `${name} min`);
    assert.strictEqual(p.sec, exp.sec, `${name} sec`);
  }
});
