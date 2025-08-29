import React from 'react';
import PropTypes from 'prop-types';

// Each entry defines the path and centre of a house polygon in the
// fixed AstroSage-style layout. Houses are numbered counter-clockwise
// starting from the left.
export const HOUSE_POLYGONS = [
  { d: 'M0 50 L25 25 L50 50 L25 75 Z', cx: 25, cy: 50 }, // 1
  { d: 'M0 50 L25 75 L50 100 Z', cx: 25, cy: 75 }, // 2
  { d: 'M25 75 L50 50 L50 100 Z', cx: 41.6667, cy: 75 }, // 3
  { d: 'M50 100 L75 75 L50 50 L25 75 Z', cx: 50, cy: 75 }, // 4
  { d: 'M50 100 L100 50 L75 75 Z', cx: 75, cy: 75 }, // 5
  { d: 'M75 75 L50 50 L100 50 Z', cx: 75, cy: 58.3333 }, // 6
  { d: 'M100 50 L75 25 L50 50 L75 75 Z', cx: 75, cy: 50 }, // 7
  { d: 'M100 50 L50 0 L75 25 Z', cx: 75, cy: 25 }, // 8
  { d: 'M75 25 L50 50 L50 0 Z', cx: 58.3333, cy: 25 }, // 9
  { d: 'M50 0 L25 25 L50 50 L75 25 Z', cx: 50, cy: 25 }, // 10
  { d: 'M50 0 L0 50 L25 25 Z', cx: 25, cy: 25 }, // 11
  { d: 'M25 25 L50 50 L0 50 Z', cx: 25, cy: 41.6667 }, // 12
];

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

  const planetByHouse = {};
  data.planets.forEach((p) => {
    const houseNum = p.house;
    if (!houseNum) return;
    const degreeValue = Number(p.deg ?? p.degree);
    let degree = 'No data';
    if (!Number.isNaN(degreeValue)) {
      const d = Math.floor(degreeValue);
      const m = Math.round((degreeValue - d) * 60);
      degree = `${d}°${String(m).padStart(2, '0')}'`;
    }
    const label = `${p.name} ${degree}${p.retro || p.retrograde ? ' R' : ''}`;
    planetByHouse[houseNum] = planetByHouse[houseNum] || [];
    planetByHouse[houseNum].push(label);
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
          <path d="M50 0 L100 50 L50 100 L0 50 Z" strokeWidth="2" />
          <path d="M0 50 L100 50" strokeWidth="1" />
          <path d="M50 0 L50 100" strokeWidth="1" />
          <path d="M25 25 L75 75" strokeWidth="1" />
          <path d="M75 25 L25 75" strokeWidth="1" />
          {HOUSE_POLYGONS.map((p, idx) => (
            <path key={idx} d={p.d} fill="transparent" stroke="none" aria-label={`house ${idx + 1}`} />
          ))}
        </svg>
        {HOUSE_POLYGONS.map((p, idx) => {
          const houseNum = idx + 1;
          const signIdx = signInHouse[houseNum];
          return (
            <div
              key={houseNum}
              className="absolute flex flex-col items-center text-xs gap-0.5 p-1"
              style={{
                top: `${p.cy}%`,
                left: `${p.cx}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-yellow-300/40 text-[0.6rem] leading-none">
                {houseNum}
              </span>
              {signIdx === data.ascSign && (
                <span className="text-yellow-300 text-[0.6rem] leading-none">Asc</span>
              )}
              {signIdx !== undefined && (
                <span className="text-orange-300 font-semibold">
                  {SIGN_LABELS[signIdx]}
                </span>
              )}
              {planetByHouse[houseNum] &&
                planetByHouse[houseNum].map((pl, i) => <span key={i}>{pl}</span>)}
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
};

