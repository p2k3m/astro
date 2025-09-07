import assert from 'node:assert';
import test from 'node:test';
test('Pushkar Mishra chart positions', async () => {
  const { compute_positions } = await import('../src/lib/ephemeris.js');
  const res = await compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Kolkata',
    lat: 26.152,
    lon: 85.897,
    nodeType: 'mean',
  });
  const asc = res.ascendant;
  assert.strictEqual(asc.sign, 7); // Libra
  assert.strictEqual(asc.deg, 19);
  assert.strictEqual(asc.min, 25);
  assert.ok(Math.abs(asc.sec - 57) <= 1);
  assert.strictEqual(asc.nakshatra, 'Swati');
  assert.strictEqual(asc.pada, 4);
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
    sun: { sign: 8, deg: 14, min: 46, sec: 24, nakshatra: 'Anuradha', pada: 4 },
    moon: { sign: 2, deg: 13, min: 36, sec: 21, nakshatra: 'Rohini', pada: 2 },
    mercury: { sign: 8, deg: 20, min: 59, sec: 44, nakshatra: 'Jyeshtha', pada: 2 },
    venus: { sign: 8, deg: 21, min: 25, sec: 3, nakshatra: 'Jyeshtha', pada: 2 },
    mars: { sign: 9, deg: 29, min: 9, sec: 17, nakshatra: 'Uttara Ashadha', pada: 1 },
    jupiter: { sign: 8, deg: 1, min: 4, sec: 30, nakshatra: 'Vishakha', pada: 4 },
    saturn: { sign: 7, deg: 6, min: 32, sec: 35, nakshatra: 'Chitra', pada: 4 },
    uranus: { sign: 8, deg: 11, min: 29, sec: 15, nakshatra: 'Anuradha', pada: 3 },
    neptune: { sign: 9, deg: 2, min: 28, sec: 11, nakshatra: 'Mula', pada: 1 },
    pluto: { sign: 7, deg: 4, min: 48, sec: 33, nakshatra: 'Chitra', pada: 4 },
    rahu: { sign: 2, deg: 13, min: 36, sec: 21, nakshatra: 'Rohini', pada: 2 },
    ketu: { sign: 8, deg: 13, min: 36, sec: 21, nakshatra: 'Anuradha', pada: 4 },
  };
  assert.deepStrictEqual(actual, expected);
});

