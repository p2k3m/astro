const assert = require('node:assert');
const test = require('node:test');

async function getFn() {
  return (await import('../src/calculateChart.js')).longitudeToSign;
}

test('longitudeToSign handles negative degrees', async () => {
  const longitudeToSign = await getFn();
  assert.deepStrictEqual(longitudeToSign(-5), { sign: 11, degree: 25 });
});

test('longitudeToSign handles degrees over 360', async () => {
  const longitudeToSign = await getFn();
  assert.deepStrictEqual(longitudeToSign(365), { sign: 0, degree: 5 });
});

test('exact boundary cases', async () => {
  const fn = await getFn();
  assert.deepStrictEqual(fn(0), { sign: 0, degree: 0 });
  assert.deepStrictEqual(fn(29.99), { sign: 0, degree: 29.99 });
  assert.deepStrictEqual(fn(30), { sign: 1, degree: 0 });
});
