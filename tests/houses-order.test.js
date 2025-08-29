const test = require('node:test');
const assert = require('node:assert');

// Ensure calculateChart yields a natural zodiac sequence of houses
// starting from the ascendant sign.
test('calculateChart produces houses in natural zodiac order', async () => {
  const calculateChart = (await import('../src/calculateChart.js')).default;

  // Stub fetch responses for timezone, ascendant, and planets
  global.fetch = async (url) => {
    if (url.startsWith('https://www.timeapi.io')) {
      return { ok: true, json: async () => ({ currentUtcOffset: { hours: 0, minutes: 0 } }) };
    }
    if (url.startsWith('/api/ascendant')) {
      return { ok: true, json: async () => ({ longitude: 90 }) };
    }
    if (url.startsWith('/api/planet')) {
      return { ok: true, json: async () => ({ longitude: 0 }) };
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
