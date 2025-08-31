import { DateTime } from 'luxon';
import * as swisseph from '../../swisseph/index.js';

const ephePath = new URL('../../swisseph/ephe/', import.meta.url).pathname;

swisseph.ready.then(() => {
  if (swisseph.swe_set_ephe_path) {
    try {
      swisseph.swe_set_ephe_path(ephePath);
    } catch {}
  }

  if (swisseph.swe_set_sid_mode) {
    try {
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    } catch {}
  }
});

export function lonToSignDeg(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(norm / 30) + 1; // 1..12
  const deg = +(norm % 30).toFixed(2);
  return { sign, deg };
}

function toUTC({ datetime, zone }) {
  // Interpret the local time in the provided zone and convert to UTC.
  const dt = DateTime.fromISO(datetime, { zone }).toUTC();
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
    Number(lat),
    Number(lon),
    'P',
    swe.SEFLG_SIDEREAL | swe.SEFLG_SWIEPH
  );
  if (
    !rawHouses ||
    typeof rawHouses.ascendant === 'undefined' ||
    !Array.isArray(rawHouses.houses)
  ) {
    throw new Error('Could not compute houses from swisseph.');
  }
  const houses = rawHouses.houses;
  if (process.env.DEBUG_HOUSES) {
    console.log('swe_houses_ex houses:', houses);
  }
  // The house array follows the Swiss Ephemeris convention: index 1 is the
  // first house cusp (ascendant) and 12 the twelfth. Index 0 is unused.
  const ascSign = lonToSignDeg(rawHouses.ascendant).sign;

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
  const { sign: rSign, deg: rDeg } = lonToSignDeg(rahuData.longitude);
  const houseOf = (bodyLon) => {
    const rawHouse = swe.swe_house_pos(
      jd,
      Number(lat),
      Number(lon),
      'P',
      bodyLon,
      houses
    );
    // Normalize to 1–12 to prevent cusp drift (e.g. 0 or 13)
    return ((Math.floor(rawHouse) - 1 + 12) % 12) + 1; // 1..12
  };
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : swe.swe_calc_ut(jd, code, flag);
    const { sign, deg } =
      name === 'rahu' ? { sign: rSign, deg: rDeg } : lonToSignDeg(data.longitude);
    const flags = name === 'rahu' ? rahuFlags : data.flags || 0;
    const retro = (flags & swe.SEFLG_RETROGRADE) !== 0;
    planets.push({
      name,
      sign,
      deg,
      speed: data.longitudeSpeed,
      flags,
      retro,
      house: houseOf(data.longitude),
    });
  }
  // Ketu opposite Rahu
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg } = lonToSignDeg(ketuLon);
  if (((kSign - rSign + 12) % 12) !== 6) {
    throw new Error('Rahu and Ketu must be six signs apart');
  }
  const ketuRetro = (rahuFlags & swe.SEFLG_RETROGRADE) !== 0;
  planets.push({
    name: 'ketu',
    sign: kSign,
    deg: kDeg,
    speed: -rahuData.longitudeSpeed,
    flags: rahuFlags,
    retro: ketuRetro,
    house: houseOf(ketuLon),
  });

  return { ascSign, houses, planets };
}
