const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');
const { summarizeChart } = require('../src/lib/summary.js');

test('houses 6-7 list expected planets for reference chart', async () => {
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const summary = summarizeChart(data);
  assert.strictEqual(summary.houses[6], 'Ma');
  assert.strictEqual(summary.houses[7], 'Me Ve');
});
