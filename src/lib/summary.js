import { SIGN_NAMES } from './astro.js';
import { NAKSHATRA_NAME_TO_ABBR } from './nakshatra.js';

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

export function summarizeChart(data, { useNakshatraAbbr = false } = {}) {
  const ascSignName = SIGN_NAMES[data.ascSign - 1];
  let ascendant = ascSignName;
  if (data.ascendant?.nakshatra && data.ascendant?.pada) {
    const nak = useNakshatraAbbr
      ? NAKSHATRA_NAME_TO_ABBR[data.ascendant.nakshatra] ||
        data.ascendant.nakshatra
      : data.ascendant.nakshatra;
    ascendant += ` ${nak} ${data.ascendant.pada}`;
  }
  const moon = data.planets.find((p) => p.name === 'moon');
  const moonSign = SIGN_NAMES[(moon?.sign ?? 1) - 1]; // 1-based sign numbers
  // keep index 0 empty so houses are 1‑indexed
  const houses = Array(13).fill('');
  for (let h = 1; h <= 12; h += 1) {
    houses[h] = data.planets
      .filter((p) => p.house === h)
      .map((p) => {
        let abbr = PLANET_ABBR[p.name] || p.name.slice(0, 2);
        if (p.retro) abbr += '(R)';
        if (p.combust) abbr += '(C)';
        const degStr = formatDMS(p);
        let extra = '';
        if (p.nakshatra && p.pada) {
          const nak = useNakshatraAbbr
            ? NAKSHATRA_NAME_TO_ABBR[p.nakshatra] || p.nakshatra
            : p.nakshatra;
          extra = ` ${nak} ${p.pada}`;
        }
        const signName = SIGN_NAMES[(p.sign ?? 1) - 1];
        return `${signName} ${abbr} ${degStr}${extra}`;
      })
      .join(' ');
  }
  return { ascendant, moonSign, houses };
}
