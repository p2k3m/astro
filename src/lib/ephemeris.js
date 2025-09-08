import { DateTime } from 'luxon';
import * as swe from '../../swisseph/index.js';
import { longitudeToNakshatra } from './nakshatra.js';

const epheUrl = new URL('../../swisseph/ephe/', import.meta.url);
swe.ready.then(() => {
  if (epheUrl.protocol === 'file:') swe.swe_set_ephe_path(epheUrl.pathname);
  try {
    swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  } catch {}
});

// Convert a longitude into sign and DMS components.
// Signs are numbered 1–12 (1 = Aries, 12 = Pisces).
function lonToSignDeg(longitude) {
  // Normalise longitude to the 0–360° range.
  let norm = ((longitude % 360) + 360) % 360;

  // Convert the normalised longitude to total arcseconds and round to the
  // nearest whole arcsecond. AstroSage uses half-up rounding here, so a
  // fractional part of 0.5 seconds or greater rounds up to the next second.
  // A tiny epsilon compensates for floating-point noise that could otherwise
  // push values like 57.5″ slightly below the 0.5″ threshold.
  let totalSec = Math.round(norm * 3600 + 1e-9);
  totalSec = ((totalSec % (360 * 3600)) + 360 * 3600) % (360 * 3600);

  // Break the total seconds down using integer division.
  const sign = Math.trunc(totalSec / (30 * 3600)) + 1; // 1..12
  totalSec %= 30 * 3600;

  const deg = Math.trunc(totalSec / 3600);
  totalSec %= 3600;

  const min = Math.trunc(totalSec / 60);
  const sec = totalSec % 60;

  return { sign, deg, min, sec };
}

function toUTC({ datetime, zone }) {
  // AstroSage truncates timestamps to whole seconds before converting to UT.
  // If no explicit zone is provided, respect any offset embedded in the ISO
  // timestamp. This mirrors typical usage where callers pass
  // `YYYY-MM-DDTHH:mm+HH:mm` without a separate time zone argument.
  const opts = zone ? { zone } : { setZone: true };
  const dt = DateTime.fromISO(datetime, opts).startOf('second').toUTC();
  return dt.toJSDate();
}

async function compute_positions(
  {
    datetime,
    tz,
    lat,
    lon,
    sidMode,
    nodeType = 'mean',
    houseSystem = 'W',
    nakshatraAbbr = false,
  },
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
  // `toUTC` already truncates to whole seconds, so mirror AstroSage by
  // ignoring any sub-second fragments when calculating UT.
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const jd = sweInst.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    ut,
    sweInst.SE_GREG_CAL
  );
  const flag =
    sweInst.SEFLG_SWIEPH | sweInst.SEFLG_SPEED | sweInst.SEFLG_SIDEREAL;
  const raw = sweInst.swe_houses_ex(jd, Number(lat), Number(lon), houseSystem, flag);
  if (typeof raw?.ascendant === 'undefined') {
    throw new Error('Could not compute houses from swisseph.');
  }
  const { sign: ascSign, deg: ascDeg, min: ascMin, sec: ascSec } = lonToSignDeg(
    raw.ascendant
  );
  const { nakshatra: ascNakshatra, pada: ascPada } = longitudeToNakshatra(
    raw.ascendant,
    { useAbbreviations: nakshatraAbbr }
  );
  const houses = raw.houses;

  function getHouse(lon) {
    for (let h = 1; h <= 12; h++) {
      const start = houses[h];
      let end = h === 12 ? houses[1] + 360 : houses[h + 1];
      let l = lon;
      if (end < start) {
        end += 360;
        if (l < start) l += 360;
      }
      if (l >= start && l < end) return h;
    }
    return 1;
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
    const house = getHouse(lon);
    const { nakshatra, pada } = longitudeToNakshatra(lon, {
      useAbbreviations: nakshatraAbbr,
    });
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
      nakshatra,
      pada,
    });
  }
  const ketuLon = (rahuData.longitude + 180) % 360;
  const { sign: kSign, deg: kDeg, min: kMin, sec: kSec } = lonToSignDeg(ketuLon);
  const { nakshatra: kNakshatra, pada: kPada } = longitudeToNakshatra(
    ketuLon,
    { useAbbreviations: nakshatraAbbr }
  );
  planets.push({
    name: 'ketu',
    sign: kSign,
    deg: kDeg,
    min: kMin,
    sec: kSec,
    lon: ketuLon,
    speed: rahuData.longitudeSpeed,
    retro: rahuData.longitudeSpeed < -speedThreshold,
    house: getHouse(ketuLon),
    nakshatra: kNakshatra,
    pada: kPada,
  });

  // ascSign and each planet.sign use 1–12 numbering (1 = Aries).
  return {
    ascSign,
    ascendant: {
      lon: raw.ascendant,
      sign: ascSign,
      deg: ascDeg,
      min: ascMin,
      sec: ascSec,
      nakshatra: ascNakshatra,
      pada: ascPada,
    },
    houses,
    planets,
  };
}

export { lonToSignDeg, toUTC, compute_positions };
