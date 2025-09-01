const assert = require('node:assert');
const test = require('node:test');

function buildLabel(p) {
  let d = p.deg;
  let m = p.min;
  let s = p.sec;
  if (typeof m !== 'number' || typeof s !== 'number') {
    const dVal = Math.floor(p.deg);
    const mFloat = (p.deg - dVal) * 60;
    const mVal = Math.floor(mFloat);
    const sVal = Math.round((mFloat - mVal) * 60);
    d = dVal;
    m = mVal;
    s = sVal;
  }
  const degree = `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
  let abbr = p.abbr;
  if (p.retrograde) abbr += '(R)';
  if (p.combust) abbr += '(C)';
  if (p.exalted) abbr += '(Ex)';
  return `${abbr} ${degree}`;
}

test('retrograde label includes (R)', () => {
  const label = buildLabel({ abbr: 'Sa', deg: 10, min: 0, sec: 0, retrograde: true });
  assert.ok(label.startsWith('Sa(R)'));
});

test('combust label includes (C)', () => {
  const label = buildLabel({ abbr: 'Me', deg: 5, min: 0, sec: 0, combust: true });
  assert.ok(label.startsWith('Me(C)'));
});

test('exalted label includes (Ex)', () => {
  const label = buildLabel({ abbr: 'Ju', deg: 15, min: 0, sec: 0, exalted: true });
  assert.ok(label.startsWith('Ju(Ex)'));
});

test('sample planets are direct by default', () => {
  const sample = [
    { abbr: 'Su', deg: 0, min: 0, sec: 0 },
    { abbr: 'Mo', deg: 15, min: 30, sec: 0 },
    { abbr: 'Ma', deg: 27, min: 0, sec: 0 },
  ];
  for (const p of sample) {
    const label = buildLabel(p);
    assert.ok(!label.includes('(R)'), `${p.abbr} should be direct`);
  }
});

