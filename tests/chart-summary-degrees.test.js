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

test('Darbhanga chart summary lists degrees and signs', async () => {
  const { computePositions, SIGN_NAMES } = await astro;
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
  const rows = data.planets.map((p) => {
    let abbr = PLANET_ABBR[p.name] || p.name.slice(0, 2);
    if (p.retro) abbr += '(R)';
    if (p.combust) abbr += '(C)';
    if (p.exalted) abbr += '(Ex)';
    const signNum = p.sign + 1;
    const signName = SIGN_NAMES[signNum - 1];
    const degStr = formatDMS(p);
    return `${abbr} ${signName} ${degStr}`;
  });
  assert.deepStrictEqual(rows, [
    'Su Scorpio 14°46′28″',
    'Mo(Ex) Taurus 13°16′59″',
    'Me(R) Aries 29°13′15″',
    'Ve(C) Aries 10°02′30″',
    'Ma Pisces 8°19′13″',
    'Ju(R) Libra 25°03′25″',
    'Sa(R) Virgo 29°14′20″',
    'Ra(R) Gemini 11°53′18″',
    'Ke(R) Sagittarius 11°53′18″',
  ]);
});

