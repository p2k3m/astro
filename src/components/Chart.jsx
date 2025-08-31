import React from 'react';
import PropTypes from 'prop-types';
import {
  CHART_PATHS,
  HOUSE_POLYGONS,
  HOUSE_BBOXES,
  HOUSE_CENTROIDS,
  getSignLabel,
} from '../lib/astro.js';

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

export default function Chart({
  data,
  children,
  useAbbreviations = false,
  size = 360,
}) {
  if (
    !data ||
    !Array.isArray(data.signInHouse) ||
    data.signInHouse.length !== 13
  ) {
    return (
      <div className="backdrop-blur-md bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-center">
        <span>Invalid chart data</span>
      </div>
    );
  }
  const signInHouse = data.signInHouse;

  const planetByHouse = {};
  data.planets.forEach((p) => {
    const houseIdx = p.house;
    if (houseIdx === undefined) return;
    const degreeValue = Number(p.deg ?? p.degree);
    let degree = 'No data';
    if (!Number.isNaN(degreeValue)) {
      const d = Math.floor(degreeValue);
      const m = Math.round((degreeValue - d) * 60);
      degree = `${d}°${String(m).padStart(2, '0')}'`;
    }
    let abbr = PLANET_ABBR[p.name.toLowerCase()] || p.name.slice(0, 2);
    const isRetro = p.retro;
    if (isRetro) abbr += '(R)';
    if (p.combust) abbr += '(C)';
    if (p.exalted) abbr += '(Ex)';
    const deg = degree;
    planetByHouse[houseIdx] = planetByHouse[houseIdx] || [];
    planetByHouse[houseIdx].push({ abbr, deg });
  });

  const SIGN_PAD_X = 0.04;
  const SIGN_PAD_Y = 0.08;
  const SIGN_FONT_SIZE = 0.05;
  const PLANET_GAP = 0.02;
  const PLANET_PAD = 0.02;
  const SIGN_MARGIN = 0.08;
  const SIGN_TOWARDS_VERTEX = 0.6;

  const houses = HOUSE_POLYGONS.map((poly, idx) => {
    const bbox = HOUSE_BBOXES[idx];
    const centroid = HOUSE_CENTROIDS[idx];
    const { minX, maxX, minY, maxY } = bbox;
    // Identify the top-most vertex (preferring the right-most when tied)
    let target = poly[0];
    for (const [x, y] of poly) {
      if (y < target[1] || (y === target[1] && x > target[0])) target = [x, y];
    }
    let signX =
      centroid.cx + (target[0] - centroid.cx) * SIGN_TOWARDS_VERTEX;
    let labelY =
      centroid.cy + (target[1] - centroid.cy) * SIGN_TOWARDS_VERTEX;
    // Ensure the label stays well within the bounding box of the polygon
    if (signX < minX + SIGN_MARGIN) signX = minX + SIGN_MARGIN;
    if (signX > maxX - SIGN_MARGIN) signX = maxX - SIGN_MARGIN;
    if (labelY < minY + SIGN_MARGIN) labelY = minY + SIGN_MARGIN;
    if (labelY > maxY - SIGN_MARGIN) labelY = maxY - SIGN_MARGIN;

    const maxPolyY = Math.max(...poly.map((pt) => pt[1]));
    const cx = centroid.cx;
    const cy = centroid.cy;
    const houseNum = idx + 1;
    const signNum = signInHouse[houseNum] ?? houseNum;
    const planets = planetByHouse[houseNum] || [];
    const signBottom = labelY + SIGN_FONT_SIZE / 2;
    let py = Math.max(signBottom + PLANET_GAP, cy + 0.07);
    if (py > maxPolyY - PLANET_PAD) py = maxPolyY - PLANET_PAD;
    const step =
      planets.length > 1
        ? Math.min(0.04, (maxPolyY - PLANET_PAD - py) / (planets.length - 1))
        : 0;
    return {
      houseNum,
      signNum,
      signX,
      signY: labelY,
      ascX: minX + SIGN_PAD_X,
      planets,
      cx,
      pyStart: py,
      step,
    };
  });

  return (
    <div className="backdrop-blur-md bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 1 1"
          className="absolute inset-0 text-amber-600"
          fill="none"
          stroke="currentColor"
        >
          <path d={CHART_PATHS.outer} strokeWidth={0.02} />
          {CHART_PATHS.diagonals.map((d, idx) => (
            <path key={`diag-${idx}`} d={d} strokeWidth={0.01} />
          ))}
          <path d={CHART_PATHS.inner} strokeWidth={0.01} />
        </svg>
        {/** Sign labels */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {houses.map(({ houseNum, signNum, signX, signY, ascX }) => (
            <React.Fragment key={`sign-${houseNum}`}>
              <div
                className="absolute text-amber-700 font-bold text-[clamp(0.9rem,1.5vw,1.2rem)] leading-none"
                style={{
                  top: signY * size,
                  left: signX * size,
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {getSignLabel(signNum - 1, { useAbbreviations })}
              </div>
              {houseNum === 1 && (
                <div
                  className="absolute text-amber-700 text-[0.7rem] font-semibold leading-none"
                  style={{
                    top: signY * size,
                    left: ascX * size,
                    transform: 'translate(0, -50%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Asc
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {/** Planet labels */}
        <div className="absolute inset-0 z-0">
          {houses.map(({ houseNum, planets, cx, pyStart, step }) =>
            planets.map((pl, i) => (
              <div
                key={`p-${houseNum}-${i}`}
                className="absolute text-amber-900 font-medium text-[clamp(0.55rem,0.75vw,0.85rem)]"
                style={{
                  top: (pyStart + step * i) * size,
                  left: cx * size,
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {pl.abbr} {pl.deg}
              </div>
            ))
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

Chart.propTypes = {
  data: PropTypes.shape({
    ascSign: PropTypes.number.isRequired,
    signInHouse: PropTypes.arrayOf(PropTypes.number).isRequired,
    planets: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sign: PropTypes.number,
        house: PropTypes.number.isRequired,
        deg: PropTypes.number,
        retro: PropTypes.bool,
        combust: PropTypes.bool,
        exalted: PropTypes.bool,
      })
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
  useAbbreviations: PropTypes.bool,
  size: PropTypes.number,
};
