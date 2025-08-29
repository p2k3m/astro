import React from 'react';
import PropTypes from 'prop-types';

const VIEWBOX_SIZE = 100;
const BOX_SIZE = VIEWBOX_SIZE / 8;

// Centres for each of the 12 house boxes, in clockwise order starting from the
// first house at index 0. Values are percentages within the 0-100 SVG viewbox.
const HOUSE_BOX_CENTERS = [
  { cx: 50, cy: 12.5 }, // House 1
  { cx: 87.5, cy: 37.5 }, // House 2
  { cx: 87.5, cy: 62.5 }, // House 3
  { cx: 62.5, cy: 87.5 }, // House 4
  { cx: 50, cy: 87.5 }, // House 5
  { cx: 12.5, cy: 62.5 }, // House 6
  { cx: 12.5, cy: 37.5 }, // House 7
  { cx: 37.5, cy: 12.5 }, // House 8
  { cx: 37.5, cy: 37.5 }, // House 9
  { cx: 62.5, cy: 37.5 }, // House 10
  { cx: 62.5, cy: 62.5 }, // House 11
  { cx: 37.5, cy: 62.5 }, // House 12
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

const diamondPath = (cx, cy, size = BOX_SIZE) =>
  `M ${cx} ${cy - size} L ${cx + size} ${cy} L ${cx} ${cy + size} L ${cx - size} ${cy} Z`;

export default function Chart({ data, children }) {
  const isValidNumber = (val) => typeof val === 'number' && !Number.isNaN(val);

  const signByHouse = [];
  const invalidHouses =
    !data ||
    !Array.isArray(data.houses) ||
    data.houses.length !== 13 ||
    (() => {
      for (let sign = 1; sign <= 12; sign++) {
        const house = data.houses[sign];
        if (
          !isValidNumber(house) ||
          house < 1 ||
          house > 12 ||
          signByHouse[house]
        ) {
          return true;
        }
        signByHouse[house] = sign;
      }
      const asc = data.houses.indexOf(1);
      if (asc === -1) return true;
      for (let i = 0; i < 12; i++) {
        const sign = ((asc - 1 + i) % 12) + 1;
        if (data.houses[sign] !== i + 1) return true;
      }
      return false;
    })();

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

  const planetByHouse = {};
  data.planets.forEach((p) => {
    if (!isValidNumber(p.house)) return;

    const degreeValue = Number(p.degree);
    let degree = 'No data';
    if (isValidNumber(degreeValue)) {
      const d = Math.floor(degreeValue);
      const m = Math.round((degreeValue - d) * 60);
      degree = `${d}°${String(m).padStart(2, '0')}'`;
    }

    planetByHouse[p.house] = planetByHouse[p.house] || [];
    planetByHouse[p.house].push(
      `${p.abbr} ${degree}${p.retrograde ? ' R' : ''}${p.combust ? ' C' : ''}`
    );
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
          {HOUSE_BOX_CENTERS.map((c, idx) => (
            <path key={idx} d={diamondPath(c.cx, c.cy)} strokeWidth="1" />
          ))}
        </svg>
        {HOUSE_BOX_CENTERS.map((c, idx) => {
          const houseNum = idx + 1;
          const sign = signByHouse[houseNum];

          return (
            <div
              key={houseNum}
              className="absolute flex flex-col items-center text-xs gap-0.5 p-1"
              style={{
                top: `${c.cy}%`,
                left: `${c.cx}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-yellow-300 font-semibold">{houseNum}</span>
              {houseNum === 1 && (
                <span className="text-yellow-300 text-[0.6rem] leading-none">Asc</span>
              )}
              <span className="text-orange-300 font-semibold">
                {sign ? SIGN_LABELS[sign - 1] : ''}
              </span>
              {planetByHouse[houseNum] &&
                planetByHouse[houseNum].map((pl, i) => (
                  <span key={i}>{pl}</span>
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

