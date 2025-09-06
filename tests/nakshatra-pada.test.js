import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('computePositions returns nakshatra and pada', async () => {
  const { computePositions } = await astro;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const mercury = data.planets.find((p) => p.name === 'mercury');
  assert.strictEqual(mercury.nakshatra, 'Vishakha');
  assert.strictEqual(mercury.pada, 3);
  const moon = data.planets.find((p) => p.name === 'moon');
  assert.strictEqual(moon.nakshatra, 'Rohini');
  assert.strictEqual(moon.pada, 1);
});
