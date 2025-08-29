const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');

// Precomputed sidereal values using Swiss Ephemeris
const EXPECTED = {
  ascendant: 90.54846025906988,
  sun: 256.38732871727575,
  moon: 0,
  mercury: 0,
  venus: 0,
  mars: 0,
  jupiter: 0,
  saturn: 0,
  rahu: 98.21695036849997,
  ketu: 278.21695036849997,
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
