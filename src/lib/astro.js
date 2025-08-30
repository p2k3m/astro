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

export const BOX_SIZE = 0.125;
export const SIGN_BOX_CENTERS = [
  { cx: 0.5, cy: 0.125 }, // Aries
  { cx: 0.75, cy: 0.125 }, // Taurus
  { cx: 0.875, cy: 0.25 }, // Gemini
  { cx: 0.875, cy: 0.5 }, // Cancer
  { cx: 0.875, cy: 0.75 }, // Leo
  { cx: 0.75, cy: 0.875 }, // Virgo
  { cx: 0.5, cy: 0.875 }, // Libra
  { cx: 0.25, cy: 0.875 }, // Scorpio
  { cx: 0.125, cy: 0.75 }, // Sagittarius
  { cx: 0.125, cy: 0.5 }, // Capricorn
  { cx: 0.125, cy: 0.25 }, // Aquarius
  { cx: 0.25, cy: 0.125 }, // Pisces
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

// Derive chart geometry and house polygons programmatically.
function buildHouseGeometry(scale = 1) {
  const O = [0.5, 0.5];
  const mid = [
    [0.5, 0],
    [1, 0.5],
    [0.5, 1],
    [0, 0.5],
  ];
  const inter = [
    { cw: [0.75, 0.25], ccw: [0.25, 0.25] },
    { cw: [0.75, 0.75], ccw: [0.75, 0.25] },
    { cw: [0.25, 0.75], ccw: [0.75, 0.75] },
    { cw: [0.25, 0.25], ccw: [0.25, 0.75] },
  ];

  const pathFrom = (pts) =>
    pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x * scale} ${y * scale}`)
      .join(' ') + ' Z';

  const cells = [];
  for (let i = 0; i < 4; i++) {
    const p0 = mid[i];
    const pCW = inter[i].cw;
    const pCCW = inter[i].ccw;
    const pNext = mid[(i + 1) % 4];

    const kite = i === 3 ? [p0, pCW, O, pCCW] : [p0, pCCW, O, pCW];
    cells.push(kite);

    const triSide = [pCW, O, p0];
    cells.push(triSide);

    const triCorner = i === 2 ? [pNext, pCW, p0] : [pNext, p0, pCW];
    cells.push(triCorner);
  }

  const outer = pathFrom(mid);
  const inner = pathFrom([
    inter[3].cw,
    inter[0].cw,
    inter[1].cw,
    inter[2].cw,
  ]);
  const diagonals = [
    `M${mid[0][0] * scale} ${mid[0][1] * scale} L${mid[2][0] * scale} ${mid[2][1] * scale}`,
    `M${mid[3][0] * scale} ${mid[3][1] * scale} L${mid[1][0] * scale} ${mid[1][1] * scale}`,
  ];

  return { paths: { outer, inner, diagonals }, polys: cells };
}

export const { paths: CHART_PATHS, polys: HOUSE_POLYGONS } = buildHouseGeometry();

export function polygonCentroid(pts) {
  const [sx, sy] = pts.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
  const n = pts.length;
  return { cx: sx / n, cy: sy / n };
}

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
  svgEl.setAttribute('viewBox', '0 0 1 1');
  svgEl.setAttribute('fill', 'none');
  svgEl.setAttribute('stroke', 'currentColor');

  const addPath = (d, width) => {
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke-width', width);
    svgEl.appendChild(path);
  };

  addPath(CHART_PATHS.outer, '0.02');
  CHART_PATHS.diagonals.forEach((d) => addPath(d, '0.01'));
  addPath(CHART_PATHS.inner, '0.01');

  for (let h = 1; h <= 12; h++) {
    const poly = HOUSE_POLYGONS[h - 1];
    const { cx, cy } = polygonCentroid(poly);
    const signIdx = data.signInHouse?.[h] ?? h - 1;

    const hText = document.createElementNS(svgNS, 'text');
    hText.setAttribute('x', cx);
    hText.setAttribute('y', cy - 0.06);
    hText.setAttribute('text-anchor', 'middle');
    hText.setAttribute('font-size', '0.03');
    hText.textContent = String(h);
    svgEl.appendChild(hText);

    if (h === 1) {
      const ascText = document.createElementNS(svgNS, 'text');
      ascText.setAttribute('x', cx);
      ascText.setAttribute('y', cy + 0.08);
      ascText.setAttribute('text-anchor', 'middle');
      ascText.setAttribute('font-size', '0.03');
      ascText.textContent = 'Asc';
      svgEl.appendChild(ascText);
    }

    const signText = document.createElementNS(svgNS, 'text');
    signText.setAttribute('x', cx);
    signText.setAttribute('y', cy);
    signText.setAttribute('text-anchor', 'middle');
    signText.setAttribute('font-size', '0.04');
    signText.textContent = getSignLabel(signIdx, options);
    svgEl.appendChild(signText);

    const planets = data.planets.filter((p) => p.sign === signIdx);
    let py = cy + 0.04;
    planets.forEach((p) => {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', cx);
      t.setAttribute('y', py);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '0.03');
      const dVal = Math.floor(p.deg);
      const m = Math.round((p.deg - dVal) * 60);
      const degStr = `${String(dVal).padStart(2, '0')}°${String(m).padStart(2, '0')}'`;
      t.textContent = `${p.name} ${degStr}${p.retro ? ' R' : ''}`;
      svgEl.appendChild(t);
      py += 0.04;
    });
  }
}

