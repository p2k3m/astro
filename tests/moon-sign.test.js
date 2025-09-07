import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');
const summary = import('../src/lib/summary.js');

test('Moon sign for sample chart is Gemini', async () => {
  const { computePositions } = await astro;
  const { summarizeChart } = await summary;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const summaryData = summarizeChart(data);
  assert.strictEqual(summaryData.moonSign, 'Gemini');
});
