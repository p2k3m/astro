import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 positions', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.15216, 85.89707);
  assert.strictEqual(res.ascSign, 7);
  assert.deepStrictEqual(
    res.signInHouse.slice(1),
    [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
  );
  assert.strictEqual(res.signInHouse[1], res.ascSign);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.saturn.sign, 7, 'saturn sign');
  const expected = {
    sun: 2,
    moon: 8,
    mercury: 2,
    venus: 2,
    mars: 3,
    jupiter: 2,
    saturn: 1,
    uranus: 2,
    neptune: 3,
    pluto: 1,
    rahu: 8,
    ketu: 2,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }

  const expectedRetro = {
    sun: false,
    moon: false,
    mars: false,
    venus: false,
    mercury: false,
    jupiter: false,
    saturn: false,
    uranus: false,
    neptune: false,
    pluto: false,
    rahu: false,
    ketu: false,
  };
  for (const [name, retro] of Object.entries(expectedRetro)) {
    assert.strictEqual(planets[name].retro, retro, `${name} retrograde`);
  }

  const expectedDMS = {
    sun: { deg: 14, min: 46, sec: 24 },
    moon: { deg: 13, min: 36, sec: 20 },
    mercury: { deg: 20, min: 59, sec: 43 },
    venus: { deg: 21, min: 25, sec: 3 },
    mars: { deg: 29, min: 9, sec: 17 },
    jupiter: { deg: 1, min: 4, sec: 29 },
    saturn: { deg: 6, min: 32, sec: 35 },
    uranus: { deg: 11, min: 29, sec: 15 },
    neptune: { deg: 2, min: 28, sec: 10 },
    pluto: { deg: 4, min: 48, sec: 32 },
    rahu: { deg: 13, min: 36, sec: 20 },
    ketu: { deg: 13, min: 36, sec: 20 },
  };
  for (const [name, exp] of Object.entries(expectedDMS)) {
    const p = planets[name];
    assert.strictEqual(p.deg, exp.deg, `${name} deg`);
    assert.strictEqual(p.min, exp.min, `${name} min`);
    assert.strictEqual(p.sec, exp.sec, `${name} sec`);
  }

  const firstHouse = ['pluto'];
  for (const name of firstHouse) {
    const p = planets[name];
    const exp = expectedDMS[name];
    assert.strictEqual(p.house, 1, `${name} 1st house`);
    assert.strictEqual(p.deg, exp.deg, `${name} deg`);
    assert.strictEqual(p.min, exp.min, `${name} min`);
    assert.strictEqual(p.sec, exp.sec, `${name} sec`);
  }
});
