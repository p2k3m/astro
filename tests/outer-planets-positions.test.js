import assert from 'node:assert';
import test from 'node:test';

const eph = import('../src/lib/ephemeris.js');
const astro = import('../src/lib/astro.js');

test('outer planets positions for Darbhanga 1982-12-01 03:50', async () => {
  const { compute_positions } = await eph;
  const res = await compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Calcutta',
    lat: 26.15216,
    lon: 85.89707,
  });
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.uranus.sign, 8);
  assert.strictEqual(planets.uranus.house, 2);
  assert.strictEqual(planets.neptune.sign, 9);
  assert.strictEqual(planets.neptune.house, 3);
  assert.strictEqual(planets.pluto.sign, 7);
  assert.strictEqual(planets.pluto.house, 1);
});

test('computePositions returns outer planets', async () => {
  const { computePositions } = await astro;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.15216, 85.89707);
  const names = data.planets.map((p) => p.name);
  for (const n of ['uranus', 'neptune', 'pluto']) {
    assert.ok(names.includes(n), `missing ${n}`);
  }
});
