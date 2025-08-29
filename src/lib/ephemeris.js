import { DateTime } from 'luxon';
import swisseph from '../../swisseph-v2/index.js';

if (swisseph.swe_set_sid_mode) {
  try {
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  } catch {}
}

function lonToSignDeg(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(norm / 30) + 1; // 1..12
  const deg = +(norm % 30).toFixed(2);
  return { sign, deg };
}

function toUTC({ datetime, zone }) {
  const dt = DateTime.fromISO(datetime, { zone });
  return dt.toJSDate();
}

export function compute_positions({ datetime, tz, lat, lon }, swe = swisseph) {
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
    lat,
    lon,
    'P',
    swe.SEFLG_SIDEREAL | swe.SEFLG_SWIEPH
  );
  if (!rawHouses || typeof rawHouses.ascendant === 'undefined') {
    throw new Error('Could not compute ascendant from swisseph.');
  }
  const asc = lonToSignDeg(rawHouses.ascendant);

  const houses = Array(13).fill(null);
  for (let i = 0; i < 12; i++) {
    const signIndex = ((asc.sign - 1 + i) % 12) + 1;
    houses[signIndex] = i + 1;
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
  const { sign: rSign, deg: rDeg } = lonToSignDeg(rahuData.longitude);
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : swe.swe_calc_ut(jd, code, flag);
    const { sign, deg } =
      name === 'rahu' ? { sign: rSign, deg: rDeg } : lonToSignDeg(data.longitude);
    planets.push({ name, sign, deg, retro: data.longitudeSpeed < 0 });
  }
  // Ketu opposite Rahu
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg } = lonToSignDeg(ketuLon);
  if (((kSign - rSign + 12) % 12) !== 6) {
    throw new Error('Rahu and Ketu must be six signs apart');
  }
  planets.push({ name: 'ketu', sign: kSign, deg: kDeg, retro: rahuData.longitudeSpeed < 0 });

  return { ascSign: asc.sign, houses, planets };
}
