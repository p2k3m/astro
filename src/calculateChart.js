// Utility to compute ascendant and planetary positions using Swiss Ephemeris.

import { DateTime } from 'luxon';
import { getTimezoneName } from './lib/timezone.js';
import { computePositions } from './lib/astro.js';

export function longitudeToSign(longitude) {
  longitude = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(longitude / 30); // 0..11
  let rem = longitude % 30;
  let deg = Math.floor(rem);
  rem = (rem - deg) * 60;
  let min = Math.floor(rem);
  let sec = Math.round((rem - min) * 60);
  if (sec === 60) {
    sec = 0;
    min += 1;
  }
  if (min === 60) {
    min = 0;
    deg += 1;
  }
  return { sign, deg, min, sec };
}

export default async function calculateChart({
  date,
  time,
  lat,
  lon,
  timezone,
  sidMode,
  nodeType,
}) {
  let tz = timezone;
  if (!tz) {
    try {
      tz = getTimezoneName(lat, lon);
    } catch {
      tz = 'Asia/Calcutta';
    }
  }

  const dt = DateTime.fromISO(`${date}T${time}`, { zone: tz });
  const dtISO = dt.toISO({ suppressMilliseconds: true });

  return await computePositions(dtISO, lat, lon, { sidMode, nodeType });
}
