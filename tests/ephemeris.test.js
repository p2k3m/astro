const assert = require('node:assert');
const test = require('node:test');

async function getCompute() {
  return (await import('../src/lib/ephemeris.js')).compute_positions;
}

test('sign to house mapping and retrograde flags', async () => {
  const compute_positions = await getCompute();

  const fakeSwe = {
    SE_GREG_CAL: 1,
    SEFLG_SIDEREAL: 2,
    SEFLG_SWIEPH: 4,
    SEFLG_SPEED: 8,
    SE_SUN: 0,
    SE_MOON: 1,
    SE_MERCURY: 2,
    SE_VENUS: 3,
    SE_MARS: 4,
    SE_JUPITER: 5,
    SE_SATURN: 6,
    SE_TRUE_NODE: 7,
    swe_julday: () => 0,
    swe_houses_ex: () => ({ ascendant: 123 }), // Leo 3°
    swe_calc_ut: (jd, id, flag) => {
      const data = {
        0: { longitude: 100, longitudeSpeed: 1 }, // Sun in Cancer
        1: { longitude: 210, longitudeSpeed: -0.5 }, // Moon retro in Libra
        2: { longitude: 50, longitudeSpeed: 0.1 },
        3: { longitude: 10, longitudeSpeed: 0.1 },
        4: { longitude: 80, longitudeSpeed: 0.1 },
        5: { longitude: 170, longitudeSpeed: 0.1 },
        6: { longitude: 300, longitudeSpeed: 0.1 },
        7: { longitude: 30, longitudeSpeed: -0.1 }, // Rahu retro in Taurus
      };
      return data[id];
    },
  };

  const result = compute_positions({ datetime: '2020-01-01T00:00', tz: 'UTC', lat: 0, lon: 0 }, fakeSwe);

  assert.strictEqual(result.asc_sign, 5); // Leo ascendant
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));

  assert.strictEqual(planets.moon.sign, 8);
  const moonHouse = ((planets.moon.sign - result.asc_sign + 12) % 12) + 1;
  assert.strictEqual(moonHouse, 4);
  assert.strictEqual(planets.moon.retro, true);

  assert.strictEqual(planets.rahu.retro, true);
  assert.strictEqual(planets.ketu.sign, 8);
  assert.strictEqual(planets.ketu.retro, true);
});
