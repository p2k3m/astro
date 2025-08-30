import assert from 'node:assert';
import test from 'node:test';

async function getCompute() {
  return (await import('../src/lib/ephemeris.js')).compute_positions;
}

test('Saturn degree and direct motion on 1982-12-28', async () => {
  const compute_positions = await getCompute();
  const result = compute_positions({
    datetime: '1982-12-28T00:00',
    tz: 'UTC',
    lat: 0,
    lon: 0,
  });
  const saturn = result.planets.find((p) => p.name === 'saturn');
  assert.ok(Math.abs(saturn.deg - 29.63) < 0.1);
  assert.ok(saturn.speed > 0, 'Saturn should be direct');
});
