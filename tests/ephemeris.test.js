import assert from 'node:assert';
import test from 'node:test';

async function getCompute() {
  return (await import('../src/lib/ephemeris.js')).compute_positions;
}

test('applies sidereal mode, converts to UTC, and uses provided coordinates', async () => {
  const compute_positions = await getCompute();
  let sidArgs = null;
  let jdArgs = null;
  let houseArgs = null;
  const fakeSwe = {
    ready: Promise.resolve(),
    SE_SIDM_LAHIRI: 42,
    SE_GREG_CAL: 0,
    SEFLG_SWIEPH: 1,
    SEFLG_SPEED: 2,
    SEFLG_SIDEREAL: 4,
    SE_SUN: 0,
    SE_MOON: 1,
    SE_MERCURY: 2,
    SE_VENUS: 3,
    SE_MARS: 4,
    SE_JUPITER: 5,
    SE_SATURN: 6,
    SE_URANUS: 7,
    SE_NEPTUNE: 8,
    SE_PLUTO: 9,
    SE_TRUE_NODE: 10,
    swe_set_sid_mode: (...args) => {
      sidArgs = args;
    },
    swe_julday: (y, m, d, ut, cal) => {
      jdArgs = { y, m, d, ut, cal };
      return 0;
    },
    swe_houses_ex: (jd, lat, lon, hsys, flag) => {
      houseArgs = { jd, lat, lon, hsys, flag };
      return {
        ascendant: 0,
        houses: Array.from({ length: 13 }, (_, i) => i * 30),
      };
    },
    swe_calc_ut: () => ({ longitude: 0, longitudeSpeed: 0 }),
  };

  await compute_positions(
    { datetime: '2020-01-01T05:30', tz: 'UTC+5:30', lat: 26.152, lon: 85.897 },
    fakeSwe
  );

  assert.deepStrictEqual(sidArgs, [fakeSwe.SE_SIDM_LAHIRI, 0, 0]);
  assert.deepStrictEqual(jdArgs, {
    y: 2020,
    m: 1,
    d: 1,
    ut: 0,
    cal: fakeSwe.SE_GREG_CAL,
  });
  assert.deepStrictEqual(houseArgs, {
    jd: 0,
    lat: 26.152,
    lon: 85.897,
    hsys: 'W',
    flag: fakeSwe.SEFLG_SWIEPH | fakeSwe.SEFLG_SPEED | fakeSwe.SEFLG_SIDEREAL,
  });
});

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
    SE_URANUS: 8,
    SE_NEPTUNE: 9,
    SE_PLUTO: 10,
    SE_TRUE_NODE: 7,
    SE_MEAN_NODE: 7,
    swe_julday: () => 0,
    swe_houses_ex: () => ({
      ascendant: 123,
      houses: [
        null,
        120,
        150,
        180,
        210,
        240,
        270,
        300,
        330,
        0,
        30,
        60,
        90,
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
        // Mercury has a small positive speed and is direct
        2: { longitude: 50, longitudeSpeed: 0.0001, flags: 0 },
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
      return data[id] || { longitude: 0, longitudeSpeed: 0, flags: 0 };
    },
  };

  const result = await compute_positions(
    { datetime: '2020-01-01T00:00', tz: 'UTC', lat: 0, lon: 0 },
    fakeSwe
  );

  assert.strictEqual(result.ascSign, 5); // Leo ascendant
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));

  assert.strictEqual(result.ascendant.lon, 123);
  assert.strictEqual(result.houses[1], 120);
  assert.strictEqual(planets.moon.sign, 8);
  assert.strictEqual(planets.moon.house, 4);
  assert.strictEqual(planets.moon.retro, true);
  assert.strictEqual(planets.mercury.retro, false);
  assert.strictEqual(planets.mars.house, 3);

  assert.strictEqual(planets.rahu.retro, true);
  assert.strictEqual(planets.rahu.house, 10);
  assert.strictEqual(planets.ketu.sign, 8);
  assert.strictEqual(planets.ketu.house, 4);
  assert.strictEqual(planets.ketu.retro, true);
  const diff = (planets.ketu.house - planets.rahu.house + 12) % 12;
  assert.strictEqual(diff, 6);
});
