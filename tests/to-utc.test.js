import assert from 'node:assert';
import test from 'node:test';
test('toUTC drops sub-second fragments before converting', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({
    datetime: '2024-05-15T12:34:56.789',
    zone: 'Asia/Kolkata',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-15T07:04:56.000Z');
});

test('toUTC truncates without overflowing to next minute', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({
    datetime: '2024-05-15T12:34:59.999',
    zone: 'Asia/Kolkata',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-15T07:04:59.000Z');
});

test('toUTC truncates before converting across negative offsets', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({
    datetime: '2024-05-15T00:00:00.999',
    zone: 'America/New_York',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-15T04:00:00.000Z');
});
