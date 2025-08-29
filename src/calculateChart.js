// Utility to compute ascendant and planetary positions using Swiss Ephemeris.

import { DateTime } from 'luxon';
import { getTimezoneName } from './lib/timezone.js';
import { computePositions } from './lib/astro.js';

const EXALTATIONS = {
  Su: 0,
  Mo: 1,
  Ma: 9,
  Me: 5,
  Ju: 3,
  Ve: 11,
  Sa: 6,
};

const DEBILITATIONS = Object.fromEntries(
  Object.entries(EXALTATIONS).map(([k, v]) => [k, (v + 6) % 12])
);

const COMBUST_THRESHOLDS = {
  Me: 12,
  Ve: 10,
  Ma: 17,
  Ju: 11,
  Sa: 15,
};

export function longitudeToSign(longitude) {
  longitude = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(longitude / 30); // 0..11
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

  const dt = DateTime.fromISO(`${date}T${time}`, { zone: tz });
  const dtISO = dt.toISO({ suppressMilliseconds: true });

  const { ascSign, houses, planets: rawPlanets } = await computePositions(dtISO, lat, lon);

  const planets = (rawPlanets || []).map((p) => {
    const house = houses[p.sign];
    return {
      name: p.name,
      abbr: p.name,
      sign: p.sign,
      degree: p.deg,
      retrograde: p.retro,
      house,
    };
  });

  const sun = planets.find((p) => p.name === 'Su');
  const sunLon = sun ? sun.sign * 30 + sun.degree : 0;

  planets.forEach((p) => {
    const sign = p.sign;
    if (EXALTATIONS[p.name] === sign) p.exalted = true;
    if (DEBILITATIONS[p.name] === sign) p.debilitated = true;
    if (p.name !== 'Su' && sun) {
      const lon = p.sign * 30 + p.degree;
      let diff = Math.abs(lon - sunLon);
      if (diff > 180) diff = 360 - diff;
      const limit = COMBUST_THRESHOLDS[p.name];
      if (limit && diff < limit) p.combust = true;
    }
  });

  return { ascendant: { sign: ascSign }, houses, planets };
}
