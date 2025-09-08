import assert from 'node:assert';
import test from 'node:test';
import { DateTime } from 'luxon';

test('toUTC drops sub-second fragments before converting', async () => {
  // Provide DateTime globally so timezone.js can import it without require.
  global.DateTime = DateTime;
  const { toUTC } = await import('../src/lib/timezone.js');
  const date = toUTC({
    datetime: '2024-05-15T12:34:56.789',
    zone: 'Asia/Kolkata',
  });
  assert.strictEqual(date.getUTCMilliseconds(), 0);
  assert.strictEqual(date.toISOString(), '2024-05-15T07:04:56.000Z');
  delete global.DateTime;
});
