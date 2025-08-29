const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');

// Precomputed sidereal values using Swiss Ephemeris
const EXPECTED = {
  ascendant: 90.54846025906988,
  sun: 256.38732871727575,
  moon: 328.0169455557543,
  mercury: 90.66389499907791,
  venus: 36.33576696431351,
  mars: 152.40038823629072,
  jupiter: 251.12402705195916,
  saturn: 269.87751240508214,
  rahu: 74.08081147961104,
  ketu: 254.08081147961104,
};

const BIRTH = {
  date: '2020-01-01T12:00:00Z',
  lat: '40.7128',
  lon: '-74.0060',
};

const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];

function closeTo(a, b) {
  return Math.abs(a - b) < 1e-3;
}

test('API returns expected chart data for birth details', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  const baseParams = new URLSearchParams(BIRTH);
  const resAsc = await fetch(`http://localhost:${port}/api/ascendant?${baseParams}`);
  assert.strictEqual(resAsc.status, 200);
  const ascBody = await resAsc.json();
  assert.ok(closeTo(ascBody.longitude, EXPECTED.ascendant));

  for (const planet of PLANETS) {
    const params = new URLSearchParams(BIRTH);
    params.set('planet', planet);
    const res = await fetch(`http://localhost:${port}/api/planet?${params}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(closeTo(body.longitude, EXPECTED[planet]), `${planet} longitude mismatch`);
  }
});
