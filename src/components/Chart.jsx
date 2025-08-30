import React from 'react';
import PropTypes from 'prop-types';
import {
  CHART_PATHS,
  HOUSE_POLYGONS,
  getSignLabel,
  polygonCentroid,
} from '../lib/astro.js';

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
    const label = `${p.name} ${degree}${p.retro ? ' R' : ''}`;
    planetBySign[signIdx] = planetBySign[signIdx] || [];
    planetBySign[signIdx].push(label);
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
        {HOUSE_POLYGONS.map((poly, idx) => {
          const { cx, cy } = polygonCentroid(poly);
          const houseNum = idx + 1;
          const signIdx = signInHouse[houseNum];
          return (
            <div
              key={houseNum}
              className="absolute flex flex-col items-center text-xs gap-[2px] p-[2px]"
              style={{
                top: cy * size,
                left: cx * size,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-yellow-300/40 text-[0.6rem] leading-none">
                {houseNum}
              </span>
              {houseNum === 1 && (
                <span className="text-yellow-300 text-[0.6rem] leading-none">
                  La/Asc
                </span>
              )}
              <span className="text-orange-300 font-semibold text-[clamp(0.5rem,0.8vw,0.75rem)]">
                {getSignLabel(signIdx, { useAbbreviations })}
              </span>
              {planetBySign[signIdx] &&
                planetBySign[signIdx].map((pl, i) => (
                  <span
                    key={i}
                    className="px-[2px] text-[clamp(0.5rem,0.7vw,0.75rem)]"
                  >
                    {pl}
                  </span>
                ))}
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
      })
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
  useAbbreviations: PropTypes.bool,
};

