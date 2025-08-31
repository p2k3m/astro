import assert from 'node:assert';
import test from 'node:test';
import { computePositions } from '../src/lib/astro.js';

test('Saturn degree and direct motion on 1982-12-28', async () => {
  const result = await computePositions('1982-12-28T00:00+00:00', 0, 0);
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
  const saturn = planets.saturn;
  assert.ok(Math.abs(saturn.deg - 29.63) < 0.1);
  const direct = ['sun', 'moon', 'mercury', 'venus', 'mars', 'saturn'];
  for (const name of direct) {
    assert.ok(!planets[name].retro, `${name} should be direct`);
  }
  assert.ok(planets.jupiter.retro, 'jupiter should be retrograde');
});
