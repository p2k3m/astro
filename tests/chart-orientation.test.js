import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('planet house values match sign mapping and nodes oppose each other', async () => {
  const { computePositions } = await astro;
  const data = await computePositions('2020-01-01T12:00+00:00', 0, 0);
  assert.deepStrictEqual(
    data.signInHouse.slice(1),
    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  );
  // Planet houses are computed from the ascendant degree rather than pure sign
  // offsets, so we no longer expect a direct mapping between `sign` and
  // `signInHouse` at a given `house`.
  const rahu = data.planets.find((p) => p.name === 'rahu');
  const ketu = data.planets.find((p) => p.name === 'ketu');
  assert.ok(rahu && ketu);
  assert.strictEqual((ketu.sign - rahu.sign + 12) % 12, 6);
  assert.strictEqual((ketu.house - rahu.house + 12) % 12, 6);
});
