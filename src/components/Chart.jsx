import React from 'react';
import PropTypes from 'prop-types';

const VIEWBOX_SIZE = 100;
const GRID = 4;
const BOX_SIZE = (VIEWBOX_SIZE / GRID) / 2; // half a grid unit

// Fixed positions for the 12 zodiac signs (Aries at the top, proceeding
// counter-clockwise). Values represent grid coordinates on a 4x4 grid.
const positions = {
  1: { x: 2, y: 0.5 }, // Aries - top centre
  2: { x: 3.5, y: 1.5 }, // Taurus - top right
  3: { x: 3.5, y: 2.5 }, // Gemini - right
  4: { x: 2.5, y: 3.5 }, // Cancer - bottom right
  5: { x: 2, y: 3.5 }, // Leo - bottom centre
  6: { x: 0.5, y: 2.5 }, // Virgo - bottom left
  7: { x: 0.5, y: 1.5 }, // Libra - left
  8: { x: 1.5, y: 0.5 }, // Scorpio - top left
  9: { x: 1.5, y: 1.5 }, // Sagittarius - inner top-left
  10: { x: 2.5, y: 1.5 }, // Capricorn - inner top-right
  11: { x: 2.5, y: 2.5 }, // Aquarius - inner bottom-right
  12: { x: 1.5, y: 2.5 }, // Pisces - inner bottom-left
};

// Pre-computed polygon information for each sign box (rhombus).
const SIGN_BOXES = Array.from({ length: 12 }, (_, i) => {
  const sign = i + 1;
  const pos = positions[sign];
  const cx = (pos.x / GRID) * VIEWBOX_SIZE;
  const cy = (pos.y / GRID) * VIEWBOX_SIZE;
  const points = `${cx},${cy - BOX_SIZE} ${cx + BOX_SIZE},${cy} ${cx},${cy + BOX_SIZE} ${cx - BOX_SIZE},${cy}`;
  return { sign, cx, cy, points };
});

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

export default function Chart({ data, children }) {
  const isValidNumber = (val) => typeof val === 'number' && !Number.isNaN(val);

  const invalidHouses =
    !data ||
    !Array.isArray(data.houses) ||
    data.houses.length !== 12 ||
    !data.houses.every(
      (h, idx, arr) =>
        typeof h === 'number' && h === ((arr[0] + idx - 1) % 12) + 1
    );

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

  const planetBySign = {};
  data.planets.forEach((p) => {
    if (!isValidNumber(p.sign)) return;

    // Convert degree to a number so numeric-like strings are treated as valid
    const degreeValue = Number(p.degree);
    const degree = isValidNumber(degreeValue) ? `${degreeValue}°` : 'No data';

    planetBySign[p.sign] = planetBySign[p.sign] || [];
    planetBySign[p.sign].push(
      `${p.abbr} ${degree}${p.retrograde ? ' R' : ''}${p.combust ? ' C' : ''}${p.exalted ? ' E' : ''}${p.debilitated ? ' D' : ''}`
    );
  });

  const ascSign = data.houses[0];
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
          <polygon points="50,0 100,50 50,100 0,50" strokeWidth="2" />
          {SIGN_BOXES.map((box) => (
            <polygon key={box.sign} points={box.points} strokeWidth="1" />
          ))}
        </svg>
        {SIGN_BOXES.map((box) => {
          const signInfo = SIGN_MAP[box.sign] || {};

          return (
            <div
              key={box.sign}
              className="absolute flex flex-col items-center text-xs gap-1"
              style={{
                top: `${box.cy}%`,
                left: `${box.cx}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-yellow-300 font-semibold">
                {box.sign}
                {box.sign === ascSign ? ' Asc' : ''}
              </span>
              <span className="text-orange-300 font-semibold flex items-center gap-1">
                {signInfo.symbol} {signInfo.abbr} {signInfo.name || ''}
              </span>
              {planetBySign[box.sign] &&
                planetBySign[box.sign].map((pl, idx) => <span key={idx}>{pl}</span>)}
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
        exalted: PropTypes.bool,
        debilitated: PropTypes.bool,
        house: PropTypes.number.isRequired,
        sign: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
};

