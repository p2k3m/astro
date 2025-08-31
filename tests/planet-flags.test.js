const assert = require('node:assert');
const test = require('node:test');

function buildLabel(p) {
  const degreeValue = Number(p.degree);
  const d = Math.floor(degreeValue);
  const m = Math.round((degreeValue - d) * 60);
  const degree = `${d}°${String(m).padStart(2, '0')}'`;
  let abbr = p.abbr;
  if (p.retrograde) abbr += '(R)';
  if (p.combust) abbr += '(C)';
  if (p.exalted) abbr += '(Ex)';
  return `${abbr} ${degree}`;
}

test('retrograde label includes (R)', () => {
  const label = buildLabel({ abbr: 'Sa', degree: 10, retrograde: true });
  assert.ok(label.startsWith('Sa(R)'));
});

test('combust label includes (C)', () => {
  const label = buildLabel({ abbr: 'Me', degree: 5, combust: true });
  assert.ok(label.startsWith('Me(C)'));
});

test('exalted label includes (Ex)', () => {
  const label = buildLabel({ abbr: 'Ju', degree: 15, exalted: true });
  assert.ok(label.startsWith('Ju(Ex)'));
});

test('sample planets are direct by default', () => {
  const sample = [
    { abbr: 'Su', degree: 0 },
    { abbr: 'Mo', degree: 15.5 },
    { abbr: 'Ma', degree: 27 },
  ];
  for (const p of sample) {
    const label = buildLabel(p);
    assert.ok(!label.includes('(R)'), `${p.abbr} should be direct`);
  }
});

