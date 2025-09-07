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
    ascendant: 'Libra Swati 4',
    moonSign: 'Taurus',
    houses: [
      '',
      'Libra Sa 6°32′35″ Chitra 4 Libra Pl 4°48′33″ Chitra 4',
      'Scorpio Su 14°46′24″ Anuradha 4 Scorpio Me(C) 20°59′44″ Jyeshtha 2 Scorpio Ve(C) 21°25′03″ Jyeshtha 2 Scorpio Ju 1°04′30″ Vishakha 4 Scorpio Ur 11°29′15″ Anuradha 3 Scorpio Ke 13°36′21″ Anuradha 4',
      'Sagittarius Ma 29°09′17″ Uttara Ashadha 1 Sagittarius Ne 2°28′11″ Mula 1',
      '',
      '',
      '',
      '',
      'Taurus Mo 13°36′21″ Rohini 2 Taurus Ra 13°36′21″ Rohini 2',
      '',
      '',
      '',
      '',
    ],
  });
});
