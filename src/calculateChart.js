// Utility to compute ascendant and planetary positions using Swiss Ephemeris.

import { DateTime } from 'luxon';
import { getTimezoneName } from './lib/timezone.js';
import { computePositions } from './lib/astro.js';

export function longitudeToSign(longitude) {
  longitude = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(longitude / 30); // 0..11
  const degree = longitude % 30;
  return { sign, degree: +degree.toFixed(2) };
}

export default async function calculateChart({
  date,
  time,
  lat,
  lon,
  timezone,
}) {
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

  return await computePositions(dtISO, lat, lon);
}
