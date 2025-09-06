import assert from 'node:assert';
import test from 'node:test';
import { longitudeToNakshatra } from '../src/lib/nakshatra.js';

test('Pushkar Mishra chart positions', async () => {
  const { compute_positions } = await import('../src/lib/ephemeris.js');
  const res = await compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Kolkata',
    lat: 26.152,
    lon: 85.897,
  });
  const actual = Object.fromEntries(
    res.planets.map((p) => {
      const { nakshatra } = longitudeToNakshatra(p.lon);
      return [p.name, { sign: p.sign, deg: p.deg, nakshatra }];
    })
  );
  const expected = {
    sun: { sign: 8, deg: 14, nakshatra: 'Anuradha' },
    moon: { sign: 2, deg: 13, nakshatra: 'Rohini' },
    mercury: { sign: 7, deg: 29, nakshatra: 'Vishakha' },
    venus: { sign: 7, deg: 10, nakshatra: 'Swati' },
    mars: { sign: 12, deg: 8, nakshatra: 'Uttara Bhadrapada' },
    jupiter: { sign: 7, deg: 25, nakshatra: 'Vishakha' },
    saturn: { sign: 6, deg: 29, nakshatra: 'Chitra' },
    uranus: { sign: 8, deg: 11, nakshatra: 'Anuradha' },
    neptune: { sign: 9, deg: 3, nakshatra: 'Mula' },
    pluto: { sign: 7, deg: 2, nakshatra: 'Chitra' },
    rahu: { sign: 3, deg: 11, nakshatra: 'Ardra' },
    ketu: { sign: 9, deg: 11, nakshatra: 'Mula' },
  };
  assert.deepStrictEqual(actual, expected);
});

