import assert from 'node:assert';
import test from 'node:test';

async function getFn() {
  return (await import('../src/lib/ephemeris.js')).lonToSignDeg;
}

test('lonToSignDeg floors fractional seconds per AstroSage', async () => {
  const lonToSignDeg = await getFn();
  const lon = 14 + 46 / 60 + 57.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 57,
  });
});

test('lonToSignDeg floors 0.5″ across minute boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = 14 + 59 / 60 + 59.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 14,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg floors 0.5″ across sign boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = 29 + 59 / 60 + 59.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg floors negative longitudes with 0.5″', async () => {
  const lonToSignDeg = await getFn();
  const lon = -(0.5 / 3600);
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 12,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg floors negative longitudes across sign boundary', async () => {
  const lonToSignDeg = await getFn();
  const lon = -(29 + 59 / 60 + 59.5 / 3600);
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 12,
    deg: 0,
    min: 0,
    sec: 0,
  });
});

test('lonToSignDeg normalizes longitudes greater than 360°', async () => {
  const lonToSignDeg = await getFn();
  const base = 14 + 46 / 60 + 57.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(base + 360), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 57,
  });
});

test('lonToSignDeg normalizes longitudes less than -360°', async () => {
  const lonToSignDeg = await getFn();
  const base = 14 + 46 / 60 + 57.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(base - 720), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 57,
  });
});

test('lonToSignDeg floors near 360° without wrapping', async () => {
  const lonToSignDeg = await getFn();
  const lon = 359 + 59 / 60 + 59.9 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 12,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

