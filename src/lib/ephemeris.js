import { DateTime } from 'luxon';
import { fileURLToPath } from 'node:url';
import * as swe from '../../swisseph/index.js';

const epheUrl = new URL('../../swisseph/ephe/', import.meta.url);
await swe.ready;
if (epheUrl.protocol === 'file:') {
  try {
    const ephePath = fileURLToPath(epheUrl);
    swe.swe_set_ephe_path(ephePath);
  } catch {}
}
try {
  swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
} catch {}

function lonToSignDeg(longitude) {
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

function houseOfLongitude(lon, cusps) {
  if (!Array.isArray(cusps) || cusps.length < 13) return 1;
  for (let i = 1; i <= 12; i++) {
    const start = cusps[i];
    let end = i === 12 ? cusps[1] + 360 : cusps[i + 1];
    if (end < start) end += 360;
    let l = lon;
    if (l < start) l += 360;
    if (l >= start && l < end) return i;
  }
  return 1;
}

function toUTC({ datetime, zone }) {
  const dt = DateTime.fromISO(datetime, { zone }).toUTC();
  return dt.toJSDate();
}

async function compute_positions({ datetime, tz, lat, lon }, sweInst = swe) {
  await sweInst.ready;

  const date = toUTC({ datetime, zone: tz });
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;
  const jd = sweInst.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    sweInst.SE_GREG_CAL
  );
  const flag =
    sweInst.SEFLG_SWIEPH | sweInst.SEFLG_SPEED | sweInst.SEFLG_SIDEREAL;
  const raw = sweInst.swe_houses_ex(jd, Number(lat), Number(lon), 'P', flag);
  if (typeof raw?.ascendant === 'undefined') {
    throw new Error('Could not compute houses from swisseph.');
  }
  const { sign: ascSign, deg: ascDeg, min: ascMin, sec: ascSec } = lonToSignDeg(
    raw.ascendant
  );
  const cusps = raw.houseCusps || raw.houses;
  const houses = [null];
  if (Array.isArray(cusps)) {
    for (let i = 1; i <= 12; i++) {
      houses[i] = cusps[i];
    }
  }

  const planetCodes = {
    sun: sweInst.SE_SUN,
    moon: sweInst.SE_MOON,
    mercury: sweInst.SE_MERCURY,
    venus: sweInst.SE_VENUS,
    mars: sweInst.SE_MARS,
    jupiter: sweInst.SE_JUPITER,
    saturn: sweInst.SE_SATURN,
    rahu: sweInst.SE_TRUE_NODE,
  };

  const planets = [];
  const rahuData = sweInst.swe_calc_ut(jd, sweInst.SE_TRUE_NODE, flag);
  const { sign: rSign, deg: rDeg, min: rMin, sec: rSec } = lonToSignDeg(
    rahuData.longitude
  );
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : sweInst.swe_calc_ut(jd, code, flag);
    const lon = data.longitude;
    const { sign, deg, min, sec } =
      name === 'rahu'
        ? { sign: rSign, deg: rDeg, min: rMin, sec: rSec }
        : lonToSignDeg(lon);
    const retro = data.longitudeSpeed < 0;
    planets.push({
      name,
      sign,
      deg,
      min,
      sec,
      lon,
      speed: data.longitudeSpeed,
      retro,
      house: houseOfLongitude(lon, houses),
    });
  }
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg, min: kMin, sec: kSec } = lonToSignDeg(ketuLon);
  planets.push({
    name: 'ketu',
    sign: kSign,
    deg: kDeg,
    min: kMin,
    sec: kSec,
    lon: ketuLon,
    speed: rahuData.longitudeSpeed,
    retro: rahuData.longitudeSpeed < 0,
    house: houseOfLongitude(ketuLon, houses),
  });

  return {
    ascSign,
    ascendant: { lon: raw.ascendant, sign: ascSign, deg: ascDeg, min: ascMin, sec: ascSec },
    houses,
    planets,
  };
}

export { lonToSignDeg, compute_positions };
