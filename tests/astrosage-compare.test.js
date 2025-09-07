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
  assert.strictEqual(planets.saturn.sign, 8, 'saturn sign');
  assert.ok(!planets.saturn.retro, 'saturn retro');
  for (const p of Object.values(planets)) {
    for (const k of ['deg', 'min', 'sec']) {
      assert.strictEqual(typeof p[k], 'number', `${p.name} ${k}`);
    }
  }
  const expected = {
    sun: 3,
    moon: 9,
    mars: 4,
    mercury: 3,
    jupiter: 2,
    venus: 3,
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
});

test('Darbhanga 1982-12-01 15:50 matches AstroSage', async () => {
  const { computePositions } = await astro;
  const pm = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  assert.strictEqual(pm.ascSign, 2);
  assert.strictEqual(pm.signInHouse[1], pm.ascSign);
  assert.strictEqual(pm.signInHouse[6], 7);
  assert.strictEqual(pm.signInHouse[7], 8);

  const planets = Object.fromEntries(pm.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.saturn.sign, 8, 'saturn sign');
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
    jupiter: 7,
    venus: 8,
    saturn: 7,
    uranus: 8,
    neptune: 8,
    pluto: 6,
    rahu: 2,
    ketu: 8,
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

test('Darbhanga 1982-12-01 03:50: Mercury and Venus in house 3, Jupiter in house 2', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const expected = { mercury: 3, venus: 3, jupiter: 2 };
  for (const [name, house] of Object.entries(expected)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }
});
