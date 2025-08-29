const test = require('node:test');
const assert = require('node:assert');

// Ensure calculateChart yields a natural zodiac sequence of houses
// starting from the ascendant sign.
test('calculateChart produces houses in natural zodiac order', async () => {
  const calculateChart = (await import('../src/calculateChart.js')).default;

  // Stub fetch response for consolidated ephemeris endpoint
  global.fetch = async (url) => {
    if (url.startsWith('/api/positions')) {
      return { ok: true, json: async () => ({ asc_sign: 4, planets: [] }) };
    }
    throw new Error('Unexpected URL ' + url);
  };

  const data = await calculateChart({
    date: '2020-01-01',
    time: '12:00',
    lat: 0,
    lon: 0,
  });

  assert.deepStrictEqual(data.houses, [4,5,6,7,8,9,10,11,12,1,2,3]);
});
