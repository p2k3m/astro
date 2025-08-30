import React from 'react';
import PropTypes from 'prop-types';
import {
  CHART_PATHS,
  HOUSE_POLYGONS,
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

// Position each sign label at the inner corner of its house.
const SIGN_LABEL_POS = [
  'bottom-0 left-1/2 -translate-x-1/2', // 1
  'bottom-0 right-0', // 2
  'top-1/2 right-0 -translate-y-1/2', // 3
  'top-0 right-0', // 4
  'top-0 right-0', // 5
  'top-0 left-1/2 -translate-x-1/2', // 6
  'top-0 left-0', // 7
  'top-0 left-0', // 8
  'top-1/2 left-0 -translate-y-1/2', // 9
  'bottom-0 left-0', // 10
  'bottom-0 left-0', // 11
  'bottom-0 right-0', // 12
];

export default function Chart({ data, children, useAbbreviations = false }) {
  if (
    !data ||
    !Array.isArray(data.signInHouse) ||
    data.signInHouse.length !== 13
  ) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
        <span>Invalid chart data</span>
      </div>
    );
  }
  const signInHouse = data.signInHouse;

  const planetBySign = {};
  data.planets.forEach((p) => {
    const signIdx = p.sign;
    if (signIdx === undefined) return;
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
    planetBySign[signIdx] = planetBySign[signIdx] || [];
    planetBySign[signIdx].push({ abbr, deg });
  });

  const size = 300; // chart size

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 1 1"
          className="absolute inset-0 text-orange-500"
          fill="none"
          stroke="currentColor"
        >
          <path d={CHART_PATHS.outer} strokeWidth={0.02} />
          {CHART_PATHS.diagonals.map((d, idx) => (
            <path key={`diag-${idx}`} d={d} strokeWidth={0.01} />
          ))}
          <path d={CHART_PATHS.inner} strokeWidth={0.01} />
        </svg>
        {HOUSE_POLYGONS.map((_, idx) => {
          const { cx, cy } = HOUSE_CENTROIDS[idx];
          const houseNum = idx + 1;
          const signIdx = signInHouse[houseNum];

          return (
            <div
              key={houseNum}
              className="absolute w-[60px] h-[60px] min-w-[50px] min-h-[50px] p-[2px]"
              style={{
                top: cy * size,
                left: cx * size,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className={`absolute text-[10px] text-yellow-300/50 ${SIGN_LABEL_POS[idx]}`}
              >
                {getSignLabel(signIdx, { useAbbreviations })}
              </span>

              <div className="flex flex-col items-center justify-center h-full gap-1 text-[clamp(0.5rem,0.7vw,0.75rem)]">
                {houseNum === 1 && (
                  <div className="flex flex-col items-center">
                    <span className="text-yellow-300 text-[0.6rem] leading-none">
                      La/Asc
                    </span>
                  </div>
                )}

                {planetBySign[signIdx] &&
                  planetBySign[signIdx].map((pl, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span>{pl.abbr}</span>
                      <span>{pl.deg}</span>
                    </div>
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
        sign: PropTypes.number.isRequired,
        house: PropTypes.number,
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

