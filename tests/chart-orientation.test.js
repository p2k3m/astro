const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('planet house values match sign mapping and nodes oppose each other', async () => {
  const data = await computePositions('2020-01-01T12:00+00:00', 0, 0);
  data.planets.forEach((p) => {
    assert.strictEqual(data.signInHouse[p.house], p.sign + 1);
  });
  const rahu = data.planets.find((p) => p.name === 'rahu');
  const ketu = data.planets.find((p) => p.name === 'ketu');
  assert.ok(rahu && ketu);
  assert.strictEqual((ketu.sign - rahu.sign + 12) % 12, 6);
  assert.strictEqual((ketu.house - rahu.house + 12) % 12, 6);
});
