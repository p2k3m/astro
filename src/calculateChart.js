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

const EXALTATIONS = {
  sun: 1,
  moon: 2,
  mars: 10,
  mercury: 6,
  jupiter: 4,
  venus: 12,
  saturn: 7,
};

const DEBILITATIONS = Object.fromEntries(
  Object.entries(EXALTATIONS).map(([k, v]) => [k, ((v + 6 - 1) % 12) + 1])
);

const COMBUST_THRESHOLDS = {
  mercury: 12,
  venus: 10,
  mars: 17,
  jupiter: 11,
  saturn: 15,
};

export function longitudeToSign(longitude) {
  longitude = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(longitude / 30) + 1; // 1..12
  const degree = longitude % 30;
  return { sign, degree: +degree.toFixed(2) };
}

export default async function calculateChart({ date, time, lat, lon, timezone }) {
  let tz = timezone;
  if (!tz) {
    try {
      tz = getTimezoneName(lat, lon);
    } catch {
      tz = 'UTC';
    }
  }
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

  const sun = planets.find((p) => p.name === 'sun');
  const sunLon = sun ? (sun.sign - 1) * 30 + sun.degree : 0;

  planets.forEach((p) => {
    const sign = p.sign;
    if (EXALTATIONS[p.name] === sign) p.exalted = true;
    if (DEBILITATIONS[p.name] === sign) p.debilitated = true;
    if (p.name !== 'sun' && sun) {
      const lon = (p.sign - 1) * 30 + p.degree;
      let diff = Math.abs(lon - sunLon);
      if (diff > 180) diff = 360 - diff;
      const limit = COMBUST_THRESHOLDS[p.name];
      if (limit && diff < limit) p.combust = true;
    }
  });

  return { ascendant: { sign: ascSign }, houses, planets };
}
