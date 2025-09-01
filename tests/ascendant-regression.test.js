import assert from 'node:assert';
import test from 'node:test';

const chart = import('../src/calculateChart.js');

test('Darbhanga 1982-10-27 03:50 ascendant regression', async () => {
  const { default: calculateChart } = await chart;
  const result = await calculateChart({
    date: '1982-10-27',
    time: '03:50',
    lat: 26.15216,
    lon: 85.89707,
    timezone: 'Asia/Calcutta',
  });

  assert.strictEqual(result.ascSign, 6);
  assert.deepStrictEqual(result.signInHouse, [null, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5]);
  assert.strictEqual(result.signInHouse[1], result.ascSign);

  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
  assert.strictEqual(planets.sun.house, 2);
  assert.strictEqual(planets.jupiter.house, 3);
  assert.strictEqual(planets.mars.house, 6);
});
