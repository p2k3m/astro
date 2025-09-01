import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');
const summary = import('../src/lib/summary.js');

test('Venus within 10° of Sun flagged (C) in summary', async () => {
  const { computePositions } = await astro;
  const { summarizeChart } = await summary;
  const data = await computePositions('2023-08-13T00:00+00:00', 0, 0);
  const planets = Object.fromEntries(data.planets.map((p) => [p.name, p]));
  const venus = planets.venus;
  const sun = planets.sun;
  const diff = Math.abs((sun.lon - venus.lon + 180) % 360 - 180);
  assert.ok(diff < 10, `Venus should be within 10°, got ${diff.toFixed(2)}°`);
  assert.ok(venus.combust, 'Venus should be combust');
  const summaryData = summarizeChart(data);
  const venRow = summaryData.houses.find((h) => h.includes('Ve'));
  assert.ok(venRow && venRow.includes('(C)'), 'Venus row should include (C)');
});
