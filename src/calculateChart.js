// Utility to compute ascendant and planetary positions using jyotish-calculations
// The library wraps the Swiss Ephemeris for high precision.
// Note: this code assumes jyotish-calculations exposes functions for ascendant
// and planetary calculations. Adjust the API usage if the package differs.

import { getAscendant, getPlanetPosition } from 'jyotish-calculations';

const PLANETS = [
  { key: 'sun', abbr: 'Su' },
  { key: 'moon', abbr: 'Mo' },
  { key: 'mars', abbr: 'Ma' },
  { key: 'mercury', abbr: 'Me' },
  { key: 'jupiter', abbr: 'Ju' },
  { key: 'venus', abbr: 'Ve' },
  { key: 'saturn', abbr: 'Sa' },
  { key: 'rahu', abbr: 'Ra' },
  { key: 'ketu', abbr: 'Ke' },
];

function longitudeToSign(longitude) {
  const sign = Math.floor(longitude / 30) + 1; // 1..12
  const degree = longitude % 30;
  return { sign, degree: degree.toFixed(2) };
}

export default async function calculateChart({ date, time, lat, lon }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const jsDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Ascendant calculation
  const ascLong = await getAscendant(jsDate, lat, lon);
  const asc = longitudeToSign(ascLong);

  const houses = Array.from({ length: 12 }, (_, i) => ((asc.sign + i - 1) % 12) + 1);

  // Planetary calculations
  const planets = [];
  for (const p of PLANETS) {
    const info = await getPlanetPosition(jsDate, lat, lon, p.key);
    const pos = longitudeToSign(info.longitude);
    planets.push({
      name: p.key,
      abbr: p.abbr,
      sign: pos.sign,
      degree: pos.degree,
      retrograde: info.retrograde,
      combust: info.combust,
      house: ((pos.sign - asc.sign + 12) % 12) + 1,
    });
  }

  return { ascendant: asc, houses, planets };
}
