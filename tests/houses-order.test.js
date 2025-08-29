const test = require('node:test');
const assert = require('node:assert');

// Ensure calculateChart yields a natural zodiac sequence of houses
// starting from the ascendant sign.
test('calculateChart produces houses in natural zodiac order', async () => {
  const calculateChart = (await import('../src/calculateChart.js')).default;

  const data = await calculateChart({
    date: '2020-01-01',
    time: '12:00',
    lat: 0,
    lon: 0,
  });

  const start = data.houses[0];
  const expected = Array.from({ length: 12 }, (_, i) => ((start + i - 1) % 12) + 1);
  assert.deepStrictEqual(data.houses, expected);
});
