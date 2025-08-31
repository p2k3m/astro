const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Jupiter is not combust', async () => {
  const res = await computePositions('2022-10-07T00:00+00:00', 0, 0);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const jupiter = planets.jupiter;
  const sun = planets.sun;
  const sunLon =
    sun.sign * 30 + sun.deg + sun.min / 60 + sun.sec / 3600;
  const jLon =
    jupiter.sign * 30 + jupiter.deg + jupiter.min / 60 + jupiter.sec / 3600;
  const diff = Math.abs((sunLon - jLon + 180) % 360 - 180);
  assert.ok(
    diff > 11,
    `separation should exceed combust threshold (got ${diff.toFixed(2)}°)`
  );
  assert.ok(!jupiter.combust, 'Jupiter should not be combust');
});
