const test = require('node:test');
const assert = require('node:assert');
const { computePositions } = require('../src/lib/astro.js');

// Ensure signInHouse rotates correctly from the ascendant and maintains cardinal orientation

test('computePositions produces houses in natural zodiac order', async () => {
  const data = await computePositions('2020-01-01T12:00+00:00', 0, 0);
  const k = data.ascSign;
  for (let h = 1; h <= 12; h++) {
    assert.strictEqual(data.signInHouse[h], (k - (h - 1) + 12) % 12);
  }
  assert.strictEqual(
    data.signInHouse[4],
    (data.signInHouse[1] - 3 + 12) % 12
  );
  assert.strictEqual(
    data.signInHouse[7],
    (data.signInHouse[1] - 6 + 12) % 12
  );
  assert.strictEqual(
    data.signInHouse[10],
    (data.signInHouse[1] - 9 + 12) % 12
  );
});
