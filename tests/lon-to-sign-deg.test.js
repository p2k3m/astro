import assert from 'node:assert';
import test from 'node:test';

async function getFn() {
  return (await import('../src/lib/ephemeris.js')).lonToSignDeg;
}

test('lonToSignDeg truncates fractional seconds per AstroSage', async () => {
  const lonToSignDeg = await getFn();
  const lon = 14 + 46 / 60 + 57.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 14,
    min: 46,
    sec: 57,
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

test('lonToSignDeg does not round up near sign change', async () => {
  const lonToSignDeg = await getFn();
  const lon = 29 + 59 / 60 + 59.9999 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg truncates near sign boundary without overflow', async () => {
  const lonToSignDeg = await getFn();
  const lon = 29 + 59 / 60 + 59.9 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg truncates and normalizes negative longitudes', async () => {
  const lonToSignDeg = await getFn();
  const lon = -(0.5 / 3600); // -0°0′0.5″ -> 359°59′59.5″
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 12,
    deg: 29,
    min: 59,
    sec: 59,
  });
});

test('lonToSignDeg truncates near 360° without overflow', async () => {
  const lonToSignDeg = await getFn();
  const lon = 359 + 59 / 60 + 59.9 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 12,
    deg: 29,
    min: 59,
    sec: 59,
  });
});
