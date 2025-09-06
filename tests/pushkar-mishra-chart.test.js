import assert from 'node:assert';
import test from 'node:test';
import { longitudeToNakshatra } from '../src/lib/nakshatra.js';

test('Pushkar Mishra chart positions', async () => {
  const { compute_positions, lonToSignDeg } = await import('../src/lib/ephemeris.js');
  const res = await compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Kolkata',
    lat: 26.152,
    lon: 85.897,
  });

  const ascLon = res.ascendant.lon;
  const { sign, deg, min, sec } = lonToSignDeg(ascLon);
  const { nakshatra, pada } = longitudeToNakshatra(ascLon);
  assert.strictEqual(sign, 7); // Libra
  assert.strictEqual(deg, 19);
  assert.strictEqual(min, 25);
  assert.ok(Math.abs(sec - 57) <= 1);
  assert.strictEqual(nakshatra, 'Swati');
  assert.strictEqual(pada, 4);
  const actual = Object.fromEntries(
    res.planets.map((p) => {
      const { nakshatra, pada } = longitudeToNakshatra(p.lon);
      return [p.name, { sign: p.sign, deg: p.deg, min: p.min, sec: p.sec, nakshatra, pada }];
    })
  );
  const expected = {
    sun: { sign: 8, deg: 14, min: 46, sec: 28, nakshatra: 'Anuradha', pada: 4 },
    moon: { sign: 2, deg: 13, min: 16, sec: 59, nakshatra: 'Rohini', pada: 1 },
    mercury: { sign: 7, deg: 29, min: 13, sec: 15, nakshatra: 'Vishakha', pada: 3 },
    venus: { sign: 7, deg: 10, min: 2, sec: 30, nakshatra: 'Swati', pada: 2 },
    mars: { sign: 12, deg: 8, min: 19, sec: 13, nakshatra: 'Uttara Bhadrapada', pada: 2 },
    jupiter: { sign: 7, deg: 25, min: 3, sec: 25, nakshatra: 'Vishakha', pada: 2 },
    saturn: { sign: 6, deg: 29, min: 14, sec: 20, nakshatra: 'Chitra', pada: 2 },
    uranus: { sign: 8, deg: 11, min: 14, sec: 52, nakshatra: 'Anuradha', pada: 3 },
    neptune: { sign: 9, deg: 3, min: 41, sec: 38, nakshatra: 'Mula', pada: 2 },
    pluto: { sign: 7, deg: 2, min: 17, sec: 25, nakshatra: 'Chitra', pada: 3 },
    rahu: { sign: 3, deg: 11, min: 53, sec: 18, nakshatra: 'Ardra', pada: 2 },
    ketu: { sign: 9, deg: 11, min: 53, sec: 18, nakshatra: 'Mula', pada: 4 },
  };
  assert.deepStrictEqual(actual, expected);
});

