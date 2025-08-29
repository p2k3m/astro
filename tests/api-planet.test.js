const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');
const swisseph = require('../swisseph-v2');

test('GET /api/planet returns sidereal longitude', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const params = new URLSearchParams({
    date: '2023-01-01T00:00:00Z',
    lat: '0',
    lon: '0',
    planet: 'sun'
  });
  const res = await fetch(`http://localhost:${port}/api/planet?${params}`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  const jsDate = new Date('2023-01-01T00:00:00Z');
  const ut = jsDate.getUTCHours();
  const jd = swisseph.swe_julday(
    jsDate.getUTCFullYear(),
    jsDate.getUTCMonth() + 1,
    jsDate.getUTCDate(),
    ut,
    swisseph.SE_GREG_CAL
  );
  const flag =
    swisseph.SEFLG_SWIEPH |
    swisseph.SEFLG_SPEED |
    swisseph.SEFLG_SIDEREAL;
  const expected = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, flag);
  assert.ok(Math.abs(body.longitude - expected.longitude) < 1e-3);
  assert.strictEqual(typeof body.retrograde, 'boolean');
  assert.strictEqual(typeof body.combust, 'boolean');
});

test('GET /api/planet missing params returns 400', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const params = new URLSearchParams({
    date: '2023-01-01T00:00:00Z',
    lat: '0',
    lon: '0'
  });
  const res = await fetch(`http://localhost:${port}/api/planet?${params}`);
  assert.strictEqual(res.status, 400);
});
