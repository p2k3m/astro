const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');
const { summarizeChart } = require('../src/lib/summary.js');

test('summary lists planets in expected houses for reference chart', async () => {
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const summary = summarizeChart(data);
  const expected = {
    1: 'Sa',
    2: 'Su Ju',
    3: 'Ke',
    6: 'Ma',
    7: 'Ve',
    8: 'Mo Me',
    9: 'Ra',
  };
  for (const [house, planets] of Object.entries(expected)) {
    assert.strictEqual(summary.houses[house], planets, `house ${house}`);
  }
});
