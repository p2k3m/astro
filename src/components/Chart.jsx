import React from 'react';
import PropTypes from 'prop-types';
import {
  CHART_PATHS,
  HOUSE_POLYGONS,
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

// Pre-compute bounding boxes for each house polygon so we can size
// the wrapper for each house dynamically based on its actual bounds.
const HOUSE_BBOXES = HOUSE_POLYGONS.map((poly) => {
  const xs = poly.map(([x]) => x);
  const ys = poly.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
});


export default function Chart({ data, children, useAbbreviations = false }) {
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
    if (p.retro) abbr += '(R)';
    if (p.combust) abbr += '(C)';
    if (p.exalted) abbr += '(Ex)';
    const deg = degree;
    planetByHouse[houseIdx] = planetByHouse[houseIdx] || [];
    planetByHouse[houseIdx].push({ abbr, deg });
  });

  const size = 300; // chart size

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
        {HOUSE_POLYGONS.map((poly, idx) => {
          const bbox = HOUSE_BBOXES[idx];
          const { minX, maxX, minY, maxY } = bbox;
          const bx = (minX + maxX) / 2;
          const by = (minY + maxY) / 2;
          const houseNum = idx + 1;
          const signIdx = signInHouse[houseNum];

          // Determine the inner corner closest to the chart centre (0.5, 0.5)
          const EPS = 1e-9;
          let vert, horiz;
          if (by < 0.5 - EPS) vert = 'bottom-0';
          else if (by > 0.5 + EPS) vert = 'top-0';
          else vert = bx < 0.5 ? 'top-0' : 'bottom-0';

          if (bx < 0.5 - EPS) horiz = 'right-0';
          else if (bx > 0.5 + EPS) horiz = 'left-0';
          else horiz = by < 0.5 ? 'right-0' : 'left-0';

          const labelPos = `${vert} ${horiz}`;

          const padClasses = [
            vert === 'top-0' ? 'pt-4' : vert === 'bottom-0' ? 'pb-4' : '',
            horiz === 'left-0' ? 'pl-4' : horiz === 'right-0' ? 'pr-4' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const margin = 4; // pixels
          const width = (maxX - minX) * size - margin;
          const height = (maxY - minY) * size - margin;

          return (
            <div
              key={houseNum}
              className="absolute overflow-hidden p-[2px]"
              style={{
                top: by * size,
                left: bx * size,
                width,
                height,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className={`absolute text-[11px] font-bold text-amber-700/70 ${labelPos}`}
              >
                {getSignLabel(signIdx, { useAbbreviations })}
              </span>

              <div
                className={`flex flex-col items-center justify-center h-full gap-1 text-amber-900 font-medium text-[clamp(0.55rem,0.75vw,0.85rem)] ${padClasses}`}
              >
                {houseNum === 1 && (
                  <div className="flex flex-col items-center">
                    <span className="text-amber-700 text-[0.7rem] font-semibold leading-none">
                      Asc
                    </span>
                  </div>
                )}

                {planetByHouse[houseNum] &&
                  planetByHouse[houseNum].map((pl, i) => (
                    <span key={i} className="text-center">
                      {pl.abbr} {pl.deg}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

Chart.propTypes = {
  data: PropTypes.shape({
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
};

