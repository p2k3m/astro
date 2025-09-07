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
    sun: 3,
    moon: 9,
    mercury: 3,
    venus: 3,
    mars: 4,
    jupiter: 2,
    saturn: 2,
    uranus: 3,
    neptune: 3,
    pluto: 1,
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
    sun: { deg: 8, min: 23, sec: 12 },
    moon: { deg: 7, min: 13, sec: 9 },
    mercury: { deg: 14, min: 36, sec: 31 },
    venus: { deg: 15, min: 1, sec: 51 },
    mars: { deg: 22, min: 46, sec: 5 },
    jupiter: { deg: 24, min: 41, sec: 18 },
    saturn: { deg: 0, min: 9, sec: 23 },
    uranus: { deg: 5, min: 6, sec: 3 },
    neptune: { deg: 26, min: 4, sec: 59 },
    pluto: { deg: 28, min: 25, sec: 21 },
    rahu: { deg: 7, min: 13, sec: 9 },
    ketu: { deg: 7, min: 13, sec: 9 },
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
