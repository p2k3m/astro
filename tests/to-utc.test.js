import assert from 'node:assert';
import test from 'node:test';
test('toUTC uses offset in ISO timestamp when no zone given', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({ datetime: '2024-05-15T12:34:56.789+05:30' });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-15T07:04:56.000Z');
});
test('toUTC drops sub-second fragments before converting', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({
    datetime: '2024-05-15T12:34:56.789',
    zone: 'Asia/Kolkata',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-15T07:04:56.000Z');
});

test('toUTC truncates half-second values', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({
    datetime: '2024-05-15T12:34:56.500',
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
    datetime: '2024-05-15T23:59:59.999',
    zone: 'America/New_York',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-16T03:59:59.000Z');
});

test('toUTC truncates before converting across positive offsets', async () => {
  const { toUTC } = await import('../src/lib/ephemeris.js');
  const date = toUTC({
    datetime: '2024-05-15T00:00:00.999',
    zone: 'Asia/Kolkata',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-14T18:30:00.000Z');
});
