const test = require('node:test');
const assert = require('node:assert');

// Ensure calculateChart yields a natural zodiac sequence of signs
// starting from the ascendant sign.
test('calculateChart produces houses in natural zodiac order', async () => {
  const calculateChart = (await import('../src/calculateChart.js')).default;

  const data = await calculateChart({
    date: '2020-01-01',
    time: '12:00',
    lat: 0,
    lon: 0,
  });

  const asc = data.ascendant.sign;
  const expected = Array(13).fill(null);
  for (let i = 0; i < 12; i++) {
    const house = i + 1;
    const sign = ((asc - 1 + i) % 12) + 1;
    expected[house] = sign;
  }
  assert.deepStrictEqual(data.houses, expected);
});
