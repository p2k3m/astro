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

test('lonToSignDeg rounds near sign boundary with overflow', async () => {
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
  const lon = -(0.5 / 3600); // -0°0′0.5″ -> 359°59′59.5″
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 0,
    min: 0,
    sec: 0,
  });
});

test('lonToSignDeg rounds near 360° without overflow', async () => {
  const lonToSignDeg = await getFn();
  const lon = 359 + 59 / 60 + 59.5 / 3600;
  assert.deepStrictEqual(lonToSignDeg(lon), {
    sign: 1,
    deg: 0,
    min: 0,
    sec: 0,
  });
});
