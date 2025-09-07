import assert from 'node:assert';
import test from 'node:test';

async function getFn() {
  return (await import('../src/lib/ephemeris.js')).lonToSignDeg;
}

test('lonToSignDeg truncates fractional components per AstroSage', async () => {
  const lonToSignDeg = await getFn();
  const lon = 14 + 46 / 60 + 57.99 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 57,
  });
});

test('lonToSignDeg does not round up at sign boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = 29 + 59 / 60 + 59.99 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 29,
    min: 59,
    sec: 59,
  });
});
