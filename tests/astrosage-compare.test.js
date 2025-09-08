import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';
const astro = import('../src/lib/astro.js');

// Reference positions from AstroSage in absolute degrees with their
// corresponding nakshatra and pada. Keeping the data inline keeps the
// expectations explicit and avoids relying on repository calculations.
// The test fails on any mismatch to ensure ongoing alignment.
const CASES = [
  {
    label: 'Darbhanga 1982-12-01 03:50',
    datetime: '1982-12-01T03:50+05:30',
    expected: {
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
    },
  },
  {
    label: 'Darbhanga 1982-12-01 15:50',
    datetime: '1982-12-01T15:50+05:30',
    expected: {
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
    },
  },
];

// Absolute difference between two longitudes in arcminutes. Using
// arcminutes keeps the comparison unit small so we can assert very tight
// tolerances.
const deltaArcminutes = (a, b) => Math.abs(((a - b + 540) % 360) - 180) * 60;
// Allowable difference in arcminutes (~3 arcseconds)
const tol = 0.05;

for (const { label, datetime, expected } of CASES) {
  test(`${label} matches AstroSage`, async () => {
    const { computePositions } = await astro;
    const res = await computePositions(datetime, 26.152, 85.897, {
      sidMode: swe.SE_SIDM_LAHIRI,
      houseSystem: 'W',
      nodeType: 'mean',
    });
    const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
    for (const [name, exp] of Object.entries(expected)) {
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
  });
}

