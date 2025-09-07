import assert from 'node:assert';
import test from 'node:test';

const eph = import('../src/lib/ephemeris.js');

test('Darbhanga 1982 chart regression', async () => {
  const { compute_positions } = await eph;
  const res = await compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Calcutta',
    lat: 26.15216,
    lon: 85.89707,
  });

  assert.strictEqual(res.ascendant.sign, 7);
  assert.strictEqual(res.ascendant.deg, 19);
  assert.strictEqual(res.ascendant.min, 25);
  assert.strictEqual(res.ascendant.sec, 57);

  const houses = Object.fromEntries(res.planets.map((p) => [p.name, p.house]));
  assert.deepStrictEqual(houses, {
    sun: 3,
    moon: 9,
    mercury: 3,
    venus: 3,
    mars: 4,
    jupiter: 2,
    saturn: 2,
    uranus: 3,
    neptune: 3,
    pluto: 1,
    rahu: 9,
    ketu: 3,
  });
});

