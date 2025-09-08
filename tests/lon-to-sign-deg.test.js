import assert from 'node:assert';
import test from 'node:test';

async function getFn() {
  return (await import('../src/lib/ephemeris.js')).lonToSignDeg;
}

test('lonToSignDeg rounds fractional seconds per AstroSage', async () => {
  const lonToSignDeg = await getFn();
  const lon = 14 + 46 / 60 + 57.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 58,
  });
});

test('lonToSignDeg normalizes longitudes greater than 360°', async () => {
  const lonToSignDeg = await getFn();
  const base = 14 + 46 / 60 + 57.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(base + 360), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 58,
  });
});

test('lonToSignDeg rounds down just below sign boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = 29 + 59 / 60 + 59.4 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg rounds up across sign boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = 29 + 59 / 60 + 59.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 2,
    deg: 0,
    min: 0,
    sec: 0,
  });
});

test('lonToSignDeg rounds and normalizes negative longitudes', async () => {
  const lonToSignDeg = await getFn();
  const lon = -(0.5 / 3600); // -0°0′0.5″ -> 359°59′59.5″ -> 0°0′0″
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 0,
    min: 0,
    sec: 0,
  });
});

test('lonToSignDeg rounds negative longitudes across sign boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = -(29 + 59 / 60 + 59.5 / 3600); // -> 330°0′0.5″ -> 330°0′1″
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 12,
    deg: 0,
    min: 0,
    sec: 1,
  });
});

test('lonToSignDeg rounds near 360° to Aries', async () => {
  const lonToSignDeg = await getFn();
  const lon = 359 + 59 / 60 + 59.9 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 0,
    min: 0,
    sec: 0,
  });
});
