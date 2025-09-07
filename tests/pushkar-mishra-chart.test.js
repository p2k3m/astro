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
    nodeType: 'mean',
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
      return [
        p.name,
        {
          sign: p.sign,
          deg: p.deg,
          min: p.min,
          sec: p.sec,
          nakshatra: p.nakshatra,
          pada: p.pada,
        },
      ];
    })
  );
  const expected = {
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
  assert.deepStrictEqual(actual, expected);
});

