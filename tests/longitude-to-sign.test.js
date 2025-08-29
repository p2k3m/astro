const assert = require('node:assert');
const test = require('node:test');

async function getFn() {
  return (await import('../src/calculateChart.js')).longitudeToSign;
}

test('longitudeToSign handles negative degrees', async () => {
  const longitudeToSign = await getFn();
  assert.deepStrictEqual(longitudeToSign(-5), { sign: 12, degree: 25 });
});

test('longitudeToSign handles degrees over 360', async () => {
  const longitudeToSign = await getFn();
  assert.deepStrictEqual(longitudeToSign(365), { sign: 1, degree: 5 });
});
