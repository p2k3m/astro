const assert = require('node:assert');
const test = require('node:test');
const { compute_positions } = require('../src/lib/ephemeris.js');

test('Mercury/Venus in 2nd and Mars in 1st house for reference chart', () => {
  const result = compute_positions({
    datetime: '1982-12-01T13:00',
    tz: 'Asia/Calcutta',
    lat: 26.15216,
    lon: 85.89707,
  });
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p.house]));
  assert.strictEqual(planets.mercury, 2);
  assert.strictEqual(planets.venus, 2);
  assert.strictEqual(planets.mars, 1);
});
