import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');
const summary = import('../src/lib/summary.js');

test('summary lists planets in expected houses for reference chart', async () => {
  const { computePositions } = await astro;
  const { summarizeChart } = await summary;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const summaryData = summarizeChart(data);
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
      assert.ok(summaryData.houses[house].includes(abbr), `house ${house} includes ${abbr}`);
    }
  }
});
