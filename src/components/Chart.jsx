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

  const houses = HOUSE_POLYGONS.map((_, idx) => {
    const bbox = HOUSE_BBOXES[idx];
    const { minX, maxX, minY, maxY } = bbox;
    const centroid = HOUSE_CENTROIDS[idx];
    // Offset the centroid slightly toward the chart centre so labels
    // remain well within each house polygon even on small charts.
    const inset = 0.92;
    const sx = 0.5 + (centroid.cx - 0.5) * inset;
    const sy = 0.5 + (centroid.cy - 0.5) * inset;
    const bx = (minX + maxX) / 2;
    const by = (minY + maxY) / 2;
    const houseNum = idx + 1;
    const signNum = signInHouse[houseNum] ?? houseNum;
    const margin = (4 / 300) * size;
    const width = (maxX - minX) * size - margin;
    const height = (maxY - minY) * size - margin;
    return {
      idx,
      bbox,
      bx,
      by,
      sx,
      sy,
      width,
      height,
      houseNum,
      signNum,
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
        {/** Sign label overlay */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {houses.map(({ houseNum, signNum, sx, sy }) => (
            <div
              key={`sign-${houseNum}`}
              className="absolute flex flex-col items-center"
              style={{
                top: sy * size,
                left: sx * size,
                transform: 'translate(-50%, -50%)',
                gap: (2 / 300) * size,
              }}
            >
              <span className="text-amber-700 font-bold text-[clamp(0.9rem,1.5vw,1.2rem)] leading-none">
                {getSignLabel(signNum - 1, { useAbbreviations })}
              </span>
              {houseNum === 1 && (
                <span className="text-amber-700 text-[0.7rem] font-semibold leading-none">
                  Asc
                </span>
              )}
            </div>
          ))}
        </div>
        {/** Planet labels */}
        {houses.map(({ houseNum, bx, by, width, height }) => (
          <div
            key={houseNum}
            className="absolute overflow-hidden z-10"
            style={{
              top: by * size,
              left: bx * size,
              width,
              height,
              transform: 'translate(-50%, -50%)',
              padding: (2 / 300) * size,
            }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-1 text-amber-900 font-medium text-[clamp(0.55rem,0.75vw,0.85rem)]">
              {planetByHouse[houseNum] &&
                planetByHouse[houseNum].map((pl, i) => (
                  <span key={i} className="text-center">
                    {pl.abbr} {pl.deg}
                  </span>
                ))}
            </div>
          </div>
        ))}
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

