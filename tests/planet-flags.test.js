import assert from 'node:assert';
import test from 'node:test';

const astro = import('../src/lib/astro.js');

const PLANET_ABBR = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
};

function formatDMS(p) {
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
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}

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

test('Venus near the Sun shows combust flag', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('2023-08-13T00:00+00:00', 0, 0);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const venus = planets.venus;
  assert.ok(venus.combust, 'Venus should be combust');
  const label = buildLabel({ ...venus, abbr: 'Ve', retrograde: venus.retro });
  assert.ok(label.includes('(C)'), 'label should include (C)');
});

test('Mercury combust and Venus not combust for Darbhanga chart', async () => {
  const { computePositions } = await astro;
  const res = await computePositions('1982-12-01T03:50+05:30', 26.15216, 85.89707);
  const planets = Object.fromEntries(res.planets.map((p) => [p.name, p]));
  const mercury = planets.mercury;
  const venus = planets.venus;
  assert.ok(mercury.combust, 'Mercury should be combust for Darbhanga chart');
  assert.ok(!venus.combust, 'Venus should not be combust for Darbhanga chart');
  const mLabel = buildLabel({ ...mercury, abbr: 'Me', retrograde: mercury.retro });
  assert.ok(mLabel.includes('(C)'), 'Mercury label should include (C)');
  const vLabel = buildLabel({ ...venus, abbr: 'Ve', retrograde: venus.retro });
  assert.ok(!vLabel.includes('(C)'), 'Venus label should not include (C)');
});

test('combust planets show (C) in chart summary', async () => {
  const { computePositions, SIGN_NAMES } = await astro;
  const res = await computePositions('2023-08-13T00:00+00:00', 0, 0);
  const rows = res.planets.map((p) => {
    let abbr = PLANET_ABBR[p.name] || p.name.slice(0, 2);
    if (p.retro) abbr += '(R)';
    if (p.combust) abbr += '(C)';
    const signNum = p.sign + 1;
    const signName = SIGN_NAMES[signNum - 1];
    const degStr = formatDMS(p);
    return `${abbr} ${signName} ${degStr}`;
  });
  const hasVenusCombust = rows.some((r) => r.startsWith('Ve(C)'));
  assert.ok(hasVenusCombust, 'summary should include Ve(C)');
});

