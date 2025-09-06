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
      'Me(R)(C) 29°13′15″ Vishakha 3 Ve(C) 10°02′30″ Swati 2 Ju(R) 25°03′25″ Vishakha 2 Pl(R) 2°17′25″ Chitra 3',
      'Su 14°46′28″ Anuradha 4 Ur(R) 11°14′52″ Anuradha 3',
      'Ne(R) 3°41′38″ Mula 2 Ke(R) 11°53′18″ Mula 4',
      '',
      '',
      'Ma 8°19′13″ Uttara Bhadrapada 2',
      '',
      'Mo 13°16′59″ Rohini 1',
      'Ra(R) 11°53′18″ Ardra 2',
      '',
      '',
      'Sa(R) 29°14′20″ Chitra 2',
    ],
  });
});
