import { DateTime } from 'luxon';
import * as swisseph from '../../swisseph-v2/index.js';

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

export function computePositions(dtISOWithZone, lat, lon, ayanamsha) {
  if (swisseph.swe_set_sid_mode && ayanamsha !== undefined) {
    try {
      swisseph.swe_set_sid_mode(ayanamsha, 0, 0);
    } catch {}
  }

  const dt = DateTime.fromISO(dtISOWithZone, { setZone: true });
  if (!dt.isValid) throw new Error('Invalid datetime');

  const date = dt.toJSDate();
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  const jd = swisseph.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    swisseph.SE_GREG_CAL
  );

  const hres = swisseph.swe_houses_ex(
    jd,
    lat,
    lon,
    'P',
    swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SWIEPH
  );
  if (!hres || typeof hres.ascendant === 'undefined') {
    throw new Error('Could not compute ascendant from swisseph.');
  }
  const asc = lonToSignDeg(hres.ascendant);
  const houses = Array(13).fill(null);
  for (let i = 0; i < 12; i++) {
    const houseNum = i + 1;
    houses[houseNum] = ((asc.sign - 1 + i) % 12) + 1;
  }

  const flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
  const planetCodes = {
    sun: swisseph.SE_SUN,
    moon: swisseph.SE_MOON,
    mercury: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS,
    mars: swisseph.SE_MARS,
    jupiter: swisseph.SE_JUPITER,
    saturn: swisseph.SE_SATURN,
    rahu: swisseph.SE_TRUE_NODE,
  };

  const planets = [];
  const rahuData = swisseph.swe_calc_ut(jd, swisseph.SE_TRUE_NODE, flag);
  const { sign: rSign, deg: rDeg } = lonToSignDeg(rahuData.longitude);
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : swisseph.swe_calc_ut(jd, code, flag);
    const { sign, deg } =
      name === 'rahu' ? { sign: rSign, deg: rDeg } : lonToSignDeg(data.longitude);
    planets.push({ name, sign, deg, retro: data.longitudeSpeed < 0 });
  }

  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg } = lonToSignDeg(ketuLon);
  if (((kSign - rSign + 12) % 12) !== 6) {
    throw new Error('Rahu and Ketu are not opposite');
  }
  planets.push({ name: 'ketu', sign: kSign, deg: kDeg, retro: rahuData.longitudeSpeed < 0 });

  return { ascSign: asc.sign, houses, planets };
}
