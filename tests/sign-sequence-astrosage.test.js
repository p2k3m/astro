import test from 'node:test';
import assert from 'node:assert';
import * as swe from '../swisseph/index.js';

const astro = import('../src/lib/astro.js');

test('sign sequence matches AstroSage for Darbhanga 1982-12-01 03:50', async () => {
  const { computePositions } = await astro;
  const result = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897, {
    sidMode: swe.SE_SIDM_LAHIRI,
    houseSystem: 'W',
    nodeType: 'mean',
  });
  // Ascendant sign should populate the first house
  assert.strictEqual(result.signInHouse[1], result.ascSign);
  // The sequence should progress sequentially
  assert.deepStrictEqual(result.signInHouse.slice(1), [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);
});
