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
  uranus: 'Ur',
  neptune: 'Ne',
  pluto: 'Pl',
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

test('Darbhanga chart summary lists degrees and signs', async () => {
  const { computePositions, SIGN_NAMES } = await astro;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.15216, 85.89707);
  const rows = data.planets.map((p) => {
    let abbr = PLANET_ABBR[p.name] || p.name.slice(0, 2);
    if (p.retro) abbr += '(R)';
    if (p.combust) abbr += '(C)';
    if (p.exalted) abbr += '(Ex)';
    const signNum = p.sign;
    const signName = SIGN_NAMES[signNum - 1];
    const degStr = formatDMS(p);
    return `${abbr} ${signName} ${degStr}`;
  });
  assert.deepStrictEqual(rows, [
    'Su Sagittarius 8°23′12″',
    'Mo Gemini 7°13′09″',
    'Me(C) Sagittarius 14°36′31″',
    'Ve(C) Sagittarius 15°01′51″',
    'Ma(Ex) Capricorn 22°46′05″',
    'Ju Scorpio 24°41′18″',
    'Sa Scorpio 0°09′23″',
    'Ur Sagittarius 5°06′03″',
    'Ne Sagittarius 26°04′59″',
    'Pl Libra 28°25′21″',
    'Ra Gemini 7°13′09″',
    'Ke Sagittarius 7°13′09″',
  ]);
});

