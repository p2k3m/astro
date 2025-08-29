const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');
const swisseph = require('../swisseph-v2');

test('GET /api/ascendant returns sidereal longitude', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const params = new URLSearchParams({
    date: '2023-01-01T00:00:00Z',
    lat: '0',
    lon: '0'
  });
  const res = await fetch(`http://localhost:${port}/api/ascendant?${params}`);
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
  const houses = swisseph.swe_houses_ex(
    jd,
    0,
    0,
    'P',
    swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH
  );
  assert.ok(Math.abs(body.longitude - houses.ascendant) < 1e-3);
});

test('GET /api/ascendant missing params returns 400', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const params = new URLSearchParams({
    date: '2023-01-01T00:00:00Z',
    lat: '0'
  });
  const res = await fetch(`http://localhost:${port}/api/ascendant?${params}`);
  assert.strictEqual(res.status, 400);
});
