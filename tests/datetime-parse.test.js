const test = require('node:test');
const assert = require('node:assert');

function load() {
  return import('../src/lib/parseDateTime.js');
}

test('parses ambiguous dates by locale', async () => {
  const { parseDateInput } = await load();
  assert.strictEqual(parseDateInput('03-04-2023', 'en-US'), '2023-03-04');
  assert.strictEqual(parseDateInput('03-04-2023', 'en-GB'), '2023-04-03');
});

test('converts 12-hour time and preserves AM/PM', async () => {
  const { parseTimeInput, formatTime24To12 } = await load();
  const am = parseTimeInput('12:30', 'AM');
  const backAm = formatTime24To12(am);
  assert.strictEqual(am, '00:30');
  assert.deepStrictEqual(backAm, { time: '12:30', ampm: 'AM' });

  const pm = parseTimeInput('3:15', 'PM');
  const backPm = formatTime24To12(pm);
  assert.strictEqual(pm, '15:15');
  assert.deepStrictEqual(backPm, { time: '3:15', ampm: 'PM' });
});

test('accepts zero-padded hour times', async () => {
  const { parseTimeInput } = await load();
  assert.strictEqual(parseTimeInput('08:05', 'AM'), '08:05');
  assert.strictEqual(parseTimeInput('08:05', 'PM'), '20:05');
});

test('rejects invalid date and time', async () => {
  const { parseDateInput, parseTimeInput } = await load();
  assert.strictEqual(parseDateInput('31-02-2023', 'en-GB'), null);
  assert.strictEqual(parseTimeInput('13:00', 'AM'), null);
});
