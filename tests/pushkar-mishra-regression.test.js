import assert from 'node:assert';
import test from 'node:test';
import * as swe from '../swisseph/index.js';
import { longitudeToNakshatra } from '../src/lib/nakshatra.js';

// Verified values from AstroSage for Pushkar Mishra birth chart
const expected = {
  ascendant: { sign: 7, deg: 19, min: 25, sec: 57, nakshatra: 'Swati', pada: 4 },
  sun: { sign: 9, deg: 8, min: 23, sec: 12, nakshatra: 'Mula', pada: 3 },
  moon: { sign: 3, deg: 7, min: 13, sec: 9, nakshatra: 'Ardra', pada: 1 },
  mercury: { sign: 9, deg: 14, min: 36, sec: 31, nakshatra: 'Purva Ashadha', pada: 1 },
  venus: { sign: 9, deg: 15, min: 1, sec: 51, nakshatra: 'Purva Ashadha', pada: 1 },
  mars: { sign: 10, deg: 22, min: 46, sec: 5, nakshatra: 'Shravana', pada: 4 },
  jupiter: { sign: 8, deg: 24, min: 41, sec: 18, nakshatra: 'Jyeshtha', pada: 3 },
  saturn: { sign: 8, deg: 0, min: 9, sec: 23, nakshatra: 'Vishakha', pada: 4 },
  uranus: { sign: 9, deg: 5, min: 6, sec: 3, nakshatra: 'Mula', pada: 2 },
  neptune: { sign: 9, deg: 26, min: 4, sec: 59, nakshatra: 'Purva Ashadha', pada: 4 },
  pluto: { sign: 7, deg: 28, min: 25, sec: 21, nakshatra: 'Vishakha', pada: 3 },
  rahu: { sign: 3, deg: 7, min: 13, sec: 9, nakshatra: 'Ardra', pada: 1 },
  ketu: { sign: 9, deg: 7, min: 13, sec: 9, nakshatra: 'Mula', pada: 3 },
};

const toArcminutes = ({ sign, deg, min, sec }) => ((sign - 1) * 30 + deg) * 60 + min + sec / 60;

const TOLERANCE = 0.5; // arcminutes

test('Pushkar Mishra positions regression', async () => {
  const { compute_positions } = await import('../src/lib/ephemeris.js');
  const res = await compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Kolkata',
    lat: 26.152,
    lon: 85.897,
    nodeType: 'mean',
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
  });

  const bodies = { ascendant: { ...res.ascendant } };
  const asc = bodies.ascendant;
  const { nakshatra, pada } = longitudeToNakshatra(asc.lon);
  asc.nakshatra = nakshatra;
  asc.pada = pada;
  for (const p of res.planets) bodies[p.name] = p;

  for (const [name, exp] of Object.entries(expected)) {
    const act = bodies[name];
    assert.ok(act, `missing ${name}`);
    const diff = Math.abs(toArcminutes(act) - toArcminutes(exp));
    assert.ok(diff < TOLERANCE, `${name} off by ${diff.toFixed(2)}'`);
    assert.strictEqual(act.nakshatra, exp.nakshatra, `${name} nakshatra`);
    assert.strictEqual(act.pada, exp.pada, `${name} pada`);
  }
});

