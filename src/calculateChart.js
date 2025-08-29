// Utility to compute ascendant and planetary positions.
// The original implementation relied on the "jyotish-calculations" package
// which is not compatible with the browser. Instead, calculations are now
// delegated to a backend API so the frontend remains dependency-free.

import { getTimezoneOffset } from './lib/timezone.js';

async function getAscendant(jsDate, lat, lon) {
  const params = new URLSearchParams({
    date: jsDate.toISOString(),
    lat: String(lat),
    lon: String(lon),
  });

  try {
    const res = await fetch(`/api/ascendant?${params.toString()}`);
    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch (e) {}
      throw new Error(data.error || res.statusText);
    }
    const data = await res.json();
    return data.longitude;
  } catch (err) {
    throw new Error(`Failed to fetch ascendant: ${err.message}`);
  }
}

async function getPlanetPosition(jsDate, lat, lon, planet) {
  const params = new URLSearchParams({
    date: jsDate.toISOString(),
    lat: String(lat),
    lon: String(lon),
    planet,
  });

  try {
    const res = await fetch(`/api/planet?${params.toString()}`);
    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch (e) {}
      throw new Error(data.error || res.statusText);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error(`Failed to fetch ${planet} data: ${err.message}`);
  }
}


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

export function longitudeToSign(longitude) {
  longitude = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(longitude / 30) + 1; // 1..12
  const degree = longitude % 30;
  // Return degree as a numeric value rounded to two decimals
  // Using unary plus converts the string result of toFixed back to a number
  return { sign, degree: +degree.toFixed(2) };
}

export default async function calculateChart({ date, time, lat, lon }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  let jsDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Adjust for the location's timezone offset so the backend receives UTC
  // timestamps. The offset is derived from historical timezone data and
  // reflects daylight saving time where applicable.
  const tzOffset = await getTimezoneOffset({ date, time, lat, lon });
  jsDate = new Date(jsDate.getTime() - tzOffset * 60000);

  // Ascendant calculation
  const ascLong = await getAscendant(jsDate, lat, lon);
  const asc = longitudeToSign(ascLong);

  const houses = Array.from(
    { length: 12 },
    (_, i) => ((asc.sign + i - 1) % 12) + 1
  );

  // Sanity check: ensure we ended up with a full 12-sign progression
  // starting from the ascendant. This helps catch logic errors if the
  // calculation above is ever altered.
  const expected = Array.from(
    { length: 12 },
    (_, i) => ((asc.sign + i - 1) % 12) + 1
  );
  const validHouses =
    houses.length === 12 && houses.every((h, idx) => h === expected[idx]);
  if (!validHouses) {
    throw new Error('Invalid house sequence');
  }

  // Planetary calculations
  let planetData;
  try {
    planetData = await Promise.all(
      PLANETS.map((p) => getPlanetPosition(jsDate, lat, lon, p.key))
    );
  } catch (err) {
    throw new Error(`Failed to fetch planetary data: ${err.message}`);
  }

  const planets = planetData.map((info, idx) => {
    const p = PLANETS[idx];
    const pos = longitudeToSign(info.longitude);
    return {
      name: p.key,
      abbr: p.abbr,
      sign: pos.sign,
      degree: pos.degree,
      retrograde: info.retrograde,
      combust: info.combust,
      exalted: info.exalted,
      debilitated: info.debilitated,
      house: ((pos.sign - asc.sign + 12) % 12) + 1,
    };
  });

  return { ascendant: asc, houses, planets };
}
