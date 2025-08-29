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

const SIGN_LABELS = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

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

  const houses = Array(12).fill(null);
  for (let i = 0; i < 12; i++) {
    houses[(asc.sign + i) % 12] = i + 1;
  }

  const flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
  const planetCodes = {
    Su: swisseph.SE_SUN,
    Mo: swisseph.SE_MOON,
    Ma: swisseph.SE_MARS,
    Me: swisseph.SE_MERCURY,
    Ju: swisseph.SE_JUPITER,
    Ve: swisseph.SE_VENUS,
    Sa: swisseph.SE_SATURN,
    Ra: swisseph.SE_TRUE_NODE,
  };

  const planets = [];
  const rahuData = swisseph.swe_calc_ut(jd, swisseph.SE_TRUE_NODE, flag);
  const { sign: rSign, deg: rDeg } = lonToSignDeg(rahuData.longitude);
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'Ra' ? rahuData : swisseph.swe_calc_ut(jd, code, flag);
    const { sign, deg } =
      name === 'Ra' ? { sign: rSign, deg: rDeg } : lonToSignDeg(data.longitude);
    planets.push({ name, sign, deg, retro: data.longitudeSpeed < 0 });
  }
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg } = lonToSignDeg(ketuLon);
  if (((kSign - rSign + 12) % 12) !== 6) {
    throw new Error('Rahu and Ketu are not opposite');
  }
  planets.push({ name: 'Ke', sign: kSign, deg: kDeg, retro: rahuData.longitudeSpeed < 0 });

  return { ascSign: asc.sign, houses, planets };
}

export function renderNorthIndian(svgEl, data) {
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  svgEl.setAttribute('viewBox', '0 0 100 100');
  svgEl.setAttribute('fill', 'none');
  svgEl.setAttribute('stroke', 'currentColor');

  const outer = document.createElementNS(svgNS, 'path');
  outer.setAttribute('d', diamondPath(50, 50, 50));
  outer.setAttribute('stroke-width', '2');
  svgEl.appendChild(outer);

  for (let i = 0; i < 12; i++) {
    const { cx, cy } = SIGN_BOX_CENTERS[i];

    const box = document.createElementNS(svgNS, 'path');
    box.setAttribute('d', diamondPath(cx, cy, BOX_SIZE));
    box.setAttribute('stroke-width', '1');
    svgEl.appendChild(box);

    const signText = document.createElementNS(svgNS, 'text');
    signText.setAttribute('x', cx);
    signText.setAttribute('y', cy - BOX_SIZE + 4);
    signText.setAttribute('text-anchor', 'middle');
    signText.setAttribute('font-size', '4');
    signText.textContent = SIGN_LABELS[i];
    svgEl.appendChild(signText);

    const houseNum = data.houses?.[i];
    if (houseNum) {
      const hText = document.createElementNS(svgNS, 'text');
      hText.setAttribute('x', cx - BOX_SIZE + 2);
      hText.setAttribute('y', cy - BOX_SIZE + 4);
      hText.setAttribute('font-size', '3');
      hText.textContent = String(houseNum);
      svgEl.appendChild(hText);
    }

    if (i === data.ascSign) {
      const ascText = document.createElementNS(svgNS, 'text');
      ascText.setAttribute('x', cx);
      ascText.setAttribute('y', cy + BOX_SIZE - 2);
      ascText.setAttribute('text-anchor', 'middle');
      ascText.setAttribute('font-size', '3');
      ascText.textContent = 'Asc';
      svgEl.appendChild(ascText);
    }

    const planets = data.planets.filter((p) => p.sign === i);
    let py = cy - BOX_SIZE / 2 + 8;
    planets.forEach((p) => {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', cx);
      t.setAttribute('y', py);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '3');
      const d = Math.floor(p.deg);
      const m = Math.round((p.deg - d) * 60);
      const degStr = `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'`;
      t.textContent = `${p.name} ${degStr}${p.retro ? ' R' : ''}`;
      svgEl.appendChild(t);
      py += 4;
    });
  }
}

