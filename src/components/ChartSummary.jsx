import React from 'react';
import PropTypes from 'prop-types';
import { summarizeChart } from '../lib/summary.js';
import * as astro from '../lib/astro.js';
const { SIGN_NAMES } = astro;

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

function formatDMS(p) {
  let d = p.deg;
  let m = p.min;
  let s = p.sec;
  if (typeof m !== 'number' || typeof s !== 'number') {
    const dVal = Math.floor(p.deg);
    const mFloat = (p.deg - dVal) * 60;
    const mVal = Math.floor(mFloat);
    const sVal = Math.round((mFloat - mVal) * 60);
    d = dVal;
    m = mVal;
    s = sVal;
  }
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}

export default function ChartSummary({ data }) {
  const { ascendant, moonSign } = summarizeChart(data);
  const planetRows = data.planets.map((p) => {
    let abbr = PLANET_ABBR[p.name] || p.name.slice(0, 2);
    if (p.retro) abbr += '(R)';
    if (p.combust) abbr += '(C)';
    const signNum = data.signInHouse?.[p.house] || p.sign + 1;
    const signName = SIGN_NAMES[signNum - 1];
    const degStr = formatDMS(p);
    return { abbr, signName, degStr };
  });
  return (
    <div className="backdrop-blur-md bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 mt-4">
      <p>Ascendant: {ascendant}</p>
      <p>Moon sign: {moonSign}</p>
      <table className="mt-4 text-left">
        <tbody>
          {planetRows.map(({ abbr, signName, degStr }) => (
            <tr key={abbr}>
              <td className="pr-2">{abbr}</td>
              <td>
                {signName} {degStr}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ChartSummary.propTypes = {
  data: PropTypes.shape({
    ascSign: PropTypes.number.isRequired,
    signInHouse: PropTypes.arrayOf(PropTypes.number).isRequired,
    planets: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sign: PropTypes.number,
        house: PropTypes.number.isRequired,
        deg: PropTypes.number,
        min: PropTypes.number,
        sec: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
};
