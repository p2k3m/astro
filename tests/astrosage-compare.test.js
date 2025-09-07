import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';

const astro = import('../src/lib/astro.js');
import { longitudeToNakshatra } from '../src/lib/nakshatra.js';
// Reference longitudes from AstroSage. Nakshatra/pada are derived
// programmatically to avoid manual duplication.
const ASTROSAGE_AM_LONGITUDES = {
  sun: { sign: 8, deg: 14, min: 46, sec: 24 },
  moon: { sign: 2, deg: 13, min: 36, sec: 21 },
  mars: { sign: 9, deg: 29, min: 9, sec: 17 },
  mercury: { sign: 8, deg: 20, min: 59, sec: 43 },
  jupiter: { sign: 8, deg: 1, min: 4, sec: 29 },
  venus: { sign: 8, deg: 21, min: 25, sec: 3 },
  saturn: { sign: 7, deg: 6, min: 32, sec: 35 },
  uranus: { sign: 8, deg: 11, min: 29, sec: 15 },
  neptune: { sign: 9, deg: 2, min: 28, sec: 10 },
  pluto: { sign: 7, deg: 4, min: 48, sec: 32 },
  rahu: { sign: 3, deg: 11, min: 53, sec: 16 },
  ketu: { sign: 9, deg: 11, min: 53, sec: 16 },
};

const ASTROSAGE_AM_POSITIONS = Object.fromEntries(
  Object.entries(ASTROSAGE_AM_LONGITUDES).map(([name, pos]) => {
    const { sign, deg, min, sec } = pos;
    const lon = (sign - 1) * 30 + deg + min / 60 + sec / 3600;
    const { nakshatra, pada } = longitudeToNakshatra(lon);
    return [name, { deg, min, sec, nakshatra, pada }];
  }),
);

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

  for (const [name, exp] of Object.entries(ASTROSAGE_AM_POSITIONS)) {
    const act = planets[name];
    assert.ok(act, `missing ${name}`);
    assert.strictEqual(act.deg, exp.deg, `${name} deg`);
    assert.strictEqual(act.min, exp.min, `${name} min`);
    assert.strictEqual(act.sec, exp.sec, `${name} sec`);
    assert.strictEqual(act.nakshatra, exp.nakshatra, `${name} nakshatra`);
    assert.strictEqual(act.pada, exp.pada, `${name} pada`);
  }

  const expectedHouses = {
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
  for (const [name, house] of Object.entries(expectedHouses)) {
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
