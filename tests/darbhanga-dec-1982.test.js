import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 positions', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(res.ascSign, 7);
  assert.strictEqual(res.ascendant.deg, 12);
  assert.strictEqual(res.ascendant.min, 17);
  assert.strictEqual(res.ascendant.sec, 6);
  assert.strictEqual(res.ascendant.nakshatra, 'Swati');
  assert.strictEqual(res.ascendant.pada, 2);
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
    rahu: true,
    ketu: true,
  };
  for (const [name, retro] of Object.entries(expectedRetro)) {
    assert.strictEqual(planets[name].retro, retro, `${name} retrograde`);
  }

  const expectedDMS = {
    sun: { deg: 14, min: 46, sec: 26 },
    moon: { deg: 13, min: 36, sec: 55 },
    mercury: { deg: 20, min: 59, sec: 47 },
    venus: { deg: 21, min: 25, sec: 6 },
    mars: { deg: 29, min: 9, sec: 19 },
    jupiter: { deg: 1, min: 4, sec: 30 },
    saturn: { deg: 6, min: 32, sec: 36 },
    uranus: { deg: 11, min: 29, sec: 15 },
    neptune: { deg: 2, min: 28, sec: 11 },
    pluto: { deg: 4, min: 48, sec: 32 },
    rahu: { deg: 11, min: 53, sec: 16 },
    ketu: { deg: 11, min: 53, sec: 16 },
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
