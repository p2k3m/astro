let geoTzModule;
let DateTimeObj;

/**
 * Determine the IANA timezone name for a latitude and longitude.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {string} IANA timezone name
 */
export function getTimezoneName(lat, lon) {
  if (!geoTzModule) {
    let mod;
    if (typeof geoTz !== 'undefined') {
      mod = geoTz;
    } else {
      const req = eval('require');
      mod = req('geo-tz');
    }
    geoTzModule = mod;
  }
  const [zone] = geoTzModule.find(lat, lon);
  if (!zone) {
    throw new Error('Unable to determine time zone');
  }
  return zone;
}

/**
 * Determine the timezone offset in minutes for a given local date/time
 * at the specified latitude and longitude.
 *
 * @param {Object} opts
 * @param {string} opts.date - Local date in YYYY-MM-DD format
 * @param {string} opts.time - Local time in HH:mm format
 * @param {number} opts.lat - Latitude
 * @param {number} opts.lon - Longitude
 * @returns {number} UTC offset in minutes (east of UTC is positive)
 */
export function getTimezoneOffset({ date, time, lat, lon }) {
  const zone = getTimezoneName(lat, lon);
  if (!DateTimeObj) {
    if (typeof DateTime !== 'undefined') {
      DateTimeObj = DateTime;
    } else {
      const req = eval('require');
      DateTimeObj = req('luxon').DateTime;
    }
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);

  const dt = DateTimeObj.fromObject({ year, month, day, hour, minute }, { zone });
  return dt.offset; // offset in minutes
}

/**
 * Convert a local ISO datetime string in a given timezone to a JS Date in UTC.
 *
 * @param {Object} opts
 * @param {string} opts.datetime - Local datetime in ISO format (YYYY-MM-DDTHH:mm)
 * @param {string} opts.zone - IANA timezone name
 * @returns {Date} UTC date
 */
export function toUTC({ datetime, zone }) {
  if (!DateTimeObj) {
    if (typeof DateTime !== 'undefined') {
      DateTimeObj = DateTime;
    } else {
      const req = eval('require');
      DateTimeObj = req('luxon').DateTime;
    }
  }
  // AstroSage truncates timestamps to whole seconds before converting to UT.
  const dt = DateTimeObj.fromISO(datetime, { zone })
    .startOf('second')
    .toUTC();
  return dt.toJSDate();
}