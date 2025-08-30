import { DateTime } from 'luxon';
import { compute_positions } from './ephemeris.js';

const svgNS = 'http://www.w3.org/2000/svg';

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
// five strokes partition the canvas into twelve regions.  The
// routine below derives the SVG paths for the static frame.
function buildChartPaths(scale = 1) {
  // Corner points of the unit square
  const TL = [0, 0];
  const TR = [1, 0];
  const BR = [1, 1];
  const BL = [0, 1];

  // Midpoints of each side
  const MT = [0.5, 0];
  const MR = [1, 0.5];
  const MB = [0.5, 1];
  const ML = [0, 0.5];

  const pathFrom = (pts) =>
    pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x * scale} ${y * scale}`)
      .join(' ') + ' Z';

  const outer = pathFrom([TL, TR, BR, BL]);
  const inner = pathFrom([MT, MR, MB, ML]);
  const diagonals = [
    `M${TL[0] * scale} ${TL[1] * scale} L${BR[0] * scale} ${BR[1] * scale}`,
    `M${TR[0] * scale} ${TR[1] * scale} L${BL[0] * scale} ${BL[1] * scale}`,
  ];

  return { outer, inner, diagonals };
}

export const CHART_PATHS = buildChartPaths();

// Ordered mapping of house numbers (1-12) to their visual positions.
// The coordinates were chosen so that text labels render near the
// geometric centre of the intended chart cell.
export const HOUSE_CENTROIDS = [
  { cx: 0.5, cy: 0.25 }, // 1: Top Diamond
  { cx: 1 / 3, cy: 1 / 3 }, // 2: Top-Left Triangle
  { cx: 0.25, cy: 0.5 }, // 3: Left Diamond
  { cx: 1 / 3, cy: 2 / 3 }, // 4: Bottom-Left Triangle
  { cx: 1 / 6, cy: 5 / 6 }, // 5: Bottom-Left Main Triangle
  { cx: 0.5, cy: 0.75 }, // 6: Bottom Diamond
  { cx: 5 / 6, cy: 5 / 6 }, // 7: Bottom-Right Main Triangle
  { cx: 2 / 3, cy: 2 / 3 }, // 8: Bottom-Right Triangle
  { cx: 0.75, cy: 0.5 }, // 9: Right Diamond
  { cx: 2 / 3, cy: 1 / 3 }, // 10: Top-Right Triangle
  { cx: 5 / 6, cy: 1 / 6 }, // 11: Top-Right Main Triangle
  { cx: 1 / 6, cy: 1 / 6 }, // 12: Top-Left Main Triangle
];

// Placeholder polygons used purely for iteration; each is a tiny diamond
// centred on the corresponding HOUSE_CENTROIDS entry.
const makeDiamond = (cx, cy, size = 0.01) => [
  [cx, cy - size],
  [cx + size, cy],
  [cx, cy + size],
  [cx - size, cy],
];

export const HOUSE_POLYGONS = HOUSE_CENTROIDS.map(({ cx, cy }) =>
  makeDiamond(cx, cy)
);

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

  const base = compute_positions({
    datetime: dt.toISO({ suppressMilliseconds: true, includeOffset: false }),
    tz: dt.zoneName,
    lat,
    lon,
  });

  // house -> sign mapping (1-indexed, signs 0..11)
  const signInHouse = [null];
  const signToHouse = {};
  for (let h = 1; h <= 12; h++) {
    const sign = base.houses[h] - 1;
    signInHouse[h] = sign;
    signToHouse[sign] = h;
  }

  // combustion thresholds (degrees)
  const combustDeg = {
    moon: 12,
    mars: 17,
    mercury: 14,
    jupiter: 11,
    venus: 10,
    saturn: 15,
  };
  // exaltation signs (0 = Aries)
  const exaltedSign = {
    sun: 0,
    moon: 1,
    mars: 9,
    mercury: 5,
    jupiter: 3,
    venus: 11,
    saturn: 6,
    rahu: 1,
    ketu: 7,
  };

  const planets = [];
  const sun = base.planets.find((p) => p.name === 'sun');
  const sunLon = (sun.sign - 1) * 30 + sun.deg;

  for (const p of base.planets) {
    const sign = p.sign - 1;
    const house = signToHouse[sign];
    const deg = p.deg;
    const lon = sign * 30 + deg;
    const retro = p.retro;
    const cDeg = combustDeg[p.name];
    let combust = false;
    if (cDeg !== undefined) {
      const diff = Math.abs(((lon - sunLon + 540) % 360) - 180);
      combust = diff < cDeg;
    }
    const exalt = exaltedSign[p.name];
    const exalted = exalt !== undefined && sign === exalt;
    planets.push({ name: p.name, sign, house, deg, retro, combust, exalted });
  }

  return { ascSign: signInHouse[1], signInHouse, planets };
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
      let name = p.name;
      if (p.retro) name += '(R)';
      if (p.combust) name += '(C)';
      if (p.exalted) name += '(Ex)';
      t.textContent = `${name} ${degStr}`;
      svgEl.appendChild(t);
      py += 0.04;
    });
  }
}

