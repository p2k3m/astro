import assert from 'node:assert';
import test from 'node:test';

const eph = import('../src/lib/ephemeris.js');

const SIGN_NUM = {
  Aries: 1,
  Taurus: 2,
  Gemini: 3,
  Cancer: 4,
  Leo: 5,
  Virgo: 6,
  Libra: 7,
  Scorpio: 8,
  Sagittarius: 9,
  Capricorn: 10,
  Aquarius: 11,
  Pisces: 12,
};

const EXPECTED = {
  sun: { sign: 'Scorpio', deg: 14, min: 46, sec: 26, nakshatra: 'Anuradha', pada: 4 },
  moon: { sign: 'Taurus', deg: 13, min: 36, sec: 54, nakshatra: 'Rohini', pada: 2 },
  mercury: { sign: 'Scorpio', deg: 20, min: 59, sec: 46, nakshatra: 'Jyeshtha', pada: 2 },
  venus: { sign: 'Scorpio', deg: 21, min: 25, sec: 6, nakshatra: 'Jyeshtha', pada: 2 },
  mars: { sign: 'Sagittarius', deg: 29, min: 9, sec: 18, nakshatra: 'Uttara Ashadha', pada: 1 },
  jupiter: { sign: 'Scorpio', deg: 1, min: 4, sec: 29, nakshatra: 'Vishakha', pada: 4 },
  saturn: { sign: 'Libra', deg: 6, min: 32, sec: 35, nakshatra: 'Chitra', pada: 4 },
  uranus: { sign: 'Scorpio', deg: 11, min: 29, sec: 15, nakshatra: 'Anuradha', pada: 3 },
  neptune: { sign: 'Sagittarius', deg: 2, min: 28, sec: 10, nakshatra: 'Mula', pada: 1 },
  pluto: { sign: 'Libra', deg: 4, min: 48, sec: 32, nakshatra: 'Chitra', pada: 4 },
  rahu: { sign: 'Gemini', deg: 11, min: 53, sec: 16, nakshatra: 'Ardra', pada: 2 },
  ketu: { sign: 'Sagittarius', deg: 11, min: 53, sec: 16, nakshatra: 'Mula', pada: 4 },
};

const totalArcsec = ({ deg, min, sec }) => deg * 3600 + min * 60 + sec;

test('compute_positions matches reference placements for Darbhanga 1982-12-01 03:50', async () => {
  const { compute_positions } = await eph;
  const res = await compute_positions({
    datetime: '1982-12-01T03:50:00',
    tz: 'Asia/Kolkata',
    lat: 26.16,
    lon: 85.90,
  });
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  for (const [name, exp] of Object.entries(EXPECTED)) {
    const act = planets[name];
    assert.ok(act, `missing ${name}`);
    assert.strictEqual(act.sign, SIGN_NUM[exp.sign], `${name} sign`);
    const diff = Math.abs(totalArcsec(act) - totalArcsec(exp));
    assert.ok(diff <= 1, `${name} DMS diff ${diff}″ exceeds tolerance`);
    assert.strictEqual(act.nakshatra, exp.nakshatra, `${name} nakshatra`);
    assert.strictEqual(act.pada, exp.pada, `${name} pada`);
  }
});

