import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 matches AstroSage', async () => {
  const { computePositions } = await astro;
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(am.ascSign, 9);
  assert.strictEqual(am.signInHouse[1], am.ascSign);
  assert.strictEqual(am.signInHouse[6], 2);
  assert.strictEqual(am.signInHouse[7], 3);

  const planets = Object.fromEntries(am.planets.map((p) => [p.name, p]));
  for (const p of Object.values(planets)) {
    for (const k of ['deg', 'min', 'sec']) {
      assert.strictEqual(typeof p[k], 'number', `${p.name} ${k}`);
    }
  }
  const expected = {
    sun: 12,
    moon: 6,
    mars: 4,
    mercury: 5,
    jupiter: 11,
    venus: 5,
    saturn: 10,
    rahu: 7,
    ketu: 1,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});

test('Darbhanga 1982-12-01 15:50 matches AstroSage', async () => {
  const { computePositions } = await astro;
  const pm = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897);
  assert.strictEqual(pm.ascSign, 3);
  assert.strictEqual(pm.signInHouse[1], pm.ascSign);
  assert.strictEqual(pm.signInHouse[6], 8);
  assert.strictEqual(pm.signInHouse[7], 9);

  const planets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  for (const p of Object.values(planets)) {
    for (const k of ['deg', 'min', 'sec']) {
      assert.strictEqual(typeof p[k], 'number', `${p.name} ${k}`);
    }
  }
  const expected = {
    sun: 6,
    moon: 12,
    mars: 10,
    mercury: 11,
    jupiter: 5,
    venus: 11,
    saturn: 4,
    rahu: 1,
    ketu: 7,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});

test('Darbhanga 1982-12-01 03:50 sign sequence matches AstroSage', async () => {
  const { computePositions } = await astro;
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const expected = [null, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepStrictEqual(am.signInHouse, expected);
});

test('Darbhanga 1982-12-01 03:50: Jupiter, Mercury, Venus in house 2; Jupiter direct', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  for (const name of ['jupiter', 'mercury', 'venus']) {
    assert.strictEqual(planets[name].house, 2, `${name} house`);
  }
  assert.ok(!planets.jupiter.retro, 'Jupiter should be direct');
});
