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
      'Sa(R) 29°14′20″',
      'Su 14°46′28″ Ju(R) 25°03′25″',
      'Ke(R) 11°53′18″',
      '',
      '',
      'Ma 8°19′13″',
      'Ve 10°02′30″',
      'Mo 13°16′59″ Me(R) 29°13′15″',
      'Ra(R) 11°53′18″',
      '',
      '',
      '',
    ],
  });
});
