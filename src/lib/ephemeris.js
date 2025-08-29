import { toUTC } from './timezone.js';
import swisseph from '../../swisseph-v2/index.js';

function lonToSignDeg(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(norm / 30) + 1; // 1..12
  const deg = +(norm % 30).toFixed(2);
  return { sign, deg };
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

  const houses = swe.swe_houses_ex(
    jd,
    lat,
    lon,
    'P',
    swe.SEFLG_SIDEREAL | swe.SEFLG_SWIEPH
  );
  if (!houses || typeof houses.ascendant === 'undefined') {
    throw new Error('Could not compute ascendant from swisseph.');
  }
  const asc = lonToSignDeg(houses.ascendant);

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
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : swe.swe_calc_ut(jd, code, flag);
    const { sign, deg } = lonToSignDeg(data.longitude);
    planets.push({ name, sign, deg, retro: data.longitudeSpeed < 0 });
  }
  // Ketu opposite Rahu
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg } = lonToSignDeg(ketuLon);
  planets.push({ name: 'ketu', sign: kSign, deg: kDeg, retro: rahuData.longitudeSpeed < 0 });

  return { asc_sign: asc.sign, planets };
}
