import { DateTime } from 'luxon';
import * as swisseph from '../../swisseph/index.js';

const ephePath = new URL('../../swisseph/ephe/', import.meta.url).pathname;

export function lonToSignDeg(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  let sign = Math.floor(norm / 30) + 1; // 1..12
  let rem = norm % 30;
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
  if (deg === 30) {
    deg = 0;
    sign = (sign % 12) + 1;
  }
  return { sign, deg, min, sec };
}

function toUTC({ datetime, zone }) {
  // Interpret the local time in the provided zone and convert to UTC.
  const dt = DateTime.fromISO(datetime, { zone }).toUTC();
  return dt.toJSDate();
}

export function compute_positions({ datetime, tz, lat, lon }, swe = swisseph) {
  if (swe.swe_set_ephe_path) {
    try {
      swe.swe_set_ephe_path(ephePath);
    } catch {}
  }
  if (swe.swe_set_sid_mode) {
    try {
      swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
    } catch {}
  }

  const date = toUTC({ datetime, zone: tz });

  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  const jd = swe.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    swe.SE_GREG_CAL
  );

  const rawHouses = swe.swe_houses_ex(
    jd,
    Number(lat),
    Number(lon),
    'W',
    swe.SEFLG_SIDEREAL | swe.SEFLG_SWIEPH
  );
  if (
    !rawHouses ||
    typeof rawHouses.ascendant === 'undefined' ||
    !Array.isArray(rawHouses.houses)
  ) {
    throw new Error('Could not compute houses from swisseph.');
  }
  const houses = rawHouses.houses.slice();
  const ascendant = rawHouses.ascendant;
  const ascSign = lonToSignDeg(ascendant).sign;
  const start =
    typeof houses[1] === 'number'
      ? houses[1]
      : ((ascSign - 1) * 30) % 360;
  if (process.env.DEBUG_HOUSES) {
    console.log('computed houses:', houses);
  }

  const flag = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL;
  const planetCodes = {
    sun: swe.SE_SUN,
    moon: swe.SE_MOON,
    mercury: swe.SE_MERCURY,
    venus: swe.SE_VENUS,
    mars: swe.SE_MARS,
    jupiter: swe.SE_JUPITER,
    saturn: swe.SE_SATURN,
    rahu: swe.SE_TRUE_NODE,
  };

  const planets = [];
  const rahuData = swe.swe_calc_ut(jd, swe.SE_TRUE_NODE, flag);
  const rahuFlags = rahuData.flags || 0;
  const { sign: rSign, deg: rDeg, min: rMin, sec: rSec } = lonToSignDeg(
    rahuData.longitude
  );
  // Determine which house a longitude falls into. Prefer the Swiss Ephemeris
  // swe_house_pos() calculation when available, falling back to simple
  // segmentation anchored to the first cusp if necessary.
  const houseOfLongitude = (lon) => {
    if (swe.swe_house_pos) {
      try {
        const h = swe.swe_house_pos(
          jd,
          Number(lat),
          Number(lon),
          'W',
          lon,
          houses
        );
        if (typeof h === 'number' && Number.isFinite(h)) {
          return Math.floor(h);
        }
      } catch {}
    }
    const diff = ((lon - start + 360) % 360 + 360) % 360;
    // Round to the nearest 1e-9° to stabilise cusp classification
    const index = Math.floor((Math.round(diff * 1e9) / 1e9) / 30);
    return index + 1; // Houses are 1-indexed
  };
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : swe.swe_calc_ut(jd, code, flag);
    const lon = data.longitude;
    const { sign, deg, min, sec } =
      name === 'rahu'
        ? { sign: rSign, deg: rDeg, min: rMin, sec: rSec }
        : lonToSignDeg(lon);
    const flags = name === 'rahu' ? rahuFlags : data.flags || 0;
    const retro =
      (flags & swe.SEFLG_RETROGRADE) !== 0 || data.longitudeSpeed < 0;
    planets.push({
      name,
      sign,
      deg,
      min,
      sec,
      speed: data.longitudeSpeed,
      flags,
      retro,
      house: houseOfLongitude(lon),
    });
  }
  // Ketu opposite Rahu
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg, min: kMin, sec: kSec } = lonToSignDeg(
    ketuLon
  );
  if (((kSign - rSign + 12) % 12) !== 6) {
    throw new Error('Rahu and Ketu must be six signs apart');
  }
  const ketuSpeed = rahuData.longitudeSpeed;
  const ketuRetro =
    (rahuFlags & swe.SEFLG_RETROGRADE) !== 0 || ketuSpeed < 0;
  planets.push({
    name: 'ketu',
    sign: kSign,
    deg: kDeg,
    min: kMin,
    sec: kSec,
    speed: ketuSpeed,
    flags: rahuFlags,
    retro: ketuRetro,
    house: houseOfLongitude(ketuLon),
  });

  return { ascSign, houses, planets };
}
