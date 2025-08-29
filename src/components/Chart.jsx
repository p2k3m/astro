import React from 'react';
import PropTypes from 'prop-types';
import { SIGN_BOX_CENTERS, BOX_SIZE, diamondPath } from '../lib/astro.js';

const SIGN_LABELS = [
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

export default function Chart({ data, children }) {
  if (!data || !Array.isArray(data.houses) || data.houses.length !== 12) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
        <span>Invalid chart data</span>
      </div>
    );
  }

  const planetBySign = {};
  data.planets.forEach((p) => {
    const degreeValue = Number(p.deg ?? p.degree);
    let degree = 'No data';
    if (!Number.isNaN(degreeValue)) {
      const d = Math.floor(degreeValue);
      const m = Math.round((degreeValue - d) * 60);
      degree = `${d}°${String(m).padStart(2, '0')}'`;
    }
    const label = `${p.name} ${degree}${p.retro || p.retrograde ? ' R' : ''}`;
    planetBySign[p.sign] = planetBySign[p.sign] || [];
    planetBySign[p.sign].push(label);
  });

  const size = 300; // chart size

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 text-orange-500"
          fill="none"
          stroke="currentColor"
        >
          <path d={diamondPath(50, 50, 50)} strokeWidth="2" />
          {SIGN_BOX_CENTERS.map((c, idx) => (
            <path key={idx} d={diamondPath(c.cx, c.cy)} strokeWidth="1" />
          ))}
        </svg>
        {SIGN_BOX_CENTERS.map((c, idx) => {
          const houseNum = data.houses[idx];
          return (
            <div
              key={idx}
              className="absolute flex flex-col items-center text-xs gap-0.5 p-1"
              style={{
                top: `${c.cy}%`,
                left: `${c.cx}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {houseNum !== undefined && (
                <span className="text-yellow-300 font-semibold text-[0.6rem] leading-none">
                  {houseNum}
                </span>
              )}
              {idx === data.ascSign && (
                <span className="text-yellow-300 text-[0.6rem] leading-none">Asc</span>
              )}
              <span className="text-orange-300 font-semibold">{SIGN_LABELS[idx]}</span>
              {planetBySign[idx] &&
                planetBySign[idx].map((pl, i) => <span key={i}>{pl}</span>)}
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
    ascSign: PropTypes.number,
    houses: PropTypes.arrayOf(PropTypes.number).isRequired,
    planets: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sign: PropTypes.number.isRequired,
        deg: PropTypes.number,
        retro: PropTypes.bool,
      })
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
};

