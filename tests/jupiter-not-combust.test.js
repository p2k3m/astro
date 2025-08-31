const assert = require('node:assert');
const test = require('node:test');
const { computePositions } = require('../src/lib/astro.js');

test('Saturn/Jupiter/Mercury direct and Jupiter not combust', async () => {
  const res = await computePositions('2022-10-07T00:00+00:00', 0, 0);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  for (const name of ['saturn', 'jupiter', 'mercury']) {
    assert.ok(!planets[name].retro, `${name} should be direct`);
  }
  const jupiter = planets.jupiter;
  const sun = planets.sun;
  const sunLon = sun.sign * 30 + sun.deg;
  const jLon = jupiter.sign * 30 + jupiter.deg;
  const diff = Math.abs((sunLon - jLon + 180) % 360 - 180);
  assert.ok(
    diff > 11,
    `separation should exceed combust threshold (got ${diff.toFixed(2)}°)`
  );
  assert.ok(!jupiter.combust, 'Jupiter should not be combust');
});
