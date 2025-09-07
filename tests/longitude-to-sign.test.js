import assert from 'node:assert';
import test from 'node:test';

async function getFn() {
  return (await import('../src/calculateChart.js')).longitudeToSign;
}

test('longitudeToSign handles negative degrees', async () => {
  const longitudeToSign = await getFn();
  assert.deepStrictEqual(longitudeToSign(-5), {
    sign: 12,
    deg: 25,
    min: 0,
    sec: 0,
  });
});

test('longitudeToSign handles degrees over 360', async () => {
  const longitudeToSign = await getFn();
  assert.deepStrictEqual(longitudeToSign(365), {
    sign: 1,
    deg: 5,
    min: 0,
    sec: 0,
  });
});

test('exact boundary cases', async () => {
  const fn = await getFn();
  assert.deepStrictEqual(fn(0), { sign: 1, deg: 0, min: 0, sec: 0 });
  assert.deepStrictEqual(fn(29.99), {
    sign: 1,
    deg: 29,
    min: 59,
    sec: 24,
  });
  assert.deepStrictEqual(fn(30), { sign: 2, deg: 0, min: 0, sec: 0 });
});
