import assert from 'node:assert';
import test from 'node:test';
import { computePositions } from '../src/lib/astro.js';
import { execFileSync } from 'node:child_process';

test('Saturn is direct on 1982-12-01', () => {
  const out = execFileSync('./swisseph/bin/swetest', [
    '-b1.12.1982',
    '-p6',
    '-sid1',
    '-fPls',
    '-n1',
  ]).toString();
  const match = out.match(/Saturn\s+[-+]?\d+\.\d+\s+([-+]?\d+\.\d+)/);
  const speed = match ? parseFloat(match[1]) : NaN;
  assert.ok(speed > 0, 'saturn should be direct');
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
  assert.ok(planets.jupiter.retro, 'jupiter should be retrograde');
});
