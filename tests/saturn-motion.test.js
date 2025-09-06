import assert from 'node:assert';
import test from 'node:test';
import { computePositions } from '../src/lib/astro.js';

test('Saturn is retrograde on 1982-12-01', async () => {
  const res = await computePositions('1982-12-01T00:00+00:00', 0, 0);
  const saturn = res.planets.find((p) => p.name === 'saturn');
  assert.strictEqual(saturn.sign, 5, 'saturn sign');
  assert.ok(saturn.retro, 'saturn should be retrograde');
});

test('Saturn degree and direct motion on 1982-12-28', async () => {
  const result = await computePositions('1982-12-28T00:00+00:00', 0, 0);
  const planets = Object.fromEntries(result.planets.map((p) => [p.name, p]));
  const saturn = planets.saturn;
  const satDeg = saturn.deg + saturn.min / 60 + saturn.sec / 3600;
  assert.ok(Math.abs(satDeg - 28.63) < 0.1);
  const direct = ['sun', 'moon', 'mercury', 'venus', 'mars', 'saturn'];
  for (const name of direct) {
    assert.ok(!planets[name].retro, `${name} should be direct`);
  }
});

