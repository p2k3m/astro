import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('Darbhanga 1982-12-01 03:50 ascendant and sign sequence', async () => {
  const { computePositions } = await astro;
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  assert.strictEqual(result.ascSign, 7);
  assert.strictEqual(result.signInHouse[1], result.ascSign);
  assert.deepStrictEqual(result.signInHouse, [null, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);
});

test('Darbhanga 1982-12-01 15:50 ascendant and sign sequence', async () => {
  const { computePositions } = await astro;
  const result = await computePositions('1982-12-01T15:50+05:30', 26.152, 85.897);
  assert.strictEqual(result.ascSign, 1);
  assert.strictEqual(result.signInHouse[1], result.ascSign);
  assert.deepStrictEqual(result.signInHouse, [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});
