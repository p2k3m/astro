const assert = require('node:assert');
const test = require('node:test');
const { compute_positions } = require('../src/lib/ephemeris.js');

test('Mercury, Venus, and Mars in 2nd house for reference chart', async () => {
  const result = await compute_positions({
    datetime: '1982-12-01T13:00',
    tz: 'Asia/Calcutta',
    lat: 26.15216,
    lon: 85.89707,
  });
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
  for (const p of Object.values(planets)) {
    for (const k of ['deg', 'min', 'sec']) {
      assert.strictEqual(typeof p[k], 'number', `${p.name} ${k}`);
    }
  }
  assert.strictEqual(planets.mercury.house, 2);
  assert.strictEqual(planets.venus.house, 2);
  assert.strictEqual(planets.mars.house, 2);
  assert.strictEqual(planets.jupiter.house, 2);
  assert.strictEqual(planets.saturn.house, 1);
});
