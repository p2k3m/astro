const assert = require('node:assert');
const test = require('node:test');

function buildLabel(p) {
  const degreeValue = Number(p.degree);
  const d = Math.floor(degreeValue);
  const m = Math.round((degreeValue - d) * 60);
  const degree = `${d}°${String(m).padStart(2, '0')}'`;
  return `${p.abbr} ${degree}${p.retrograde ? ' R' : ''}`;
}

test('retrograde label includes R', () => {
  const label = buildLabel({ abbr: 'Sa', degree: 10, retrograde: true });
  assert.ok(label.includes('R'));
});
