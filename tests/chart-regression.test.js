const assert = require('node:assert');
const test = require('node:test');
const calculateChart = require('../src/calculateChart.js').default;

test('calculateChart matches AstroSage for Darbhanga 1982-12-01 03:50', async () => {
  const result = await calculateChart({
    date: '1982-12-01',
    time: '03:50',
    lat: 26.152,
    lon: 85.897,
    timezone: 'Asia/Calcutta',
  });

  // Ascendant sign
  assert.strictEqual(result.ascSign, 7);

  // Sign sequence (sign in each house)
  assert.deepStrictEqual(result.signInHouse, [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);

  // Expected house placement for each planet
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
  const expectedHouses = {
    sun: 2,
    moon: 8,
    mars: 6,
    mercury: 7,
    jupiter: 2,
    venus: 7,
    saturn: 1,
    rahu: 9,
    ketu: 3,
  };
  for (const [name, house] of Object.entries(expectedHouses)) {
    assert.strictEqual(planets[name].house, house, `${name} house`);
  }

  // Retrograde flags
  const expectedRetro = {
    sun: false,
    moon: false,
    mars: false,
    mercury: true,
    jupiter: true,
    venus: false,
    saturn: true,
    rahu: true,
    ketu: true,
  };
  for (const [name, retro] of Object.entries(expectedRetro)) {
    assert.strictEqual(planets[name].retro, retro, `${name} retrograde`);
  }

  // Combustion states
  const expectedCombust = {
    sun: false,
    moon: false,
    mars: false,
    mercury: false,
    jupiter: true,
    venus: false,
    saturn: false,
    rahu: false,
    ketu: false,
  };
  for (const [name, combust] of Object.entries(expectedCombust)) {
    assert.strictEqual(planets[name].combust, combust, `${name} combust`);
  }
});
