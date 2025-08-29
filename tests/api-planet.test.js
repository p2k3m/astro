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

  test('Ketu is always opposite Rahu with matching retrograde', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  const base = { date: '2023-01-01T00:00:00Z', lat: '0', lon: '0' };
  const paramsRahu = new URLSearchParams({ ...base, planet: 'rahu' });
  const paramsKetu = new URLSearchParams({ ...base, planet: 'ketu' });

  const [resRahu, resKetu] = await Promise.all([
    fetch(`http://localhost:${port}/api/planet?${paramsRahu}`),
    fetch(`http://localhost:${port}/api/planet?${paramsKetu}`),
  ]);

  assert.strictEqual(resRahu.status, 200);
  assert.strictEqual(resKetu.status, 200);
  const [bodyRahu, bodyKetu] = await Promise.all([resRahu.json(), resKetu.json()]);

  const jsDate = new Date(base.date);
  const ut = jsDate.getUTCHours() + jsDate.getUTCMinutes() / 60 + jsDate.getUTCSeconds() / 3600;
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
  const rahuExpected = swisseph.swe_calc_ut(jd, swisseph.SE_TRUE_NODE, flag);

  const diff = (bodyKetu.longitude - bodyRahu.longitude + 360) % 360;
  assert.ok(Math.abs(diff - 180) < 1e-6);
  const expectedRetrograde = rahuExpected.longitudeSpeed < 0;
    assert.strictEqual(bodyRahu.retrograde, expectedRetrograde);
    assert.strictEqual(bodyKetu.retrograde, expectedRetrograde);
  });

  test('combustion detection marks close planets', async (t) => {
    const server = app.listen(0);
    t.after(() => server.close());
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();

    const base = { date: '2020-01-01T00:00:00Z', lat: '0', lon: '0' };
    const paramsJupiter = new URLSearchParams({ ...base, planet: 'jupiter' });
    const paramsMoon = new URLSearchParams({ ...base, planet: 'moon' });

    const [resJupiter, resMoon] = await Promise.all([
      fetch(`http://localhost:${port}/api/planet?${paramsJupiter}`),
      fetch(`http://localhost:${port}/api/planet?${paramsMoon}`),
    ]);

    assert.strictEqual(resJupiter.status, 200);
    assert.strictEqual(resMoon.status, 200);
    const [bodyJupiter, bodyMoon] = await Promise.all([
      resJupiter.json(),
      resMoon.json(),
    ]);

    assert.strictEqual(bodyJupiter.combust, true);
    assert.strictEqual(bodyMoon.combust, false);
  });

  test('exaltation and debilitation flags', async (t) => {
    const server = app.listen(0);
    t.after(() => server.close());
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();

    const base = { lat: '0', lon: '0' };
    const paramsSunEx = new URLSearchParams({
      ...base,
      date: '2020-05-01T00:00:00Z',
      planet: 'sun',
    });
    const paramsSunDeb = new URLSearchParams({
      ...base,
      date: '2020-11-01T00:00:00Z',
      planet: 'sun',
    });
    const paramsJupDeb = new URLSearchParams({
      ...base,
      date: '2020-08-01T00:00:00Z',
      planet: 'jupiter',
    });

    const [resEx, resDeb, resJupDeb] = await Promise.all([
      fetch(`http://localhost:${port}/api/planet?${paramsSunEx}`),
      fetch(`http://localhost:${port}/api/planet?${paramsSunDeb}`),
      fetch(`http://localhost:${port}/api/planet?${paramsJupDeb}`),
    ]);

    const [bodyEx, bodyDeb, bodyJupDeb] = await Promise.all([
      resEx.json(),
      resDeb.json(),
      resJupDeb.json(),
    ]);

    assert.strictEqual(bodyEx.exalted, true);
    assert.strictEqual(bodyEx.debilitated, false);
    assert.strictEqual(bodyDeb.debilitated, true);
    assert.strictEqual(bodyDeb.exalted, false);
    assert.strictEqual(bodyJupDeb.debilitated, true);
  });
