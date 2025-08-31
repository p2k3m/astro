const assert = require('node:assert');
const test = require('node:test');

async function getCompute() {
  return (await import('../src/lib/ephemeris.js')).compute_positions;
}

test('house cusps and retrograde flags', async () => {
  const compute_positions = await getCompute();

  const fakeSwe = {
    SE_GREG_CAL: 1,
    SEFLG_SIDEREAL: 2,
    SEFLG_SWIEPH: 4,
    SEFLG_SPEED: 8,
    SEFLG_RETROGRADE: 16,
    SE_SUN: 0,
    SE_MOON: 1,
    SE_MERCURY: 2,
    SE_VENUS: 3,
    SE_MARS: 4,
    SE_JUPITER: 5,
    SE_SATURN: 6,
    SE_TRUE_NODE: 7,
    swe_julday: () => 0,
    swe_houses_ex: () => ({
      ascendant: 123,
      houses: [
        null,
        123,
        153,
        183,
        213,
        243,
        273,
        303,
        333,
        3,
        33,
        63,
        93,
      ],
    }), // Leo 3° ascendant
    swe_calc_ut: (jd, id, flag) => {
      const data = {
        0: { longitude: 100, longitudeSpeed: 1, flags: 0 }, // Sun in Cancer
        1: {
          longitude: 210,
          longitudeSpeed: -0.5,
          flags: fakeSwe.SEFLG_RETROGRADE,
        }, // Moon retro in Libra
        // Mercury has a tiny negative speed that should not count as retrograde
        2: { longitude: 50, longitudeSpeed: -1e-6, flags: 0 },
        3: { longitude: 10, longitudeSpeed: 0.1, flags: 0 },
        4: { longitude: 200, longitudeSpeed: 0.1, flags: 0 }, // Mars in Libra
        5: { longitude: 170, longitudeSpeed: 0.1, flags: 0 },
        6: { longitude: 300, longitudeSpeed: 0.1, flags: 0 },
        7: {
          longitude: 30,
          longitudeSpeed: -0.1,
          flags: fakeSwe.SEFLG_RETROGRADE,
        }, // Rahu retro in Taurus
      };
      return data[id];
    },
    swe_house_pos: (jd, lat, lon, hsys, bodyLon, houses) => {
      const asc = houses[1];
      return Math.floor(((bodyLon - asc + 360) % 360) / 30) + 1;
    },
  };

  const result = compute_positions(
    { datetime: '2020-01-01T00:00', tz: 'UTC', lat: 0, lon: 0 },
    fakeSwe
  );

  assert.strictEqual(result.ascSign, 5); // Leo ascendant
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));

  assert.strictEqual(result.houses[1], 123);
    assert.strictEqual(planets.moon.sign, 8);
    assert.strictEqual(planets.moon.house, 3);
    assert.strictEqual(planets.moon.retro, true);
    assert.strictEqual(planets.mercury.retro, false);
    assert.strictEqual(planets.mars.house, 3);

    assert.strictEqual(planets.rahu.retro, true);
    assert.strictEqual(planets.rahu.house, 9);
    assert.strictEqual(planets.ketu.sign, 8);
    assert.strictEqual(planets.ketu.house, 3);
  assert.strictEqual(planets.ketu.retro, true);
  const diff = (planets.ketu.house - planets.rahu.house + 12) % 12;
  assert.strictEqual(diff, 6);
});
