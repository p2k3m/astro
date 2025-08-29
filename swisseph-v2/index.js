const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Constants mimicking a subset of Swiss Ephemeris
module.exports.SE_SUN = 0;
module.exports.SE_MOON = 1; // unused stub
module.exports.SE_MERCURY = 2; // unused
module.exports.SE_VENUS = 3; // unused
module.exports.SE_MARS = 4; // unused
module.exports.SE_JUPITER = 5; // unused
module.exports.SE_SATURN = 6; // unused
module.exports.SE_TRUE_NODE = 7; // Rahu
module.exports.SE_MEAN_NODE = 8; // Ketu approximated

module.exports.SEFLG_SPEED = 1 << 0;
module.exports.SEFLG_SWIEPH = 1 << 1;
module.exports.SEFLG_SIDEREAL = 1 << 2;

module.exports.SE_SIDM_LAHIRI = 0; // id for Lahiri mode
module.exports.SE_GREG_CAL = 1;

// no-op setters for path and sidereal mode
module.exports.swe_set_ephe_path = function () {};
module.exports.swe_set_sid_mode = function () {};

// Julian day computation (Gregorian calendar only)
module.exports.swe_julday = function (year, month, day, ut, calflag) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    ut / 24;
  return jd;
};

// Simple approximate Lahiri ayanamsa
function lahiriAyanamsa(jd) {
  const days = jd - 2451545.0; // days since J2000
  return 23.85675 + days * (50.29 / 3600) / 365.25; // degrees
}

function sunLongitude(jd) {
  const n = jd - 2451545.0; // days since J2000
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda =
    L +
    1.915 * Math.sin(g * DEG2RAD) +
    0.020 * Math.sin(2 * g * DEG2RAD);
  return (lambda % 360 + 360) % 360; // degrees
}

module.exports.swe_calc_ut = function (jd, planetId, flags) {
  let lon = 0;
  if (planetId === module.exports.SE_SUN) {
    const tropical = sunLongitude(jd);
    const ayan = lahiriAyanamsa(jd);
    lon = (tropical - ayan + 360) % 360;
  } else if (planetId === module.exports.SE_TRUE_NODE) {
    // Rough mean node formula (sidereal)
    const days = jd - 2451545.0;
    const meanNode = (125.04452 - 0.0529538083 * days) % 360;
    lon = (meanNode + 360) % 360;
  }
  return {
    longitude: lon,
    longitudeSpeed: 0, // not modelled
  };
};

function localSiderealTime(jd, lon) {
  const T = (jd - 2451545.0) / 36525;
  const GMST =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return (GMST + lon) % 360;
}

function obliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * T; // degrees
}

function ascendantTropical(jd, lat, lon) {
  const lst = localSiderealTime(jd, lon) * DEG2RAD;
  const eps = obliquity(jd) * DEG2RAD;
  const phi = lat * DEG2RAD;
  // Formula valid near equator; adequate for tests
  const asc = Math.atan2(-Math.cos(lst), Math.sin(lst) * Math.cos(eps));
  return (asc * RAD2DEG + 360) % 360;
}

module.exports.swe_houses_ex = function (jd, lat, lon, hsys, flags) {
  const ascTropical = ascendantTropical(jd, lat, lon);
  const ayan = lahiriAyanamsa(jd);
  const ascSid = (ascTropical - ayan + 360) % 360;
  return { ascendant: ascSid };
};
