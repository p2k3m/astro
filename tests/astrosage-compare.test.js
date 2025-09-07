import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';

const astro = import('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 matches AstroSage', async () => {
  const { computePositions } = await astro;
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  assert.strictEqual(am.ascSign, 7);
  assert.strictEqual(am.signInHouse[1], am.ascSign);
  assert.strictEqual(am.signInHouse[6], 12);
  assert.strictEqual(am.signInHouse[7], 1);

  const planets = Object.fromEntries(am.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.saturn.sign, 7, 'saturn sign');
  assert.ok(!planets.saturn.retro, 'saturn retro');
  for (const p of Object.values(planets)) {
    for (const k of ['deg', 'min', 'sec']) {
      assert.strictEqual(typeof p[k], 'number', `${p.name} ${k}`);
    }
  }
  const expected = {
    sun: 2,
    moon: 8,
    mars: 3,
    mercury: 2,
    jupiter: 2,
    venus: 2,
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
});

test('Darbhanga 1982-12-01 15:50 matches AstroSage', async () => {
  const { computePositions } = await astro;
  const pm = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
    assert.strictEqual(pm.ascSign, 1);
    assert.strictEqual(pm.signInHouse[1], pm.ascSign);
    assert.strictEqual(pm.signInHouse[6], 6);
    assert.strictEqual(pm.signInHouse[7], 7);

  const planets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.saturn.sign, 7, 'saturn sign');
  assert.ok(!planets.saturn.retro, 'saturn retro');
  for (const p of Object.values(planets)) {
    for (const k of ['deg', 'min', 'sec']) {
      assert.strictEqual(typeof p[k], 'number', `${p.name} ${k}`);
    }
  }
  const expected = {
    sun: 8,
    moon: 2,
    mars: 9,
    mercury: 8,
    jupiter: 8,
    venus: 8,
    saturn: 7,
    uranus: 8,
    neptune: 9,
    pluto: 7,
    rahu: 3,
    ketu: 9,
  };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});

test('Darbhanga 1982-12-01 03:50 sign sequence matches AstroSage', async () => {
  const { computePositions } = await astro;
  const am = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  const expected = [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  assert.deepStrictEqual(am.signInHouse, expected);
});

test('Darbhanga 1982-12-01 03:50: Mercury and Venus in house 2, Jupiter in house 2', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const expected = { mercury: 2, venus: 2, jupiter: 2 };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});

// Using the "true" node accounts for the lunar node's small oscillation.
// AstroSage labels this option "True Node". For the reference chart the
// nodes should still fall in Gemini (Rahu) and Sagittarius (Ketu).
test('Darbhanga 1982-12-01 03:50 true node matches AstroSage', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'true',
  });
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.rahu.sign, 3); // Gemini
  assert.strictEqual(planets.ketu.sign, 9); // Sagittarius
});

test('Darbhanga 1982-12-01 15:50 true node matches AstroSage', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'true',
  });
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.rahu.sign, 3); // Gemini
  assert.strictEqual(planets.ketu.sign, 9); // Sagittarius
});
