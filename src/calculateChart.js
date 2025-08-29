// Utility to compute ascendant and planetary positions.
// Calculations are delegated to a backend API so the frontend remains dependency-free.

import { getTimezoneName } from './lib/timezone.js';

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
  return { sign, degree: +degree.toFixed(2) };
}

export default async function calculateChart({ date, time, lat, lon }) {
  const tz = getTimezoneName(lat, lon);
  const params = new URLSearchParams({
    datetime: `${date}T${time}`,
    tz,
    lat: String(lat),
    lon: String(lon),
  });

  let data;
  try {
    const res = await fetch(`/api/positions?${params.toString()}`);
    if (!res.ok) {
      let body = {};
      try {
        body = await res.json();
      } catch (e) {}
      throw new Error(body.error || res.statusText);
    }
    data = await res.json();
  } catch (err) {
    throw new Error(`Failed to fetch positions: ${err.message}`);
  }

  const ascSign = data.asc_sign;
  const houses = Array.from({ length: 12 }, (_, i) => ((ascSign + i - 1) % 12) + 1);

  const planets = (data.planets || []).map((p) => {
    const house = ((p.sign - ascSign + 12) % 12) + 1;
    const abbr = PLANETS.find((pl) => pl.key === p.name)?.abbr;
    return {
      name: p.name,
      abbr,
      sign: p.sign,
      degree: p.deg,
      retrograde: p.retro,
      house,
    };
  });

  return { ascendant: { sign: ascSign }, houses, planets };
}
