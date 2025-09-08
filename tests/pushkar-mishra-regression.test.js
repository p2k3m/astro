import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';

// Verified values from AstroSage for Pushkar Mishra birth chart.
// Longitudes recomputed with Swiss Ephemeris 2.10.03 and Lahiri ayanamsa.
const expected = {
  ascendant: {
    sign: 7,
    deg: 12,
    min: 17,
    // AstroSage reports fractional seconds. `lonToSignDeg`
    // rounds to the nearest arcsecond, so round the
    // expected values as well for comparison.
    sec: 6,
    lon: 192.2850677,
    nakshatra: 'Swati',
    pada: 2,
  },
  sun: {
    sign: 8,
    deg: 14,
    min: 46,
    sec: 26,
    lon: 224.7740255,
    nakshatra: 'Anuradha',
    pada: 4,
  },
  moon: {
    sign: 2,
    deg: 13,
    min: 36,
    sec: 54,
    lon: 43.614882,
    nakshatra: 'Rohini',
    pada: 2,
  },
  mercury: {
    sign: 8,
    deg: 20,
    min: 59,
    sec: 47,
    lon: 230.9963753,
    nakshatra: 'Jyeshtha',
    pada: 2,
  },
  venus: {
    sign: 8,
    deg: 21,
    min: 25,
    sec: 6,
    lon: 231.4184031,
    nakshatra: 'Jyeshtha',
    pada: 2,
  },
  mars: {
    sign: 9,
    deg: 29,
    min: 9,
    sec: 19,
    lon: 269.1552136,
    nakshatra: 'Uttara Ashadha',
    pada: 1,
  },
  jupiter: {
    sign: 8,
    deg: 1,
    min: 4,
    sec: 30,
    lon: 211.0750265,
    nakshatra: 'Vishakha',
    pada: 4,
  },
  saturn: {
    sign: 7,
    deg: 6,
    min: 32,
    sec: 35,
    lon: 186.5431544,
    nakshatra: 'Chitra',
    pada: 4,
  },
  uranus: {
    sign: 8,
    deg: 11,
    min: 29,
    sec: 16,
    lon: 221.4876737,
    nakshatra: 'Anuradha',
    pada: 3,
  },
  neptune: {
    sign: 9,
    deg: 2,
    min: 28,
    sec: 11,
    lon: 242.4696397,
    nakshatra: 'Mula',
    pada: 1,
  },
  pluto: {
    sign: 7,
    deg: 4,
    min: 48,
    sec: 33,
    lon: 184.8090607,
    nakshatra: 'Chitra',
    pada: 4,
  },
  rahu: {
    sign: 3,
    deg: 11,
    min: 53,
    sec: 16,
    lon: 71.8878067,
    nakshatra: 'Ardra',
    pada: 2,
  },
  ketu: {
    sign: 9,
    deg: 11,
    min: 53,
    sec: 16,
    lon: 251.8878067,
    nakshatra: 'Mula',
    pada: 4,
  },
};

const toArcminutes = ({ sign, deg, min, sec }) => ((sign - 1) * 30 + deg) * 60 + min + sec / 60;

const TOLERANCE = 0.05; // arcminutes (~3 arcseconds)
const LON_TOLERANCE = 0.0003; // degrees (~1 arcsecond)

test('Pushkar Mishra positions regression', async () => {
  const { compute_positions } = await import('../src/lib/ephemeris.js');
  const res = await compute_positions({
    datetime: '1982-12-01T03:50+05:30',
    lat: 26.152,
    lon: 85.897,
    nodeType: 'mean',
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
  });

  const bodies = { ascendant: res.ascendant };
  for (const p of res.planets) bodies[p.name] = p;

  for (const [name, exp] of Object.entries(expected)) {
    const act = bodies[name];
    assert.ok(act, `missing ${name}`);
    const diff = Math.abs(toArcminutes(act) - toArcminutes(exp));
    assert.ok(diff < TOLERANCE, `${name} off by ${diff.toFixed(2)}'`);
    if (exp.lon) {
      const lonDiff = Math.abs(act.lon - exp.lon);
      assert.ok(lonDiff < LON_TOLERANCE, `${name} lon off by ${lonDiff}`);
    }
    assert.strictEqual(act.nakshatra, exp.nakshatra, `${name} nakshatra`);
    assert.strictEqual(act.pada, exp.pada, `${name} pada`);
  }
});

