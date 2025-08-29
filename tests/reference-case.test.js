const assert = require('node:assert');
const test = require('node:test');

async function getCompute() {
  return (await import('../src/lib/ephemeris.js')).compute_positions;
}

test('reference chart matches known placements', async () => {
  const compute_positions = await getCompute();
  const res = compute_positions({
    datetime: '1982-12-01T03:50',
    tz: 'Asia/Kolkata',
    lat: 26.152,
    lon: 85.897,
  });
  assert.strictEqual(res.asc_sign, 1);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p.sign]));
  assert.strictEqual(planets.sun, 8);
  assert.strictEqual(planets.moon, 2);
  assert.strictEqual(planets.saturn, 6);
});
