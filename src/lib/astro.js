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
export const SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
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
  const O = [0.5, 0.5];

  // Intersections of diagonals with the inner diamond
  const P1 = [0.25, 0.25];
  const P2 = [0.75, 0.75];
  const P3 = [0.75, 0.25];
  const P4 = [0.25, 0.75];

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

  // House polygons derived from chart geometry
  // Order corresponds to houses 1–12 progressing anti-clockwise
  const housePolygons = [
    [P1, MT, P3, O], // 1st house (top centre)
    [TL, MT, P1], // 2nd
    [ML, TL, P1], // 3rd
    [ML, P1, O, P4], // 4th
    [BL, ML, P4], // 5th
    [MB, BL, P4], // 6th
    [P2, MB, P4, O], // 7th
    [BR, MB, P2], // 8th
    [MR, BR, P2], // 9th
    [P3, MR, P2, O], // 10th
    [TR, MR, P3], // 11th
    [MT, TR, P3], // 12th
  ].map((poly) => poly.map(([x, y]) => [x * scale, y * scale]));

  return { outer, inner, diagonals, housePolygons };
}

export const CHART_PATHS = buildChartPaths();

export const HOUSE_POLYGONS = CHART_PATHS.housePolygons;
export const HOUSE_CENTROIDS = HOUSE_POLYGONS.map(polygonCentroid);
// Bounding boxes for each house polygon. Useful for positioning labels
// at specific corners without overlap.
export const HOUSE_BBOXES = HOUSE_POLYGONS.map((poly) => {
  const xs = poly.map(([x]) => x);
  const ys = poly.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
});

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

  const ascSign = base.ascSign;
  const signInHouse = [null];
  for (let h = 1; h <= 12; h++) {
    // In a whole-sign system the sign of each subsequent house simply advances
    // by one from the ascendant sign.
    signInHouse[h] = ((ascSign + h - 2 + 12) % 12) + 1;
  }
  if (process.env.DEBUG_HOUSES) {
    console.log('signInHouse:', signInHouse);
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
  // Sun longitude in degrees (0..360)
  const sunDeg =
    typeof sun.min === 'number' && typeof sun.sec === 'number'
      ? sun.deg + sun.min / 60 + sun.sec / 3600
      : sun.deg;
  const sunLon = (sun.sign - 1) * 30 + sunDeg;

  for (const p of base.planets) {
    const sign = p.sign - 1;
    const house = p.house;
    let d = p.deg;
    let m = p.min;
    let s = p.sec;
    let degFloat;
    if (typeof m === 'number' && typeof s === 'number') {
      degFloat = d + m / 60 + s / 3600;
    } else {
      // derive minutes and seconds from decimal degrees
      degFloat = d;
      const dVal = Math.floor(d);
      const mFloat = (d - dVal) * 60;
      const mVal = Math.floor(mFloat);
      const sVal = Math.round((mFloat - mVal) * 60);
      d = dVal;
      m = mVal;
      s = sVal;
    }
    const lon = sign * 30 + degFloat;
    const retro = p.retro;
    const cDeg = combustDeg[p.name];
    let combust = false;
    if (cDeg !== undefined) {
      // Shortest Sun–planet separation in degrees (0..180)
      const diff = Math.abs((sunLon - lon + 180) % 360 - 180);
      if (diff < cDeg) {
        combust = true;
      }
    }
    const exalt = exaltedSign[p.name];
    const exalted = exalt !== undefined && sign === exalt;
    planets.push({
      name: p.name,
      sign,
      house,
      deg: d,
      min: m,
      sec: s,
      retro,
      combust,
      exalted,
      speed: p.speed,
    });
  }

  return { ascSign, signInHouse, planets };
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

  const SIGN_PAD_X = 0.04;
  const SIGN_PAD_Y = 0.08;
  const SIGN_FONT_SIZE = 0.05;
  const PLANET_GAP = 0.02;
  const PLANET_PAD = 0.02;

  const signNodes = [];
  const SIGN_MARGIN = 0.08;
  const SIGN_TOWARDS_VERTEX = 0.6;
  const signBottoms = [];
  const signXs = [];
  for (let h = 1; h <= 12; h++) {
    const poly = HOUSE_POLYGONS[h - 1];
    const centroid = HOUSE_CENTROIDS[h - 1];
    const bbox = HOUSE_BBOXES[h - 1];
    const { minX, maxX, minY, maxY } = bbox;
    const signNum = data.signInHouse?.[h] ?? h;

    // Determine a point towards the top corner of the polygon
    let target = poly[0];
    for (const [x, y] of poly) {
      if (y < target[1] || (y === target[1] && x > target[0])) target = [x, y];
    }
    let sx = centroid.cx + (target[0] - centroid.cx) * SIGN_TOWARDS_VERTEX;
    let sy = centroid.cy + (target[1] - centroid.cy) * SIGN_TOWARDS_VERTEX;
    if (sx < minX + SIGN_MARGIN) sx = minX + SIGN_MARGIN;
    if (sx > maxX - SIGN_MARGIN) sx = maxX - SIGN_MARGIN;
    if (sy < minY + SIGN_MARGIN) sy = minY + SIGN_MARGIN;
    if (sy > maxY - SIGN_MARGIN) sy = maxY - SIGN_MARGIN;

    if (h === 1) {
      const ascText = document.createElementNS(svgNS, 'text');
      ascText.setAttribute('x', minX + SIGN_PAD_X);
      ascText.setAttribute('y', sy);
      ascText.setAttribute('text-anchor', 'start');
      ascText.setAttribute('dominant-baseline', 'middle');
      ascText.setAttribute('font-size', '0.03');
      ascText.textContent = 'Asc';
      signNodes.push(ascText);
    }

    const signText = document.createElementNS(svgNS, 'text');
    signText.setAttribute('x', sx);
    signText.setAttribute('y', sy);
    signText.setAttribute('text-anchor', 'middle');
    signText.setAttribute('dominant-baseline', 'middle');
    signText.setAttribute('font-size', '0.05');
    signText.textContent = getSignLabel(signNum - 1, options);
    signNodes.push(signText);
    signBottoms[h] = sy + SIGN_FONT_SIZE / 2;
    signXs[h] = sx;
  }
  signNodes.forEach((n) => svgEl.appendChild(n));

  for (let h = 1; h <= 12; h++) {
    const { cx, cy } = HOUSE_CENTROIDS[h - 1];
    const poly = HOUSE_POLYGONS[h - 1];
    const bbox = HOUSE_BBOXES[h - 1];
    const { minX, maxX } = bbox;
    const planets = data.planets.filter((p) => p.house === h);
    if (planets.length === 0) continue;
    const maxY = Math.max(...poly.map((pt) => pt[1]));
    const bottomLimit = maxY - PLANET_PAD;
    const signBottom = signBottoms[h];
    let px = cx;
    const baseline = cy + 0.07;
    let py = signBottom + PLANET_GAP;
    if (py < baseline) py = baseline;
    let downward = true;
    if (py > bottomLimit) {
      py = bottomLimit;
      downward = false;
      const shift = 0.06;
      px =
        signXs[h] < cx
          ? Math.min(maxX - PLANET_PAD, cx + shift)
          : Math.max(minX + PLANET_PAD, cx - shift);
    }
    let step = 0;
    if (planets.length > 1) {
      const available = downward
        ? bottomLimit - py
        : py - (bbox.minY + PLANET_PAD);
      step = available > 0 ? Math.min(0.04, available / (planets.length - 1)) : 0;
      if (!downward) step = -step;
    }
    planets.forEach((p) => {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', px);
      t.setAttribute('y', py);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '0.03');
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
      const degStr = `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}′${String(
        s
      ).padStart(2, '0')}″`;
      let name = p.name;
      if (p.retro) name += '(R)';
      if (p.combust) name += '(C)';
      if (p.exalted) name += '(Ex)';
      t.textContent = `${name} ${degStr}`;
      svgEl.appendChild(t);
      py += step;
    });
  }
}

