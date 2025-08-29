import React from 'react';
import PropTypes from 'prop-types';

export default function Chart({ data, children }) {
  const isValidNumber = (val) => typeof val === 'number' && !Number.isNaN(val);

  const invalidHouses = !data || !Array.isArray(data.houses);

  const invalidPlanets = !data || !Array.isArray(data.planets);

  if (invalidHouses || invalidPlanets) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
        <span>Invalid chart data</span>
      </div>
    );
  }

  if (
    children !== undefined &&
    children !== null &&
    !React.isValidElement(children) &&
    !Array.isArray(children) &&
    typeof children !== 'string' &&
    typeof children !== 'number'
  ) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
        <span>Invalid children</span>
      </div>
    );
  }

  // Coordinates for the 12 houses laid out on a 4x4 grid. Values represent
  // the centre point of each house in grid units so we can position labels
  // without drawing individual boxes.
  const positions = {
    1: { x: 2, y: 0.5 }, // top centre
    2: { x: 3.5, y: 1.5 }, // top right
    3: { x: 3.5, y: 2.5 }, // right
    4: { x: 2.5, y: 3.5 }, // bottom right
    5: { x: 2, y: 3.5 }, // bottom centre
    6: { x: 0.5, y: 2.5 }, // bottom left
    7: { x: 0.5, y: 1.5 }, // left
    8: { x: 1.5, y: 0.5 }, // top left
    9: { x: 1.5, y: 1.5 }, // inner top-left
    10: { x: 2.5, y: 1.5 }, // inner top-right
    11: { x: 2.5, y: 2.5 }, // inner bottom-right
    12: { x: 1.5, y: 2.5 }, // inner bottom-left
  };

  const SIGN_MAP = {
    1: { abbr: 'Ar', symbol: '\u2648', name: 'Aries' },
    2: { abbr: 'Ta', symbol: '\u2649', name: 'Taurus' },
    3: { abbr: 'Ge', symbol: '\u264A', name: 'Gemini' },
    4: { abbr: 'Cn', symbol: '\u264B', name: 'Cancer' },
    5: { abbr: 'Le', symbol: '\u264C', name: 'Leo' },
    6: { abbr: 'Vi', symbol: '\u264D', name: 'Virgo' },
    7: { abbr: 'Li', symbol: '\u264E', name: 'Libra' },
    8: { abbr: 'Sc', symbol: '\u264F', name: 'Scorpio' },
    9: { abbr: 'Sg', symbol: '\u2650', name: 'Sagittarius' },
    10: { abbr: 'Cp', symbol: '\u2651', name: 'Capricorn' },
    11: { abbr: 'Aq', symbol: '\u2652', name: 'Aquarius' },
    12: { abbr: 'Pi', symbol: '\u2653', name: 'Pisces' },
  };

  const planetByHouse = {};
  data.planets.forEach((p) => {
    if (!isValidNumber(p.house)) return;

    // Convert degree to a number so numeric-like strings are treated as valid
    const degreeValue = Number(p.degree);
    const degree = isValidNumber(degreeValue) ? `${degreeValue}°` : 'No data';

    planetByHouse[p.house] = planetByHouse[p.house] || [];
    planetByHouse[p.house].push(
      `${p.abbr} ${degree}${p.retrograde ? ' R' : ''}${p.combust ? ' C' : ''}`
    );
  });

  const size = 300; // chart size
  const grid = 4; // 4x4 grid for positioning

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 text-orange-500"
          fill="none"
          stroke="currentColor"
        >
          <polygon
            points="50,0 100,50 50,100 0,50"
            strokeWidth="2"
          />
          <line x1="50" y1="0" x2="50" y2="100" strokeWidth="1" />
          <line x1="0" y1="50" x2="100" y2="50" strokeWidth="1" />
          <line x1="25" y1="25" x2="75" y2="75" strokeWidth="1" />
          <line x1="75" y1="25" x2="25" y2="75" strokeWidth="1" />
        </svg>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
          const pos = positions[house];
          const signNum = data.houses[house - 1];
          const signInfo = SIGN_MAP[signNum] || {};

          return (
            <div
              key={house}
              className="absolute flex flex-col items-center text-xs gap-1"
              style={{
                top: (pos.y / grid) * 100 + '%',
                left: (pos.x / grid) * 100 + '%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-yellow-300 font-semibold">{signNum}</span>
              <span className="text-orange-300 font-semibold flex items-center gap-1">
                {signInfo.symbol} {signInfo.abbr} {signInfo.name || ''}
              </span>
              {planetByHouse[house] &&
                planetByHouse[house].map((pl, idx) => <span key={idx}>{pl}</span>)}
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
    houses: PropTypes.arrayOf(PropTypes.number).isRequired,
    planets: PropTypes.arrayOf(
      PropTypes.shape({
        abbr: PropTypes.string.isRequired,
        degree: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
          .isRequired,
        retrograde: PropTypes.bool,
        combust: PropTypes.bool,
        house: PropTypes.number.isRequired,
        sign: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
};
