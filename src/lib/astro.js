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
// The layout follows the North-Indian style used by AstroSage:
// a square frame with two diagonals forming an "X" and an inner
// diamond that joins the midpoints of the four sides. These
// five strokes partition the canvas into twelve regions which we
// expose as HOUSE_POLYGONS for labelling and hit‑testing.
function buildHouseGeometry(scale = 1) {
  // Corner points of the unit square
  const TL = [0, 0];
  const TR = [1, 0];
  const BR = [1, 1];
  const BL = [0, 1];

  // Midpoints of each side and the centre
  const MT = [0.5, 0];
  const MR = [1, 0.5];
  const MB = [0.5, 1];
  const ML = [0, 0.5];
  const C = [0.5, 0.5];

  const pathFrom = (pts) =>
    pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x * scale} ${y * scale}`)
      .join(' ') + ' Z';

  // Paths for outer square, diagonals and inner diamond
  const outer = pathFrom([TL, TR, BR, BL]);
  const inner = pathFrom([MT, MR, MB, ML]);
  const diagonals = [
    `M${TL[0] * scale} ${TL[1] * scale} L${BR[0] * scale} ${BR[1] * scale}`,
    `M${TR[0] * scale} ${TR[1] * scale} L${BL[0] * scale} ${BL[1] * scale}`,
  ];

  // Define the twelve regions (8 corner triangles + 4 kites)
  const cells = [
    // Top hexagon (House 1)
    [TL, MT, TR, MR, C, ML],
    // Top-right triangle (House 2)
    [TR, C, MT],
    // Top-right corner triangle (House 3)
    [TR, MR, C],
    // Right hexagon (House 4)
    [TR, MR, BR, MB, C, MT],
    // Bottom-right triangle (House 5)
    [BR, C, MR],
    // Bottom-right corner triangle (House 6)
    [BR, MB, C],
    // Bottom hexagon (House 7)
    [BR, MB, BL, ML, C, MR],
    // Bottom-left triangle (House 8)
    [BL, C, MB],
    // Bottom-left corner triangle (House 9)
    [BL, ML, C],
    // Left hexagon (House 10)
    [BL, ML, TL, MT, C, MB],
    // Top-left triangle (House 11)
    [TL, C, ML],
    // Top-left corner triangle (House 12)
    [TL, MT, C],
  ];

  const centroids = cells.map(polygonCentroid);

  return { paths: { outer, inner, diagonals }, polys: cells, centroids };
}

export const {
  paths: CHART_PATHS,
  polys: HOUSE_POLYGONS,
  centroids: HOUSE_CENTROIDS,
} = buildHouseGeometry();

export function polygonCentroid(pts) {
  // Compute the centroid using the area-weighted formula (shoelace theorem).
  // This provides the true geometric centre even for irregular polygons.
  let doubleArea = 0;
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    doubleArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (doubleArea === 0) {
    // Degenerate polygon; fall back to simple average.
    const [sx, sy] = pts.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
    return { cx: sx / n, cy: sy / n };
  }
  const area = doubleArea / 2;
  return { cx: cx / (6 * area), cy: cy / (6 * area) };
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
    -lon,
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
    const { cx, cy } = HOUSE_CENTROIDS[h - 1];
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

