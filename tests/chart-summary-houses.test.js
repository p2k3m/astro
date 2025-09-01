const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');
const { summarizeChart } = require('../src/lib/summary.js');

test('summary lists planets in expected houses for reference chart', async () => {
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const summary = summarizeChart(data);
  const expected = {
    1: ['Sa(R)'],
    2: ['Su', 'Ju(R)'],
    3: ['Ke(R)'],
    6: ['Ma'],
    7: ['Ve'],
    8: ['Mo', 'Me(R)'],
    9: ['Ra(R)'],
  };
  for (const [house, planets] of Object.entries(expected)) {
    for (const abbr of planets) {
      assert.ok(summary.houses[house].includes(abbr), `house ${house} includes ${abbr}`);
    }
  }
});
