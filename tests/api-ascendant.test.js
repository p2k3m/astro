const assert = require('node:assert');
const test = require('node:test');
const app = require('../server/index.cjs');

test('GET /api/ascendant returns numeric longitude', async (t) => {
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
  assert.strictEqual(typeof body.longitude, 'number');
  // The ascendant should be a valid ecliptic longitude in the range [0, 360).
  assert.ok(body.longitude >= 0 && body.longitude < 360);
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
