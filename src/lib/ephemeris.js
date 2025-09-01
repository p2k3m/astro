const { DateTime } = require('luxon');
const swe = require('swisseph-v2');
const path = require('path');

const ephePath = path.join(__dirname, '../../swisseph/ephe');
try {
  swe.swe_set_ephe_path(ephePath);
} catch {}
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

function toUTC({ datetime, zone }) {
  const dt = DateTime.fromISO(datetime, { zone }).toUTC();
  return dt.toJSDate();
}

function compute_positions({ datetime, tz, lat, lon }, sweInst = swe) {
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
  const raw = sweInst.swe_houses_ex(jd, flag, Number(lat), Number(lon), 'W');
  if (!raw || typeof raw.ascendant === 'undefined' || !Array.isArray(raw.house)) {
    throw new Error('Could not compute houses from swisseph.');
  }
  const houses = [null, ...raw.house];
  const ascendant = raw.ascendant;
  const ascSign = lonToSignDeg(ascendant).sign;
  const start = houses[1];

  const houseOfLongitude = (bodyLon) => {
    const diff = ((bodyLon - start + 360) % 360 + 360) % 360;
    const segHouse = Math.floor((Math.round(diff * 1e9) / 1e9) / 30) + 1;
    return segHouse;
  };

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
      name === 'rahu' ? { sign: rSign, deg: rDeg, min: rMin, sec: rSec } : lonToSignDeg(lon);
    const retro = data.longitudeSpeed < 0;
    planets.push({
      name,
      sign,
      deg,
      min,
      sec,
      speed: data.longitudeSpeed,
      retro,
      house: houseOfLongitude(lon),
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
    speed: rahuData.longitudeSpeed,
    retro: rahuData.longitudeSpeed < 0,
    house: houseOfLongitude(ketuLon),
  });

  return { ascSign, houses, planets };
}

module.exports = { lonToSignDeg, compute_positions };
