const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');

test('GET /api/planet returns expected fields', async (t) => {
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
  assert.strictEqual(typeof body.longitude, 'number');
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
