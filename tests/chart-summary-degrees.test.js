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
  const data = await computePositions('1982-12-01T03:50+05:30', 26.152, 85.897);
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
    'Su Scorpio 14°46′24″',
    'Mo(Ex) Taurus 13°36′21″',
    'Me(C) Scorpio 20°59′43″',
    'Ve(C) Scorpio 21°25′03″',
    'Ma Sagittarius 29°09′17″',
    'Ju Scorpio 1°04′29″',
    'Sa(Ex) Libra 6°32′35″',
    'Ur Scorpio 11°29′15″',
    'Ne Sagittarius 2°28′10″',
    'Pl Libra 4°48′32″',
    'Ra(R) Gemini 11°53′16″',
    'Ke(R) Sagittarius 11°53′16″',
  ]);
});

