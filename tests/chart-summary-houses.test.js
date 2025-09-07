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
    1: ['Pl'],
    2: ['Ju', 'Sa'],
    3: ['Su', 'Me(C)', 'Ve(C)', 'Ur', 'Ne', 'Ke'],
    4: ['Ma'],
    9: ['Mo', 'Ra'],
  };
  for (const [house, planets] of Object.entries(expected)) {
    for (const abbr of planets) {
      assert.ok(summaryData.houses[house].includes(abbr), `house ${house} includes ${abbr}`);
    }
  }
});
