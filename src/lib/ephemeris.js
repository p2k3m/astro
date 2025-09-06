import { DateTime } from 'luxon';
import * as swe from '../../swisseph/index.js';

const epheUrl = new URL('../../swisseph/ephe/', import.meta.url);
swe.ready.then(() => {
  if (epheUrl.protocol === 'file:') swe.swe_set_ephe_path(epheUrl.pathname);
  try {
    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  } catch {}
});

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

function toUTC({ datetime, zone }) {
  const dt = DateTime.fromISO(datetime, { zone }).toUTC();
  return dt.toJSDate();
}

async function compute_positions(
  { datetime, tz, lat, lon, sidMode, nodeType },
  sweInst = swe
) {
  await sweInst.ready;
  try {
    if (typeof sweInst.swe_set_sid_mode === 'function') {
      sweInst.swe_set_sid_mode(
        sidMode ?? sweInst.SE_SIDM_LAHIRI,
        0,
        0
      );
    }
  } catch {}

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
  const ascStart = Math.floor(raw.ascendant / 30) * 30;
  const houses = [null];
  for (let i = 1; i <= 12; i++) {
    houses[i] = (ascStart + (i - 1) * 30) % 360;
  }

  const nodeCode =
    nodeType === 'mean' ? sweInst.SE_MEAN_NODE : sweInst.SE_TRUE_NODE;

  const planetCodes = {
    sun: sweInst.SE_SUN,
    moon: sweInst.SE_MOON,
    mercury: sweInst.SE_MERCURY,
    venus: sweInst.SE_VENUS,
    mars: sweInst.SE_MARS,
    jupiter: sweInst.SE_JUPITER,
    saturn: sweInst.SE_SATURN,
    uranus: sweInst.SE_URANUS,
    neptune: sweInst.SE_NEPTUNE,
    pluto: sweInst.SE_PLUTO,
    rahu: nodeCode,
  };

  const planets = [];
  const rahuData = sweInst.swe_calc_ut(jd, nodeCode, flag);
  const { sign: rSign, deg: rDeg, min: rMin, sec: rSec } = lonToSignDeg(
    rahuData.longitude
  );
  const speedThreshold = 0.0001;
  for (const [name, code] of Object.entries(planetCodes)) {
    const data = name === 'rahu' ? rahuData : sweInst.swe_calc_ut(jd, code, flag);
    const lon = data.longitude;
    const { sign, deg, min, sec } =
      name === 'rahu'
        ? { sign: rSign, deg: rDeg, min: rMin, sec: rSec }
        : lonToSignDeg(lon);
    const retro = data.longitudeSpeed < -speedThreshold;
    const house = Math.floor(((lon - ascStart + 360) % 360) / 30) + 1;
    planets.push({
      name,
      sign,
      deg,
      min,
      sec,
      lon,
      speed: data.longitudeSpeed,
      retro,
      house,
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
    retro: rahuData.longitudeSpeed < -speedThreshold,
    house: Math.floor(((ketuLon - ascStart + 360) % 360) / 30) + 1,
  });

  return {
    ascSign,
    ascendant: { lon: raw.ascendant, sign: ascSign, deg: ascDeg, min: ascMin, sec: ascSec },
    houses,
    planets,
  };
}

export { lonToSignDeg, compute_positions };
