import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

test('computePositions returns nakshatra abbreviations when requested', async () => {
  const { computePositions } = await astro;
  const data = await computePositions(
    '1982-12-01T03:50+05:30',
    26.152,
    85.897,
    { nakshatraAbbr: true }
  );
  const mercury = data.planets.find((p) => p.name === 'mercury');
  assert.strictEqual(mercury.nakshatra, 'Jyes');
  const moon = data.planets.find((p) => p.name === 'moon');
  assert.strictEqual(moon.nakshatra, 'Rohi');
});
