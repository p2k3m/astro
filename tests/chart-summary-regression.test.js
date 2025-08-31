const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');
const { summarizeChart } = require('../src/lib/summary.js');

test('Chart summary for reference chart matches expected output', async () => {
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(data.signInHouse[1], data.ascSign);
  const summary = summarizeChart(data);
  assert.deepStrictEqual(summary, {
    ascendant: 'Libra',
    moonSign: 'Taurus',
    houses: [
      '',
      'Ju',
      'Su',
      'Ke',
      '',
      '',
      'Me Ve',
      'Ma',
      'Mo',
      'Ra',
      '',
      '',
      'Sa',
    ],
  });
});
