import { DateTime } from 'luxon';
import * as swisseph from '../../swisseph-v2/index.js';

const svgNS = 'http://www.w3.org/2000/svg';

// initialise Lahiri ayanāṃśa
if (swisseph.swe_set_sid_mode) {
  try {
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  } catch {}
}

function lonToSignDeg(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(norm / 30); // 0..11
  const deg = norm % 30;
  return { sign, deg };
}

export const BOX_SIZE = 12.5;
export const SIGN_BOX_CENTERS = [
  { cx: 50, cy: 12.5 }, // Aries
  { cx: 75, cy: 12.5 }, // Taurus
  { cx: 87.5, cy: 25 }, // Gemini
  { cx: 87.5, cy: 50 }, // Cancer
  { cx: 87.5, cy: 75 }, // Leo
  { cx: 75, cy: 87.5 }, // Virgo
  { cx: 50, cy: 87.5 }, // Libra
  { cx: 25, cy: 87.5 }, // Scorpio
  { cx: 12.5, cy: 75 }, // Sagittarius
  { cx: 12.5, cy: 50 }, // Capricorn
  { cx: 12.5, cy: 25 }, // Aquarius
  { cx: 25, cy: 12.5 }, // Pisces
];

// Sign label helpers. By default signs are labelled 1-12.
export const SIGN_NUMBERS = Array.from({ length: 12 }, (_, i) => String(i + 1));
export const SIGN_ABBREVIATIONS = [
  'Ar',
  'Ta',
  'Ge',
  'Cn',
  'Le',
  'Vi',
  'Li',
  'Sc',
  'Sg',
  'Cp',
  'Aq',
  'Pi',
];

export function getSignLabel(index, { useAbbreviations = false } = {}) {
  const labels = useAbbreviations ? SIGN_ABBREVIATIONS : SIGN_NUMBERS;
  return labels[index] ?? String(index + 1);
}

// Each entry defines the path and centre of a house polygon in the
// fixed AstroSage-style layout. Houses are numbered clockwise
// starting from the top diamond.
export const HOUSE_POLYGONS = [
  { d: 'M50 0 L25 25 L50 50 L75 25 Z', cx: 50, cy: 25 }, // 1
  { d: 'M75 25 L50 50 L50 0 Z', cx: 58.3333, cy: 25 }, // 2
  { d: 'M100 50 L50 0 L75 25 Z', cx: 75, cy: 25 }, // 3
  { d: 'M100 50 L75 25 L50 50 L75 75 Z', cx: 75, cy: 50 }, // 4
  { d: 'M75 75 L50 50 L100 50 Z', cx: 75, cy: 58.3333 }, // 5
  { d: 'M50 100 L100 50 L75 75 Z', cx: 75, cy: 75 }, // 6
  { d: 'M50 100 L75 75 L50 50 L25 75 Z', cx: 50, cy: 75 }, // 7
  { d: 'M25 75 L50 50 L50 100 Z', cx: 41.6667, cy: 75 }, // 8
  { d: 'M0 50 L25 75 L50 100 Z', cx: 25, cy: 75 }, // 9
  { d: 'M0 50 L25 25 L50 50 L25 75 Z', cx: 25, cy: 50 }, // 10
  { d: 'M25 25 L50 50 L0 50 Z', cx: 25, cy: 41.6667 }, // 11
  { d: 'M50 0 L0 50 L25 25 Z', cx: 25, cy: 25 }, // 12
];

export function diamondPath(cx, cy, size = BOX_SIZE) {
  return `M ${cx} ${cy - size} L ${cx + size} ${cy} L ${cx} ${cy + size} L ${cx - size} ${cy} Z`;
}

export async function computePositions(dtISOWithZone, lat, lon) {
  const dt = DateTime.fromISO(dtISOWithZone, { setZone: true });
  if (!dt.isValid) throw new Error('Invalid datetime');

  const date = dt.toJSDate();
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  const jd = swisseph.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    swisseph.SE_GREG_CAL
  );

  const hres = swisseph.swe_houses_ex(
    jd,
    lat,
    lon,
    'P',
    swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH
  );
  if (!hres || typeof hres.ascendant === 'undefined') {
    throw new Error('Could not compute ascendant from swisseph.');
  }
  const asc = lonToSignDeg(hres.ascendant);

  // house -> sign mapping (1-indexed)
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) {
    signInHouse[h] = (asc.sign + h - 1) % 12;
  }

  const flag =
    swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
  const planetCodes = {
    sun: swisseph.SE_SUN,
    moon: swisseph.SE_MOON,
    mars: swisseph.SE_MARS,
    mercury: swisseph.SE_MERCURY,
    jupiter: swisseph.SE_JUPITER,
    venus: swisseph.SE_VENUS,
    saturn: swisseph.SE_SATURN,
    rahu: swisseph.SE_TRUE_NODE,
  };

  const planets = [];
  const rahuData = swisseph.swe_calc_ut(jd, swisseph.SE_TRUE_NODE, flag);
  const { sign: rSign } = lonToSignDeg(rahuData.longitude);

  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : swisseph.swe_calc_ut(jd, code, flag);
    const { sign, deg } = lonToSignDeg(data.longitude);
    planets.push({
      name,
      sign,
      house: ((sign - asc.sign + 12) % 12) + 1,
      deg,
      retro: data.longitudeSpeed < 0,
    });
  }

  // Ketu is always opposite Rahu
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg } = lonToSignDeg(ketuLon);
  if (((kSign - rSign + 12) % 12) !== 6) {
    throw new Error('Rahu and Ketu are not opposite');
  }
  planets.push({
    name: 'ketu',
    sign: kSign,
    house: ((kSign - asc.sign + 12) % 12) + 1,
    deg: kDeg,
    retro: rahuData.longitudeSpeed < 0,
  });

  return { ascSign: asc.sign, signInHouse, planets };
}

export function renderNorthIndian(svgEl, data, options = {}) {
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  svgEl.setAttribute('viewBox', '0 0 100 100');
  svgEl.setAttribute('fill', 'none');
  svgEl.setAttribute('stroke', 'currentColor');

  const outer = document.createElementNS(svgNS, 'path');
  outer.setAttribute('d', diamondPath(50, 50, 50));
  outer.setAttribute('stroke-width', '2');
  svgEl.appendChild(outer);

  for (let h = 1; h <= 12; h++) {
    const poly = HOUSE_POLYGONS[h - 1];
    const { d, cx, cy } = poly;

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke-width', '1');
    svgEl.appendChild(path);

    const signIdx = data.signInHouse?.[h] ?? h - 1;

    const hText = document.createElementNS(svgNS, 'text');
    hText.setAttribute('x', cx);
    hText.setAttribute('y', cy - 6);
    hText.setAttribute('text-anchor', 'middle');
    hText.setAttribute('font-size', '3');
    hText.textContent = String(h);
    svgEl.appendChild(hText);

    if (h === 1) {
      const ascText = document.createElementNS(svgNS, 'text');
      ascText.setAttribute('x', cx);
      ascText.setAttribute('y', cy + 8);
      ascText.setAttribute('text-anchor', 'middle');
      ascText.setAttribute('font-size', '3');
      ascText.textContent = 'Asc';
      svgEl.appendChild(ascText);
    }

    const signText = document.createElementNS(svgNS, 'text');
    signText.setAttribute('x', cx);
    signText.setAttribute('y', cy);
    signText.setAttribute('text-anchor', 'middle');
    signText.setAttribute('font-size', '4');
    signText.textContent = getSignLabel(signIdx, options);
    svgEl.appendChild(signText);

    const planets = data.planets.filter((p) => p.sign === signIdx);
    let py = cy + 4;
    planets.forEach((p) => {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', cx);
      t.setAttribute('y', py);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '3');
      const dVal = Math.floor(p.deg);
      const m = Math.round((p.deg - dVal) * 60);
      const degStr = `${String(dVal).padStart(2, '0')}°${String(m).padStart(2, '0')}'`;
      t.textContent = `${p.name} ${degStr}${p.retro ? ' R' : ''}`;
      svgEl.appendChild(t);
      py += 4;
    });
  }
}

