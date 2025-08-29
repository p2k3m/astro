const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');

test('calculateChart assigns ascendant sign to first house for multiple charts', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  const originalFetch = global.fetch;
  global.fetch = (url, opts) => {
    if (typeof url === 'string') {
      if (url.startsWith('/api/')) {
        return originalFetch(`http://localhost:${port}${url}`, opts);
      }
      if (url.startsWith('https://www.timeapi.io')) {
        return Promise.reject(new Error('no external fetch'));
      }
    }
    return originalFetch(url, opts);
  };
  t.after(() => {
    global.fetch = originalFetch;
  });

  const calculateChart = (await import('../src/calculateChart.js')).default;

  const verify = async (params) => {
    const chart = await calculateChart(params);
    const asc = chart.ascendant.sign;
    assert.strictEqual(chart.houses[asc], 1);
    const sun = chart.planets.find((p) => p.name === 'sun');
    assert.strictEqual(sun.house, chart.houses[sun.sign]);
  };

  await t.test('Libra ascendant', () =>
    verify({ date: '2020-10-17', time: '19:00', lat: 0, lon: 0 })
  );

  await t.test('Gemini ascendant', () =>
    verify({ date: '2020-04-01', time: '00:00', lat: 0, lon: 0 })
  );
});
