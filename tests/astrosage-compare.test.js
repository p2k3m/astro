import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';
const astro = import('../src/lib/astro.js');

// Reference positions from AstroSage in absolute degrees with their
// nakshatra and pada. Keeping the table inline makes the expectations
// explicit and avoids relying on repository calculations.
const ASTROSAGE_AM_TABLE = {
  sun: { lon: 224.773889, nakshatra: 'Anuradha', pada: 4 },
  moon: { lon: 43.615, nakshatra: 'Rohini', pada: 2 },
  mars: { lon: 269.155, nakshatra: 'Uttara Ashadha', pada: 1 },
  mercury: { lon: 230.996111, nakshatra: 'Jyeshtha', pada: 2 },
  jupiter: { lon: 211.074722, nakshatra: 'Vishakha', pada: 4 },
  venus: { lon: 231.418333, nakshatra: 'Jyeshtha', pada: 2 },
  saturn: { lon: 186.543056, nakshatra: 'Chitra', pada: 4 },
  uranus: { lon: 221.4875, nakshatra: 'Anuradha', pada: 3 },
  neptune: { lon: 242.469444, nakshatra: 'Mula', pada: 1 },
  pluto: { lon: 184.808889, nakshatra: 'Chitra', pada: 4 },
  rahu: { lon: 71.887778, nakshatra: 'Ardra', pada: 2 },
  ketu: { lon: 251.887778, nakshatra: 'Mula', pada: 4 },
};

const ASTROSAGE_PM_TABLE = {
  sun: { lon: 225.280556, nakshatra: 'Anuradha', pada: 4 },
  moon: { lon: 51.051111, nakshatra: 'Rohini', pada: 4 },
  mars: { lon: 269.541111, nakshatra: 'Uttara Ashadha', pada: 1 },
  mercury: { lon: 231.775, nakshatra: 'Jyeshtha', pada: 2 },
  jupiter: { lon: 211.183889, nakshatra: 'Vishakha', pada: 4 },
  venus: { lon: 232.046111, nakshatra: 'Jyeshtha', pada: 2 },
  saturn: { lon: 186.595, nakshatra: 'Chitra', pada: 4 },
  uranus: { lon: 221.518333, nakshatra: 'Anuradha', pada: 3 },
  neptune: { lon: 242.487778, nakshatra: 'Mula', pada: 1 },
  pluto: { lon: 184.825278, nakshatra: 'Chitra', pada: 4 },
  rahu: { lon: 71.861111, nakshatra: 'Ardra', pada: 2 },
  ketu: { lon: 251.861111, nakshatra: 'Mula', pada: 4 },
};

// Absolute difference between two longitudes in arcminutes.  Using arcminutes
// keeps the comparison unit small so we can assert very tight tolerances.
const deltaArcminutes = (a, b) => Math.abs(((a - b + 540) % 360) - 180) * 60;
const tol = 0.05; // allowable difference in arcminutes (~3 arcseconds)

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

  for (const [name, exp] of Object.entries(ASTROSAGE_AM_TABLE)) {
    const act = planets[name];
    assert.ok(act, `missing ${name}`);
    const delta = deltaArcminutes(act.lon, exp.lon);
    assert.ok(
      delta <= tol,
      `${name} lon diff ${delta.toFixed(3)}' exceeds tolerance`,
    );
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

  for (const [name, exp] of Object.entries(ASTROSAGE_PM_TABLE)) {
    const act = planets[name];
    assert.ok(act, `missing ${name}`);
    const delta = deltaArcminutes(act.lon, exp.lon);
    assert.ok(
      delta <= tol,
      `${name} lon diff ${delta.toFixed(3)}' exceeds tolerance`,
    );
    assert.strictEqual(act.nakshatra, exp.nakshatra, `${name} nakshatra`);
    assert.strictEqual(act.pada, exp.pada, `${name} pada`);
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
