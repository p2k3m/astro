const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

// Reference chart generated with AstroSage for
// Darbhanga, India on 1982-12-01 at 03:50 (UTC+5:30)
// Signs are 0=Aries .. 11=Pisces; houses are 1..12.
const reference = {
  sun: { sign: 7, house: 8 },
  moon: { sign: 1, house: 2 },
  mars: { sign: 11, house: 12 },
  mercury: { sign: 0, house: 1 },
  jupiter: { sign: 6, house: 7 },
  venus: { sign: 0, house: 1 },
  saturn: { sign: 5, house: 6 },
  rahu: { sign: 2, house: 3 },
  ketu: { sign: 8, house: 9 },
};

test('computePositions matches AstroSage reference for Darbhanga 1982-12-01 03:50', async () => {
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
  const rows = Object.keys(reference).map((name) => ({
    planet: name,
    expectedSign: reference[name].sign,
    actualSign: planets[name].sign,
    expectedHouse: reference[name].house,
    actualHouse: planets[name].house,
  }));

  console.table(rows);

  for (const row of rows) {
    assert.strictEqual(row.actualSign, row.expectedSign, `${row.planet} sign`);
    assert.strictEqual(row.actualHouse, row.expectedHouse, `${row.planet} house`);
  }
});
