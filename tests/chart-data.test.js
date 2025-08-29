const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');

// Precomputed sidereal values (Swiss Ephemeris, Lahiri) rounded to 1e-12°
const EXPECTED = {
  ascendant: 90.54846025907,
  sun: 256.387328717276,
  moon: 328.016945555754,
  mercury: 90.663894999078,
  venus: 36.335766964314,
  mars: 152.400388236291,
  jupiter: 251.124027051959,
  saturn: 269.877512405082,
  rahu: 74.080811479611,
  ketu: 254.080811479611,
};

const BIRTH = {
  date: '2020-01-01T12:00:00Z',
  lat: '40.7128',
  lon: '-74.0060',
};

const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];

const TOLERANCE = 1e-3; // 0.001°
function closeTo(a, b) {
  return Math.abs(a - b) < TOLERANCE;
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
