import React from 'react';
import PropTypes from 'prop-types';
import { summarizeChart } from '../lib/summary.js';

export default function ChartSummary({ data }) {
  const { ascendant, moonSign, houses } = summarizeChart(data);
  return (
    <div className="backdrop-blur-md bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 mt-4">
      <p>Ascendant: {ascendant}</p>
      <p>Moon sign: {moonSign}</p>
      <table className="mt-4 text-left">
        <tbody>
          {houses.slice(1).map((planets, idx) => (
            <tr key={idx}>
              <td className="pr-2">House {idx + 1}</td>
              <td>{planets}</td>
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
    planets: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sign: PropTypes.number,
        house: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
};
