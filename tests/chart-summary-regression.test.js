import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');
const summary = import('../src/lib/summary.js');

test('Chart summary for reference chart matches expected output', async () => {
  const { computePositions } = await astro;
  const { summarizeChart } = await summary;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(data.signInHouse[1], data.ascSign);
  const summaryData = summarizeChart(data);
  assert.deepStrictEqual(summaryData, {
    ascendant: 'Libra',
    moonSign: 'Taurus',
    houses: [
      '',
      'Me(R)(C) 29°13′15″ Ve 10°02′30″ Ju(R) 25°03′25″',
      'Su 14°46′28″',
      'Ke(R) 11°53′18″',
      '',
      '',
      'Ma 8°19′13″',
      '',
      'Mo 13°16′59″',
      'Ra(R) 11°53′18″',
      '',
      '',
      'Sa(R) 29°14′20″',
    ],
  });
});
