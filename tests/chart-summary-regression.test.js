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
    moonSign: 'Gemini',
    houses: [
      '',
      'Pl 28°25′21″ Vishakha 3',
      'Ju 24°41′18″ Jyeshtha 3 Sa 0°09′23″ Vishakha 4',
      'Su 8°23′12″ Mula 3 Me(C) 14°36′31″ Purva Ashadha 1 Ve(C) 15°01′51″ Purva Ashadha 1 Ur 5°06′03″ Mula 2 Ne 26°04′59″ Purva Ashadha 4 Ke 7°13′09″ Mula 3',
      'Ma 22°46′05″ Shravana 4',
      '',
      '',
      '',
      '',
      'Mo 7°13′09″ Ardra 1 Ra 7°13′09″ Ardra 1',
      '',
      '',
      '',
    ],
  });
});
